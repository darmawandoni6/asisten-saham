import yfinance as yf
import pandas as pd
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from models import PriceHistory
from services.technical import calculate_indicators

def normalize_ticker(ticker: str) -> str:
    ticker = ticker.strip().upper()
    if not ticker.endswith(".JK"):
        ticker = f"{ticker}.JK"
    return ticker

def fetch_and_store_stock_data(ticker: str, db: Session, period: str = "6mo") -> pd.DataFrame:
    ticker = normalize_ticker(ticker)
    
    try:
        data = yf.download(ticker, period=period, interval="1d", progress=False)
        if data.empty:
            raise ValueError(f"Data kosong dari yfinance untuk {ticker}")

        # Flatten multi-index columns if yfinance returns them
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = [col[0].lower() for col in data.columns]
        else:
            data.columns = [col.lower() for col in data.columns]

        data = data.reset_index()
        date_col = "date" if "date" in data.columns else "Date"
        data["date"] = pd.to_datetime(data[date_col]).dt.date

        # Calculate technical indicators
        df = calculate_indicators(data)

        # Save or update into DB
        for _, row in df.iterrows():
            candle_date = row["date"]
            existing = db.query(PriceHistory).filter(
                PriceHistory.ticker == ticker,
                PriceHistory.date == candle_date
            ).first()

            if not existing:
                new_hist = PriceHistory(
                    ticker=ticker,
                    date=candle_date,
                    open=float(row["open"]),
                    high=float(row["high"]),
                    low=float(row["low"]),
                    close=float(row["close"]),
                    volume=int(row["volume"]) if pd.notna(row.get("volume")) else 0,
                    ma20=float(row["ma20"]) if pd.notna(row.get("ma20")) else None,
                    ma50=float(row["ma50"]) if pd.notna(row.get("ma50")) else None,
                    ma200=float(row.get("ma200")) if pd.notna(row.get("ma200")) else None,
                    rsi=float(row["rsi"]) if pd.notna(row.get("rsi")) else None,
                    support=float(row.get("support")) if pd.notna(row.get("support")) else None,
                    resistance=float(row.get("resistance")) if pd.notna(row.get("resistance")) else None,
                )
                db.add(new_hist)
            else:
                existing.close = float(row["close"])
                existing.high = float(row["high"])
                existing.low = float(row["low"])
                existing.open = float(row["open"])
                existing.volume = int(row["volume"]) if pd.notna(row.get("volume")) else 0
                existing.ma20 = float(row["ma20"]) if pd.notna(row.get("ma20")) else None
                existing.ma50 = float(row["ma50"]) if pd.notna(row.get("ma50")) else None
                existing.rsi = float(row["rsi"]) if pd.notna(row.get("rsi")) else None
                existing.support = float(row.get("support")) if pd.notna(row.get("support")) else None
                existing.resistance = float(row.get("resistance")) if pd.notna(row.get("resistance")) else None

        db.commit()
        return df

    except Exception as e:
        print(f"Gagal menarik data {ticker}: {e}")
        # Return fallback historical data from DB if exists
        records = db.query(PriceHistory).filter(PriceHistory.ticker == ticker).order_by(PriceHistory.date.asc()).all()
        if records:
            return pd.DataFrame([{
                "date": r.date, "open": r.open, "high": r.high, "low": r.low,
                "close": r.close, "volume": r.volume, "ma20": r.ma20, "ma50": r.ma50,
                "rsi": r.rsi, "support": r.support, "resistance": r.resistance
            } for r in records])
        return pd.DataFrame()

def fetch_stock_profile(ticker: str) -> dict:
    ticker = normalize_ticker(ticker)
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        sector = info.get("sector")
        industry = info.get("industry")
        short_name = info.get("shortName") or info.get("longName") or f"{ticker.replace('.JK', '')} Tbk"
        return {
            "sector": sector or "General",
            "industry": industry or "",
            "name": short_name
        }
    except Exception as e:
        print(f"[fetch_stock_profile] Gagal menarik profile {ticker}: {e}")
        return {
            "sector": "General",
            "industry": "",
            "name": f"{ticker.replace('.JK', '')} Tbk"
        }

