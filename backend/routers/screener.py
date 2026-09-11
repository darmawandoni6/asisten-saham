from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date
from database import get_db
from models import ScreenerResult, ScreenerChatLog
import json
from services.screener_engine import scan_market_pool, analyze_single_ticker_for_screener
from services.data_fetcher import normalize_ticker
from services.ai_copilot import discuss_screener_recommendation

router = APIRouter(prefix="/api/v1/screener", tags=["EOD Screener"])

class AnalyzeTickerRequest(BaseModel):
    ticker: str

class ScreenerDiscussRequest(BaseModel):
    question: Optional[str] = None
    provider: Optional[str] = None

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
        score_val = r.score if r.score is not None else details.get("score", 85)
        rrr_val = details.get("risk_reward_ratio", "1 : 2.0")

        if "conviction_score" in details:
            conv_score = details["conviction_score"]
            conv_label = details.get("conviction_label", "Wajib Dibeli Besok Pagi" if conv_score == 10 else "Sangat Direkomendasikan")
        else:
            if score_val >= 90 or (score_val >= 87 and ("2." in rrr_val or "3." in rrr_val or "4." in rrr_val)):
                conv_score = 10
                conv_label = "Wajib Dibeli Besok Pagi"
            elif score_val >= 85:
                conv_score = 9
                conv_label = "Sangat Direkomendasikan Beli Besok Pagi"
            elif score_val >= 80:
                conv_score = 8
                conv_label = "Prioritas Masuk Radar Beli"
            elif score_val >= 75:
                conv_score = 7
                conv_label = "Layak Pantau / Akumulasi Bertahap"
            else:
                conv_score = 6
                conv_label = "Tunggu Konfirmasi Pantulan"

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
            "score": score_val,
            "conviction_score": conv_score,
            "conviction_label": conv_label,
            "catalyst": details.get("catalyst", ""),
            "action_stance": details.get("action_stance", "MONITOR"),
            "why_buy": details.get("why_buy", details.get("catalyst", "")),
            "watch_trigger": details.get("watch_trigger", ""),
            "buy_area": details.get("buy_area", ""),
            "target_price": details.get("target_price", details.get("resistance", 0)),
            "stop_loss": details.get("stop_loss", details.get("support", 0)),
            "risk_reward_ratio": rrr_val,
            "potential_gain_pct": details.get("potential_gain_pct", 0),
            "potential_risk_pct": details.get("potential_risk_pct", 0),
            "support": details.get("support", 0),
            "resistance": details.get("resistance", 0)
        })
    return results


@router.post("/scan")
def run_screener_scan(db: Session = Depends(get_db)):
    db.query(ScreenerChatLog).delete()
    db.commit()
    return scan_market_pool(db)

@router.post("/analyze")
def analyze_custom_ticker(req: AnalyzeTickerRequest, db: Session = Depends(get_db)):
    if not req.ticker or not req.ticker.strip():
        raise HTTPException(status_code=400, detail="Ticker tidak boleh kosong")
    result = analyze_single_ticker_for_screener(req.ticker.strip(), db)
    if not result:
        raise HTTPException(status_code=404, detail=f"Gagal menganalisis saham '{req.ticker}'. Pastikan kode ticker terdaftar di Bursa Efek Indonesia (IDX).")
    return result

@router.post("/{ticker}/discuss")
def discuss_screener_item(ticker: str, req: ScreenerDiscussRequest, db: Session = Depends(get_db)):
    ticker = normalize_ticker(ticker)
    today = date.today()
    
    # 1. Cari data rekomendasi screener
    record = db.query(ScreenerResult).filter(ScreenerResult.ticker == ticker).order_by(ScreenerResult.id.desc()).first()
    if record and record.details:
        screener_item = json.loads(record.details)
    else:
        # Jika belum ada di DB, analisis instan
        screener_item = analyze_single_ticker_for_screener(ticker, db)
        if not screener_item:
            raise HTTPException(status_code=404, detail=f"Data saham {ticker} tidak ditemukan di BEI.")

    # 2. Ambil riwayat chat multi-turn
    past_logs = db.query(ScreenerChatLog).filter(
        ScreenerChatLog.ticker == ticker
    ).order_by(ScreenerChatLog.created_at.asc()).all()
    history_list = [{"role": l.role, "message": l.message} for l in past_logs]

    # 3. Simpan pertanyaan user jika ada
    if req.question and req.question.strip():
        user_log = ScreenerChatLog(
            ticker=ticker,
            role="user",
            message=req.question.strip(),
            source=None,
            session_date=today
        )
        db.add(user_log)
        db.commit()

    # 4. Panggil engine AI
    result = discuss_screener_recommendation(
        screener_item=screener_item,
        user_question=req.question,
        conversation_history=history_list,
        db=db,
        provider=req.provider
    )

    # 5. Simpan respons asisten ke database
    assistant_msg = result.get("answer", "")
    used_src = result.get("source", "rule_based")
    conv_score = result.get("conviction_score", 10)
    
    assistant_log = ScreenerChatLog(
        ticker=ticker,
        role="assistant",
        message=assistant_msg,
        source=used_src,
        conviction_score=conv_score,
        session_date=today
    )
    db.add(assistant_log)
    db.commit()

    # 6. Format updated history
    updated_logs = db.query(ScreenerChatLog).filter(
        ScreenerChatLog.ticker == ticker
    ).order_by(ScreenerChatLog.created_at.asc()).all()
    
    result["history"] = [
        {
            "id": l.id,
            "role": l.role,
            "message": l.message,
            "source": l.source,
            "conviction_score": l.conviction_score,
            "created_at": str(l.created_at) if l.created_at else None
        }
        for l in updated_logs
    ]

    return result

@router.get("/{ticker}/chat-history")
def get_screener_chat_history(ticker: str, db: Session = Depends(get_db)):
    ticker = normalize_ticker(ticker)
    logs = db.query(ScreenerChatLog).filter(
        ScreenerChatLog.ticker == ticker
    ).order_by(ScreenerChatLog.created_at.asc()).all()
    return [
        {
            "id": l.id,
            "role": l.role,
            "message": l.message,
            "source": l.source,
            "conviction_score": l.conviction_score,
            "created_at": str(l.created_at) if l.created_at else None
        }
        for l in logs
    ]

@router.delete("/{ticker}/chat-history")
def clear_screener_chat_history(ticker: str, db: Session = Depends(get_db)):
    ticker = normalize_ticker(ticker)
    deleted = db.query(ScreenerChatLog).filter(ScreenerChatLog.ticker == ticker).delete()
    db.commit()
    return {"status": "success", "deleted_count": deleted}



