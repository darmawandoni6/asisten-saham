from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import date
import json
from models import ScreenerResult
from services.data_fetcher import (
    fetch_and_store_stock_data,
    fetch_stock_profile,
    fetch_stock_fundamentals,
    normalize_ticker,
    format_market_cap
)
from services.technical import get_latest_indicators

# Kumpulan Saham Terlikuid & Paling Aktif di BEI (Konstituen Indeks LQ45 Universe & Saham Terjangkau)
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

    # Properti & Konstruksi
    "BSDE.JK": {"name": "Bumi Serpong Damai Tbk", "sector": "Real Estate"},
    "CTRA.JK": {"name": "Ciputra Development Tbk", "sector": "Real Estate"},
    "PWON.JK": {"name": "Pakuwon Jati Tbk", "sector": "Real Estate"},
    "SMRA.JK": {"name": "Summarecon Agung Tbk", "sector": "Real Estate"},

    # Saham Likuid Terjangkau (Harga <= Rp 2.000 / Modal <= Rp 200rb per lot)
    "SIDO.JK": {"name": "Industri Jamu dan Farmasi Sido Muncul Tbk", "sector": "Healthcare"},
    "DEWA.JK": {"name": "Darma Henwa Tbk", "sector": "Energy"},
    "BUMI.JK": {"name": "Bumi Resources Tbk", "sector": "Energy"},
    "ENRG.JK": {"name": "Energi Mega Persada Tbk", "sector": "Energy"},
    "ELSA.JK": {"name": "Elnusa Tbk", "sector": "Energy"},
    "ERAA.JK": {"name": "Erajaya Swasembada Tbk", "sector": "Consumer Cyclicals"},
    "MAPA.JK": {"name": "MAP Aktif Adiperkasa Tbk", "sector": "Consumer Cyclicals"},
    "BBTN.JK": {"name": "Bank Tabungan Negara (Persero) Tbk", "sector": "Financials"},
    "BJBR.JK": {"name": "Bank Pembangunan Daerah Jawa Barat Tbk", "sector": "Financials"},
    "BJTM.JK": {"name": "Bank Pembangunan Daerah Jawa Timur Tbk", "sector": "Financials"},
    "MBMA.JK": {"name": "Merdeka Battery Materials Tbk", "sector": "Basic Materials"},
    "NCKL.JK": {"name": "Trimegah Bangun Persada Tbk", "sector": "Basic Materials"},
    "TINS.JK": {"name": "Timah Tbk", "sector": "Basic Materials"},
    "IATA.JK": {"name": "MNC Energy Investments Tbk", "sector": "Energy"},
    "GTSI.JK": {"name": "GTS Internasional Tbk", "sector": "Energy"},
    "INET.JK": {"name": "Sinergi Inti Andalan Prima Tbk", "sector": "Telecommunication"},
}


def determine_profile_suitability(
    roe_pct: Optional[float] = None,
    der: Optional[float] = None,
    sector: Optional[str] = None,
    market_cap: Optional[float] = None,
    strategy: Optional[str] = None,
    rsi: Optional[float] = 50.0,
    close: Optional[float] = None,
    ma20: Optional[float] = None
) -> Tuple[str, str]:
    """
    Menentukan profil kesesuaian saham:
    - TRADING: Cocok Trading (Momentum / Spekulatif / Utang tinggi / Perlu disiplin SL ketat)
    - INVESTASI: Cocok Investasi (Fundamental solid di area support/valuasi murah)
    - BOTH: Trading & Investasi (Fundamental solid + Sedang breakout momentum)
    """
    is_financial = sector in ["Financials", "Financial Services", "Perbankan", "Bank"]
    
    is_fundamental_solid = (
        (roe_pct is not None and roe_pct >= 10.0) and
        (der is None or der <= 1.2 or is_financial) and
        (market_cap is None or market_cap >= 8_000_000_000_000)
    )

    if is_fundamental_solid:
        # Saham fundamental bagus yang sedang breakout atau RSI kuat
        if strategy == "BREAKOUT" or (rsi is not None and rsi >= 55) or (close is not None and ma20 is not None and close >= ma20):
            return "BOTH", "Trading & Investasi"
        else:
            return "INVESTASI", "Cocok Investasi"
    else:
        if strategy in ["BREAKOUT", "OVERSOLD"] or (der is not None and der > 1.2) or (roe_pct is not None and roe_pct < 8.0):
            return "TRADING", "Cocok Trading"
        else:
            return "INVESTASI", "Cocok Investasi"


