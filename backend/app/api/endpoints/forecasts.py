from fastapi import APIRouter, Query
from backend.app.models.schemas import ForecastSummary
from backend.app.repositories.generation_repository import repository
from backend.app.services.forecast_service import ForecastService

router = APIRouter(tags=["Forecasts"])
forecast_service = ForecastService(repository)


@router.get("/forecasts/summary", response_model=ForecastSummary)
async def get_forecasts_summary(
    cutoff_rule: str = Query(
        "day_ahead_1100",
        description="Decision cutoff rule ('day_ahead_1100', 'day_ahead_1200', 'day_ahead_1700', 'intraday_4h', 'gate_closure_1h')",
    ),
):
    """
    Get high-level summary of available forecasts, coverage, and publish timestamps
    for the selected decision cutoff rule.
    """
    return await forecast_service.get_forecast_summary(cutoff_rule=cutoff_rule)
