"""
ai_tp_sl.py — AI-powered TP & SL Recommendation
Menggunakan data historis yfinance untuk menghitung:
- Support/Resistance dari rolling high/low
- MA20/50 sebagai dynamic support
- TP: nearest resistance di atas current price
- SL: slightly below nearest support (for trading)
- Investasi: SL = None, TP lebih jauh (200 session peak)
"""
import yfinance as yf
import pandas as pd
from services.data_fetcher import normalize_ticker


def recommend_tp_sl(ticker: str, jenis: str = "trading", avg_price: float = None) -> dict:
    ticker = normalize_ticker(ticker)
    
    try:
        data = yf.download(ticker, period="200d", interval="1d", progress=False, auto_adjust=True)
        
        if data.empty or len(data) < 20:
            return _fallback_recommendation(avg_price, jenis, ticker)
        
        close = data['Close'].squeeze()
        high = data['High'].squeeze()
        low = data['Low'].squeeze()
        
        current_price = float(close.iloc[-1])
        
        # Moving Averages
        ma20 = float(close.rolling(20).mean().iloc[-1])
        ma50 = float(close.rolling(50).mean().iloc[-1]) if len(close) >= 50 else ma20
        ma200 = float(close.rolling(200).mean().iloc[-1]) if len(close) >= 200 else ma50
        
        # RSI (14)
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.rolling(14).mean().iloc[-1]
        avg_loss = loss.rolling(14).mean().iloc[-1]
        rsi = float(100 - (100 / (1 + avg_gain / avg_loss))) if avg_loss and avg_loss > 0 else 50.0
        
        # Support = max(20d low, MA50 * 0.97)
        recent_low_20 = float(low.rolling(20).min().iloc[-1])
        support = max(recent_low_20, ma50 * 0.97)
        
        # Resistance = 20d high
        recent_high_20 = float(high.rolling(20).max().iloc[-1])
        recent_high_60 = float(high.rolling(min(60, len(high))).max().iloc[-1])
        
        if jenis == "investasi":
            tp = float(high.rolling(min(200, len(high))).max().iloc[-1])
            sl = None
            sl_rationale = "Tidak ada Hard Stop Loss untuk saham investasi. Strategi: averaging down di level support."
            tp_rationale = f"Target = all-time high 200 sesi terakhir (Rp {tp:,.0f}). Fokus pemulihan jangka panjang."
            avg_down_target = round(support * 0.97, 0) if avg_price and current_price < avg_price * 0.85 else None
            avg_down_rationale = f"Area averaging rekomendasi: sekitar Rp {avg_down_target:,.0f} (dekat support kuat)" if avg_down_target else None
        else:
            tp = recent_high_20 if recent_high_20 > current_price * 1.05 else current_price * 1.15
            sl = round(support * 0.97, 0)
            sl_rationale = f"SL = 3% di bawah support Rp {support:,.0f}. Eksekusi disiplin jika tertembus closing."
            tp_rationale = f"TP = resistance 20-hari terdekat (Rp {recent_high_20:,.0f}). Scale-out saat tersentuh."
            avg_down_target = None
            avg_down_rationale = None
        
        pnl_context = None
        if avg_price:
            pnl_pct = ((current_price - avg_price) / avg_price) * 100
            pnl_context = {
                "currentPnlPct": round(pnl_pct, 2),
                "currentPrice": round(current_price, 0),
                "avgPrice": avg_price
            }
        
        return {
            "ticker": ticker,
            "jenis": jenis,
            "currentPrice": round(current_price, 0),
            "tp": round(tp, 0),
            "sl": round(sl, 0) if sl else None,
            "support": round(support, 0),
            "resistance": round(recent_high_20, 0),
            "ma20": round(ma20, 0),
            "ma50": round(ma50, 0),
            "ma200": round(ma200, 0),
            "rsi": round(rsi, 1),
            "tpRationale": tp_rationale,
            "slRationale": sl_rationale,
            "avgDownTarget": avg_down_target,
            "avgDownRationale": avg_down_rationale,
            "pnlContext": pnl_context,
            "dataSource": "yfinance 200d historical"
        }
        
    except Exception as e:
        print(f"[ai_tp_sl] Error for {ticker}: {e}")
        return _fallback_recommendation(avg_price, jenis, ticker)


def _fallback_recommendation(avg_price: float, jenis: str, ticker: str = "UNKNOWN") -> dict:
    if avg_price:
        tp = round(avg_price * (1.30 if jenis == "investasi" else 1.15), 0)
        sl = None if jenis == "investasi" else round(avg_price * 0.90, 0)
    else:
        tp = None
        sl = None
    
    return {
        "ticker": ticker,
        "jenis": jenis,
        "currentPrice": None,
        "tp": tp,
        "sl": sl,
        "support": None,
        "resistance": None,
        "ma20": None,
        "ma50": None,
        "ma200": None,
        "rsi": None,
        "tpRationale": "Data historis tidak tersedia. TP dihitung +15% dari avg price.",
        "slRationale": "Data historis tidak tersedia. SL dihitung -10% dari avg price.",
        "avgDownTarget": None,
        "avgDownRationale": None,
        "pnlContext": None,
        "dataSource": "fallback"
    }