def evaluate_screener_indicators(
    df,
    ticker: str,
    profile_name: str,
    profile_sector: str,
    fundamentals: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    if df.empty or len(df) < 5:
        return None

    indicators = get_latest_indicators(df)
    close = indicators["close"]
    prev_close = float(df["close"].iloc[-2]) if len(df) >= 2 else close
    change_nominal = round(close - prev_close)
    change_pct = round(((close - prev_close) / prev_close) * 100, 2)
    rsi = indicators.get("rsi", 50.0)
    ma20 = indicators.get("ma20", close)
    ma50 = indicators.get("ma50", close)
    volume = indicators.get("volume", 0)
    support = indicators.get("support", round(close * 0.95))
    resistance = indicators.get("resistance", round(close * 1.05))

    target_price = resistance if resistance > close else round(close * 1.08)

    # Risk / Reward calculations
    potential_gain_nominal = max(target_price - close, 1)
    potential_risk_nominal = max(close - (support * 0.97 if rsi < 35 else (ma20 * 0.96 if close >= ma20 else support * 0.95)), 1)
    potential_gain_pct = round((potential_gain_nominal / close) * 100, 1)
    potential_risk_pct = round((potential_risk_nominal / close) * 100, 1)
    
    rrr_num = round(potential_gain_nominal / potential_risk_nominal, 2)
    risk_reward_ratio = f"1 : {round(rrr_num, 1)}"

    # Fundamental Context
    fund = fundamentals or {}
    market_cap = fund.get("market_cap")
    market_cap_formatted = fund.get("market_cap_formatted") or (format_market_cap(market_cap) if market_cap else "-")
    free_float_pct = fund.get("free_float_pct")
    roe_pct = fund.get("roe_pct")
    der = fund.get("der")

    # Fundamental description text
    fund_notes = []
    if roe_pct is not None:
        fund_notes.append(f"ROE {roe_pct}%")
    if der is not None:
        fund_notes.append(f"DER {der}x")
    elif profile_sector in ["Financials", "Financial Services"]:
        fund_notes.append("Sektor Finansial")
    if free_float_pct is not None:
        fund_notes.append(f"Float {free_float_pct}%")
    if market_cap_formatted != "-":
        fund_notes.append(f"MC {market_cap_formatted}")
    
    fund_tag_str = " | ".join(fund_notes) if fund_notes else "Fundamental Likuid LQ45"

    # Base Strategy classification & 3 pillars
    if rsi < 35:
        strategy = "OVERSOLD"
        base_score = round(92 - (rsi * 0.5))
        ma_status = "Oversold Rebound Zone"
        action_stance = "BUY ON WEAKNESS (Area Support)"
        stop_loss = round(support * 0.97)
        why_buy = (
            f"Indikator RSI {rsi:.1f} berada di zona jenuh jual ekstrem dekat lantai Support Mayor Rp {int(support):,}. "
            f"Tekanan jual mereda dengan potensi pantulan teknikal tinggi. Ditopang {fund_tag_str}."
        )
        watch_trigger = (
            f"Pantau antrean Bid di area Rp {int(support):,} pada jam 09:00 WIB. "
            f"Tunggu konfirmasi pantulan candle hijau sebelum entry. Batalkan jika tembus ke bawah Rp {int(stop_loss):,}."
        )
        buy_area = f"Rp {int(support):,} – Rp {int(close):,}"
    elif close >= ma20 and rsi >= 55:
        strategy = "BREAKOUT"
        base_score = round(82 + (change_pct if change_pct > 0 else 4))
        ma_status = "Above MA20 Bullish Momentum"
        action_stance = "BUY ON BREAKOUT (Momentum MA20)"
        stop_loss = round(ma20 * 0.96)
        why_buy = (
            f"Harga berhasil breakout & bertahan di atas garis MA20 (Rp {int(ma20):,}) dengan momentum RSI {rsi:.1f}. "
            f"Akselerasi tren bullish baru dimulai. Didukung profil {fund_tag_str}."
        )
        watch_trigger = (
            f"Pastikan harga dibuka & bertahan stabil di atas Rp {int(ma20):,}. "
            f"Konfirmasi volume beli aktif di 15 menit pertama (09:00–09:15 WIB). Disiplin SL di Rp {int(stop_loss):,}."
        )
        buy_area = f"Rp {int(close):,} – Rp {int(close * 1.02):,}"
    else:
        strategy = "VALUE"
        base_score = 84
        ma_status = "Akumulasi Support MA50"
        action_stance = "ACCUMULATE / DCA (Support MA50)"
        stop_loss = round(support * 0.95)
        why_buy = (
            f"Emiten berfundamental stabil ({fund_tag_str}) berkonsolidasi sehat di area support penopang MA50 (Rp {int(support):,}). "
            f"Valuasi menarik untuk akumulasi bertahap."
        )
        watch_trigger = (
            f"Pantau stabilitas konsolidasi harga di atas Rp {int(support):,}. "
            f"Lakukan akumulasi bertahap (DCA 2-3 tahap) untuk strategi swing medium-term."
        )
        buy_area = f"Rp {int(support):,} – Rp {int(close):,}"

    # Fundamental Score Modifiers
    fund_modifier = 0
    if roe_pct is not None:
        if roe_pct >= 15.0:
            fund_modifier += 4
        elif roe_pct >= 8.0:
            fund_modifier += 2
        elif roe_pct < 0:
            fund_modifier -= 8

    if free_float_pct is not None:
        if free_float_pct >= 20.0:
            fund_modifier += 2
        elif free_float_pct < 8.0:
            fund_modifier -= 4

    if der is not None:
        if der <= 1.0:
            fund_modifier += 2
        elif der > 2.5:
            fund_modifier -= 5

    if market_cap and market_cap >= 10_000_000_000_000:
        fund_modifier += 2

    final_score = min(max(base_score + fund_modifier, 65), 98)

    # Conviction Score 1 - 10 (Skor Keyakinan Rekomendasi Beli Besok Pagi dengan Validasi RRR)
    if rrr_num < 1.0:
        conviction_score = 6
        conviction_label = "Layak Pantau / Tunggu Pullback (RRR Rendah)"
    elif (final_score >= 90 or final_score >= 87) and rrr_num >= 1.8:
        conviction_score = 10
        conviction_label = "Wajib Dibeli Besok Pagi (Setup Prima)"
    elif final_score >= 85 and rrr_num >= 1.4:
        conviction_score = 9
        conviction_label = "Sangat Direkomendasikan Beli Besok Pagi"
    elif final_score >= 80 and rrr_num >= 1.0:
        conviction_score = 8
        conviction_label = "Prioritas Masuk Radar Beli"
    elif final_score >= 75:
        conviction_score = 7
        conviction_label = "Layak Pantau / Akumulasi Bertahap"
    else:
        conviction_score = 6
        conviction_label = "Tunggu Konfirmasi Pantulan"

    # Profil Kesesuaian: Trading vs Investasi vs Dual (Trading & Investasi)
    profile_suitability, profile_suitability_label = determine_profile_suitability(
        roe_pct=roe_pct,
        der=der,
        sector=profile_sector,
        market_cap=market_cap,
        strategy=strategy,
        rsi=rsi,
        close=close,
        ma20=ma20
    )

    return {
        "ticker": ticker,
        "name": profile_name,
        "sector": profile_sector,
        "profile_suitability": profile_suitability,
        "profile_suitability_label": profile_suitability_label,
        "price": close,
        "change_pct": change_pct,
        "change_nominal": change_nominal,
        "volume": volume,
        "rsi": rsi,
        "ma_status": ma_status,
        "strategy": strategy,
        "score": final_score,
        "conviction_score": conviction_score,
        "conviction_label": conviction_label,
        "market_cap": market_cap,
        "market_cap_formatted": market_cap_formatted,
        "free_float_pct": free_float_pct,
        "roe_pct": roe_pct,
        "der": der,
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
    Memindai seluruh kumpulan saham likuid di BEI (LQ45 universe & emiten terjangkau),
    mengintegrasikan 4 metrik fundamental (Market Cap, Free Float, ROE, DER),
    lalu memilih dan mengembalikan Top 10 saham dengan skor rekomendasi tertinggi.
    """
    today = date.today()
    all_evaluated = []

    # Clear previous screener results
    db.query(ScreenerResult).delete()
    db.commit()

    for ticker, profile in STOCK_PROFILES.items():
        try:
            # 1. Fetch historical candle data
            df = fetch_and_store_stock_data(ticker, db, period="3mo")
            if df.empty or len(df) < 5:
                continue

            # 2. Fetch key fundamentals from yfinance
            fund = fetch_stock_fundamentals(ticker)
            sector = fund.get("sector") or profile.get("sector", "General")
            name = fund.get("name") or profile.get("name", ticker)

            # 3. Evaluate technical + fundamental score
            item_data = evaluate_screener_indicators(df, ticker, name, sector, fund)
            if item_data:
                all_evaluated.append(item_data)
        except Exception as e:
            print(f"Error scanning {ticker}: {e}")
            continue

    # Sort by Score descending (gabungan teknikal + fundamental)
    all_evaluated.sort(key=lambda x: (x.get("score", 0), x.get("conviction_score", 0)), reverse=True)

    # Filter to Top 10 Picks
    top_picks = all_evaluated[:top_n]

    # Save to DB
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
    menghitung indikator teknikal & metrik fundamental (Market Cap, Float, ROE, DER),
    dan memasukkannya ke ScreenerResult.
    """
    ticker = normalize_ticker(ticker_input)
    today = date.today()

    try:
        # 1. Fetch fundamental profile
        fund = fetch_stock_fundamentals(ticker)
        name = fund.get("name", f"{ticker.replace('.JK', '')} Tbk")
        sector = fund.get("sector", "General")

        # 2. Fetch historical candle data
        df = fetch_and_store_stock_data(ticker, db, period="3mo")
        if df.empty or len(df) < 5:
            return None

        # 3. Evaluate technicals + fundamentals
        item_data = evaluate_screener_indicators(df, ticker, name, sector, fund)
        if not item_data:
            return None

        # 4. Check if already in DB, update or insert
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
