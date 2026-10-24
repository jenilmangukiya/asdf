from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import pandas as pd
import numpy as np

from backend.app.core.logging import logger
from backend.app.repositories.generation_repository import GenerationRepository
from backend.app.utils.datetime_utils import parse_utc_iso, to_utc_iso, compute_day_ahead_cutoff
from backend.app.models.schemas import ForecastSummary


CUTOFF_DESCRIPTIONS = {
    "day_ahead_1100": "Day-Ahead 11:00 GMT (EPEX SPOT / Nord Pool GB Auction Gate Closure)",
    "day_ahead_1200": "Day-Ahead 12:00 GMT (Midday Day-Ahead Benchmark)",
    "day_ahead_1700": "Day-Ahead 17:00 GMT (Closing of Day-Ahead Bilateral Trading)",
    "intraday_4h": "Intraday 4 Hours Ahead of Delivery",
    "gate_closure_1h": "Balancing Mechanism Gate Closure (1 Hour Ahead)",
}


class ForecastService:
    """
    Business logic for forecast selection, publication cutoff rules,
    and forecast summary aggregations.
    """

    def __init__(self, repo: GenerationRepository):
        self.repo = repo

    async def get_selected_forecasts(
        self,
        cutoff_rule: str = "day_ahead_1100",
        matching_mode: str = "exact",
    ) -> Dict[str, Dict[str, Any]]:
        """
        Select the most recent eligible forecast for each delivery period startTime
        published BEFORE the decision cutoff.
        
        Returns a dictionary mapping delivery period startTime (ISO string)
        to the chosen forecast dict:
        {
            "startTime": str,
            "publishTime": str,
            "generation": float,
            "decisionCutoff": str
        }
        """
        raw_forecasts = await self.repo.get_forecasts()
        if not raw_forecasts:
            return {}

        # Convert to DataFrame for fast filtering and deduplication
        df = pd.DataFrame(raw_forecasts)
        if df.empty or "startTime" not in df.columns or "publishTime" not in df.columns:
            return {}

        # Parse UTC timestamps
        df["dt_start"] = pd.to_datetime(df["startTime"], utc=True)
        df["dt_publish"] = pd.to_datetime(df["publishTime"], utc=True)
        df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
        df = df.dropna(subset=["generation", "dt_start", "dt_publish"])

        # Calculate decision cutoff for each unique delivery start time
        unique_starts = df["dt_start"].drop_duplicates()
        cutoff_map = {
            st: compute_day_ahead_cutoff(st.to_pydatetime(), rule=cutoff_rule)
            for st in unique_starts
        }
        df["dt_cutoff"] = df["dt_start"].map(cutoff_map)

        # CRITICAL BUSINESS RULE: Filter strictly to forecasts published on or before cutoff
        eligible_df = df[df["dt_publish"] <= df["dt_cutoff"]].copy()

        if eligible_df.empty:
            logger.warning(f"No forecasts eligible under cutoff rule: {cutoff_rule}")
            return {}

        # For each target delivery start time, select the forecast with the MAX publishTime
        # (most recent forecast known before cutoff)
        eligible_df = eligible_df.sort_values(
            ["dt_start", "dt_publish"], ascending=[True, False]
        )
        selected_df = eligible_df.drop_duplicates(subset=["dt_start"], keep="first")

        result: Dict[str, Dict[str, Any]] = {}
        for _, row in selected_df.iterrows():
            st_iso = to_utc_iso(row["dt_start"].to_pydatetime())
            record = {
                "startTime": st_iso,
                "publishTime": to_utc_iso(row["dt_publish"].to_pydatetime()),
                "decisionCutoff": to_utc_iso(row["dt_cutoff"].to_pydatetime()),
                "generation": float(row["generation"]),
            }
            result[st_iso] = record

            # If matching_mode is 'half_hour', also assign the same hourly forecast
            # to the +30 min settlement period of that hour
            if matching_mode == "half_hour":
                half_hour_st = row["dt_start"] + pd.Timedelta(minutes=30)
                half_hour_iso = to_utc_iso(half_hour_st.to_pydatetime())
                result[half_hour_iso] = {
                    "startTime": half_hour_iso,
                    "publishTime": record["publishTime"],
                    "decisionCutoff": record["decisionCutoff"],
                    "generation": record["generation"],
                    "isInterpolatedHalfHour": True,
                }

        return result

    async def get_forecast_summary(
        self,
        cutoff_rule: str = "day_ahead_1100",
    ) -> ForecastSummary:
        """Calculate high-level summary statistics of the forecast dataset."""
        forecast_map = await self.get_selected_forecasts(cutoff_rule=cutoff_rule)
        raw_forecasts = await self.repo.get_forecasts()

        if not forecast_map:
            return ForecastSummary(
                totalForecastRecords=len(raw_forecasts),
                uniqueDeliveryPeriods=0,
                firstPublishTime=None,
                lastPublishTime=None,
                meanForecastMW=0.0,
                maxForecastMW=0.0,
                minForecastMW=0.0,
                cutoffRule=cutoff_rule,
            )

        gen_values = [f["generation"] for f in forecast_map.values()]
        publish_times = [f["publishTime"] for f in forecast_map.values() if f.get("publishTime")]

        return ForecastSummary(
            totalForecastRecords=len(raw_forecasts),
            uniqueDeliveryPeriods=len(forecast_map),
            firstPublishTime=min(publish_times) if publish_times else None,
            lastPublishTime=max(publish_times) if publish_times else None,
            meanForecastMW=round(float(np.mean(gen_values)), 2) if gen_values else 0.0,
            maxForecastMW=round(float(np.max(gen_values)), 2) if gen_values else 0.0,
            minForecastMW=round(float(np.min(gen_values)), 2) if gen_values else 0.0,
            cutoffRule=cutoff_rule,
        )
