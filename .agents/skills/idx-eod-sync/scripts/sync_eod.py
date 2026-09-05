#!/usr/bin/env python3
"""
idx-eod-sync helper script.
Pulls EOD data from Yahoo Finance for IDX stocks, calculates technical indicators,
updates SQLite database, and prints a formatted EOD action report.
"""

import os
import sys
import argparse
from datetime import datetime

# Setup path so backend modules can be imported
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../../.."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import SessionLocal
from models import Holding, PriceHistory
from services.data_fetcher import fetch_and_store_stock_data, normalize_ticker
from services.technical import get_latest_indicators
from services.portfolio_engine import evaluate_holding_status

def format_idr(val: float) -> str:
    if val >= 0:
        return f"Rp {val:,.0f}".replace(",", ".")
    else:
        return f"-Rp {abs(val):,.0f}".replace(",", ".")

def sync_eod(ticker: str = None, period: str = "6mo", as_json: bool = False):
    db = SessionLocal()
    try:
        if ticker:
            ticker = normalize_ticker(ticker)
            holdings = db.query(Holding).filter(Holding.ticker == ticker).all()
            if not holdings:
                print(f"[!] Saham {ticker} tidak ditemukan di tabel portofolio.")
                print(f"[*] Tetap menarik data harga {ticker} ke database...")
                df = fetch_and_store_stock_data(ticker, db, period=period)
                print(f"[✓] Berhasil menarik {len(df)} baris data untuk {ticker}.")
                return
        else:
            holdings = db.query(Holding).all()
            if not holdings:
                print("[!] Tidak ada saham dalam portofolio untuk disinkronkan.")
                return

        print(f"\n========================================================")
        print(f"📊 ASISTEN SAHAM IDX — EOD MARKET SYNC ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
        print(f"========================================================")
        print(f"[*] Menghubungi Yahoo Finance untuk {len(holdings)} emiten...")

        evaluated_list = []
        total_equity = 0.0
        total_cost = 0.0
        urgent_list = []

        for h in holdings:
            t = h.ticker
            try:
                df = fetch_and_store_stock_data(t, db, period=period)
                if not df.empty:
                    last_row = df.iloc[-1]
                    candle = {
                        "close": float(last_row["close"]),
                        "open": float(last_row["open"]),
                        "ma20": float(last_row["ma20"]) if "ma20" in last_row and last_row["ma20"] is not None else float(last_row["close"]),
                        "ma50": float(last_row["ma50"]) if "ma50" in last_row and last_row["ma50"] is not None else float(last_row["close"]),
                        "rsi": float(last_row["rsi"]) if "rsi" in last_row and last_row["rsi"] is not None else 50.0,
                        "support": float(last_row.get("support") or 0),
                        "resistance": float(last_row.get("resistance") or 0),
                    }
                    card = evaluate_holding_status(h, candle, db)
                    evaluated_list.append(card)

                    cost = card["avgPrice"] * card["shares"]
                    equity = card["currentPrice"] * card["shares"]
                    total_cost += cost
                    total_equity += equity

                    if card.get("isUrgent") or card["actionStatus"] in ["SELL_CUT_LOSS", "TAKE_PROFIT", "SL_PROXIMITY_WARNING"]:
                        urgent_list.append(card)
                else:
                    print(f"[!] Data kosong untuk {t}")
            except Exception as ex:
                print(f"[!] Gagal menarik data {t}: {ex}")

        # Summary Metrics
        pnl = total_equity - total_cost
        pnl_pct = (pnl / total_cost * 100) if total_cost > 0 else 0.0

        print(f"\n📈 RINGKASAN PORTOFOLIO PASCA-CLOSING:")
        print(f"• Total Nilai Portofolio : {format_idr(total_equity)}")
        print(f"• Total Modal Beli      : {format_idr(total_cost)}")
        print(f"• Total Floating PnL    : {format_idr(pnl)} ({pnl_pct:+.2f}%)")
        print(f"• Kas Aktif             : Rp 168.755")
        print(f"• Jumlah Emiten         : {len(evaluated_list)}")

        print("\n📋 TABEL STATUS EMITEN:")
        print(f"{'Ticker':<10} {'Tipe':<10} {'Avg Beli':<10} {'Close':<8} {'PnL (%)':<10} {'RSI':<6} {'TP':<8} {'SL':<8} {'Status Aksi':<22}")
        print("-" * 100)

        for c in evaluated_list:
            t = c["ticker"]
            jenis = c["jenis"].capitalize()
            avg_str = f"Rp {c['avgPrice']:,.0f}".replace(",", ".")
            close_str = f"Rp {c['currentPrice']:,.0f}".replace(",", ".")
            pnl_s = f"{c['floatingPnlPct']:+.2f}%"
            rsi_s = f"{c.get('rsi', 0):.1f}"
            tp_s = f"Rp {c['targetPrice']:,.0f}".replace(",", ".") if c.get("targetPrice") else "-"
            sl_s = f"Rp {c['stopLoss']:,.0f}".replace(",", ".") if c.get("stopLoss") else "No SL"
            st_s = c["actionStatus"]

            print(f"{t:<10} {jenis:<10} {avg_str:<10} {close_str:<8} {pnl_s:<10} {rsi_s:<6} {tp_s:<8} {sl_s:<8} {st_s:<22}")

        if urgent_list:
            print("\n🚨 PERINGATAN TINDAKAN DARURAT (SEBELUM MARKET BUKA BESOK):")
            for u in urgent_list:
                print(f"  • [{u['ticker']}] {u['actionStatus']}: {u['actionReason']}")
                print(f"    👉 Instruksi: {u['actionInstruction']}")
        else:
            print("\n✅ Seluruh posisi saat ini dalam kondisi aman (tidak ada trigger darurat SL/TP).")

        print(f"\n========================================================")
        print(f"[✓] Sinkronisasi EOD selesai. Database assiten_saham.db telah dimutakhirkan.")
        print(f"========================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync IDX EOD stock data from Yahoo Finance")
    parser.add_argument("--ticker", "-t", type=str, help="Specific ticker symbol (e.g. SIDO.JK)")
    parser.add_argument("--period", "-p", type=str, default="6mo", help="Period to fetch (default: 6mo)")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")

    args = parser.parse_args()
    sync_eod(ticker=args.ticker, period=args.period, as_json=args.json)
