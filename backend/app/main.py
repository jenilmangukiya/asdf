import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.api.router import api_router
from backend.app.repositories.generation_repository import repository


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    On startup, kicks off background cache warming for January 2026 data.
    """
    logger.info("Starting UK Wind Power Forecast & Accuracy Application...")
    logger.info(f"Environment: {settings.ENVIRONMENT}, Host: {settings.HOST}:{settings.PORT}")
    logger.info(f"CORS Allowed Origins: {settings.CORS_ORIGINS}")

    # Kick off background cache warming without blocking startup
    async def warm_cache():
        try:
            logger.info("Checking / warming January 2026 Elexon dataset cache...")
            res = await repository.refresh_data(force=False)
            logger.info(f"Cache initialization completed: {res}")
        except Exception as e:
            logger.error(f"Background cache warm-up error: {e}")

    asyncio.create_task(warm_cache())

    yield

    logger.info("Shutting down application...")


app = FastAPI(
    title="UK Wind Power Forecast & Accuracy API",
    description=(
        "Production-ready Day-Ahead wholesale market electricity trading forecast accuracy dashboard. "
        "Evaluates UK national wind power generation outturn against Elexon BMRS WINDFOR forecasts for January 2026."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
# In development, also allow local preview origins
if "*" not in origins and "http://localhost:5173" not in origins:
    origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router)


@app.get("/", include_in_schema=False)
async def root():
    """Redirect root to OpenAPI interactive documentation."""
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
