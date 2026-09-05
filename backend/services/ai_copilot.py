import os
import json
import requests
from datetime import date
from typing import Dict, Any, Tuple, Optional, List
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from models import AIAnalysis, Holding

load_dotenv(override=True)

# Runtime in-memory provider selection
_RUNNING_PROVIDER: Optional[str] = None

def get_gemini_api_key() -> Optional[str]:
    load_dotenv(override=True)
    key = os.getenv("GEMINI_API_KEY")
    if key and key.strip() and key != "your_gemini_api_key_here":
        return key.strip()
    return None

def get_opencode_api_key() -> Optional[str]:
    load_dotenv(override=True)
    key = os.getenv("OPENCODE_API_KEY")
    if key and key.strip() and key != "your_opencode_api_key_here":
        return key.strip()
    return None


def get_active_provider() -> str:
    global _RUNNING_PROVIDER
    if _RUNNING_PROVIDER:
        return _RUNNING_PROVIDER
    
    env_provider = os.getenv("AI_PROVIDER", "").strip().lower()
    if env_provider in ("gemini", "opencode_zen"):
        return env_provider
    
    # Auto-detect fallback based on configured keys
    if get_opencode_api_key() and not get_gemini_api_key():
        return "opencode_zen"
    return "gemini"

def set_active_provider(provider: str) -> str:
    global _RUNNING_PROVIDER
    if provider in ("gemini", "opencode_zen"):
        _RUNNING_PROVIDER = provider
        return provider
    raise ValueError(f"Provider tidak valid: {provider}. Pilihan: 'gemini' atau 'opencode_zen'")

def get_ai_providers_status() -> Dict[str, Any]:
    load_dotenv()
    gemini_key = get_gemini_api_key()
    opencode_key = get_opencode_api_key()
    active = get_active_provider()
    
    return {
        "active_provider": active,
        "providers": [
            {
                "id": "gemini",
                "name": "Google Gemini",
                "model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
                "is_configured": bool(gemini_key),
                "badge_label": "Google Gemini AI"
            },
            {
                "id": "opencode_zen",
                "name": "OpenCode Zen",
                "model": os.getenv("OPENCODE_MODEL", "deepseek-chat"),
                "base_url": os.getenv("OPENCODE_BASE_URL", "https://opencode.ai/zen/v1"),
                "is_configured": bool(opencode_key),
                "badge_label": "OpenCode Zen AI"
            }
        ]
    }

def _extract_json(text: str) -> dict:
    text = text.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()
    return json.loads(text)

def call_llm(
    prompt: str,
    system_prompt: Optional[str] = None,
    preferred_provider: Optional[str] = None,
    json_mode: bool = False
) -> Tuple[str, str]:
    """
    Calls the selected LLM provider (or active provider).
    Returns (response_text, provider_name).
    """
    provider = preferred_provider or get_active_provider()
    
    if provider == "opencode_zen":
        api_key = get_opencode_api_key()
        if not api_key:
            raise ValueError("API Key OpenCode Zen belum dikonfigurasi di backend/.env (OPENCODE_API_KEY)")
        
        base_url = os.getenv("OPENCODE_BASE_URL", "https://opencode.ai/zen/v1").rstrip("/")
        model_name = os.getenv("OPENCODE_MODEL", "deepseek-chat")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload: Dict[str, Any] = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.2
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        resp = requests.post(f"{base_url}/chat/completions", headers=headers, json=payload, timeout=60)
        if resp.status_code != 200:
            raise RuntimeError(f"OpenCode Zen API Error ({resp.status_code}): {resp.text}")
            
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return content.strip(), "opencode_zen"
        
    else:  # Gemini
        api_key = get_gemini_api_key()
        if not api_key:
            raise ValueError("API Key Google Gemini belum dikonfigurasi di backend/.env (GEMINI_API_KEY)")
            
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        model = genai.GenerativeModel(model_name)
        
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        resp = model.generate_content(full_prompt)
        return resp.text.strip(), "gemini"


