from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import ScreenerResult
import json
from services.screener_engine import scan_market_pool, analyze_single_ticker_for_screener

router = APIRouter(prefix="/api/v1/screener", tags=["EOD Screener"])

class AnalyzeTickerRequest(BaseModel):
    ticker: str

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

@router.post("/analyze")
def analyze_custom_ticker(req: AnalyzeTickerRequest, db: Session = Depends(get_db)):
    if not req.ticker or not req.ticker.strip():
        raise HTTPException(status_code=400, detail="Ticker tidak boleh kosong")
    result = analyze_single_ticker_for_screener(req.ticker.strip(), db)
    if not result:
        raise HTTPException(status_code=404, detail=f"Gagal menganalisis saham '{req.ticker}'. Pastikan kode ticker terdaftar di Bursa Efek Indonesia (IDX).")
    return result


