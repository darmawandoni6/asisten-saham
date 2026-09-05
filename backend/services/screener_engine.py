from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import date
import json
from models import ScreenerResult
from services.data_fetcher import fetch_and_store_stock_data, fetch_stock_profile, normalize_ticker
from services.technical import get_latest_indicators

# Kumpulan Saham Terlikuid & Paling Aktif di BEI (Konstituen Indeks LQ45 Universe)
STOCK_PROFILES = {
    # Perbankan & Keuangan
    "BBCA.JK": {"name": "Bank Central Asia Tbk", "sector": "Financials"},
    "BBRI.JK": {"name": "Bank Rakyat Indonesia Tbk", "sector": "Financials"},
    "BMRI.JK": {"name": "Bank Mandiri (Persero) Tbk", "sector": "Financials"},
    "BBNI.JK": {"name": "Bank Negara Indonesia Tbk", "sector": "Financials"},
    "BRIS.JK": {"name": "Bank Syariah Indonesia Tbk", "sector": "Financials"},
    
    # Energi & Batubara / Migas
    "ADRO.JK": {"name": "Adaro Energy Indonesia Tbk", "sector": "Energy"},
    "PTBA.JK": {"name": "Bukit Asam Tbk", "sector": "Energy"},
    "MEDC.JK": {"name": "Medco Energi Internasional Tbk", "sector": "Energy"},
    "PGAS.JK": {"name": "Perusahaan Gas Negara Tbk", "sector": "Energy"},
    "AKRA.JK": {"name": "AKR Corporindo Tbk", "sector": "Energy"},
    
    # Tambang Mineral & Logam
    "ANTM.JK": {"name": "Aneka Tambang Tbk", "sector": "Basic Materials"},
    "INCO.JK": {"name": "Vale Indonesia Tbk", "sector": "Basic Materials"},
    "MDKA.JK": {"name": "Merdeka Copper Gold Tbk", "sector": "Basic Materials"},
    "AMMN.JK": {"name": "Amman Mineral Internasional Tbk", "sector": "Basic Materials"},
    "BREN.JK": {"name": "Barito Renewables Tbk", "sector": "Utilities"},
    
    # Telekomunikasi & Teknologi
    "TLKM.JK": {"name": "Telkom Indonesia Tbk", "sector": "Telecommunication"},
    "ISAT.JK": {"name": "Indosat Tbk", "sector": "Telecommunication"},
    "EXCL.JK": {"name": "XL Axiata Tbk", "sector": "Telecommunication"},
    "GOTO.JK": {"name": "GoTo Gojek Tokopedia Tbk", "sector": "Technology"},
    "EMTK.JK": {"name": "Elang Mahkota Teknologi Tbk", "sector": "Technology"},

    # Industri & Otomotif / Alat Berat
    "ASII.JK": {"name": "Astra International Tbk", "sector": "Industrials"},
    "UNTR.JK": {"name": "United Tractors Tbk", "sector": "Industrials"},

    # Konsumsi Primer & Ritel
    "ICBP.JK": {"name": "Indofood CBP Sukses Makmur Tbk", "sector": "Consumer Non-Cyclicals"},
    "INDF.JK": {"name": "Indofood Sukses Makmur Tbk", "sector": "Consumer Non-Cyclicals"},
    "UNVR.JK": {"name": "Unilever Indonesia Tbk", "sector": "Consumer Non-Cyclicals"},
    "MYOR.JK": {"name": "Mayora Indah Tbk", "sector": "Consumer Non-Cyclicals"},
    "CPIN.JK": {"name": "Charoen Pokphand Indonesia Tbk", "sector": "Consumer Non-Cyclicals"},
    "ACES.JK": {"name": "Aspirasi Hidup Indonesia Tbk", "sector": "Consumer Cyclicals"},
    "MAPI.JK": {"name": "Mitra Adiperkasa Tbk", "sector": "Consumer Cyclicals"},

    # Farmasi & Kesehatan
    "KLBF.JK": {"name": "Kalbe Farma Tbk", "sector": "Healthcare"},
    "MIKA.JK": {"name": "Mitra Keluarga Karyasehat Tbk", "sector": "Healthcare"},

    # Infrastruktur & Semen
    "JSMR.JK": {"name": "Jasa Marga Tbk", "sector": "Infrastructure"},
    "TOWR.JK": {"name": "Sarana Menara Nusantara Tbk", "sector": "Infrastructure"},
    "SMGR.JK": {"name": "Semen Indonesia Tbk", "sector": "Basic Materials"},
    "INTP.JK": {"name": "Indocement Tunggal Prakarsa Tbk", "sector": "Basic Materials"},

    # Properti
    "BSDE.JK": {"name": "Bumi Serpong Damai Tbk", "sector": "Real Estate"},
    "CTRA.JK": {"name": "Ciputra Development Tbk", "sector": "Real Estate"},
    "PWON.JK": {"name": "Pakuwon Jati Tbk", "sector": "Real Estate"},
}


