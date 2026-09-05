from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import TradeLog, get_cash_balance, set_cash_balance

router = APIRouter(prefix="/api/v1/journal", tags=["Trading Journal"])

class TradeCreate(BaseModel):
    ticker: str
    action: str # BUY, SELL, CUT_LOSS, TRIM, AVG_DOWN
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
        "realizedPnlPct": round((t.realized_pnl / (t.price * t.lot * 100)) * 100, 2) if t.realized_pnl and (t.price * t.lot * 100) > 0 else 0,
        "notes": t.note,
        "psychologyFlag": "FOMO_BUY" if any(k in (t.note or "") for k in ["ARA", "FOMO", "FOMO_BUY"]) else "PANIC_SELL" if any(k in (t.note or "") for k in ["Panik", "PANIC", "PANIC_SELL"]) else "DISCIPLINED"
    } for t in trades]

@router.post("/trade")
def record_trade(req: TradeCreate, db: Session = Depends(get_db)):
    act = req.action.upper()

    note_val = req.notes or ""
    if req.psychology_flag and req.psychology_flag != "DISCIPLINED" and f"[{req.psychology_flag}]" not in note_val:
        note_val = f"[{req.psychology_flag}] {note_val}".strip()

    item = TradeLog(
        ticker=req.ticker.upper(),
        action=act,
        price=req.price,
        lot=req.lot,
        realized_pnl=req.realized_pnl,
        note=note_val if note_val else None
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/post-mortem")
def get_post_mortem_evaluation(db: Session = Depends(get_db)):
    trades = db.query(TradeLog).all()
    closed_trades = [t for t in trades if t.action in ("SELL", "CUT_LOSS", "TRIM") or (t.realized_pnl is not None and t.realized_pnl != 0)]
    
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
    eval_trades = closed_trades if closed_trades else trades
    wins = [t for t in eval_trades if (t.realized_pnl or 0) > 0]
    win_rate = (len(wins) / len(eval_trades) * 100) if eval_trades else 0

    gross_profit = sum([t.realized_pnl for t in eval_trades if (t.realized_pnl or 0) > 0])
    gross_loss = abs(sum([t.realized_pnl for t in eval_trades if (t.realized_pnl or 0) < 0]))
    profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (round(gross_profit, 2) if gross_profit > 0 else 1.0)

    return {
        "winRatePct": round(win_rate, 1),
        "totalRealizedPnl": round(total_pnl),
        "profitFactor": profit_factor,
        "totalTrades": len(trades),
        "dominantPattern": "Disiplin Trading Plan",
        "aiFeedback": f"Tercatat {len(trades)} transaksi ({len(closed_trades)} penjualan/exit) pada portofolio Anda. Terus pertahankan evaluasi berkala pasca-closing.",
        "recommendations": [
            "Terapkan aturan 'Wait for Pullback' — jangan pernah buy order ketika harga sudah running > 5% dalam 1 sesi.",
            "Perketat stop-loss otomatis di broker untuk menghindari ragu cut-loss saat terjadi flash dump."
        ]
    }
