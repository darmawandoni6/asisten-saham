#!/usr/bin/env python3
"""
idx-eod-screener helper script.
Scans the IDX market pool for high-probability setups or analyzes on-demand tickers.
Calculates technical indicators, 4 fundamental metrics, AI conviction scores (1–10),
Risk:Reward Ratios, and profile suitability badges. Saves curated Top 10 Picks into SQLite.
"""

import os
import sys
import json
import argparse
from datetime import datetime

# Setup path so backend modules can be imported
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../../.."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import SessionLocal
from models import ScreenerResult, ScreenerChatLog
from services.data_fetcher import normalize_ticker
from services.screener_engine import scan_market_pool, analyze_single_ticker_for_screener, determine_profile_suitability


def format_idr(val: float) -> str:
    if val >= 0:
        return f"Rp {val:,.0f}".replace(",", ".")
    else:
        return f"-Rp {abs(val):,.0f}".replace(",", ".")


def render_confidence_bar(score: int) -> str:
    filled = "█" * score
    empty = "░" * (10 - score)
    return f"[{filled}{empty}] {score}/10"


def format_badge_terminal(code: str) -> str:
    if code == "BOTH":
        return "✨ Trading & Investasi"
    elif code == "INVESTASI":
        return "🏛️ Cocok Investasi"
    else:
        return "⚡ Cocok Trading"