def analyze_holding_with_ai(
    holding: Holding,
    latest_indicators: dict,
    db: Session,
    provider: Optional[str] = None
) -> Dict[str, Any]:
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

    active_provider = provider or get_active_provider()
    has_key = bool(get_opencode_api_key() if active_provider == "opencode_zen" else get_gemini_api_key())

    if not has_key:
        provider_name = "OpenCode Zen" if active_provider == "opencode_zen" else "Google Gemini"
        key_name = "OPENCODE_API_KEY" if active_provider == "opencode_zen" else "GEMINI_API_KEY"
        return {
            "status": "unavailable",
            "error_type": "NO_API_KEY",
            "provider": active_provider,
            "message": f"Fitur AI Copilot belum tersedia karena API Key {provider_name} belum dikonfigurasi.",
            "detail": f"Tambahkan {key_name} di file backend/.env untuk mengaktifkan analisis AI.",
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
            "provider": snapshot.get("source", active_provider),
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
        tp_text = f"Rp {round(holding.target_price):,d}" if holding.target_price else "Belum ditentukan"
        sl_text = "Tidak ada hard stop loss (Saham Investasi)" if jenis == "investasi" else (f"Rp {round(holding.stop_loss):,d}" if holding.stop_loss else "Belum ditentukan")

        system_prompt = (
            "Anda adalah AI Decision Copilot profesional untuk saham IDX (Bursa Efek Indonesia). "
            "Berikan analisis EOD pasca-closing objektif, berbasis data teknikal historis, dan bebas emosi."
        )

        prompt = f"""
        Ticker: {ticker}
        Jenis Kepemilikan: {jenis.upper()} (PENTING: Jika jenis INVESTASI, jangan rekomendasikan Cut Loss panik. Fokus pada valuasi, dividen, support historis, dan kelayakan averaging down bertahap. Jika TRADING, utamakan disiplin Stop Loss ketat)
        Harga Close EOD: Rp {round(close):,d}
        Avg Price Beli: Rp {round(avg_price):,d} (PnL: {pnl_pct:.2f}%)
        Target Price: {tp_text}
        Stop Loss: {sl_text}
        Indikator: MA20=Rp {round(ma20):,d}, MA50=Rp {round(ma50):,d}, RSI(14)={rsi:.1f}, Support=Rp {round(support):,d}, Resistance=Rp {round(resistance):,d}

        ATURAN FORMAT PENTING:
        - Seluruh harga saham, level support/resistance, target, dan nominal Rupiah WAJIB dinyatakan dalam BILANGAN BULAT (integer) tanpa desimal/sen (contoh: Rp {round(close):,d}, bukan {close}).

        Format jawaban JSON murni:
        {{
            "recommendation": "HOLD" | "TRIM 50%" | "SELL ALL" | "CUT LOSS" | "AVERAGE DOWN" | "BUY MORE",
            "confidence": 85-95,
            "rationale": "1-2 paragraf objektif evaluasi kondisi teknikal dibanding trading plan / strategi investasi",
            "action_items": ["item 1", "item 2", "item 3"]
        }}
        """
        response_text, used_provider = call_llm(
            prompt=prompt,
            system_prompt=system_prompt,
            preferred_provider=active_provider,
            json_mode=True
        )
        data = _extract_json(response_text)
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
                "source": used_provider,
                "action_items": action_items,
                "confidence": confidence,
                "indicators": latest_indicators
            })
        )
        db.add(new_analysis)
        db.commit()

        return {
            "status": "success",
            "provider": used_provider,
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
        print(f"[ai_copilot] Error memanggil AI ({active_provider}): {err_msg}")
        is_quota = any(k in err_msg.lower() for k in ["429", "resourceexhausted", "quota", "limit", "exhausted"])
        error_type = "QUOTA_EXCEEDED" if is_quota else "AI_ERROR"
        user_message = (
            f"AI ({active_provider}) belum dapat menjawab saat ini karena limit atau kuota token telah habis."
            if is_quota else
            f"AI ({active_provider}) belum dapat memproses jawaban: {err_msg}"
        )
        user_detail = (
            "Batas kuota harian (rate limit) API tercapai. Mohon tunggu beberapa saat sebelum mencoba analisis ulang."
            if is_quota else
            "Terjadi kendala koneksi ke server AI."
        )

        return {
            "status": "error",
            "provider": active_provider,
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
    cash_balance: float = 168755.0,
    conversation_history: list = None,
    provider: Optional[str] = None
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

    active_provider = provider or get_active_provider()
    has_valid_api = bool(get_opencode_api_key() if active_provider == "opencode_zen" else get_gemini_api_key())

    # If user provided a specific follow-up question
    if user_question and user_question.strip():
        q_clean = user_question.strip()
        
        if has_valid_api:
            try:
                history_context = ""
                if conversation_history and len(conversation_history) > 0:
                    history_lines = []
                    for h in conversation_history[-6:]:
                        role_label = "USER" if h.get("role") == "user" else "AI"
                        msg_text = h.get("message") or h.get("text", "")
                        if msg_text:
                            history_lines.append(f"{role_label}: {msg_text}")
                    if history_lines:
                        history_context = "\nRiwayat Percakapan Sebelumnya Sesi Hari Ini:\n" + "\n".join(history_lines) + "\n"

                system_prompt = (
                    "Anda adalah AI Financial & Trading Copilot profesional untuk pasar saham IDX (Bursa Efek Indonesia). "
                    "Berikan jawaban yang edukatif, jujur, berbasis matematika & data teknikal, bebas halusinasi, dan dalam Bahasa Indonesia profesional."
                )

                prompt = f"""
                Konteks Pengguna:
                - Ticker: {ticker} (Tipe: {jenis.upper()})
                - Posisi: {lot} Lot di Avg Rp {round(avg_price):,d}, Harga saat ini Rp {round(close):,d} (Floating Loss: {pnl_pct:.2f}% / Rp {round(floating_nominal):,d})
                - Sisa Saldo Kas Pengguna: Rp {round(cash_balance):,d}
                - Indikator: Support Major Rp {round(support):,d}, Resistance Rp {round(resistance):,d}, MA20 Rp {round(ma20):,d}, RSI {rsi:.1f}
                - Fundamental: Dividend Yield {div_text}, PE {pe if pe else '-'}x, PBV {pbv if pbv else '-'}x
                - Skenario yang Dipilih: {scenario_title}
                {history_context}
                Pertanyaan Pengguna Terbaru: "{q_clean}"

                ATURAN FORMAT WAJIB:
                - Seluruh harga saham, target pergerakan harga, dan nominal Rupiah WAJIB berupa BILANGAN BULAT tanpa pecahan/desimal/sen (contoh: Rp {round(avg_price):,d}, bukan {avg_price}).
                - Berikan jawaban langsung ke poin dalam 1-3 paragraf ringkas yang bersahabat dan profesional.
                - Sertakan perhitungan nominal riil jika pengguna bertanya tentang nominal kas/dividen/lot.
                """
                ai_answer, used_provider = call_llm(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    preferred_provider=active_provider
                )
                return {
                    "status": "success",
                    "source": used_provider,
                    "hasApiKey": True,
                    "scenarioId": scenario_id,
                    "scenarioTitle": scenario_title,
                    "question": q_clean,
                    "answer": ai_answer
                }
            except Exception as e:
                print(f"[recovery_discuss] {active_provider} error: {e}")
        
        # Rule-based Q&A fallback responder
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
            "source": "rule_based",
            "hasApiKey": has_valid_api,
            "scenarioId": scenario_id,
            "scenarioTitle": scenario_title,
            "question": q_clean,
            "answer": answer
        }

    # Initial Deep-Dive breakdown
    if has_valid_api:
        try:
            system_prompt = (
                "Anda adalah AI Decision Copilot profesional saham IDX. "
                "Berikan analisis bedah logika mendalam dalam format JSON murni."
            )
            prompt = f"""
            Ticker: {ticker} (Tipe: {jenis.upper()})
            Lot: {lot} | Avg Price: Rp {round(avg_price):,d} | Harga EOD: Rp {round(close):,d} (Floating PnL: {pnl_pct:.2f}%)
            Saldo Kas Pengguna: Rp {round(cash_balance):,d}
            Support: Rp {round(support):,d} | Resistance: Rp {round(resistance):,d} | MA20: Rp {round(ma20):,d} | RSI: {rsi:.1f}
            Fundamental: Yield {div_text}, PE {pe}, PBV {pbv}
            Skenario yang Dibedah: {scenario_title}

            ATURAN FORMAT WAJIB:
            - Seluruh harga saham, target pergerakan harga, level support/resistance, dan nominal Rupiah WAJIB berupa BILANGAN BULAT tanpa pecahan/desimal/sen (contoh: Rp {round(avg_price):,d}, bukan {avg_price}).

            Format JSON:
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
            response_text, used_provider = call_llm(
                prompt=prompt,
                system_prompt=system_prompt,
                preferred_provider=active_provider,
                json_mode=True
            )
            data = _extract_json(response_text)
            return {
                "status": "success",
                "source": used_provider,
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
            print(f"[recovery_deepdive] {active_provider} error: {e}")

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
