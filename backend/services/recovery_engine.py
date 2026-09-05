import math
from typing import Dict, Any

def diagnose_recovery(
    ticker: str, 
    current_price: float, 
    avg_price: float, 
    lot: int, 
    total_portfolio_equity: float, 
    latest_indicators: dict,
    jenis: str = "trading",
    cash_balance: float = 168755.0,
    fundamental_info: dict = None
) -> Dict[str, Any]:
    shares = lot * 100
    floating_loss = (current_price - avg_price) * shares
    floating_loss_pct = ((current_price - avg_price) / avg_price) * 100
    position_value = current_price * shares
    portfolio_weight_pct = (position_value / total_portfolio_equity * 100) if total_portfolio_equity > 0 else 0
    portfolio_impact_pct = (floating_loss / total_portfolio_equity * 100) if total_portfolio_equity > 0 else 0

    support_major = float(latest_indicators.get("support", current_price * 0.95))
    support_minor = round(current_price * 0.98)
    rsi = float(latest_indicators.get("rsi", 30.0))

    is_oversold = rsi < 35.0
    near_support = abs(current_price - support_major) / current_price < 0.05

    # Determine scenario recommendations
    recommend_cut = not is_oversold and current_price < support_major
    recommend_avgdown = is_oversold or near_support
    recommend_hold_bep = not recommend_cut and not recommend_avgdown

    # Skenario B (Average down suggestion): target avg at halfway
    suggested_entry = round(support_major)
    target_avg = round((avg_price + suggested_entry) / 2)
    calc = calculate_precision_avg_down(lot, avg_price, suggested_entry, target_avg)
    capital_required = calc["capital_required"]

    # Variable 1: Cash Feasibility Check
    is_cash_sufficient = cash_balance >= capital_required
    cash_shortage = max(0, capital_required - cash_balance)
    cash_status_note = (
        f"Saldo kas aktif (Rp {cash_balance:,.0f}) mencukupi untuk average down ini."
        if is_cash_sufficient else
        f"Saldo kas aktif (Rp {cash_balance:,.0f}) belum mencukupi kebutuhan modal (Rp {capital_required:,.0f}). Kekurangan: Rp {cash_shortage:,.0f}."
    )

    # Variable 3: Fundamental & Dividend metrics
    f_info = fundamental_info or {}
    div_yield = f_info.get("dividendYield")
    pe_ratio = f_info.get("trailingPE")
    pbv = f_info.get("priceToBook")

    div_text = f"{div_yield:.2f}% / tahun" if div_yield and div_yield > 0 else "Tidak Ada / Terbatas"
    fundamental_verdict = (
        f"Dividen Jumbo ({div_yield:.1f}%/thn) — Sangat layak dipertahankan untuk passive income."
        if div_yield and div_yield >= 5.0 else
        "Fokus pada perbaikan teknikal & momentum harga."
    )

    return {
        "ticker": ticker,
        "name": f"{ticker.replace('.JK', '')} Tbk",
        "jenis": jenis,
        "currentPrice": round(current_price),
        "avgPrice": round(avg_price),
        "lot": lot,
        "cashBalance": round(cash_balance),
        "floatingLossNominal": round(floating_loss),
        "floatingLossPct": round(floating_loss_pct, 2),
        "portfolioWeightPct": round(portfolio_weight_pct, 1),
        "portfolioImpactPct": round(portfolio_impact_pct, 2),
        "supportMajor": round(support_major),
        "supportMinor": round(support_minor),
        "rsi": rsi,
        "trendStatus": "Oversold di Major Support (Potensi Rebound)" if recommend_avgdown else "Downtrend / Breakdown Support",
        "fundamentals": {
            "dividendYield": round(div_yield, 2) if div_yield else None,
            "dividendYieldText": div_text,
            "peRatio": round(pe_ratio, 1) if pe_ratio else None,
            "pbv": round(pbv, 2) if pbv else None,
            "verdict": fundamental_verdict
        },
        "scenarios": {
            "cutLoss": {
                "title": "Opsi A: Cut Loss / Pangkas Posisi",
                "description": f"Pangkas posisi di Rp {current_price:,.0f} jika candle penutupan menembus Support Rp {support_major:,.0f}.",
                "lossSavedIfSupportBroken": round(position_value * 0.5),
                "actionRecommended": recommend_cut,
                "suitabilityTitle": "DIREKOMENDASIKAN UNTUK TRADING" if jenis == "trading" else "KURANG DIREKOMENDASIKAN UNTUK INVESTASI",
                "suitabilityColor": "text-rose-700 bg-rose-50 border-rose-200" if jenis == "trading" else "text-amber-800 bg-amber-50 border-amber-200",
                "suitabilityReason": (
                    "Posisi trading wajib disiplin batasi risiko modal sebelum amblas lebih dalam."
                    if jenis == "trading" else
                    "Menjual saham investasi di titik bawah menghilangkan hak dividen dan potensi pemulihan jangka panjang."
                ),
                "checklist": [
                    "Anda membutuhkan modal kas segera untuk diputar ke saham lain",
                    "Tidak bersedia menanggung risiko penurunan harga lebih dalam",
                    "Tujuan awal Anda adalah trading swing/momentum jangka pendek"
                ]
            },
            "averageDown": {
                "title": "Opsi B: Precision Average Down (Cicil di Support)",
                "description": f"Cicil beli di area support Rp {suggested_entry:,.0f}. Tambahkan {calc['add_lot']} lot untuk menurunkan Avg Price ke Rp {calc['new_avg']:,.0f}.",
                "suggestedEntryPrice": suggested_entry,
                "minRequiredLot": calc["add_lot"],
                "capitalRequired": capital_required,
                "newAvgPrice": calc["new_avg"],
                "actionRecommended": recommend_avgdown,
                "cashSufficient": is_cash_sufficient,
                "cashShortage": round(cash_shortage),
                "cashStatusNote": cash_status_note,
                "suitabilityTitle": "STRATEGI UTAMA INVESTASI" if jenis == "investasi" else "RISIKO TINGGI UNTUK TRADING",
                "suitabilityColor": "text-indigo-700 bg-indigo-50 border-indigo-200" if jenis == "investasi" else "text-rose-700 bg-rose-50 border-rose-200",
                "suitabilityReason": (
                    "Saham investasi berfundamental solid sangat ideal diakumulasi bertahap saat valuasi diskon di Support Major."
                    if jenis == "investasi" else
                    "Average down pada saham trading berisiko tinggi memperbesar porsi kerugian jika tren terus bearish."
                ),
                "checklist": [
                    f"Saldo kas menganggur Anda mencukupi (Kebutuhan: Rp {capital_required:,.0f})",
                    "Fundamental bisnis emiten terbukti sehat & rutin membagikan dividen",
                    "Anda bersedia menahan posisi dalam horizon 3–6 bulan ke depan"
                ]
            },
            "holdForBep": {
                "title": "Opsi C: Hold for Rebound & Exit at BEP",
                "description": f"Pertahankan {lot} lot tanpa modal baru. Tunggu pemantulan teknikal ke area Resistance MA20 untuk exit dengan kerugian terminimalisir.",
                "realisticExitPrice": round(latest_indicators.get("resistance", current_price * 1.08)),
                "expectedDays": "5 - 14 Hari Bursa",
                "actionRecommended": recommend_hold_bep or (recommend_avgdown and not is_cash_sufficient),
                "suitabilityTitle": "PILIHAN TERBAIK JIKA KAS TERBATAS",
                "suitabilityColor": "text-blue-700 bg-blue-50 border-blue-200",
                "suitabilityReason": (
                    "Pilihan paling realistis saat saldo kas belum mencukupi untuk average down, tanpa perlu rugi cut loss di harga bawah."
                ),
                "checklist": [
                    "Saldo kas saat ini terbatas (tidak memungkinkan menambah lot baru)",
                    "Tidak ingin merealisasikan kerugian di harga dasar (bottom)",
                    "Siap bersabar menunggu swing pantulan teknikal menuju Resistance terdekat"
                ]
            }
        }
    }


def calculate_precision_avg_down(current_lot: int, current_avg: float, target_buy_price: float, target_avg_price: float) -> Dict[str, Any]:
    if target_avg_price <= target_buy_price or target_avg_price >= current_avg:
        return {
            "add_lot": 0, "capital_required": 0, "new_avg": current_avg,
            "error": "Target Avg harus di antara harga beli bawah dan Avg saat ini"
        }
    
    raw_add_lot = (current_lot * (current_avg - target_avg_price)) / (target_avg_price - target_buy_price)
    add_lot = math.ceil(raw_add_lot)
    capital_required = add_lot * target_buy_price * 100
    new_avg = round((current_lot * current_avg + add_lot * target_buy_price) / (current_lot + add_lot))

    return {
        "add_lot": add_lot,
        "capital_required": round(capital_required),
        "new_avg": new_avg
    }
