from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Literal
from database import get_db
from models import Holding
from services.data_fetcher import normalize_ticker, fetch_and_store_stock_data, fetch_stock_profile
from services.ai_tp_sl import recommend_tp_sl

router = APIRouter(prefix="/api/v1/portfolio", tags=["Portfolio"])

class HoldingCreate(BaseModel):
    ticker: str
    avg_price: float
    lot: int
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    buy_reason: Optional[str] = None
    sector: Optional[str] = None
    jenis: Optional[Literal["trading", "investasi"]] = "trading"

class HoldingUpdate(BaseModel):
    avg_price: Optional[float] = None
    lot: Optional[int] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    buy_reason: Optional[str] = None
    sector: Optional[str] = None
    jenis: Optional[Literal["trading", "investasi"]] = None

class BatchImportItem(BaseModel):
    ticker: str
    avg_price: float
    lot: int
    jenis: Optional[Literal["trading", "investasi"]] = "trading"
    buy_reason: Optional[str] = None
    sector: Optional[str] = None

@router.get("")
def list_holdings(db: Session = Depends(get_db)):
    holdings = db.query(Holding).order_by(Holding.id.desc()).all()
    return holdings

@router.get("/recommend-tpsl/{ticker}")
def get_ai_tpsl_recommendation(
    ticker: str,
    jenis: str = "trading",
    avg_price: Optional[float] = None
):
    """Endpoint untuk mendapatkan rekomendasi TP & SL dari analisis teknikal AI."""
    ticker = normalize_ticker(ticker)
    result = recommend_tp_sl(ticker=ticker, jenis=jenis, avg_price=avg_price)
    result["ticker"] = ticker
    return result

@router.post("/import-batch")
def import_batch(items: List[BatchImportItem], db: Session = Depends(get_db)):
    """
    Import banyak saham sekaligus dengan AI-calculated TP & SL.
    Untuk tiap saham: fetch data yfinance → hitung TP/SL → simpan ke DB.
    """
    results = []
    errors = []

    for item in items:
        try:
            ticker = normalize_ticker(item.ticker)

            # Cek apakah sudah ada
            existing = db.query(Holding).filter(Holding.ticker == ticker).first()
            if existing:
                results.append({
                    "ticker": ticker,
                    "status": "skipped",
                    "reason": "Sudah ada di portofolio",
                    "id": existing.id
                })
                continue

            # Minta AI rekomendasikan TP & SL
            rec = recommend_tp_sl(ticker=ticker, jenis=item.jenis or "trading", avg_price=item.avg_price)

            # Tentukan TP & SL final
            tp = item.target_price if hasattr(item, 'target_price') and getattr(item, 'target_price', None) else rec.get("tp")
            sl = None if item.jenis == "investasi" else rec.get("sl")

            # Auto-fetch sector jika belum diisi
            sector = item.sector
            if not sector:
                profile = fetch_stock_profile(ticker)
                sector = profile.get("sector")

            # Buat holding
            holding = Holding(
                ticker=ticker,
                avg_price=item.avg_price,
                lot=item.lot,
                target_price=tp,
                stop_loss=sl,
                buy_reason=item.buy_reason,
                sector=sector,
                jenis=item.jenis or "trading",
                high_watermark=item.avg_price
            )
            db.add(holding)
            db.commit()
            db.refresh(holding)

            # Fetch price history di background
            try:
                fetch_and_store_stock_data(ticker, db, period="6mo")
            except Exception as fe:
                print(f"[import-batch] Fetch price history failed for {ticker}: {fe}")

            results.append({
                "ticker": ticker,
                "status": "imported",
                "id": holding.id,
                "jenis": item.jenis,
                "sector": sector,
                "tp": tp,
                "sl": sl,
                "ai_tp_rationale": rec.get("tpRationale"),
                "ai_sl_rationale": rec.get("slRationale"),
                "currentPrice": rec.get("currentPrice"),
                "rsi": rec.get("rsi"),
                "ma20": rec.get("ma20"),
                "ma50": rec.get("ma50"),
            })

        except Exception as e:
            errors.append({"ticker": item.ticker, "error": str(e)})

    return {
        "imported": len([r for r in results if r["status"] == "imported"]),
        "skipped": len([r for r in results if r["status"] == "skipped"]),
        "errors": len(errors),
        "results": results,
        "error_details": errors
    }

@router.post("")
def create_holding(req: HoldingCreate, db: Session = Depends(get_db)):
    ticker = normalize_ticker(req.ticker)
    jenis = req.jenis or "trading"

    # Minta rekomendasi teknikal AI (support/resistance 200 hari)
    rec = recommend_tp_sl(ticker=ticker, jenis=jenis, avg_price=req.avg_price)
    
    # TP/SL logic berbasis rekomendasi AI jika tidak diisi manual
    if jenis == "investasi":
        tp = req.target_price or rec.get("tp") or (req.avg_price * 1.30)
        sl = None  # Tidak ada hard SL untuk investasi
    else:
        tp = req.target_price or rec.get("tp") or (req.avg_price * 1.15)
        sl = req.stop_loss or rec.get("sl") or (req.avg_price * 0.93)

    # Auto-fetch sector dari yfinance jika tidak diisi
    sector = req.sector
    if not sector:
        profile = fetch_stock_profile(ticker)
        sector = profile.get("sector")

    holding = Holding(
        ticker=ticker,
        avg_price=req.avg_price,
        lot=req.lot,
        target_price=tp,
        stop_loss=sl,
        buy_reason=req.buy_reason,
        sector=sector,
        jenis=jenis,
        high_watermark=req.avg_price
    )

    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.put("/{holding_id}")
def update_holding(holding_id: int, req: HoldingUpdate, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding tidak ditemukan")
    
    if req.avg_price is not None: holding.avg_price = req.avg_price
    if req.lot is not None: holding.lot = req.lot
    if req.target_price is not None: holding.target_price = req.target_price
    if req.stop_loss is not None: holding.stop_loss = req.stop_loss
    if req.buy_reason is not None: holding.buy_reason = req.buy_reason
    if req.sector is not None: holding.sector = req.sector
    if req.jenis is not None: holding.jenis = req.jenis

    db.commit()
    db.refresh(holding)
    return holding

@router.delete("/{holding_id}")
def delete_holding(holding_id: int, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding tidak ditemukan")
    db.delete(holding)
    db.commit()
    return {"status": "deleted", "id": holding_id}

