import os
import json
from datetime import date
from typing import Dict, Any
from sqlalchemy.orm import Session
from models import AIAnalysis, Holding

def analyze_holding_with_ai(holding: Holding, latest_indicators: dict, db: Session) -> Dict[str, Any]:
    ticker = holding.ticker
    today = date.today()

    close = float(latest_indicators.get("close", holding.avg_price))
    avg_price = float(holding.avg_price)
    pnl_pct = ((close - avg_price) / avg_price) * 100
    rsi = float(latest_indicators.get("rsi", 50.0))
    ma20 = float(latest_indicators.get("ma20", close))
    ma50 = float(latest_indicators.get("ma50", close))
    support = float(latest_indicators.get("support", close * 0.95))
    resistance = float(latest_indicators.get("resistance", close * 1.05))
    jenis = getattr(holding, "jenis", "trading") or "trading"

    api_key = os.getenv("GEMINI_API_KEY")

    # User preference: Jika belum pakai AI, berikan alert AI belum tersedia
    if not api_key or api_key == "your_gemini_api_key_here":
        return {
            "status": "unavailable",
            "error_type": "NO_API_KEY",
            "message": "Fitur AI Copilot belum tersedia karena API Key Google Gemini belum dikonfigurasi di backend.",
            "detail": "Tambahkan GEMINI_API_KEY di file backend/.env untuk mengaktifkan analisis generatif Gemini 2.0 Flash.",
            "ticker": ticker,
            "name": f"{ticker.replace('.JK', '')} Tbk",
            "date": str(today),
            "currentPrice": round(close),
            "avgPrice": round(avg_price),
            "pnlPct": round(pnl_pct, 2),
            "indicators": latest_indicators
        }

    # Check cache in DB (only when valid API key is configured)
    cached = db.query(AIAnalysis).filter(
        AIAnalysis.ticker == ticker,
        AIAnalysis.date == today
    ).first()

    if cached:
        snapshot = {}
        try:
            snapshot = json.loads(cached.raw_data_snapshot) if cached.raw_data_snapshot else {}
        except Exception:
            snapshot = {}

        return {
            "status": "success",
            "ticker": ticker,
            "name": f"{ticker.replace('.JK', '')} Tbk",
            "date": str(cached.date),
            "currentPrice": round(close),
            "avgPrice": round(avg_price),
            "pnlPct": round(pnl_pct, 2),
            "recommendation": cached.recommendation,
            "confidence": snapshot.get("confidence", 90),
            "rationale": cached.analysis_text,
            "indicators": latest_indicators,
            "actionItems": snapshot.get("action_items") or [
                f"Evaluasi batas proteksi trailing stop pada level Rp {round(holding.avg_price * 0.95):,.0f}.",
                f"Perhatikan reaksi harga saat menguji Resistance Rp {latest_indicators.get('resistance', 0):,.0f}."
            ]
        }

    try:

        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = f"""
        Anda adalah AI Decision Copilot profesional untuk saham IDX (Bursa Efek Indonesia).
        Berikan analisis EOD pasca-closing objektif dan bebas emosi untuk:
        Ticker: {ticker}
        Jenis Kepemilikan: {jenis.upper()} (PENTING: Jika jenis INVESTASI, jangan rekomendasikan Cut Loss panik. Fokus pada valuasi, dividen, support historis, dan kelayakan averaging down bertahap. Jika TRADING, utamakan disiplin Stop Loss ketat)
        Harga Close EOD: Rp {close}
        Avg Price Beli: Rp {avg_price} (PnL: {pnl_pct:.2f}%)
        Target Price: Rp {holding.target_price}
        Stop Loss: {'Tidak ada hard stop loss (Saham Investasi)' if jenis == 'investasi' else f'Rp {holding.stop_loss}'}
        Indikator: MA20={ma20}, MA50={ma50}, RSI(14)={rsi}, Support={support}, Resistance={resistance}

        Format jawaban JSON:
        {{
            "recommendation": "HOLD" | "TRIM 50%" | "SELL ALL" | "CUT LOSS" | "AVERAGE DOWN" | "BUY MORE",
            "confidence": 85-95,
            "rationale": "1-2 paragraf objektif evaluasi kondisi teknikal dibanding trading plan / strategi investasi",
            "action_items": ["item 1", "item 2", "item 3"]
        }}
        """
        response = model.generate_content(prompt)
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        recommendation = data.get("recommendation", "HOLD")
        rationale = data.get("rationale", "")
        action_items = data.get("action_items", [])
        confidence = data.get("confidence", 90)

        # Save to cache
        new_analysis = AIAnalysis(
            ticker=ticker,
            date=today,
            recommendation=recommendation,
            analysis_text=rationale,
            raw_data_snapshot=json.dumps({
                "source": "gemini",
                "action_items": action_items,
                "confidence": confidence,
                "indicators": latest_indicators
            })
        )
        db.add(new_analysis)
        db.commit()

        return {
            "status": "success",
            "ticker": ticker,
            "name": f"{ticker.replace('.JK', '')} Tbk",
            "date": str(today),
            "currentPrice": round(close),
            "avgPrice": round(avg_price),
            "pnlPct": round(pnl_pct, 2),
            "recommendation": recommendation,
            "confidence": confidence,
            "rationale": rationale,
            "indicators": latest_indicators,
            "actionItems": action_items
        }

    except Exception as e:
        err_msg = str(e)
        print(f"[ai_copilot] Error memanggil Gemini: {err_msg}")
        is_quota = any(k in err_msg.lower() for k in ["429", "resourceexhausted", "quota", "limit", "exhausted"])
        error_type = "QUOTA_EXCEEDED" if is_quota else "AI_ERROR"
        user_message = (
            "AI belum dapat menjawab saat ini karena limit atau kuota token Gemini API telah habis."
            if is_quota else
            f"AI belum dapat memproses jawaban: {err_msg}"
        )
        user_detail = (
            "Batas kuota harian (rate limit) API tercapai. Mohon tunggu beberapa saat sebelum mencoba analisis ulang."
            if is_quota else
            "Terjadi kendala koneksi ke server AI."
        )

        return {
            "status": "error",
            "error_type": error_type,
            "message": user_message,
            "detail": user_detail,
            "ticker": ticker,
            "name": f"{ticker.replace('.JK', '')} Tbk",
            "date": str(today),
            "currentPrice": round(close),
            "avgPrice": round(avg_price),
            "pnlPct": round(pnl_pct, 2),
            "indicators": latest_indicators
        }


