from fastapi import APIRouter
from backend.app.api.endpoints import health, data_status, forecasts, accuracy

api_router = APIRouter(prefix="/api/v1")

# Register individual sub-routers
api_router.include_router(health.router)
api_router.include_router(data_status.router)
api_router.include_router(forecasts.router)
api_router.include_router(accuracy.router)
