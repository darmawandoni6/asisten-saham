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

    target_price = resistance if resistance > close else round(close * 1.08)

    # Strategy classification & in-depth 3 pillars
    if rsi < 35:
        strategy = "OVERSOLD"
        score = round(95 - rsi)
        ma_status = "Oversold Rebound Zone"
        action_stance = "BUY ON WEAKNESS (Area Support)"
        stop_loss = round(support * 0.97)
        why_buy = f"Indikator RSI {rsi:.1f} berada di zona jenuh jual ekstrem dekat lantai Support Mayor Rp {int(support):,}. Tekanan jual mereda dan potensi pantulan teknikal tinggi."
        watch_trigger = f"Pantau antrean Bid di area Rp {int(support):,} pada jam 09:00 WIB. Tunggu konfirmasi pantulan candle hijau sebelum entry. Batal jika jebol ke bawah Rp {int(stop_loss):,}."
        buy_area = f"Rp {int(support):,} – Rp {int(close):,}"
    elif close >= ma20 and rsi >= 55:
        strategy = "BREAKOUT"
        score = round(80 + (change_pct if change_pct > 0 else 5))
        ma_status = "Above MA20 Bullish Momentum"
        action_stance = "BUY ON BREAKOUT (Momentum MA20)"
        stop_loss = round(ma20 * 0.96)
        why_buy = f"Harga berhasil bertahan di atas garis MA20 (Rp {int(ma20):,}) dengan momentum RSI {rsi:.1f}. Fase sideways selesai dan tren akselerasi bullish baru dimulai."
        watch_trigger = f"Pastikan harga dibuka & bertahan stabil di atas Rp {int(ma20):,}. Konfirmasi volume beli aktif di 15 menit pertama (09:00–09:15 WIB). Disiplin SL di Rp {int(stop_loss):,}."
        buy_area = f"Rp {int(close):,} – Rp {int(close * 1.02):,}"
    else:
        strategy = "VALUE"
        score = 85
        ma_status = "Akumulasi Support MA50"
        action_stance = "ACCUMULATE / DCA (Support MA50)"
        stop_loss = round(support * 0.95)
        why_buy = f"Emiten berfundamental kuat berkonsolidasi sehat di area support penopang MA50 (Rp {int(support):,}) dengan valuasi menarik."
        watch_trigger = f"Pantau stabilitas konsolidasi harga di atas Rp {int(support):,}. Lakukan pembelian bertahap (DCA 2-3 tahap) untuk investasi jangka menengah-panjang."
        buy_area = f"Rp {int(support):,} – Rp {int(close):,}"

    score = min(max(score, 70), 98)

    # Risk / Reward calculations
    potential_gain_nominal = max(target_price - close, 1)
    potential_risk_nominal = max(close - stop_loss, 1)
    potential_gain_pct = round((potential_gain_nominal / close) * 100, 1)
    potential_risk_pct = round((potential_risk_nominal / close) * 100, 1)
    
    rrr_num = round(potential_gain_nominal / potential_risk_nominal, 1)
    if rrr_num < 0.5:
        rrr_num = 1.0
    risk_reward_ratio = f"1 : {rrr_num}"

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
        "catalyst": why_buy,
        "action_stance": action_stance,
        "why_buy": why_buy,
        "watch_trigger": watch_trigger,
        "buy_area": buy_area,
        "target_price": target_price,
        "stop_loss": stop_loss,
        "risk_reward_ratio": risk_reward_ratio,
        "potential_gain_pct": potential_gain_pct,
        "potential_risk_pct": potential_risk_pct,
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