def discuss_recovery_scenario(
    holding: Holding,
    scenario_id: str,
    user_question: str | None,
    latest_indicators: dict,
    fundamental_info: dict,
    cash_balance: float = 168755.0
) -> Dict[str, Any]:
    ticker = holding.ticker
    jenis = getattr(holding, "jenis", "trading") or "trading"
    lot = holding.lot
    avg_price = float(holding.avg_price)
    close = float(latest_indicators.get("close", avg_price))
    pnl_pct = ((close - avg_price) / avg_price) * 100
    floating_nominal = (close - avg_price) * lot * 100
    rsi = float(latest_indicators.get("rsi", 50.0))
    ma20 = float(latest_indicators.get("ma20", close))
    support = float(latest_indicators.get("support", close * 0.95))
    resistance = float(latest_indicators.get("resistance", close * 1.05))

    div_yield_val = fundamental_info.get("dividendYield")
    pe = fundamental_info.get("trailingPE")
    pbv = fundamental_info.get("priceToBook")

    if div_yield_val and div_yield_val > 0:
        div_pct = div_yield_val if div_yield_val > 1.0 else (div_yield_val * 100.0)
        div_ratio = div_pct / 100.0
    else:
        div_pct = 0.0
        div_ratio = 0.0

    div_text = f"{div_pct:.2f}% / tahun" if div_pct > 0 else "Tidak ada data / Rendah"
    est_div_per_share = close * div_ratio
    est_annual_div_total = est_div_per_share * lot * 100

    scenario_names = {
        "cutLoss": "Opsi A: Cut Loss / Pangkas Posisi",
        "averageDown": "Opsi B: Precision Average Down",
        "holdForBep": "Opsi C: Hold for Rebound & Exit at BEP"
    }
    scenario_title = scenario_names.get(scenario_id, "Skenario Penyelamatan")

    api_key = os.getenv("GEMINI_API_KEY")
    has_valid_api = bool(api_key and api_key != "your_gemini_api_key_here")

    # If user provided a specific follow-up question
    if user_question and user_question.strip():
        q_clean = user_question.strip()
        
        # Check if Gemini API is available
        if has_valid_api:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-2.0-flash")

                prompt = f"""
                Anda adalah AI Financial & Trading Copilot profesional untuk saham IDX.
                Konteks Pengguna:
                - Ticker: {ticker} (Tipe: {jenis.upper()})
                - Posisi: {lot} Lot di Avg Rp {avg_price:,.0f}, Harga saat ini Rp {close:,.0f} (Floating Loss: {pnl_pct:.2f}% / Rp {floating_nominal:,.0f})
                - Sisa Saldo Kas Pengguna: Rp {cash_balance:,.0f}
                - Indikator: Support Major Rp {support:,.0f}, Resistance Rp {resistance:,.0f}, MA20 Rp {ma20:,.0f}, RSI {rsi:.1f}
                - Fundamental: Dividend Yield {div_text}, PE {pe if pe else '-'}x, PBV {pbv if pbv else '-'}x
                - Skenario yang Dipilih: {scenario_title}

                Pertanyaan Pengguna: "{q_clean}"

                Berikan jawaban yang edukatif, jujur, objektif, bebas halusinasi, dan langsung ke poin dalam 1-3 paragraf ringkas berbahasa Indonesia yang bersahabat dan profesional.
                Sertakan perhitungan nominal riil jika pengguna bertanya tentang nominal kas/dividen/lot.
                """
                resp = model.generate_content(prompt)
                ai_answer = resp.text.strip()
                return {
                    "status": "success",
                    "source": "gemini",
                    "hasApiKey": True,
                    "scenarioId": scenario_id,
                    "scenarioTitle": scenario_title,
                    "question": q_clean,
                    "answer": ai_answer
                }
            except Exception as e:
                print(f"[recovery_discuss] Gemini error: {e}")
        
        # Rule-based Q&A responder
        q_lower = q_clean.lower()
        if any(w in q_lower for w in ["dividen", "yield", "passive", "penghasilan", "bagi hasil"]):
            if est_annual_div_total > 0:
                answer = (
                    f"Berdasarkan data resmi Yahoo Finance, {ticker} memiliki dividend yield sekitar {div_text}. "
                    f"Dengan kepemilikan Anda saat ini sebesar {lot} lot ({lot*100:,} lembar saham), estimasi dividen tunai tahunan "
                    f"yang masuk ke RDN Anda adalah sekitar Rp {est_annual_div_total:,.0f} per tahun.\n\n"
                    f"Artinya, meskipun saat ini terjadi floating loss sebesar Rp {abs(floating_nominal):,.0f}, "
                    f"arus kas dividen ini secara pasif memulihkan sekitar {(est_annual_div_total / abs(floating_nominal))*100:.1f}% "
                    f"dari floating loss Anda setiap tahunnya tanpa perlu menjual lembar saham di harga dasar."
                )
            else:
                answer = (
                    f"Saat ini {ticker} tidak membagikan dividen yang signifikan (dividend yield tercatat rendah atau nihil). "
                    f"Oleh karena itu, strategi pemulihan modal tidak dapat mengandalkan pasif dividen tunai, "
                    f"melainkan murni mengandalkan momentum swing teknikal rebound menuju Resistance terdekat."
                )
        elif any(w in q_lower for w in ["pantul", "konfirmasi", "tanda", "reversal", "selesai turun", "bottom"]):
            answer = (
                f"Sinyal konfirmasi bahwa {ticker} sudah selesai fase penurunannya dan siap memantul dapat dipantau dari 3 indikator teknikal:\n\n"
                f"1. **Formasi Candle Reversal di Support Rp {support:,.0f}**: Munculnya candle berpola *Hammer*, *Bullish Pinbar* (ekor bawah panjang), atau *Bullish Engulfing* pada penutupan sesi 2 (pukul 15:50 WIB).\n"
                f"2. **Rebound RSI dari Area Oversold**: RSI saat ini ({rsi:.1f}) mulai melengkung ke atas menembus level 30–40.\n"
                f"3. **Peningkatan Volume Akumulasi**: Volume pembelian harian melampaui rata-rata 20 hari terakhir, menandakan masuknya kembali *smart money*."
            )
        elif any(w in q_lower for w in ["cicil", "sedikit", "dca", "bertahap", "dikit", "lot kecil"]):
            max_lot_cash = int(cash_balance // (support * 100))
            answer = (
                f"Ya, mencicil secara bertahap (Dollar Cost Averaging) jauh lebih aman dan bijak daripada langsung 'all-in' sekaligus.\n\n"
                f"Dengan saldo kas Anda saat ini sebesar Rp {cash_balance:,.0f}, Anda memiliki kapasitas membeli hingga {max_lot_cash} lot di harga Rp {support:,.0f}. "
                f"Jika Anda ingin mencicil, gunakan taktik 3 tahap:\n"
                f"- **Tahap 1 (Uji Pantulan)**: Beli 20-30% saat candle hijau pertama muncul di support.\n"
                f"- **Tahap 2 (Konfirmasi Rebound)**: Tambah sisa porsi saat harga berhasil breakout di atas MA20 (Rp {ma20:,.0f}).\n"
                f"Dengan metode bertahap ini, Anda membatasi eksposur risiko jika pasar IDX kembali bergejolak."
            )
        elif any(w in q_lower for w in ["jual", "cut loss", "kapan harus", "rugi", "pangkas"]):
            answer = (
                f"Untuk posisi {ticker} ({jenis.upper()}), aturan batas risiko adalah sebagai berikut:\n\n"
                f"- **Level Kritis (Invalidasi)**: Jika harga penutupan EOD menembus di bawah Support Rp {support:,.0f} dan ditutup di level Rp {round(support*0.98):,.0f}.\n"
                f"- **Tindakan SOP**: Jangan jual 100% secara panik. Pangkas posisi bertahap 50% lot (Trim) untuk menghentikan pendarahan modal, lalu amankan sisa modal kas untuk mencari momentum di saham lain yang lebih sehat."
            )
        else:
            answer = (
                f"Mengenai pertanyaan Anda untuk saham {ticker}: Kondisi saat ini berada di harga Rp {close:,.0f} "
                f"dengan floating loss {pnl_pct:.2f}%. Mengacu pada strategi {scenario_title}, prioritas utama adalah menjaga ketahanan kas "
                f"(saat ini Rp {cash_balance:,.0f}) serta menghindari tindakan emosional menjual di area jenuh jual (RSI {rsi:.1f}). "
                f"Pantau reaksi harga saat menguji Support Rp {support:,.0f} dan Resistance MA20 Rp {ma20:,.0f}."
            )

        return {
            "status": "success",
            "source": "rule_based" if not has_valid_api else "gemini",
            "hasApiKey": has_valid_api,
            "scenarioId": scenario_id,
            "scenarioTitle": scenario_title,
            "question": q_clean,
            "answer": answer
        }

    # Initial Deep-Dive breakdown
    if has_valid_api:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")

            prompt = f"""
            Anda adalah AI Decision Copilot profesional saham IDX.
            Berikan analisis bedah logika mendalam untuk:
            Ticker: {ticker} (Tipe: {jenis.upper()})
            Lot: {lot} | Avg Price: Rp {avg_price} | Harga EOD: Rp {close} (Floating PnL: {pnl_pct:.2f}%)
            Saldo Kas Pengguna: Rp {cash_balance:,.0f}
            Support: Rp {support} | Resistance: Rp {resistance} | MA20: Rp {ma20} | RSI: {rsi}
            Fundamental: Yield {div_text}, PE {pe}, PBV {pbv}
            Skenario yang Dibedah: {scenario_title}

            Format jawaban JSON:
            {{
                "coreLogic": "1-2 paragraf penjelasan mendalam mengapa opsi ini paling logis secara finansial dan psikologis bagi investor",
                "invalidationRisk": "Kondisi terburuk apa yang membatalkan skenario ini dan apa batas toleransinya",
                "cashflowAndTimeline": "Penjelasan arus kas riil (dividen atau kebutuhan modal) dan estimasi rentang hari pemulihan",
                "tomorrowActionPlan": [
                    "Langkah konkret 1 di jam bursa besok",
                    "Langkah konkret 2 di jam bursa besok",
                    "Langkah konkret 3 di jam bursa besok"
                ]
            }}
            """
            resp = model.generate_content(prompt)
            clean_text = resp.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_text)
            return {
                "status": "success",
                "source": "gemini",
                "hasApiKey": True,
                "scenarioId": scenario_id,
                "scenarioTitle": scenario_title,
                "deepDive": data,
                "suggestedQuestions": [
                    f"Berapa estimasi dividen tunai per tahun dari {lot} lot saya?",
                    "Apa tanda konfirmasi bahwa harga sudah selesai fase turun?",
                    "Bolehkah saya mencicil bertahap dengan saldo kas yang ada?"
                ]
            }
        except Exception as e:
            print(f"[recovery_deepdive] Gemini error: {e}")

    # Deterministic Rule-Based Deep Dive (Clean, Transparent, Accurate)
    if scenario_id == "holdForBep":
        core_logic = (
            f"Saham {ticker} bertipe {jenis.upper()} saat ini berada di area jenuh jual (RSI {rsi:.1f}). "
            f"Dengan saldo kas aktif Anda sebesar Rp {cash_balance:,.0f}, menambah lot dalam jumlah besar untuk average down "
            f"belum memungkinkan secara likuiditas. Menahan posisi (Hold) adalah keputusan matematis paling disiplin: "
            f"Anda menghindari 'cut loss panik' di titik bawah, sembari mempertahankan kepemilikan aset untuk menangkap "
            f"technical bounce menuju Resistance MA20 di level Rp {round(ma20):,.0f}."
        )
        invalidation_risk = (
            f"Skenario Hold dinyatakan INVALID jika harga penutupan harian breakdown menembus level Major Support Rp {round(support):,.0f} "
            f"disertai volume jual abnormal. Jika hal ini terjadi, jangan pertahankan ego: pangkas 50% lot (Trim) "
            f"untuk mengamankan sisa modal dan tunggu pembentukan base support baru di bawahnya."
        )
        if est_annual_div_total > 0:
            cashflow_and_timeline = (
                f"Dengan kepemilikan {lot} lot ({lot*100:,} lembar), dividen tahunan diestimasikan sekitar Rp {est_annual_div_total:,.0f} "
                f"(yield {div_text}). Estimasi waktu pemulihan teknikal menuju target swing Rp {round(ma20):,.0f} biasanya membutuhkan "
                f"waktu 5 hingga 15 hari bursa saat pasar mengalami rotasi sektoral."
            )
        else:
            cashflow_and_timeline = (
                f"Karena {ticker} bukan pembagi dividen rutin, pemulihan murni bertumpu pada technical swing rebound. "
                f"Estimasi siklus pemulihan teknikal menuju target exit realistis Rp {round(ma20):,.0f} berkisar antara "
                f"5 hingga 15 hari bursa."
            )
        tomorrow_action_plan = [
            f"Pasang Price Alert di aplikasi sekuritas Anda pada Rp {round(support):,.0f} (Level Siaga 1) dan Rp {round(ma20):,.0f} (Level Target Rebound).",
            "Hindari kepanikan di 15 menit awal market open (09:00–09:15 WIB). Jangan lakukan transaksi impulsive.",
            f"Jika harga menyentuh Rp {round(ma20):,.0f} dan candle menunjukkan tekanan jual (ekor atas panjang), pasang antrean jual bertahap untuk exit."
        ]
    elif scenario_id == "averageDown":
        core_logic = (
            f"Skenario Average Down di area Major Support Rp {round(support):,.0f} bertujuan menurunkan rata-rata modal beli "
            f"dari Rp {avg_price:,.0f} ke area yang lebih realistis dicapai oleh swing harga normal. "
            f"Strategi ini sangat efektif untuk saham bernilai fundamental tinggi, namun membutuhkan kesiapan modal segar."
        )
        invalidation_risk = (
            f"Skenario ini GAGAL jika setelah Anda melakukan pembelian bawah di Rp {round(support):,.0f}, harga justru menembus "
            f"ke bawah (breakdown). Batas toleransi cut-loss untuk lot tambahan adalah maksimal 3% di bawah harga beli baru."
        )
        cashflow_and_timeline = (
            f"Kondisi Kas: Saldo aktif Anda adalah Rp {cash_balance:,.0f}. Jika kalkulasi membutuhkan modal lebih besar, "
            f"jangan memaksakan average down sekaligus. Waktu yang dibutuhkan setelah average down untuk mencapai Break-Even Point "
            f"rata-rata 2 hingga 4 minggu bursa."
        )
        tomorrow_action_plan = [
            f"Hanya pasang antrean beli jika harga menguji Rp {round(support):,.0f} dan terdapat bid tebal penahan harga.",
            "Jangan gunakan fasilitas margin sekuritas demi menghindari bunga dan force sell.",
            "Segera perbarui catatan average price baru di menu Portofolio setelah order match."
        ]
    else:  # cutLoss
        core_logic = (
            f"Disiplin memangkas posisi (Cut Loss) adalah pilar pertahanan modal paling fundamental. "
            f"Menjual sebagian atau seluruh posisi pada harga Rp {close:,.0f} jika Support Rp {round(support):,.0f} jebol "
            f"menghentikan risiko penurunan modal yang lebih parah, serta membebaskan kas untuk peluang saham lain yang sedang uptrend."
        )
        invalidation_risk = (
            f"Risiko skenario ini adalah terjadinya 'False Breakdown' (harga turun sesaat di bawah support lalu ditarik naik lagi). "
            f"Untuk mencegah false breakdown, tunggu konfirmasi hingga 15 menit menjelang penutupan market (pukul 15:45 WIB)."
        )
        cashflow_and_timeline = (
            f"Eksekusi cut loss akan mengamankan sisa modal cair seketika (T+1/T+2 di RDN sekuritas). "
            f"Kas tersebut langsung siap dibelanjakan kembali ke saham berskor tinggi pada menu EOD Screener."
        )
        tomorrow_action_plan = [
            f"Siapkan Stop Order di sistem sekuritas pada level harga Rp {round(support):,.0f}.",
            "Jika harga ditutup di bawah support pada sesi 1, siapkan antrean jual di awal sesi 2.",
            "Catat kerugian ini ke dalam Trading Journal untuk evaluasi post-mortem objektif."
        ]

    return {
        "status": "success",
        "source": "rule_based",
        "hasApiKey": False,
        "scenarioId": scenario_id,
        "scenarioTitle": scenario_title,
        "deepDive": {
            "coreLogic": core_logic,
            "invalidationRisk": invalidation_risk,
            "cashflowAndTimeline": cashflow_and_timeline,
            "tomorrowActionPlan": tomorrow_action_plan
        },
        "suggestedQuestions": [
            f"Berapa estimasi dividen tunai per tahun dari {lot} lot saya?",
            "Apa tanda konfirmasi bahwa harga sudah selesai fase turun?",
            "Bolehkah saya mencicil bertahap dengan saldo kas yang ada?"
        ]
    }


