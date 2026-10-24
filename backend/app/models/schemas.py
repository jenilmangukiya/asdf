from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    timestamp: str
    version: str = "1.0.0"
    service: str = "UK Wind Power Forecast & Accuracy API"


class DataStatusResponse(BaseModel):
    status: str
    elexonConnected: bool
    lastFetchedAt: Optional[str] = None
    fuelhhRecordsCached: int
    windforRecordsCached: int
    analysisPeriodStart: str
    analysisPeriodEnd: str
    cacheTtlHours: int
    isCacheWarm: bool
    message: Optional[str] = None


class MatchedDeliveryRecord(BaseModel):
    startTime: str = Field(..., description="Delivery period start time (UTC ISO 8601)")
    settlementDate: str = Field(..., description="Settlement date (YYYY-MM-DD)")
    settlementPeriod: int = Field(..., description="Settlement period (1-48)")
    actualGeneration: Optional[float] = Field(None, description="Actual generation in MW (FUELHH)")
    forecastGeneration: Optional[float] = Field(None, description="Selected forecast generation in MW (WINDFOR)")
    forecastError: Optional[float] = Field(None, description="Forecast Error = Forecast - Actual (MW)")
    absError: Optional[float] = Field(None, description="Absolute Error = |Forecast - Actual| (MW)")
    percentageError: Optional[float] = Field(None, description="Absolute Percentage Error relative to actual (if actual > 0)")
    publishTime: Optional[str] = Field(None, description="Forecast publication timestamp (UTC)")
    decisionCutoff: Optional[str] = Field(None, description="Decision cutoff timestamp used for selection (UTC)")
    isMatched: bool = Field(..., description="True if both actual and forecast are present")


class AccuracySummary(BaseModel):
    mae: float = Field(..., description="Mean Absolute Error in MW: mean(|forecast - actual|)")
    rmse: float = Field(..., description="Root Mean Squared Error in MW: sqrt(mean((forecast - actual)^2))")
    mbe: float = Field(..., description="Mean Bias Error in MW: mean(forecast - actual). Positive = overforecast, Negative = underforecast")
    nmaePercent: Optional[float] = Field(None, description="Normalized MAE as % of average actual generation")
    matchedCount: int = Field(..., description="Number of valid delivery periods with both forecast and actual data")
    totalDeliveryPeriods: int = Field(..., description="Total delivery periods in the queried range")
    missingActualCount: int = Field(..., description="Count of periods with missing actual generation")
    missingForecastCount: int = Field(..., description="Count of periods where no valid eligible forecast was found before cutoff")
    meanActualGeneration: float = Field(..., description="Mean actual generation across matched periods in MW")
    meanForecastGeneration: float = Field(..., description="Mean forecast generation across matched periods in MW")
    totalActualEnergyGWh: float = Field(..., description="Total actual energy delivered in GWh")
    totalForecastEnergyGWh: float = Field(..., description="Total forecast energy in GWh")
    maxOverforecastMW: float = Field(..., description="Maximum overforecast (forecast - actual) in MW")
    maxUnderforecastMW: float = Field(..., description="Maximum underforecast (forecast - actual) in MW")
    cutoffRule: str = Field(..., description="Key of the decision cutoff rule applied")
    cutoffRuleDescription: str = Field(..., description="Human-readable description of the cutoff rule")
    matchingMode: str = Field(..., description="'exact' (hourly) or 'half_hour' (extended to both settlement periods)")
    dateRange: Dict[str, str] = Field(..., description="Start and end dates queried")


class ForecastSummary(BaseModel):
    totalForecastRecords: int
    uniqueDeliveryPeriods: int
    firstPublishTime: Optional[str]
    lastPublishTime: Optional[str]
    meanForecastMW: float
    maxForecastMW: float
    minForecastMW: float
    cutoffRule: str


class PaginatedRecordsResponse(BaseModel):
    total: int
    page: int
    pageSize: int
    totalPages: int
    records: List[MatchedDeliveryRecord]


class TimeseriesResponse(BaseModel):
    count: int
    unit: str = "MW"
    resolution: str
    cutoffRule: str
    matchingMode: str
    records: List[MatchedDeliveryRecord]
