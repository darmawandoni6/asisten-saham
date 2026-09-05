from typing import Dict, Any
from sqlalchemy.orm import Session
from models import Holding, PriceHistory

def evaluate_holding_status(holding: Holding, latest_candle: dict, db: Session) -> Dict[str, Any]:
    close = float(latest_candle.get("close", holding.avg_price))
    prev_close = float(latest_candle.get("open", close))
    avg_price = float(holding.avg_price)
    jenis = getattr(holding, "jenis", "trading") or "trading"
    trailing_stop_pct = float(holding.trailing_stop_pct or 7.0)

    # Track high watermark
    current_high_watermark = float(holding.high_watermark or holding.avg_price)
    if close > current_high_watermark:
        current_high_watermark = close
        holding.high_watermark = close
        db.commit()

    trailing_stop_price = round(current_high_watermark * (1 - (trailing_stop_pct / 100)))

    # PnL calculations
    shares = holding.lot * 100
    floating_pnl = (close - avg_price) * shares
    floating_pnl_pct = ((close - avg_price) / avg_price) * 100
    highest_profit_pct = ((current_high_watermark - avg_price) / avg_price) * 100

    # Dynamic Adaptive TP & SL (Opsi B):
    # Support & Resistance dari candle penutupan terbaru
    supp = float(latest_candle.get("support", 0) or 0)
    res = float(latest_candle.get("resistance", 0) or 0)

    if jenis == "trading":
        # Aturan Baku SL: Hanya boleh naik (trailing up), TIDAK BOLEH turun di bawah SL awal!
        if supp > 0:
            candidate_sl = round(supp * 0.97)
            current_sl = float(holding.stop_loss or 0)
            if candidate_sl > current_sl:
                holding.stop_loss = candidate_sl
                db.commit()

        # Update TP adaptif ke level resistance harian terbaru
        if res > 0:
            holding.target_price = round(res)
            db.commit()

    elif jenis == "investasi":
        holding.stop_loss = None
        # Untuk investasi, target price adaptif mengikuti resistance puncak jangka panjang
        if res > 0 and (holding.target_price is None or res > float(holding.target_price)):
            holding.target_price = round(res)
            db.commit()

    if jenis == "investasi":
        target_price = float(holding.target_price) if holding.target_price else avg_price * 1.30
        stop_loss = None  # Tidak ada hard SL untuk investasi

        dist_tp = ((target_price - close) / target_price * 100) if target_price > 0 else 999

        if close >= target_price:
            action_status = "TAKE_PROFIT"
            action_reason = f"AMBIL UNTUNG — Target investasi Rp {target_price:,.0f} tercapai! Evaluasi amankan sebagian profit atau pertahankan untuk dividen berkala."
        elif 0 < dist_tp <= 2.0:
            action_status = "TP_PROXIMITY_WARNING"
            action_reason = f"PERSIAPAN TP — Harga Rp {close:,.0f} mendekati Target Investasi Rp {target_price:,.0f} (jarak tinggal {dist_tp:.1f}%). Bersiap amankan laba."
        elif floating_pnl_pct <= -30.0:
            action_status = "AVERAGING_REVIEW"
            action_reason = f"AVERAGING DOWN — Floating loss {floating_pnl_pct:.1f}%. Buka menu Recovery Engine untuk simulasi cicil beli di Support Major."
        elif floating_pnl_pct <= -15.0:
            action_status = "RECOVERY_MODE"
            action_reason = f"RECOVERY REVIEW — Floating loss {floating_pnl_pct:.1f}%. Pantau support emiten untuk potensi akumulasi bertahap."
        else:
            action_status = "HOLD_MONITOR"
            action_reason = f"HOLD — Posisi investasi terpantau aman. Target jangka panjang Rp {target_price:,.0f}. Tidak ada aksi mendesak."
    else:
        target_price = float(holding.target_price) if holding.target_price else avg_price * 1.15
        stop_loss = float(holding.stop_loss) if holding.stop_loss else avg_price * 0.93

        dist_sl = ((close - stop_loss) / close * 100) if close > 0 else 999
        dist_tp = ((target_price - close) / target_price * 100) if target_price > 0 else 999

        if close <= stop_loss:
            action_status = "SELL_CUT_LOSS"
            action_reason = f"JUAL 100% LOT — Disiplin! Harga closing (Rp {close:,.0f}) menembus Stop Loss (Rp {stop_loss:,.0f}). Pasang order jual pada pembukaan market besok pagi."
        elif 0 < dist_sl <= 2.0:
            action_status = "SL_PROXIMITY_WARNING"
            action_reason = f"SIAGA 1 (DEKAT STOP LOSS) — Harga Rp {close:,.0f} mendekati Stop Loss Rp {stop_loss:,.0f} (jarak {dist_sl:.1f}%). Pasang Stop Order di sekuritas untuk antisipasi breakdown."
        elif close >= target_price:
            action_status = "TAKE_PROFIT"
            action_reason = f"AMBIL UNTUNG (SCALE-OUT) — Harga Rp {close:,.0f} mencapai Target Profit Rp {target_price:,.0f}. Pasang Sell Limit 50% Lot untuk kunci laba, sisa pasang trailing stop."
        elif 0 < dist_tp <= 2.0:
            action_status = "TP_PROXIMITY_WARNING"
            action_reason = f"PERSIAPAN TAKE PROFIT — Harga Rp {close:,.0f} mendekati Target Rp {target_price:,.0f} (jarak tinggal {dist_tp:.1f}%). Bersiap pasang antrean jual 50% lot besok pagi."
        elif highest_profit_pct >= 10.0 and close <= trailing_stop_price:
            action_status = "TRAILING_STOP_WARNING"
            action_reason = f"KUNCI PROFIT — Harga turun dari puncak Rp {current_high_watermark:,.0f} dan menembus Trailing Stop Rp {trailing_stop_price:,.0f}. Jual sisa posisi sekarang."
        elif floating_pnl_pct <= -10.0:
            action_status = "RECOVERY_MODE"
            action_reason = f"RECOVERY PLAN — Floating loss mencapai {floating_pnl_pct:.1f}%. Buka Recovery Engine untuk simulasi exit rebound."
        else:
            action_status = "HOLD_MONITOR"
            action_reason = f"HOLD — Kondisi teknikal aman berjalan sesuai trading plan. Pertahankan posisi menuju target Rp {target_price:,.0f}."


    return {
        "id": holding.id,
        "ticker": holding.ticker,
        "name": f"{holding.ticker.replace('.JK', '')} Tbk",
        "sector": holding.sector or "—",
        "jenis": jenis,
        "avgPrice": avg_price,
        "lot": holding.lot,
        "shares": shares,
        "currentPrice": close,
        "previousClose": prev_close,
        "targetPrice": target_price,
        "stopLoss": stop_loss,
        "highWatermark": current_high_watermark,
        "trailingStopPrice": trailing_stop_price if jenis == "trading" else None,
        "floatingPnl": round(floating_pnl),
        "floatingPnlPct": round(floating_pnl_pct, 2),
        "actionStatus": action_status,
        "actionReason": action_reason,
        "buyReason": holding.buy_reason,
        "buyDate": holding.created_at.strftime("%Y-%m-%d") if holding.created_at else "2026-08-01",
        "rsi": float(latest_candle.get("rsi", 50.0)),
        "aboveMa20": close > float(latest_candle.get("ma20", 0)),
        "aboveMa50": close > float(latest_candle.get("ma50", 0)),
    }