def run_screener_cli(
    ticker: str = None,
    top_n: int = 10,
    strategy_filter: str = "ALL",
    max_price: float = None,
    clear_chat: bool = True,
    as_json: bool = False
):
    db = SessionLocal()
    try:
        if ticker:
            norm_ticker = normalize_ticker(ticker)
            if not as_json:
                print(f"\n" + "=" * 70)
                print(f"🔎 ANALISIS EMITEN ON-DEMAND: {norm_ticker}")
                print(f"📅 Tanggal Analisis : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print("=" * 70)
                print(f"[*] Menarik data historis 3 bulan & metrik fundamental live...")

            res = analyze_single_ticker_for_screener(norm_ticker, db)
            if not res:
                print(f"[!] Gagal menganalisis {norm_ticker}. Pastikan kode ticker valid di Bursa Efek Indonesia.")
                return

            if as_json:
                print(json.dumps(res, indent=2))
                return

            price = res.get("price", 0)
            chg_pct = res.get("change_pct", 0)
            chg_nom = res.get("change_nominal", 0)
            chg_str = f"{'+' if chg_nom >= 0 else ''}{chg_nom} ({'+' if chg_pct >= 0 else ''}{chg_pct:.2f}%)"
            conv_score = res.get("conviction_score", 6)
            suit_code = res.get("profile_suitability", "TRADING")
            suit_badge = format_badge_terminal(suit_code)

            print(f"\n📌 {res.get('ticker')} — {res.get('name')}")
            print(f"   Sektor          : {res.get('sector', '-')}")
            print(f"   Harga Closing   : {format_idr(price)} | Perubahan: {chg_str}")
            print(f"   Strategi        : [{res.get('strategy', 'BREAKOUT')}] — {res.get('ma_status', '-')}")
            print(f"   Kesesuaian      : {suit_badge}")
            print(f"   Skor AI (1–10)  : {render_confidence_bar(conv_score)} ({res.get('conviction_label', '-')})")
            print(f"   Risk:Reward     : {res.get('risk_reward_ratio', '1 : 2.0')}")
            print(f"   Estimasi Modal  : {format_idr(price * 100)} / lot")
            print("-" * 70)
            print("🎯 RENCANA LEVEL TRANSAKSI:")
            print(f"   • Area Beli     : {res.get('buy_area', '-')}")
            print(f"   • Target TP     : {format_idr(res.get('target_price', 0))} (+{res.get('potential_gain_pct', 0):.1f}%)")
            print(f"   • Stop Loss     : {format_idr(res.get('stop_loss', 0))} (-{res.get('potential_risk_pct', 0):.1f}%)")
            print("-" * 70)
            print("📊 4 PILAR FUNDAMENTAL:")
            mc_str = res.get("market_cap_formatted", "-")
            float_str = f"{res.get('free_float_pct'):.1f}%" if res.get("free_float_pct") is not None else "N/A"
            roe_str = f"{res.get('roe_pct'):.1f}%" if res.get("roe_pct") is not None else "N/A"
            der_str = f"{res.get('der'):.2f}x" if res.get("der") is not None else "N/A (Bank/Fin)"
            print(f"   • Market Cap    : {mc_str}")
            print(f"   • Free Float    : {float_str}")
            print(f"   • ROE (%)       : {roe_str}")
            print(f"   • DER           : {der_str}")
            print("-" * 70)
            print(f"💡 ALASAN MASUK RADAR & AKSI BESOK:")
            print(f"   {res.get('why_buy', '-')}")
            print(f"   Trigger: {res.get('watch_trigger', '-')}")
            print("=" * 70 + "\n")
            return

        # Full Market Pool Scan
        if not as_json:
            print(f"\n" + "=" * 80)
            print(f"🔎 ASISTEN SAHAM IDX — EOD MARKET SCREENER SCAN")
            print(f"📅 Waktu Eksekusi   : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"🎯 Target Kurasi    : Top {top_n} Rekomendasi Terpilih")
            print("=" * 80)

        # Purge previous screener chat logs if requested
        if clear_chat:
            deleted_chats = db.query(ScreenerChatLog).delete()
            db.commit()
            if not as_json:
                print(f"[*] Reset riwayat chat screener ({deleted_chats} pesan dibersihkan).")

        if not as_json:
            print(f"[*] Memindai pool emiten likuid BEI (fokus harga terjangkau <= Rp 2.000)...")

        items = scan_market_pool(db, top_n=top_n)

        if strategy_filter and strategy_filter.upper() != "ALL":
            items = [it for it in items if it.get("strategy") == strategy_filter.upper()]

        if max_price:
            items = [it for it in items if it.get("price", 0) <= max_price]

        if not items:
            print(f"[!] Tidak ada emiten yang memenuhi kriteria filter (Strategi: {strategy_filter}, Max Price: {max_price}).")
            return

        if as_json:
            print(json.dumps(items, indent=2))
            return

        print(f"[✓] Berhasil memindai pasar! Ditemukan {len(items)} saham terkurasi.")
        print("\n" + "-" * 115)
        print(f"{'#':<3} | {'Ticker & Nama':<26} | {'Sektor':<16} | {'Close':<9} | {'Chg %':<7} | {'Strategi':<9} | {'Kesesuaian':<22} | {'Skor AI':<8} | {'RRR':<9} | {'Modal/Lot':<12}")
        print("-" * 115)

        for idx, it in enumerate(items, 1):
            t_name = f"{it.get('ticker')} ({it.get('name')[:14]}..)" if len(it.get('name', '')) > 14 else f"{it.get('ticker')} ({it.get('name', '')})"
            sector = (it.get('sector', '-')[:14] + '..') if len(it.get('sector', '-')) > 14 else it.get('sector', '-')
            price_str = f"Rp {int(it.get('price', 0)):,}".replace(",", ".")
            chg = it.get('change_pct', 0)
            chg_str = f"{'+' if chg >= 0 else ''}{chg:.1f}%"
            strat = it.get('strategy', '-')
            suit_code = it.get('profile_suitability', 'TRADING')
            suit_badge = format_badge_terminal(suit_code)
            score_str = f"{it.get('conviction_score', 6)}/10"
            rrr = it.get('risk_reward_ratio', '1 : 2.0')
            lot_cost = format_idr(it.get('price', 0) * 100)

            print(f"{idx:<3} | {t_name:<26} | {sector:<16} | {price_str:<9} | {chg_str:<7} | {strat:<9} | {suit_badge:<22} | {score_str:<8} | {rrr:<9} | {lot_cost:<12}")

        print("-" * 115)

        # Highlight Top 3 Picks
        print("\n🏆 TOP 3 PICKS REKOMENDASI BELI BESOK PAGI (09:00 WIB):")
        top_3 = items[:3]
        for i, it in enumerate(top_3, 1):
            suit_code = it.get('profile_suitability', 'TRADING')
            suit_badge = format_badge_terminal(suit_code)
            conv_score = it.get('conviction_score', 6)
            mc_str = it.get("market_cap_formatted", "-")
            roe_str = f"{it.get('roe_pct'):.1f}%" if it.get("roe_pct") is not None else "N/A"
            der_str = f"{it.get('der'):.2f}x" if it.get("der") is not None else "N/A"

            print(f"\n  {i}. ⭐ {it.get('ticker')} — {it.get('name')}")
            print(f"     • Profil & Skor : {suit_badge} | AI Conviction: {render_confidence_bar(conv_score)}")
            print(f"     • Level Trading : Area Beli {it.get('buy_area', '-')} | TP {format_idr(it.get('target_price', 0))} (+{it.get('potential_gain_pct', 0):.1f}%) | SL {format_idr(it.get('stop_loss', 0))} (-{it.get('potential_risk_pct', 0):.1f}%)")
            print(f"     • Fundamental   : MC {mc_str} | ROE {roe_str} | DER {der_str}")
            print(f"     • Alasan Utama  : {it.get('why_buy', '-')}")
            print(f"     • Panduan Aksi  : {it.get('watch_trigger', '-')}")

        print("\n" + "=" * 80)
        print("💡 TIPS EKSEKUSI:")
        print("1. Pastikan harga tidak dibuka gap down di bawah garis Support/Stop Loss.")
        print("2. Untuk saham [⚡ Cocok Trading], pasang Stop Order ketat di aplikasi sekuritas.")
        print("3. Untuk saham [🏛️ Cocok Investasi], gunakan metode DCA (Dollar-Cost Averaging) bertahap.")
        print("4. Hasil lengkap & interaktif dapat diakses di Web UI: http://localhost:8000/screener")
        print("=" * 80 + "\n")

    except Exception as e:
        print(f"[!] Terjadi kesalahan saat menjalankan screener: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="IDX EOD Market Screener & Stock Intelligence")
    parser.add_argument("--ticker", type=str, help="Analisis satu kode emiten tertentu (contoh: BREN.JK, MEDC.JK, AKRA)")
    parser.add_argument("--top", type=int, default=10, help="Jumlah saham teratas yang ditampilkan (default: 10)")
    parser.add_argument("--strategy", type=str, default="ALL", choices=["ALL", "BREAKOUT", "VALUE", "OVERSOLD"], help="Filter strategi")
    parser.add_argument("--max-price", type=float, help="Filter harga maksimal (contoh: 2000, 1000, 500)")
    parser.add_argument("--no-clear-chat", action="store_true", help="Jangan hapus riwayat chat screener sebelumnya")
    parser.add_argument("--json", action="store_true", help="Format output sebagai raw JSON")

    args = parser.parse_args()
    run_screener_cli(
        ticker=args.ticker,
        top_n=args.top,
        strategy_filter=args.strategy,
        max_price=args.max_price,
        clear_chat=not args.no_clear_chat,
        as_json=args.json
    )


if __name__ == "__main__":
    main()
