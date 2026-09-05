import pandas as pd
import numpy as np

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Menghitung MA20, MA50, MA200, RSI(14), dan Support/Resistance.
    Memiliki fallback kalkulasi native pandas jika pandas-ta tidak terpasang.
    """
    if df.empty or len(df) < 5:
        return df

    df = df.copy()
    
    # Sort chronological
    if "date" in df.columns:
        df = df.sort_values("date").reset_index(drop=True)

    # 1. Moving Averages
    df["ma20"] = df["close"].rolling(window=20, min_periods=1).mean()
    df["ma50"] = df["close"].rolling(window=50, min_periods=1).mean()
    df["ma200"] = df["close"].rolling(window=200, min_periods=1).mean()

    # 2. RSI (14-day standard)
    delta = df["close"].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    
    avg_gain = gain.rolling(window=14, min_periods=1).mean()
    avg_loss = loss.rolling(window=14, min_periods=1).mean()
    
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    df["rsi"] = rsi.fillna(50.0).round(1)

    # 3. Support & Resistance (Rolling 20-day Low & High)
    df["support"] = df["low"].rolling(window=20, min_periods=5).min()
    df["resistance"] = df["high"].rolling(window=20, min_periods=5).max()

    return df

def get_latest_indicators(df: pd.DataFrame) -> dict:
    if df.empty:
        return {
            "close": 0, "ma20": 0, "ma50": 0, "ma200": 0,
            "rsi": 50.0, "support": 0, "resistance": 0,
            "trend": "SIDEWAYS", "volume_status": "NORMAL"
        }
    
    df = calculate_indicators(df)
    last_row = df.iloc[-1]
    
    close = float(last_row["close"])
    ma20 = float(last_row["ma20"]) if pd.notna(last_row.get("ma20")) else close
    ma50 = float(last_row["ma50"]) if pd.notna(last_row.get("ma50")) else close
    ma200 = float(last_row.get("ma200", close)) if pd.notna(last_row.get("ma200")) else close
    rsi = float(last_row["rsi"]) if pd.notna(last_row.get("rsi")) else 50.0
    support = float(last_row.get("support", close * 0.95))
    resistance = float(last_row.get("resistance", close * 1.05))

    # Trend logic
    if close > ma20 and ma20 > ma50:
        trend = "BULLISH"
    elif close < ma20 and ma20 < ma50:
        trend = "BEARISH"
    else:
        trend = "SIDEWAYS"

    # Volume status
    vol_mean = df["volume"].tail(20).mean() if "volume" in df.columns else 0
    cur_vol = float(last_row.get("volume", 0))
    volume_status = "ABOVE_AVG" if cur_vol > vol_mean * 1.2 else "NORMAL"

    return {
        "close": round(close),
        "ma20": round(ma20),
        "ma50": round(ma50),
        "ma200": round(ma200),
        "rsi": round(rsi, 1),
        "support": round(support),
        "resistance": round(resistance),
        "trend": trend,
        "volume_status": volume_status
    }
