from datetime import datetime, date, time, timedelta, timezone
from typing import Tuple, Optional


UTC = timezone.utc


def parse_utc_iso(ts_str: str) -> datetime:
    """Parse an ISO 8601 timestamp string into a UTC-aware datetime object."""
    if not ts_str:
        raise ValueError("Timestamp string cannot be empty")
    dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def to_utc_iso(dt: datetime) -> str:
    """Format a datetime object as a standard UTC ISO 8601 string ending with 'Z'."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    else:
        dt = dt.astimezone(UTC)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def get_settlement_info(dt: datetime) -> Tuple[str, int]:
    """
    Compute settlementDate (YYYY-MM-DD) and settlementPeriod (1-48) for a given UTC delivery start time.
    Note: January is GMT (UTC+0), so settlement day aligns directly with UTC calendar date.
    """
    dt_utc = dt.astimezone(UTC)
    settlement_date_str = dt_utc.strftime("%Y-%m-%d")
    # 30-minute intervals: 00:00 is SP 1, 00:30 is SP 2, ..., 23:30 is SP 48
    sp = (dt_utc.hour * 60 + dt_utc.minute) // 30 + 1
    return settlement_date_str, sp


def compute_day_ahead_cutoff(delivery_start: datetime, rule: str = "day_ahead_1100") -> datetime:
    """
    Calculate the exact decision cutoff timestamp for a given delivery start time.
    
    UK Wholesale Day-Ahead Market Rules:
    - 'day_ahead_1100' (Default): EPEX SPOT GB & Nord Pool GB Day-Ahead Auction gate closure.
      Orders must be submitted by 11:00 GMT on day D-1.
    - 'day_ahead_1200': Midday day-ahead benchmark (12:00 GMT on day D-1).
    - 'day_ahead_1700': Closing of day-ahead bilateral notification window (17:00 GMT on day D-1).
    - 'intraday_4h': Forecast available 4 hours prior to delivery start.
    - 'gate_closure_1h': UK National Grid Balancing Mechanism gate closure (1 hour before delivery).
    """
    delivery_utc = delivery_start.astimezone(UTC)
    delivery_date = delivery_utc.date()
    d_minus_1 = delivery_date - timedelta(days=1)
    
    if rule == "day_ahead_1100":
        return datetime.combine(d_minus_1, time(11, 0, 0), tzinfo=UTC)
    elif rule == "day_ahead_1200":
        return datetime.combine(d_minus_1, time(12, 0, 0), tzinfo=UTC)
    elif rule == "day_ahead_1700":
        return datetime.combine(d_minus_1, time(17, 0, 0), tzinfo=UTC)
    elif rule == "intraday_4h":
        return delivery_utc - timedelta(hours=4)
    elif rule == "gate_closure_1h":
        return delivery_utc - timedelta(hours=1)
    else:
        # Default to 11:00 GMT D-1
        return datetime.combine(d_minus_1, time(11, 0, 0), tzinfo=UTC)
