from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd

from backend.app.core.logging import logger
from backend.app.repositories.generation_repository import GenerationRepository
from backend.app.services.forecast_service import ForecastService, CUTOFF_DESCRIPTIONS
from backend.app.models.schemas import (
    MatchedDeliveryRecord,
    AccuracySummary,
    PaginatedRecordsResponse,
    TimeseriesResponse,
)
from backend.app.utils.datetime_utils import parse_utc_iso, to_utc_iso, get_settlement_info


class AccuracyService:
    """
    Service responsible for aligning actuals and forecasts, calculating
    evaluation metrics (MAE, RMSE, MBE), and generating time series and paginated records.
    """

    def __init__(self, repo: GenerationRepository, forecast_service: ForecastService):
        self.repo = repo
        self.forecast_service = forecast_service

    async def get_aligned_records(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_rule: str = "day_ahead_1100",
        matching_mode: str = "exact",
    ) -> List[MatchedDeliveryRecord]:
        """
        Merge actual wind generation (FUELHH) with cutoff-filtered forecasts (WINDFOR)
        by delivery period startTime.
        """
        raw_actuals = await self.repo.get_actuals()
        forecast_map = await self.forecast_service.get_selected_forecasts(
            cutoff_rule=cutoff_rule,
            matching_mode=matching_mode,
        )

        if not raw_actuals:
            logger.warning("No actual generation records available for alignment.")
            return []

        # Convert actuals to structured records and filter by date range
        aligned_records: List[MatchedDeliveryRecord] = []
        for item in raw_actuals:
            st = item.get("startTime")
            if not st:
                continue

            dt = parse_utc_iso(st)
            st_date_str = dt.strftime("%Y-%m-%d")

            # Date range filter
            if not (start_date <= st_date_str <= end_date):
                continue

            # In 'exact' mode, if WINDFOR only has hourly forecasts, we can either
            # include all actuals (with null forecast for :30 periods) or only hourly actuals.
            # Keeping all actuals with isMatched=False is honest and shows missing forecast!
            settlement_date = item.get("settlementDate") or st_date_str
            settlement_period = item.get("settlementPeriod")
            if settlement_period is None:
                _, settlement_period = get_settlement_info(dt)

            actual_mw = item.get("generation")
            if actual_mw is not None:
                actual_mw = float(actual_mw)

            forecast_item = forecast_map.get(st)
            forecast_mw = forecast_item["generation"] if forecast_item else None
            publish_time = forecast_item["publishTime"] if forecast_item else None
            decision_cutoff = forecast_item["decisionCutoff"] if forecast_item else None

            # Calculate errors only if both are present
            if actual_mw is not None and forecast_mw is not None:
                err = round(forecast_mw - actual_mw, 2)
                abs_err = round(abs(forecast_mw - actual_mw), 2)
                pct_err = (
                    round((abs_err / actual_mw) * 100, 2)
                    if actual_mw > 0
                    else None
                )
                is_matched = True
            else:
                err = None
                abs_err = None
                pct_err = None
                is_matched = False

            aligned_records.append(
                MatchedDeliveryRecord(
                    startTime=st,
                    settlementDate=settlement_date,
                    settlementPeriod=int(settlement_period),
                    actualGeneration=actual_mw,
                    forecastGeneration=forecast_mw,
                    forecastError=err,
                    absError=abs_err,
                    percentageError=pct_err,
                    publishTime=publish_time,
                    decisionCutoff=decision_cutoff,
                    isMatched=is_matched,
                )
            )

        # Sort chronologically by startTime
        aligned_records.sort(key=lambda r: r.startTime)
        return aligned_records

    async def calculate_accuracy_summary(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_rule: str = "day_ahead_1100",
        matching_mode: str = "exact",
    ) -> AccuracySummary:
        """
        Calculate MAE, RMSE, MBE and auxiliary metrics over valid matched pairs.
        """
        records = await self.get_aligned_records(
            start_date=start_date,
            end_date=end_date,
            cutoff_rule=cutoff_rule,
            matching_mode=matching_mode,
        )

        total_delivery_periods = len(records)
        matched_records = [r for r in records if r.isMatched]
        missing_actual_count = sum(1 for r in records if r.actualGeneration is None)
        missing_forecast_count = sum(1 for r in records if r.forecastGeneration is None)

        if not matched_records:
            return AccuracySummary(
                mae=0.0,
                rmse=0.0,
                mbe=0.0,
                nmaePercent=None,
                matchedCount=0,
                totalDeliveryPeriods=total_delivery_periods,
                missingActualCount=missing_actual_count,
                missingForecastCount=missing_forecast_count,
                meanActualGeneration=0.0,
                meanForecastGeneration=0.0,
                totalActualEnergyGWh=0.0,
                totalForecastEnergyGWh=0.0,
                maxOverforecastMW=0.0,
                maxUnderforecastMW=0.0,
                cutoffRule=cutoff_rule,
                cutoffRuleDescription=CUTOFF_DESCRIPTIONS.get(cutoff_rule, cutoff_rule),
                matchingMode=matching_mode,
                dateRange={"start": start_date, "end": end_date},
            )

        actuals = np.array([r.actualGeneration for r in matched_records], dtype=float)
        forecasts = np.array([r.forecastGeneration for r in matched_records], dtype=float)
        errors = forecasts - actuals

        mae = float(np.mean(np.abs(errors)))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        mbe = float(np.mean(errors))
        mean_actual = float(np.mean(actuals))
        mean_forecast = float(np.mean(forecasts))

        # Normalized MAE (%) relative to mean actual generation
        nmae = round((mae / mean_actual) * 100, 2) if mean_actual > 0 else None

        # Energy calculation: each period duration is 0.5h if 30-min resolution or 1.0h if hourly
        duration_hours = 1.0 if matching_mode == "exact" else 0.5
        total_actual_gwh = float(np.sum(actuals * duration_hours) / 1000.0)
        total_forecast_gwh = float(np.sum(forecasts * duration_hours) / 1000.0)

        max_over = float(np.max(errors)) if len(errors) > 0 else 0.0
        max_under = float(np.min(errors)) if len(errors) > 0 else 0.0

        return AccuracySummary(
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            mbe=round(mbe, 2),
            nmaePercent=nmae,
            matchedCount=len(matched_records),
            totalDeliveryPeriods=total_delivery_periods,
            missingActualCount=missing_actual_count,
            missingForecastCount=missing_forecast_count,
            meanActualGeneration=round(mean_actual, 2),
            meanForecastGeneration=round(mean_forecast, 2),
            totalActualEnergyGWh=round(total_actual_gwh, 2),
            totalForecastEnergyGWh=round(total_forecast_gwh, 2),
            maxOverforecastMW=round(max_over, 2),
            maxUnderforecastMW=round(max_under, 2),
            cutoffRule=cutoff_rule,
            cutoffRuleDescription=CUTOFF_DESCRIPTIONS.get(cutoff_rule, cutoff_rule),
            matchingMode=matching_mode,
            dateRange={"start": start_date, "end": end_date},
        )

    async def get_timeseries(
        self,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_rule: str = "day_ahead_1100",
        matching_mode: str = "exact",
    ) -> TimeseriesResponse:
        """Return aligned time series data for charting."""
        records = await self.get_aligned_records(
            start_date=start_date,
            end_date=end_date,
            cutoff_rule=cutoff_rule,
            matching_mode=matching_mode,
        )

        # In exact mode, the chart represents the 60m hourly series
        if matching_mode == "exact":
            records = [r for r in records if r.isMatched]

        return TimeseriesResponse(
            count=len(records),
            unit="MW",
            resolution="30m" if matching_mode == "half_hour" else "60m",
            cutoffRule=cutoff_rule,
            matchingMode=matching_mode,
            records=records,
        )

    async def get_paginated_records(
        self,
        page: int = 1,
        page_size: int = 50,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_rule: str = "day_ahead_1100",
        matching_mode: str = "exact",
        sort_by: str = "startTime",
        sort_order: str = "asc",
        only_matched: bool = False,
    ) -> PaginatedRecordsResponse:
        """Return paginated, sorted records for the detailed data table."""
        records = await self.get_aligned_records(
            start_date=start_date,
            end_date=end_date,
            cutoff_rule=cutoff_rule,
            matching_mode=matching_mode,
        )

        if only_matched:
            records = [r for r in records if r.isMatched]

        # Sorting
        reverse = sort_order.lower() == "desc"
        if sort_by in ["startTime", "settlementPeriod", "actualGeneration", "forecastGeneration", "forecastError", "absError"]:
            records.sort(
                key=lambda r: (getattr(r, sort_by) is None, getattr(r, sort_by)),
                reverse=reverse,
            )

        total = len(records)
        total_pages = max(1, (total + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_records = records[start_idx:end_idx]

        return PaginatedRecordsResponse(
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
            records=paged_records,
        )
