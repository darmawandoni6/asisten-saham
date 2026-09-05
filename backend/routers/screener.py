from fastapi import APIRouter, Query, Depends
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import ScreenerResult
import json
from services.screener_engine import scan_market_pool

router = APIRouter(prefix="/api/v1/screener", tags=["EOD Screener"])

@router.get("")
def get_screener_results(
    strategy: Optional[str] = Query("ALL", description="ALL, OVERSOLD, BREAKOUT, VALUE"),
    db: Session = Depends(get_db)
):
    query = db.query(ScreenerResult)
    strategy_upper = (strategy or "ALL").upper()
    if strategy_upper != "ALL":
        query = query.filter(ScreenerResult.strategy == strategy_upper)
    
    records = query.order_by(ScreenerResult.score.desc()).all()
    if not records:
        return []
    
    results = []
    for r in records:
        details = json.loads(r.details) if r.details else {}
        results.append({
            "ticker": r.ticker,
            "name": details.get("name", r.ticker),
            "sector": details.get("sector", "General"),
            "price": details.get("price", 0),
            "change_pct": details.get("change_pct", 0),
            "volume": details.get("volume", 0),
            "rsi": details.get("rsi", 50),
            "ma_status": details.get("ma_status", "Normal"),
            "strategy": r.strategy,
            "score": r.score,
            "catalyst": details.get("catalyst", ""),
            "support": details.get("support", 0),
            "resistance": details.get("resistance", 0)
        })
    return results

@router.post("/scan")
def run_screener_scan(db: Session = Depends(get_db)):
    return scan_market_pool(db)

