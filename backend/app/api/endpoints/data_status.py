from fastapi import APIRouter, Query, BackgroundTasks
from backend.app.models.schemas import DataStatusResponse
from backend.app.repositories.generation_repository import repository
from backend.app.core.config import settings

router = APIRouter(tags=["Data Status"])


@router.get("/data-status", response_model=DataStatusResponse)
async def get_data_status():
    """
    Get current cache status, record counts, data freshness timestamp,
    and Elexon API connectivity status.
    """
    elexon_ok = await repository.client.check_connectivity()
    
    return DataStatusResponse(
        status="ready" if repository.is_cache_warm() else "uninitialized",
        elexonConnected=elexon_ok,
        lastFetchedAt=repository.last_fetched_at,
        fuelhhRecordsCached=repository.actuals_count,
        windforRecordsCached=repository.forecasts_count,
        analysisPeriodStart=settings.ANALYSIS_START_DATE,
        analysisPeriodEnd=settings.ANALYSIS_END_DATE,
        cacheTtlHours=settings.CACHE_TTL_HOURS,
        isCacheWarm=repository.is_cache_warm(),
        message="Data cached and available for analysis" if repository.is_cache_warm() else "Cache warming required",
    )


@router.post("/data-status/refresh")
async def trigger_refresh(
    force: bool = Query(True, description="Force re-fetch from Elexon BMRS API"),
):
    """
    Trigger manual refresh of January 2026 Elexon datasets (FUELHH actuals & WINDFOR forecasts).
    """
    result = await repository.refresh_data(force=force)
    return {
        "status": "success" if result.get("refreshed") or result.get("reason") == "cache_valid" else "error",
        "details": result,
    }
