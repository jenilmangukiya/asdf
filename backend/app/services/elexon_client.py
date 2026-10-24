import asyncio
from typing import List, Dict, Any, Optional
import httpx
from backend.app.core.config import settings
from backend.app.core.logging import logger


class ElexonClient:
    """
    HTTP client for the official Elexon Insights Solution (BMRS) API.
    Interacts with the /datasets/FUELHH/stream and /datasets/WINDFOR/stream endpoints.
    """

    def __init__(self, base_url: Optional[str] = None, timeout: Optional[float] = None):
        self.base_url = (base_url or settings.ELEXON_BASE_URL).rstrip("/")
        self.timeout = timeout or settings.ELEXON_TIMEOUT_SECONDS
        self.headers = {
            "Accept": "application/json",
            "User-Agent": "UK-Wind-Forecast-Dashboard/1.0 (Enterprise Trading Analytics)",
        }

    async def fetch_fuelhh_actuals(
        self,
        settlement_date_from: str,
        settlement_date_to: str,
        fuel_type: str = "WIND",
        max_retries: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Fetch actual generation outturn from FUELHH stream filtered by fuelType and date range.
        URL: /datasets/FUELHH/stream?settlementDateFrom=...&settlementDateTo=...&fuelType=WIND
        """
        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "settlementDateFrom": settlement_date_from,
            "settlementDateTo": settlement_date_to,
            "fuelType": fuel_type,
        }

        logger.info(f"Fetching FUELHH actuals from Elexon: {params}")
        return await self._get_with_retry(url, params, max_retries)

    async def fetch_windfor_forecasts(
        self,
        publish_time_from: str,
        publish_time_to: str,
        max_retries: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Fetch wind generation forecast stream (WINDFOR) filtered by publishDateTime range.
        URL: /datasets/WINDFOR/stream?publishDateTimeFrom=...&publishDateTimeTo=...
        """
        url = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": publish_time_from,
            "publishDateTimeTo": publish_time_to,
        }

        logger.info(f"Fetching WINDFOR forecasts from Elexon: {params}")
        return await self._get_with_retry(url, params, max_retries)

    async def check_connectivity(self) -> bool:
        """Ping Elexon API with a small date query to verify connectivity."""
        try:
            url = f"{self.base_url}/datasets/FUELHH/stream"
            params = {
                "settlementDateFrom": "2026-01-01",
                "settlementDateTo": "2026-01-01",
                "settlementPeriod": 1,
                "fuelType": "WIND",
            }
            async with httpx.AsyncClient(timeout=10.0, headers=self.headers) as client:
                response = await client.get(url, params=params)
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Elexon connectivity check failed: {e}")
            return False

    async def _get_with_retry(
        self,
        url: str,
        params: Dict[str, Any],
        max_retries: int = 3,
    ) -> List[Dict[str, Any]]:
        """Execute async HTTP GET request with retries and exponential backoff."""
        attempt = 0
        backoff = 1.0

        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            while attempt < max_retries:
                attempt += 1
                try:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()
                    if isinstance(data, list):
                        return data
                    elif isinstance(data, dict) and "data" in data:
                        return data["data"]
                    else:
                        logger.warning(f"Unexpected response structure from {url}: {type(data)}")
                        return []
                except (httpx.RequestError, httpx.HTTPStatusError) as e:
                    logger.warning(
                        f"Attempt {attempt}/{max_retries} failed for {url} ({params}): {e}"
                    )
                    if attempt >= max_retries:
                        logger.error(f"Exhausted retries for {url}")
                        raise
                    await asyncio.sleep(backoff)
                    backoff *= 2.0

        return []
