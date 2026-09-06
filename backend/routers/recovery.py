from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Holding, PriceHistory, RecoveryChatLog, get_cash_balance
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
        cash_balance=get_cash_balance(db),
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
    provider: Optional[str] = None  # 'gemini' | 'opencode_zen'


@router.get("/{ticker}/chat-history")
def get_recovery_chat_history(
    ticker: str,
    scenario_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    ticker = normalize_ticker(ticker)

    # Ambil seluruh riwayat chat dalam siklus trading berjalan
    query = db.query(RecoveryChatLog).filter(
        RecoveryChatLog.ticker == ticker
    )
    if scenario_id:
        query = query.filter(RecoveryChatLog.scenario_id == scenario_id)

    logs = query.order_by(RecoveryChatLog.created_at.asc()).all()
    return [
        {
            "id": log.id,
            "ticker": log.ticker,
            "scenarioId": log.scenario_id,
            "role": log.role,
            "message": log.message,
            "source": log.source,
            "sessionDate": str(log.session_date),
            "createdAt": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]


@router.delete("/{ticker}/chat-history")
def clear_recovery_chat_history(
    ticker: str,
    scenario_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    ticker = normalize_ticker(ticker)

    query = db.query(RecoveryChatLog).filter(
        RecoveryChatLog.ticker == ticker
    )
    if scenario_id:
        query = query.filter(RecoveryChatLog.scenario_id == scenario_id)

    deleted_count = query.delete()
    db.commit()
    return {"status": "success", "deleted": deleted_count}


@router.post("/{ticker}/discuss")
def discuss_recovery(ticker: str, req: RecoveryDiscussRequest, db: Session = Depends(get_db)):
    ticker = normalize_ticker(ticker)
    today = date.today()
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

    # Fetch conversation history for multi-turn context (siklus berjalan)
    conversation_history = []
    if req.user_question and req.user_question.strip():
        past_logs = db.query(RecoveryChatLog).filter(
            RecoveryChatLog.ticker == ticker,
            RecoveryChatLog.scenario_id == req.scenario_id
        ).order_by(RecoveryChatLog.created_at.asc()).all()

        conversation_history = [
            {"role": log.role, "message": log.message}
            for log in past_logs
        ]

    result = discuss_recovery_scenario(
        holding=holding,
        scenario_id=req.scenario_id,
        user_question=req.user_question,
        latest_indicators=indicators,
        fundamental_info=fundamental_info,
        cash_balance=get_cash_balance(db),
        conversation_history=conversation_history,
        provider=req.provider
    )

    # If this was a user Q&A interaction, persist to today's chat history
    if req.user_question and req.user_question.strip():
        user_text = req.user_question.strip()
        ai_answer = result.get("answer", "")
        source = result.get("source", "gemini")

        # Save user message
        db.add(RecoveryChatLog(
            ticker=ticker,
            scenario_id=req.scenario_id,
            role="user",
            message=user_text,
            source=None,
            session_date=today
        ))
        # Save assistant message
        db.add(RecoveryChatLog(
            ticker=ticker,
            scenario_id=req.scenario_id,
            role="assistant",
            message=ai_answer,
            source=source,
            session_date=today
        ))
        db.commit()

    return result

