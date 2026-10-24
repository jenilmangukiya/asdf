from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.models.schemas import HealthResponse
from backend.app.utils.datetime_utils import to_utc_iso

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint returning application status and UTC timestamp."""
    return HealthResponse(
        status="healthy",
        timestamp=to_utc_iso(datetime.now(timezone.utc)),
        version="1.0.0",
        service="UK Wind Power Forecast & Accuracy API",
    )
