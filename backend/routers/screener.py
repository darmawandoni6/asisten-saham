from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date
from database import get_db
from models import ScreenerResult, ScreenerChatLog
import json
from services.screener_engine import scan_market_pool, analyze_single_ticker_for_screener, determine_profile_suitability
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

        if "profile_suitability" in details and "profile_suitability_label" in details:
            suit_code = details["profile_suitability"]
            suit_label = details["profile_suitability_label"]
        else:
            suit_code, suit_label = determine_profile_suitability(
                roe_pct=details.get("roe_pct"),
                der=details.get("der"),
                sector=details.get("sector"),
                market_cap=details.get("market_cap"),
                strategy=r.strategy or details.get("strategy"),
                rsi=details.get("rsi", 50.0),
                close=details.get("price"),
                ma20=details.get("ma20")
            )

        results.append({
            "ticker": r.ticker,
            "name": details.get("name", r.ticker),
            "sector": details.get("sector", "General"),
            "profile_suitability": suit_code,
            "profile_suitability_label": suit_label,
            "price": details.get("price", 0),
            "change_pct": details.get("change_pct", 0),
            "change_nominal": details.get("change_nominal", 0),
            "volume": details.get("volume", 0),
            "rsi": details.get("rsi", 50),
            "ma_status": details.get("ma_status", "Normal"),
            "strategy": r.strategy,
            "score": score_val,
            "conviction_score": conv_score,
            "conviction_label": conv_label,
            "conviction_reason": details.get("conviction_reason"),
            "ai_analysis": details.get("ai_analysis"),
            "ai_source": details.get("ai_source"),
            "market_cap": details.get("market_cap"),
            "market_cap_formatted": details.get("market_cap_formatted", "-"),
            "free_float_pct": details.get("free_float_pct"),
            "roe_pct": details.get("roe_pct"),
            "der": details.get("der"),
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
    # 1. Reset / hapus seluruh riwayat chat diskusi screener dari database
    db.query(ScreenerChatLog).delete()
    db.commit()
    # 2. Jalankan pemindaian market pool baru dan simpan hasilnya ke database
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
    
    # 1. Cari data rekomendasi screener di DB
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

    has_user_question = bool(req.question and req.question.strip())

    # Jika hanya load/init tanpa pertanyaan baru dan sudah ada riwayat chat di DB
    if not has_user_question and len(past_logs) > 0:
        last_asst = [l for l in past_logs if l.role == "assistant"]
        latest_asst = last_asst[-1] if last_asst else None
        
        conv_score = latest_asst.conviction_score if (latest_asst and latest_asst.conviction_score) else screener_item.get("conviction_score", 8)
        
        return {
            "status": "success",
            "source": latest_asst.source if latest_asst else "database",
            "ticker": ticker,
            "conviction_score": conv_score,
            "conviction_label": screener_item.get("conviction_label", "Layak Pantau"),
            "conviction_reason": screener_item.get("conviction_reason", ""),
            "answer": latest_asst.message if latest_asst else screener_item.get("why_buy", ""),
            "suggested_questions": [
                f"Bisakah saham {ticker} ini saya beli besok pagi dan bagaimana prospeknya?",
                f"Bagaimana kesehatan fundamental (ROE & DER) emiten ini?",
                f"Berapa batas risiko Stop Loss dan area antre beli idealnya?"
            ],
            "history": [
                {
                    "id": l.id,
                    "role": l.role,
                    "message": l.message,
                    "source": l.source,
                    "conviction_score": l.conviction_score,
                    "created_at": str(l.created_at) if l.created_at else None
                }
                for l in past_logs
            ]
        }

    history_list = [{"role": l.role, "message": l.message} for l in past_logs]

    # 3. Simpan pertanyaan user jika ada
    if has_user_question:
        user_log = ScreenerChatLog(
            ticker=ticker,
            role="user",
            message=req.question.strip(),
            source=None,
            session_date=today
        )
        db.add(user_log)
        db.commit()

    # 4. Panggil engine AI untuk analisis
    result = discuss_screener_recommendation(
        screener_item=screener_item,
        user_question=req.question,
        conversation_history=history_list,
        db=db,
        provider=req.provider
    )

    # 5. Simpan respons asisten ke database ScreenerChatLog
    assistant_msg = result.get("answer", "")
    used_src = result.get("source", "rule_based")
    conv_score = result.get("conviction_score", screener_item.get("conviction_score", 8))
    conv_label = result.get("conviction_label", screener_item.get("conviction_label", "Layak Pantau"))
    conv_reason = result.get("conviction_reason", "")

    assistant_log = ScreenerChatLog(
        ticker=ticker,
        role="assistant",
        message=assistant_msg,
        source=used_src,
        conviction_score=conv_score,
        session_date=today
    )
    db.add(assistant_log)

    # 6. Simpan / Perbarui data analisa AI ke dalam tabel ScreenerResult di database
    if record:
        details_obj = json.loads(record.details) if record.details else {}
        details_obj["conviction_score"] = conv_score
        details_obj["conviction_label"] = conv_label
        details_obj["conviction_reason"] = conv_reason
        details_obj["ai_analysis"] = assistant_msg
        details_obj["ai_source"] = used_src
        record.details = json.dumps(details_obj)
        record.score = conv_score * 10
    
    db.commit()

    # 7. Format updated history
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



