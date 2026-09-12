#!/usr/bin/env python3
"""
idx-recovery-plan helper script.
Analyzes underwater / floating loss portfolio stocks using the 3-Scenario
AI Recovery Engine (Cut Loss, Average Down, Hold) with 1-10 conviction scores,
lot suggestions, and action rationale.
"""

import os
import sys
import argparse
import json
from datetime import datetime

# Setup path so backend modules can be imported
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../../.."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import SessionLocal
from models import Holding, PriceHistory, get_cash_balance
from services.data_fetcher import fetch_and_store_stock_data, normalize_ticker
from services.technical import get_latest_indicators
from services.ai_copilot import generate_recovery_recommendation
from services.recovery_engine import diagnose_recovery
import pandas as pd
import yfinance as yf

def format_idr(val: float) -> str:
    if val >= 0:
        return f"Rp {val:,.0f}".replace(",", ".")
    else:
        return f"-Rp {abs(val):,.0f}".replace(",", ".")

def render_confidence_bar(score: int) -> str:
    filled = "█" * score
    empty = "░" * (10 - score)
    return f"[{filled}{empty}] {score}/10"

def run_recovery_plan(ticker: str = None, force_refresh: bool = False, as_json: bool = False):
    db = SessionLocal()
    try:
        cash_balance = get_cash_balance(db)
        if ticker:
            norm_ticker = normalize_ticker(ticker)
            holdings = db.query(Holding).filter(Holding.ticker == norm_ticker).all()
            if not holdings:
                print(f"[!] Saham {norm_ticker} tidak ditemukan di portofolio.")
                return
        else:
            # All holdings with floating loss or in recovery mode
            all_holdings = db.query(Holding).all()
            holdings = []
            for h in all_holdings:
                records = db.query(PriceHistory).filter(PriceHistory.ticker == h.ticker).order_by(PriceHistory.date.asc()).all()
                close = records[-1].close if records else h.avg_price
                pnl_pct = ((close - h.avg_price) / h.avg_price) * 100 if h.avg_price > 0 else 0
                if pnl_pct < 0:
                    holdings.append(h)

            if not holdings:
                print("[✓] Semua posisi portofolio berada dalam kondisi profit (tidak ada floating loss).")
                return

        if not as_json:
            print(f"\n" + "=" * 68)
            print(f"🩺 ASISTEN SAHAM IDX — AI TRI-SCENARIO RECOVERY PLAN")
            print(f"📅 Tanggal Analisis : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"💰 Saldo Kas RDN   : {format_idr(cash_balance)}")
            print(f"📊 Saham Terdeteksi: {len(holdings)} emiten floating loss")
            print("=" * 68)

        results = {}

        for h in holdings:
            t = h.ticker
            records = db.query(PriceHistory).filter(PriceHistory.ticker == t).order_by(PriceHistory.date.asc()).all()
            if not records:
                try:
                    df_raw = fetch_and_store_stock_data(t, db, period="6mo")
                    records = db.query(PriceHistory).filter(PriceHistory.ticker == t).order_by(PriceHistory.date.asc()).all()
                except Exception as e:
                    print(f"[!] Gagal fetch data harga untuk {t}: {e}")
                    continue

            df = pd.DataFrame([{
                "date": r.date, "open": r.open, "high": r.high, "low": r.low,
                "close": r.close, "volume": r.volume, "ma20": r.ma20, "ma50": r.ma50,
                "rsi": r.rsi, "support": r.support, "resistance": r.resistance
            } for r in records])
            indicators = get_latest_indicators(df)
            close = indicators["close"]
            pnl_pct = ((close - h.avg_price) / h.avg_price) * 100 if h.avg_price > 0 else 0
            floating_nom = (close - h.avg_price) * h.lot * 100

            fundamental_info = {}
            try:
                t_obj = yf.Ticker(t)
                info = t_obj.info or {}
                fundamental_info = {
                    "dividendYield": info.get("dividendYield"),
                    "trailingPE": info.get("trailingPE"),
                    "priceToBook": info.get("priceToBook"),
                }
            except Exception as e:
                pass

            rec = generate_recovery_recommendation(
                holding=h,
                latest_indicators=indicators,
                db=db,
                cash_balance=cash_balance,
                fundamental_info=fundamental_info,
                force_refresh=force_refresh
            )
            results[t] = {
                "holding": {
                    "ticker": t,
                    "jenis": h.jenis,
                    "lot": h.lot,
                    "avg_price": h.avg_price,
                    "close": close,
                    "floating_pnl_pct": round(pnl_pct, 2),
                    "floating_pnl_nominal": round(floating_nom)
                },
                "indicators": indicators,
                "recommendation": rec
            }

            if not as_json:
                recs = rec.get("recommendations", {})
                cl = recs.get("cutLoss", {})
                ad = recs.get("averageDown", {})
                hd = recs.get("hold", {})
                source_label = "9Router AI" if rec.get("source") == "9router" else (rec.get("source", "AI Copilot").upper())

                print(f"\n📌 EMITEN: {t} | Tipe: {h.jenis.upper()} | Posisi: {h.lot} Lot @ {format_idr(h.avg_price)}")
                print(f"   Harga Closing: {format_idr(close)} | Floating PnL: {pnl_pct:.1f}% ({format_idr(floating_nom)})")
                print(f"   Support Major: {format_idr(indicators.get('support', 0))} | Resistance: {format_idr(indicators.get('resistance', 0))} | RSI: {indicators.get('rsi', 50):.1f}")
                print(f"   AI Engine    : ✨ {source_label}")
                print(f"   ────────────────────────────────────────────────────────────────")

                # Skenario A: Cut Loss
                rec_badge_cl = " [✅ DIREKOMENDASIKAN]" if cl.get("recommended") else ""
                print(f"   🛑 SKENARIO A: CUT LOSS{rec_badge_cl}")
                print(f"      Keyakinan : {render_confidence_bar(cl.get('confidence', 5))}")
                print(f"      Saran Lot : {cl.get('lotSuggestion') or '-'}")
                print(f"      Alasan    : {cl.get('reason') or '-'}")
                print()

                # Skenario B: Average Down
                rec_badge_ad = " [✅ DIREKOMENDASIKAN]" if ad.get("recommended") else ""
                print(f"   📉 SKENARIO B: PRECISION AVERAGE DOWN{rec_badge_ad}")
                print(f"      Keyakinan : {render_confidence_bar(ad.get('confidence', 5))}")
                print(f"      Saran Lot : {ad.get('lotSuggestion') or '-'}")
                print(f"      Alasan    : {ad.get('reason') or '-'}")
                print()

                # Skenario C: Hold
                rec_badge_hd = " [✅ DIREKOMENDASIKAN]" if hd.get("recommended") else ""
                print(f"   ⏸️ SKENARIO C: HOLD / EXIT REBOUND{rec_badge_hd}")
                print(f"      Keyakinan : {render_confidence_bar(hd.get('confidence', 5))}")
                print(f"      Saran Lot : {hd.get('lotSuggestion') or '-'}")
                print(f"      Alasan    : {hd.get('reason') or '-'}")
                print()

                # Summary
                print(f"   💡 KESIMPULAN STRATEGIS AI:")
                print(f"      \"{rec.get('aiSummary')}\"")
                print(f"   " + "─" * 64)

        if as_json:
            print(json.dumps(results, indent=2))
        else:
            print(f"\n" + "=" * 68)
            print(f"✅ Selesai. Hasil rekomendasi tersimpan permanen di database lokal.")
            print(f"🌐 Buka antarmuka interaktif di: http://localhost:8000/recovery")
            print("=" * 68 + "\n")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Tri-Scenario Recovery Plan for IDX stocks")
    parser.add_argument("--ticker", "-t", help="Specific ticker symbol (e.g. SIDO.JK or SIDO)", default=None)
    parser.add_argument("--force", "-f", action="store_true", help="Force regenerate analysis with AI even if cached today")
    parser.add_argument("--json", "-j", action="store_true", help="Output results in JSON format")
    args = parser.parse_args()

    run_recovery_plan(ticker=args.ticker, force_refresh=args.force, as_json=args.json)
