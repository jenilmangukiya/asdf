import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
import asyncio

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.services.elexon_client import ElexonClient
from backend.app.utils.datetime_utils import to_utc_iso


class GenerationRepository:
    """
    Repository for managing and caching UK wind generation actuals (FUELHH)
    and forecast records (WINDFOR).
    Provides in-memory caching backed by file storage to avoid unnecessary external API calls.
    """

    def __init__(self, client: Optional[ElexonClient] = None, cache_dir: Optional[Path] = None):
        self.client = client or ElexonClient()
        self.cache_dir = cache_dir or settings.CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self._fuelhh_cache_file = self.cache_dir / "fuelhh_jan2026.json"
        self._windfor_cache_file = self.cache_dir / "windfor_jan2026.json"
        self._metadata_file = self.cache_dir / "cache_metadata.json"

        # In-memory datasets
        self._actuals: List[Dict[str, Any]] = []
        self._forecasts: List[Dict[str, Any]] = []
        self._last_fetched: Optional[datetime] = None
        self._lock = asyncio.Lock()
        self._is_warming = False

        # Attempt to load disk cache on initialization
        self._load_from_disk()

    @property
    def last_fetched_at(self) -> Optional[str]:
        return to_utc_iso(self._last_fetched) if self._last_fetched else None

    @property
    def actuals_count(self) -> int:
        return len(self._actuals)

    @property
    def forecasts_count(self) -> int:
        return len(self._forecasts)

    def is_cache_warm(self) -> bool:
        return len(self._actuals) > 0 and len(self._forecasts) > 0

    def _is_cache_expired(self) -> bool:
        if not self._last_fetched:
            return True
        age = datetime.now(timezone.utc) - self._last_fetched
        return age > timedelta(hours=settings.CACHE_TTL_HOURS)

    def _load_from_disk(self) -> bool:
        """Attempt to restore datasets from JSON cache files on disk."""
        try:
            if not (self._fuelhh_cache_file.exists() and self._windfor_cache_file.exists()):
                return False

            with open(self._fuelhh_cache_file, "r", encoding="utf-8") as f:
                self._actuals = json.load(f)

            with open(self._windfor_cache_file, "r", encoding="utf-8") as f:
                self._forecasts = json.load(f)

            if self._metadata_file.exists():
                with open(self._metadata_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    if "last_fetched" in meta:
                        self._last_fetched = datetime.fromisoformat(meta["last_fetched"])
            else:
                self._last_fetched = datetime.now(timezone.utc)

            logger.info(
                f"Restored from disk cache: {len(self._actuals)} FUELHH actuals, "
                f"{len(self._forecasts)} WINDFOR forecasts. Fetched at: {self.last_fetched_at}"
            )
            return True
        except Exception as e:
            logger.warning(f"Failed to read disk cache: {e}")
            self._actuals = []
            self._forecasts = []
            return False

    def _save_to_disk(self) -> None:
        """Persist in-memory records to JSON cache files."""
        try:
            with open(self._fuelhh_cache_file, "w", encoding="utf-8") as f:
                json.dump(self._actuals, f)

            with open(self._windfor_cache_file, "w", encoding="utf-8") as f:
                json.dump(self._forecasts, f)

            with open(self._metadata_file, "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "last_fetched": self._last_fetched.isoformat() if self._last_fetched else None,
                        "fuelhh_count": len(self._actuals),
                        "windfor_count": len(self._forecasts),
                    },
                    f,
                    indent=2,
                )
            logger.info("Successfully saved dataset cache to disk.")
        except Exception as e:
            logger.error(f"Failed to save cache to disk: {e}")

    async def refresh_data(self, force: bool = False) -> Dict[str, Any]:
        """
        Fetch January 2026 data from Elexon and update the cache.
        """
        async with self._lock:
            if not force and self.is_cache_warm() and not self._is_cache_expired():
                logger.info("Cache is warm and valid; skipping external API fetch.")
                return {
                    "refreshed": False,
                    "reason": "cache_valid",
                    "actuals_count": len(self._actuals),
                    "forecasts_count": len(self._forecasts),
                    "last_fetched_at": self.last_fetched_at,
                }

            self._is_warming = True
            try:
                # 1. Fetch January 2026 actuals (2026-01-01 to 2026-01-31)
                actuals = await self.client.fetch_fuelhh_actuals(
                    settlement_date_from=settings.ANALYSIS_START_DATE,
                    settlement_date_to=settings.ANALYSIS_END_DATE,
                    fuel_type="WIND",
                )

                # 2. Fetch WINDFOR forecasts published from 2025-12-30T00:00:00Z to 2026-02-01T00:00:00Z
                # This covers day-ahead forecasts for all delivery days in January 2026
                forecasts = await self.client.fetch_windfor_forecasts(
                    publish_time_from="2025-12-30T00:00:00Z",
                    publish_time_to="2026-02-01T00:00:00Z",
                )

                if actuals:
                    self._actuals = actuals
                if forecasts:
                    self._forecasts = forecasts

                self._last_fetched = datetime.now(timezone.utc)
                self._save_to_disk()

                return {
                    "refreshed": True,
                    "actuals_count": len(self._actuals),
                    "forecasts_count": len(self._forecasts),
                    "last_fetched_at": self.last_fetched_at,
                }
            except Exception as e:
                logger.error(f"Error fetching data from Elexon: {e}")
                # If we have existing disk/in-memory data, keep it as fallback
                if not self._actuals and not self._forecasts:
                    raise
                return {
                    "refreshed": False,
                    "error": str(e),
                    "actuals_count": len(self._actuals),
                    "forecasts_count": len(self._forecasts),
                    "last_fetched_at": self.last_fetched_at,
                }
            finally:
                self._is_warming = False

    async def get_actuals(self) -> List[Dict[str, Any]]:
        """Return cached actuals, refreshing if empty."""
        if not self._actuals:
            await self.refresh_data()
        return self._actuals

    async def get_forecasts(self) -> List[Dict[str, Any]]:
        """Return cached forecasts, refreshing if empty."""
        if not self._forecasts:
            await self.refresh_data()
        return self._forecasts


# Global singleton instance
repository = GenerationRepository()