def evaluate_screener_indicators(df, ticker: str, profile_name: str, profile_sector: str) -> Optional[Dict[str, Any]]:
    if df.empty or len(df) < 5:
        return None

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
        catalyst = f"Breakout MA20 dengan momentum RSI {rsi:.1f} dan volume aktif"
    else:
        strategy = "VALUE"
        score = 85
        ma_status = "Akumulasi Support MA50"
        catalyst = f"Konsolidasi di area support Rp {int(support):,} dengan valuasi wajar"

    score = min(max(score, 70), 98)

    return {
        "ticker": ticker,
        "name": profile_name,
        "sector": profile_sector,
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


def scan_market_pool(db: Session, top_n: int = 10) -> List[Dict[str, Any]]:
    """
    Memindai seluruh kumpulan saham likuid di BEI (LQ45 universe),
    lalu memilih dan mengembalikan Top N (default 10) saham dengan AI Score tertinggi.
    """
    today = date.today()
    all_evaluated = []

    # Clear previous screener results
    db.query(ScreenerResult).delete()
    db.commit()

    for ticker, profile in STOCK_PROFILES.items():
        try:
            df = fetch_and_store_stock_data(ticker, db, period="3mo")
            item_data = evaluate_screener_indicators(df, ticker, profile["name"], profile["sector"])
            if item_data:
                all_evaluated.append(item_data)
        except Exception as e:
            print(f"Error scanning {ticker}: {e}")
            continue

    # Sort by AI Score descending
    all_evaluated.sort(key=lambda x: x["score"], reverse=True)

    # Filter to Top N (Top 10 rekomendasi terbaik)
    top_picks = all_evaluated[:top_n]

    # Save Top 10 to DB
    for item in top_picks:
        screener_row = ScreenerResult(
            date=today,
            ticker=item["ticker"],
            strategy=item["strategy"],
            score=float(item["score"]),
            details=json.dumps(item)
        )
        db.add(screener_row)

    db.commit()
    return top_picks


def analyze_single_ticker_for_screener(ticker_input: str, db: Session) -> Optional[Dict[str, Any]]:
    """
    Menganalisis 1 saham kustom yang diinput oleh pengguna dari Yahoo Finance,
    menghitung indikator teknikal & AI score, dan memasukkannya ke ScreenerResult.
    """
    ticker = normalize_ticker(ticker_input)
    today = date.today()

    try:
        # Fetch stock profile for name and sector
        if ticker in STOCK_PROFILES:
            profile = STOCK_PROFILES[ticker]
            name = profile["name"]
            sector = profile["sector"]
        else:
            prof = fetch_stock_profile(ticker)
            name = prof.get("name", f"{ticker.replace('.JK', '')} Tbk")
            sector = prof.get("sector", "General")

        df = fetch_and_store_stock_data(ticker, db, period="3mo")
        if df.empty or len(df) < 5:
            return None

        item_data = evaluate_screener_indicators(df, ticker, name, sector)
        if not item_data:
            return None

        # Check if already in DB, update or insert
        existing = db.query(ScreenerResult).filter(
            ScreenerResult.ticker == ticker,
            ScreenerResult.date == today
        ).first()

        if existing:
            existing.strategy = item_data["strategy"]
            existing.score = float(item_data["score"])
            existing.details = json.dumps(item_data)
        else:
            screener_row = ScreenerResult(
                date=today,
                ticker=ticker,
                strategy=item_data["strategy"],
                score=float(item_data["score"]),
                details=json.dumps(item_data)
            )
            db.add(screener_row)

        db.commit()
        return item_data

    except Exception as e:
        print(f"[analyze_single_ticker_for_screener] Error: {e}")
        return None
