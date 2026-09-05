from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Holding, PriceHistory
from services.data_fetcher import normalize_ticker
from services.technical import get_latest_indicators
from services.recovery_engine import diagnose_recovery, calculate_precision_avg_down
from services.ai_copilot import discuss_recovery_scenario
import pandas as pd

router = APIRouter(prefix="/api/v1/recovery", tags=["Recovery Engine"])

class AvgDownRequest(BaseModel):
    current_lot: int
    current_avg: float
    target_buy_price: float
    target_avg_price: float

@router.get("/{ticker}")
def get_recovery_diagnosis(ticker: str, db: Session = Depends(get_db)):
    ticker = normalize_ticker(ticker)
    holding = db.query(Holding).filter(Holding.ticker == ticker).first()
    
    if not holding:
        raise HTTPException(status_code=404, detail="Saham tidak ditemukan dalam portofolio")

    records = db.query(PriceHistory).filter(PriceHistory.ticker == ticker).order_by(PriceHistory.date.asc()).all()
    if records:
        df = pd.DataFrame([{
            "date": r.date, "open": r.open, "high": r.high, "low": r.low, "close": r.close,
            "volume": r.volume, "ma20": r.ma20, "ma50": r.ma50, "rsi": r.rsi, "support": r.support, "resistance": r.resistance
        } for r in records])
        indicators = get_latest_indicators(df)
        current_price = indicators["close"]
    else:
        current_price = holding.avg_price * 0.86
        indicators = {"support": current_price * 0.96, "resistance": current_price * 1.08, "rsi": 28.0}

    all_holdings = db.query(Holding).all()
    total_portfolio_equity = sum([h.avg_price * h.lot * 100 for h in all_holdings]) or (holding.avg_price * holding.lot * 100)
    import yfinance as yf

    fundamental_info = {}
    try:
        t_obj = yf.Ticker(ticker)
        info = t_obj.info or {}
        fundamental_info = {
            "dividendYield": info.get("dividendYield"),
            "trailingPE": info.get("trailingPE"),
            "priceToBook": info.get("priceToBook"),
        }
    except Exception as e:
        print(f"[recovery] Error fetching fundamentals for {ticker}: {e}")

    diagnosis = diagnose_recovery(
        ticker=ticker,
        current_price=current_price,
        avg_price=holding.avg_price,
        lot=holding.lot,
        total_portfolio_equity=total_portfolio_equity,
        latest_indicators=indicators,
        jenis=holding.jenis or "trading",
        cash_balance=168755.0,
        fundamental_info=fundamental_info
    )
    return diagnosis


@router.post("/calculate-avgdown")
def calculate_avg_down(req: AvgDownRequest):
    return calculate_precision_avg_down(
        current_lot=req.current_lot,
        current_avg=req.current_avg,
        target_buy_price=req.target_buy_price,
        target_avg_price=req.target_avg_price
    )


class RecoveryDiscussRequest(BaseModel):
    scenario_id: str
    user_question: Optional[str] = None


@router.post("/{ticker}/discuss")
def discuss_recovery(ticker: str, req: RecoveryDiscussRequest, db: Session = Depends(get_db)):
    ticker = normalize_ticker(ticker)
    holding = db.query(Holding).filter(Holding.ticker == ticker).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Saham tidak ditemukan dalam portofolio")

    records = db.query(PriceHistory).filter(PriceHistory.ticker == ticker).order_by(PriceHistory.date.asc()).all()
    if records:
        df = pd.DataFrame([{
            "date": r.date, "open": r.open, "high": r.high, "low": r.low, "close": r.close,
            "volume": r.volume, "ma20": r.ma20, "ma50": r.ma50, "rsi": r.rsi, "support": r.support, "resistance": r.resistance
        } for r in records])
        indicators = get_latest_indicators(df)
    else:
        current_price = holding.avg_price * 0.86
        indicators = {"close": current_price, "support": current_price * 0.96, "resistance": current_price * 1.08, "rsi": 28.0, "ma20": current_price * 1.02}

    import yfinance as yf
    fundamental_info = {}
    try:
        t_obj = yf.Ticker(ticker)
        info = t_obj.info or {}
        fundamental_info = {
            "dividendYield": info.get("dividendYield"),
            "trailingPE": info.get("trailingPE"),
            "priceToBook": info.get("priceToBook"),
        }
    except Exception as e:
        print(f"[recovery] Error fetching fundamentals for {ticker}: {e}")

    result = discuss_recovery_scenario(
        holding=holding,
        scenario_id=req.scenario_id,
        user_question=req.user_question,
        latest_indicators=indicators,
        fundamental_info=fundamental_info,
        cash_balance=168755.0
    )
    return result

