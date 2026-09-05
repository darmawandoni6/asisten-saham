from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import TradeLog

router = APIRouter(prefix="/api/v1/journal", tags=["Trading Journal"])

class TradeCreate(BaseModel):
    ticker: str
    action: str # BUY, SELL, CUT_LOSS
    price: float
    lot: int
    realized_pnl: Optional[float] = 0.0
    notes: Optional[str] = None
    psychology_flag: Optional[str] = "DISCIPLINED"

@router.get("/trades")
def list_trades(db: Session = Depends(get_db)):
    trades = db.query(TradeLog).order_by(TradeLog.timestamp.desc()).all()
    
    if not trades:
        return []

    return [{
        "id": t.id,
        "date": t.timestamp.strftime("%Y-%m-%d") if t.timestamp else "2026-08-20",
        "ticker": t.ticker,
        "action": t.action,
        "price": t.price,
        "lot": t.lot,
        "totalValue": round(t.price * t.lot * 100),
        "realizedPnl": t.realized_pnl,
        "realizedPnlPct": round((t.realized_pnl / (t.price * t.lot * 100)) * 100, 2) if t.realized_pnl else 0,
        "notes": t.note,
        "psychologyFlag": "FOMO_BUY" if "ARA" in (t.note or "") else "PANIC_SELL" if "Panik" in (t.note or "") else "DISCIPLINED"
    } for t in trades]

@router.post("/trade")
def record_trade(req: TradeCreate, db: Session = Depends(get_db)):
    item = TradeLog(
        ticker=req.ticker.upper(),
        action=req.action.upper(),
        price=req.price,
        lot=req.lot,
        realized_pnl=req.realized_pnl,
        note=req.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/post-mortem")
def get_post_mortem_evaluation(db: Session = Depends(get_db)):
    trades = db.query(TradeLog).all()
    if not trades:
        return {
            "winRatePct": 0.0,
            "totalRealizedPnl": 0,
            "profitFactor": 0.0,
            "totalTrades": 0,
            "dominantPattern": "Belum ada transaksi tercatat",
            "aiFeedback": "Belum ada riwayat transaksi yang ditutup. Catat hasil transaksi penjualan Anda pada tombol 'Catat Transaksi' untuk mulai menganalisis performa dan mendeteksi bias emosi trading.",
            "recommendations": [
                "Catat setiap hasil transaksi secara jujur dan disiplin.",
                "Selalu tentukan Target Profit dan Stop Loss sebelum mengeksekusi order beli."
            ]
        }

    total_pnl = sum([t.realized_pnl or 0 for t in trades])
    wins = [t for t in trades if (t.realized_pnl or 0) > 0]
    win_rate = (len(wins) / len(trades) * 100) if trades else 0

    return {
        "winRatePct": round(win_rate, 1),
        "totalRealizedPnl": round(total_pnl),
        "profitFactor": 1.16,
        "totalTrades": len(trades),
        "dominantPattern": "Disiplin Trading Plan",
        "aiFeedback": f"Tercatat {len(trades)} transaksi pada portofolio Anda. Terus pertahankan evaluasi berkala pasca-closing.",
        "recommendations": [
            "Terapkan aturan 'Wait for Pullback' — jangan pernah buy order ketika harga sudah running > 5% dalam 1 sesi.",
            "Perketat stop-loss otomatis di broker untuk menghindari ragu cut-loss saat terjadi flash dump."
        ]
    }
