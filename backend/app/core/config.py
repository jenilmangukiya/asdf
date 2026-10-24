from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    """Application configuration settings loaded from environment or defaults."""
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # Elexon Insights Solution (BMRS) API
    ELEXON_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"
    ELEXON_TIMEOUT_SECONDS: float = 40.0
    
    # Cache settings
    CACHE_DIR: Path = Path(__file__).resolve().parent.parent.parent / ".cache"
    CACHE_TTL_HOURS: int = 24
    
    # Analysis period constraints
    ANALYSIS_START_DATE: str = "2026-01-01"
    ANALYSIS_END_DATE: str = "2026-01-31"
    
    # Forecast decision cutoff rule
    # Supported: 'day_ahead_1100' (EPEX SPOT / Nord Pool GB DA auction 11:00 GMT D-1)
    #            'day_ahead_1200' (12:00 GMT D-1)
    #            'day_ahead_1700' (17:00 GMT D-1 bilateral gate closure)
    DEFAULT_CUTOFF_RULE: str = "day_ahead_1100"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
# Ensure cache directory exists
settings.CACHE_DIR.mkdir(parents=True, exist_ok=True)
