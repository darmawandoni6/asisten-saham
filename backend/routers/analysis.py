import json
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd

from database import get_db
from models import Holding, PriceHistory, CopilotChatLog, AIAnalysis
from services.data_fetcher import normalize_ticker, fetch_and_store_stock_data
from services.technical import get_latest_indicators
from services.ai_copilot import (
    analyze_holding_with_ai,
    get_ai_providers_status,
    set_active_provider,
    discuss_copilot_recommendation
)

router = APIRouter(prefix="/api/v1/analysis", tags=["AI Copilot"])

class SetProviderRequest(BaseModel):
    provider: str  # 'gemini' | 'opencode_zen' | 'openrouter' | '9router'

class CopilotChatRequest(BaseModel):
    question: str
    force_refresh: Optional[bool] = False

def _get_indicators_for_ticker(ticker: str, db: Session):
    records = db.query(PriceHistory).filter(PriceHistory.ticker == ticker).order_by(PriceHistory.date.asc()).all()
    if not records:
        df = fetch_and_store_stock_data(ticker, db, period="6mo")
    else:
        df = pd.DataFrame([{
            "date": r.date, "open": r.open, "high": r.high, "low": r.low, "close": r.close,
            "volume": r.volume, "ma20": r.ma20, "ma50": r.ma50, "rsi": r.rsi, "support": r.support, "resistance": r.resistance
        } for r in records])
    return get_latest_indicators(df)

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

@router.get("/{ticker}/chat-history")
def get_copilot_chat_history(
    ticker: str,
    db: Session = Depends(get_db)
):
    """Mengambil riwayat percakapan chat AI Copilot untuk ticker tertentu."""
    ticker = normalize_ticker(ticker)
    logs = db.query(CopilotChatLog).filter(
        CopilotChatLog.ticker == ticker
    ).order_by(CopilotChatLog.created_at.asc()).all()

    return [
        {
            "id": log.id,
            "ticker": log.ticker,
            "role": log.role,
            "message": log.message,
            "source": log.source,
            "sessionDate": str(log.session_date),
            "createdAt": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]

@router.get("/{ticker}/chat")
def get_copilot_chat(
    ticker: str,
    db: Session = Depends(get_db)
):
    """Mengambil riwayat percakapan chat AI Copilot (bisa dipanggil langsung via browser)."""
    return get_copilot_chat_history(ticker, db)

@router.post("/{ticker}/chat")
def send_copilot_chat(
    ticker: str,
    req: CopilotChatRequest,
    db: Session = Depends(get_db)
):
    """Mengirim pertanyaan pengguna terkait rekomendasi AI untuk ticker tertentu."""
    ticker = normalize_ticker(ticker)
    today = date.today()

    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Pertanyaan tidak boleh kosong.")

    holding = db.query(Holding).filter(Holding.ticker == ticker).first()
    if not holding:
        holding = Holding(ticker=ticker, avg_price=5000.0, lot=10, target_price=5750.0, stop_loss=4650.0)

    indicators = _get_indicators_for_ticker(ticker, db)

    # Ambil analisis AI terakhir dari DB atau generate
    cached_analysis = db.query(AIAnalysis).filter(
        AIAnalysis.ticker == ticker,
        AIAnalysis.date == today
    ).first()

    if cached_analysis:
        snapshot = json.loads(cached_analysis.raw_data_snapshot) if cached_analysis.raw_data_snapshot else {}
        ai_rec = {
            "recommendation": cached_analysis.recommendation,
            "confidence": snapshot.get("confidence", 90),
            "rationale": cached_analysis.analysis_text,
            "actionItems": snapshot.get("action_items", [])
        }
    else:
        res = analyze_holding_with_ai(holding, indicators, db)
        ai_rec = {
            "recommendation": res.get("recommendation", "HOLD"),
            "confidence": res.get("confidence", 90),
            "rationale": res.get("rationale", ""),
            "actionItems": res.get("actionItems", [])
        }

    # Ambil percakapan sebelumnya untuk konteks multi-turn
    past_logs = db.query(CopilotChatLog).filter(
        CopilotChatLog.ticker == ticker
    ).order_by(CopilotChatLog.created_at.asc()).all()

    history_list = [{"role": l.role, "message": l.message} for l in past_logs]

    # Simpan pertanyaan user ke DB
    user_log = CopilotChatLog(
        ticker=ticker,
        role="user",
        message=req.question.strip(),
        source=None,
        session_date=today
    )
    db.add(user_log)
    db.commit()

    # Panggil engine AI
    chat_res = discuss_copilot_recommendation(
        holding=holding,
        latest_indicators=indicators,
        ai_recommendation=ai_rec,
        user_question=req.question.strip(),
        conversation_history=history_list,
        db=db
    )

    assistant_msg = chat_res.get("answer", "")
    used_src = chat_res.get("source", "rule_based")

    # Simpan jawaban asisten ke DB
    assistant_log = CopilotChatLog(
        ticker=ticker,
        role="assistant",
        message=assistant_msg,
        source=used_src,
        session_date=today
    )
    db.add(assistant_log)
    db.commit()
    db.refresh(assistant_log)

    return {
        "status": "success",
        "role": "assistant",
        "answer": assistant_msg,
        "source": used_src,
        "created_at": assistant_log.created_at.isoformat() if assistant_log.created_at else None
    }

@router.delete("/{ticker}/chat-history")
def clear_copilot_chat_history(
    ticker: str,
    db: Session = Depends(get_db)
):
    """Menghapus seluruh riwayat percakapan chat untuk ticker tertentu."""
    ticker = normalize_ticker(ticker)
    deleted = db.query(CopilotChatLog).filter(
        CopilotChatLog.ticker == ticker
    ).delete()
    db.commit()
    return {"status": "success", "ticker": ticker, "deleted_count": deleted}

@router.post("/{ticker}")
@router.get("/{ticker}")
def analyze_stock(
    ticker: str,
    provider: Optional[str] = Query(None),
    force_refresh: Optional[bool] = Query(False),
    db: Session = Depends(get_db)
):
    ticker = normalize_ticker(ticker)
    today = date.today()

    # Ketika user meminta analisa ulang, hapus semua histori chat emiten ini dan reset cache
    if force_refresh:
        deleted_chats = db.query(CopilotChatLog).filter(CopilotChatLog.ticker == ticker).delete()
        db.query(AIAnalysis).filter(AIAnalysis.ticker == ticker, AIAnalysis.date == today).delete()
        db.commit()
        print(f"[analysis] Analisis ulang {ticker}: {deleted_chats} histori chat dihapus.")

    holding = db.query(Holding).filter(Holding.ticker == ticker).first()
    if not holding:
        # Create virtual holding if user analyzes non-held stock
        holding = Holding(ticker=ticker, avg_price=5000.0, lot=10, target_price=5750.0, stop_loss=4650.0)

    indicators = _get_indicators_for_ticker(ticker, db)
    result = analyze_holding_with_ai(holding, indicators, db, provider=provider, force_refresh=bool(force_refresh))
    return result
