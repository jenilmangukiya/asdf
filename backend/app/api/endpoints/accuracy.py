from fastapi import APIRouter, Query
from backend.app.models.schemas import (
    AccuracySummary,
    TimeseriesResponse,
    PaginatedRecordsResponse,
)
from backend.app.repositories.generation_repository import repository
from backend.app.services.forecast_service import ForecastService
from backend.app.services.accuracy_service import AccuracyService

router = APIRouter(tags=["Accuracy Analysis"])
forecast_service = ForecastService(repository)
accuracy_service = AccuracyService(repository, forecast_service)


@router.get("/accuracy/summary", response_model=AccuracySummary)
async def get_accuracy_summary(
    start_date: str = Query(
        "2026-01-01",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Start delivery date in YYYY-MM-DD format (within Jan 2026)",
    ),
    end_date: str = Query(
        "2026-01-31",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="End delivery date in YYYY-MM-DD format (within Jan 2026)",
    ),
    cutoff_rule: str = Query(
        "day_ahead_1100",
        description="Decision cutoff rule ('day_ahead_1100', 'day_ahead_1200', 'day_ahead_1700', 'intraday_4h', 'gate_closure_1h')",
    ),
    matching_mode: str = Query(
        "exact",
        description="Matching mode: 'exact' (hourly exact startTime match) or 'half_hour' (both 30-min settlement periods in hour)",
    ),
):
    """
    Calculate forecast accuracy metrics (MAE, RMSE, MBE) and energy totals
    over valid matched pairs for the given date range and market cutoff.
    """
    return await accuracy_service.calculate_accuracy_summary(
        start_date=start_date,
        end_date=end_date,
        cutoff_rule=cutoff_rule,
        matching_mode=matching_mode,
    )


@router.get("/accuracy/timeseries", response_model=TimeseriesResponse)
async def get_accuracy_timeseries(
    start_date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query("2026-01-31", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_rule: str = Query("day_ahead_1100"),
    matching_mode: str = Query("exact"),
):
    """
    Get chronological aligned forecast vs actual time series for dashboard charts.
    """
    return await accuracy_service.get_timeseries(
        start_date=start_date,
        end_date=end_date,
        cutoff_rule=cutoff_rule,
        matching_mode=matching_mode,
    )


@router.get("/accuracy/records", response_model=PaginatedRecordsResponse)
async def get_accuracy_records(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=5, le=500, description="Records per page"),
    start_date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query("2026-01-31", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_rule: str = Query("day_ahead_1100"),
    matching_mode: str = Query("exact"),
    sort_by: str = Query("startTime", description="Field to sort by"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order"),
    only_matched: bool = Query(False, description="Filter only to matched delivery periods"),
):
    """
    Get paginated, sortable records of individual delivery periods with
    forecasts, actuals, errors, and publication timestamps.
    """
    return await accuracy_service.get_paginated_records(
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
        cutoff_rule=cutoff_rule,
        matching_mode=matching_mode,
        sort_by=sort_by,
        sort_order=sort_order,
        only_matched=only_matched,
    )
