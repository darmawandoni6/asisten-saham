from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import date
import json
from models import ScreenerResult
from services.data_fetcher import fetch_and_store_stock_data
from services.technical import get_latest_indicators

STOCK_PROFILES = {
    "BBCA.JK": {"name": "Bank Central Asia Tbk", "sector": "Financials"},
    "BBRI.JK": {"name": "Bank Rakyat Indonesia Tbk", "sector": "Financials"},
    "BMRI.JK": {"name": "Bank Mandiri (Persero) Tbk", "sector": "Financials"},
    "BBNI.JK": {"name": "Bank Negara Indonesia Tbk", "sector": "Financials"},
    "ASII.JK": {"name": "Astra International Tbk", "sector": "Industrials"},
    "TLKM.JK": {"name": "Telkom Indonesia Tbk", "sector": "Telecommunication"},
    "UNVR.JK": {"name": "Unilever Indonesia Tbk", "sector": "Consumer Non-Cyclicals"},
    "ICBP.JK": {"name": "Indofood CBP Sukses Makmur Tbk", "sector": "Consumer Non-Cyclicals"},
    "ADRO.JK": {"name": "Adaro Energy Indonesia Tbk", "sector": "Energy"},
    "PTBA.JK": {"name": "Bukit Asam Tbk", "sector": "Energy"},
    "MEDC.JK": {"name": "Medco Energi Internasional Tbk", "sector": "Energy"},
    "GOTO.JK": {"name": "GoTo Gojek Tokopedia Tbk", "sector": "Technology"},
}

def scan_market_pool(db: Session) -> List[Dict[str, Any]]:
    today = date.today()
    results = []

    # Clear previous screener results
    db.query(ScreenerResult).delete()
    db.commit()

    for ticker, profile in STOCK_PROFILES.items():
        try:
            df = fetch_and_store_stock_data(ticker, db, period="3mo")
            if df.empty or len(df) < 5:
                continue

            indicators = get_latest_indicators(df)
            close = indicators["close"]
            prev_close = float(df["close"].iloc[-2]) if len(df) >= 2 else close
            change_pct = round(((close - prev_close) / prev_close) * 100, 2)
            rsi = indicators.get("rsi", 50.0)
            ma20 = indicators.get("ma20", close)
            ma50 = indicators.get("ma50", close)
            volume = indicators.get("volume", 0)
            support = indicators.get("support", round(close * 0.95))
            resistance = indicators.get("resistance", round(close * 1.05))

            # Strategy classification
            if rsi < 35:
                strategy = "OVERSOLD"
                score = round(95 - rsi)
                ma_status = "Oversold Rebound Zone"
                catalyst = f"RSI oversold level {rsi:.1f} di dekat area support Rp {int(support):,}"
            elif close >= ma20 and rsi >= 55:
                strategy = "BREAKOUT"
                score = round(80 + (change_pct if change_pct > 0 else 5))
                ma_status = "Above MA20 Bullish Momentum"
                catalyst = f"Breakout MA20 dengan momentum RSI {rsi:.1f} dan volume harian aktif"
            else:
                strategy = "VALUE"
                score = 85
                ma_status = "Akumulasi Support MA50"
                catalyst = f"Konsolidasi di area support Rp {int(support):,} dengan valuasi wajar"

            score = min(max(score, 70), 98)

            item_data = {
                "ticker": ticker,
                "name": profile["name"],
                "sector": profile["sector"],
                "price": close,
                "change_pct": change_pct,
                "volume": volume,
                "rsi": rsi,
                "ma_status": ma_status,
                "strategy": strategy,
                "score": score,
                "catalyst": catalyst,
                "support": support,
                "resistance": resistance
            }

            screener_row = ScreenerResult(
                date=today,
                ticker=ticker,
                strategy=strategy,
                score=float(score),
                details=json.dumps(item_data)
            )
            db.add(screener_row)
            results.append(item_data)
        except Exception as e:
            print(f"Error scanning {ticker}: {e}")
            continue

    db.commit()
    results.sort(key=lambda x: x["score"], reverse=True)
    return results
