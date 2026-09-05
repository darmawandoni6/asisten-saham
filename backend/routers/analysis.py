from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Holding, PriceHistory
from services.data_fetcher import normalize_ticker, fetch_and_store_stock_data
from services.technical import get_latest_indicators
from services.ai_copilot import (
    analyze_holding_with_ai,
    get_ai_providers_status,
    set_active_provider
)
import pandas as pd

router = APIRouter(prefix="/api/v1/analysis", tags=["AI Copilot"])

class SetProviderRequest(BaseModel):
    provider: str  # 'gemini' | 'opencode_zen'

@router.get("/providers")
def get_providers():
    """Get list of AI providers, configuration status, and active provider."""
    return get_ai_providers_status()

@router.post("/provider")
def set_provider(req: SetProviderRequest):
    """Switch the runtime active AI provider."""
    try:
        active = set_active_provider(req.provider)
        return {"status": "success", "active_provider": active}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{ticker}")
@router.get("/{ticker}")
def analyze_stock(
    ticker: str,
    provider: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    ticker = normalize_ticker(ticker)
    holding = db.query(Holding).filter(Holding.ticker == ticker).first()
    
    if not holding:
        # Create virtual holding if user analyzes non-held stock
        holding = Holding(ticker=ticker, avg_price=5000.0, lot=10, target_price=5750.0, stop_loss=4650.0)

    # Get latest indicators from DB or yfinance
    records = db.query(PriceHistory).filter(PriceHistory.ticker == ticker).order_by(PriceHistory.date.asc()).all()
    if not records:
        df = fetch_and_store_stock_data(ticker, db, period="6mo")
    else:
        df = pd.DataFrame([{
            "date": r.date, "open": r.open, "high": r.high, "low": r.low, "close": r.close,
            "volume": r.volume, "ma20": r.ma20, "ma50": r.ma50, "rsi": r.rsi, "support": r.support, "resistance": r.resistance
        } for r in records])

    indicators = get_latest_indicators(df)
    result = analyze_holding_with_ai(holding, indicators, db, provider=provider)
    return result
