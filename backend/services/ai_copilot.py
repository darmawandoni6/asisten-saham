import os
import json
import time
import requests
from datetime import datetime, date
from typing import Dict, Any, Tuple, Optional, List
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from models import AIAnalysis, Holding, RecoveryDeepDive, CopilotChatLog, RecoveryChatLog, ScreenerChatLog

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")

def reload_env():
    """Memuat ulang file .env secara instan (hot-reload) baik saat dipanggil dari backend maupun CLI script."""
    if os.path.exists(ENV_PATH):
        load_dotenv(dotenv_path=ENV_PATH, override=True)
    else:
        load_dotenv(override=True)

reload_env()

# Runtime in-memory provider selection (Custom OpenAI-Compatible LLM Gateway)
_RUNNING_PROVIDER: Optional[str] = None

def get_ai_api_key() -> Optional[str]:
    """Mengambil API Key dari .env (mendukung AI_API_KEY, NINEROUTER_API_KEY, OPENAI_API_KEY)."""
    reload_env()
    key = os.getenv("AI_API_KEY") or os.getenv("NINEROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if key and key.strip() and not key.strip().startswith("your_"):
        return key.strip()
    return None

def get_ninerouter_api_key() -> Optional[str]:
    """Alias kompatibilitas mundur."""
    return get_ai_api_key()

def get_ai_model() -> str:
    """Mengambil nama model AI dari .env (Default: gpt-4o-mini)."""
    reload_env()
    return os.getenv("AI_MODEL") or os.getenv("NINEROUTER_MODEL") or os.getenv("OPENAI_MODEL") or "gpt-4o-mini"

def get_ai_base_url() -> str:
    """Mengambil Base URL / Endpoint dari .env (Default: https://api.openai.com/v1)."""
    reload_env()
    return os.getenv("AI_BASE_URL") or os.getenv("NINEROUTER_BASE_URL") or os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1"

def get_active_provider() -> str:
    global _RUNNING_PROVIDER
    if _RUNNING_PROVIDER:
        return _RUNNING_PROVIDER
    
    reload_env()
    provider = os.getenv("AI_PROVIDER", "").strip().lower()
    if provider:
        return provider
    return "9router"

def set_active_provider(provider: str) -> str:
    global _RUNNING_PROVIDER
    _RUNNING_PROVIDER = provider or "9router"
    return _RUNNING_PROVIDER

def get_ai_cache_ttl() -> int:
    """Durasi cache AI dalam detik (Default: 300 detik / 5 menit, configurable via .env)."""
    reload_env()
    try:
        return int(os.getenv("AI_CACHE_TTL_SECONDS", "300"))
    except Exception:
        return 300

def get_ai_max_tokens() -> int:
    """Batas maksimal token output AI (Default: 2000 tokens, configurable via .env)."""
    reload_env()
    try:
        return int(os.getenv("AI_MAX_TOKENS", "2000"))
    except Exception:
        return 2000

def get_ai_timeout() -> int:
    """Batas waktu timeout request AI dalam detik (Default: 30 detik, configurable via .env)."""
    reload_env()
    try:
        return int(os.getenv("AI_TIMEOUT_SECONDS", "30"))
    except Exception:
        return 30

# In-memory fast cache untuk diskusi recovery skenario AI
_RECOVERY_DISCUSS_CACHE: Dict[str, Tuple[Dict[str, Any], float]] = {}


def get_ai_providers_status() -> Dict[str, Any]:
    reload_env()
    api_key = get_ai_api_key()
    model = get_ai_model()
    base_url = get_ai_base_url()
    active_prov = get_active_provider()
    prov_name = "9Router AI Gateway" if active_prov == "9router" else "Custom OpenAI-Compatible LLM"
    
    return {
        "active_provider": active_prov,
        "providers": [
            {
                "id": active_prov,
                "name": prov_name,
                "model": model,
                "base_url": base_url,
                "is_configured": bool(api_key),
                "badge_label": f"{prov_name} ({model})"
            }
        ]
    }

def _clean_chat_response(text: str) -> str:
    """Membersihkan tag reasoning internal (<think>...</think> atau 'Here is a thinking process:') dari chat respons."""
    if not text:
        return ""
    import re
    cleaned = text.strip()
    cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL).strip()
    
    if cleaned.startswith("Here's a thinking process:") or cleaned.startswith("Here is a thinking process:"):
        for sep in ["\n---\n", "\n***\n", "\n### ", "\n## ", "\n# ", "\n**Final Answer**", "\nFinal Answer:"]:
            if sep in cleaned:
                parts = cleaned.split(sep, 1)
                if len(parts[1].strip()) > 30:
                    cleaned = (sep.strip() + "\n" + parts[1]).strip()
                    break
    return cleaned


def _extract_json(text: str) -> dict:
    if not text or not text.strip():
        raise ValueError("Empty response text received for JSON extraction")
    raw = text.strip()

    # 0. Direct full-string JSON parse (fastest & most accurate for json_mode)
    try:
        val = json.loads(raw)
        if isinstance(val, dict) and len(val) > 0:
            return val
    except Exception:
        pass

    # 1. Try markdown ```json codeblock first (from right to left)
    if "```json" in raw:
        blocks = raw.split("```json")[1:]
        for block in reversed(blocks):
            block_content = block.split("```", 1)[0].strip()
            try:
                val = json.loads(block_content)
                if isinstance(val, dict) and len(val) > 0:
                    return val
            except Exception:
                pass
    elif "```" in raw:
        blocks = raw.split("```")[1:]
        for block in reversed(blocks):
            block_content = block.split("```", 1)[0].strip()
            if "{" in block_content and "}" in block_content:
                s = block_content.find("{")
                e = block_content.rfind("}")
                try:
                    val = json.loads(block_content[s:e+1])
                    if isinstance(val, dict) and len(val) > 0:
                        return val
                except Exception:
                    pass

    # 2. Extract top-level balanced { ... } objects from left to right
    import re
    candidates = []
    depth = 0
    start_idx = None
    in_string = False
    escape = False

    for pos, char in enumerate(raw):
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if not in_string:
            if char == '{':
                if depth == 0:
                    start_idx = pos
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0 and start_idx is not None:
                    candidate = raw[start_idx:pos+1].strip()
                    try:
                        val = json.loads(candidate)
                        if isinstance(val, dict) and len(val) > 0:
                            candidates.append(val)
                    except Exception:
                        try:
                            no_trailing = re.sub(r',\s*([\]}])', r'\1', candidate)
                            val = json.loads(no_trailing)
                            if isinstance(val, dict) and len(val) > 0:
                                candidates.append(val)
                        except Exception:
                            pass
                    start_idx = None

    if candidates:
        for c in reversed(candidates):
            if any(k in c for k in ['recommendations', 'recommendation', 'coreLogic', 'target_price', 'score']):
                return c
        return candidates[-1]

    # 3. Python dict literal (e.g. single quotes)
    try:
        import ast
        s_idx = raw.find("{")
        e_idx = raw.rfind("}")
        if s_idx != -1 and e_idx != -1 and e_idx > s_idx:
            val = ast.literal_eval(raw[s_idx:e_idx+1])
            if isinstance(val, dict) and len(val) > 0:
                return val
    except Exception:
        pass

    # 4. Fallback: Parse key fields via regex / partial recovery
    import re
    rec_m = re.search(r'["\']?recommendation["\']?\s*:\s*["\']?([A-Z0-9 %_\-]+)', raw, re.IGNORECASE)
    rat_m = re.search(r'["\']?rationale["\']?\s*:\s*["\']([^"\}]+)', raw, re.IGNORECASE)
    core_m = re.search(r'["\']?coreLogic["\']?\s*:\s*["\']([^"\}]+)', raw, re.IGNORECASE)

    if rec_m:
        val = rec_m.group(1).replace('"', '').replace("'", '').strip().upper()
        rec_final = "HOLD"
        for candidate in ["HOLD", "TRIM 50%", "SELL ALL", "CUT LOSS", "AVERAGE DOWN", "BUY MORE", "TRIM"]:
            if candidate in val:
                rec_final = candidate
                break
        return {
            "recommendation": rec_final,
            "confidence": 85,
            "rationale": rat_m.group(1).strip() if rat_m else raw.strip()[:300],
            "action_items": ["Pantau pergerakan harga saham sesuai trading plan"]
        }
    if core_m:
        return {
            "coreLogic": core_m.group(1).strip(),
            "invalidationRisk": "Breakdown support major harian",
            "cashflowAndTimeline": "Pemulihan berkala teknikal swing",
            "tomorrowActionPlan": ["Pantau pergerakan jam 09:00 WIB"]
        }

    # Ultimate fallback: return a valid structured dict rather than failing
    return {
        "recommendation": "HOLD",
        "confidence": 80,
        "rationale": raw.strip()[:400],
        "action_items": ["Disiplin memantau level Support dan Resistance"]
    }


def call_llm(
    prompt: str,
    system_prompt: Optional[str] = None,
    preferred_provider: Optional[str] = None,
    json_mode: bool = False
) -> Tuple[str, str]:
    """
    Calls the configured OpenAI-compatible LLM Gateway / Provider.
    Returns (response_text, provider_id).
    """
    api_key = get_ai_api_key()
    if not api_key:
        raise ValueError("API Key AI belum dikonfigurasi di backend/.env (AI_API_KEY)")
    
    raw_url = get_ai_base_url().strip().rstrip("/")
    if raw_url.endswith("/chat/completions"):
        endpoint_url = raw_url
    else:
        endpoint_url = f"{raw_url}/chat/completions"
    model_name = get_ai_model()

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    payload: Dict[str, Any] = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": get_ai_max_tokens(),
        "stream": False
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    resp = requests.post(endpoint_url, headers=headers, json=payload, timeout=get_ai_timeout())
    if resp.status_code == 400 and json_mode and "response_format" in payload:
        del payload["response_format"]
        resp = requests.post(endpoint_url, headers=headers, json=payload, timeout=get_ai_timeout())

    if resp.status_code != 200:
        raise RuntimeError(f"AI Provider API Error ({resp.status_code}): {resp.text}")
        
    data = resp.json()
    choice = data.get("choices", [{}])[0]
    msg = choice.get("message") or {}
    content = msg.get("content") or ""
    if not content.strip() and msg.get("reasoning"):
        content = msg.get("reasoning") or ""
        
    final_text = content.strip()
    if not json_mode:
        final_text = _clean_chat_response(final_text)
        
    used_provider = preferred_provider or get_active_provider() or "9router"
    return final_text, used_provider




def analyze_holding_with_ai(
    holding: Holding,
    latest_indicators: dict,
    db: Session,
    provider: Optional[str] = None,
    force_refresh: bool = False
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
    has_key = bool(get_ai_api_key())
    model_name = get_ai_model()

    if not has_key:
        return {
            "status": "unavailable",
            "error_type": "NO_API_KEY",
            "provider": active_provider,
            "message": "Fitur AI Copilot belum tersedia karena API Key belum dikonfigurasi.",
            "detail": "Tambahkan AI_API_KEY, AI_MODEL, dan AI_BASE_URL di file backend/.env untuk mengaktifkan analisis AI.",
            "ticker": ticker,
            "name": f"{ticker.replace('.JK', '')} Tbk",
            "date": str(today),
            "currentPrice": round(close),
            "avgPrice": round(avg_price),
            "pnlPct": round(pnl_pct, 2),
            "indicators": latest_indicators
        }

    # Check cache in DB with configurable TTL
    ttl_seconds = get_ai_cache_ttl()
    cached = db.query(AIAnalysis).filter(
        AIAnalysis.ticker == ticker,
        AIAnalysis.date == today
    ).first()

    if not force_refresh and cached and cached.created_at:
        try:
            cached_time = cached.created_at.replace(tzinfo=None) if cached.created_at.tzinfo else cached.created_at
            now_time = datetime.now()
            age = (now_time - cached_time).total_seconds()
            if age < ttl_seconds:
                snapshot = json.loads(cached.raw_data_snapshot) if cached.raw_data_snapshot else {}
                cached_src = snapshot.get("source", active_provider)
                if not provider or provider == cached_src:
                    return {
                        "status": "success",
                        "cached": True,
                        "cacheAgeSeconds": int(age),
                        "provider": cached_src,
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
        except Exception as cache_e:
            print(f"[ai_copilot] Cache evaluation error: {cache_e}")

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

        # Save / update cache in database
        raw_snapshot_str = json.dumps({
            "source": used_provider,
            "action_items": action_items,
            "confidence": confidence,
            "indicators": latest_indicators
        })

        if cached:
            cached.recommendation = recommendation
            cached.analysis_text = rationale
            cached.raw_data_snapshot = raw_snapshot_str
            cached.created_at = datetime.now()
        else:
            new_analysis = AIAnalysis(
                ticker=ticker,
                date=today,
                recommendation=recommendation,
                analysis_text=rationale,
                raw_data_snapshot=raw_snapshot_str,
                created_at=datetime.now()
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


def discuss_copilot_recommendation(
    holding: Holding,
    latest_indicators: dict,
    ai_recommendation: dict,
    user_question: str,
    conversation_history: Optional[List[dict]] = None,
    db: Optional[Session] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Menjawab pertanyaan pengguna terkait rekomendasi AI Copilot untuk suatu emiten.
    Memanfaatkan konteks posisi portofolio, indikator teknikal, putusan AI, dan riwayat multi-turn chat.
    """
    ticker = holding.ticker
    jenis = getattr(holding, "jenis", "trading") or "trading"
    lot = holding.lot
    avg_price = float(holding.avg_price)
    close = float(latest_indicators.get("close", avg_price))
    pnl_pct = ((close - avg_price) / avg_price) * 100
    floating_nominal = (close - avg_price) * lot * 100
    rsi = float(latest_indicators.get("rsi", 50.0))
    ma20 = float(latest_indicators.get("ma20", close))
    ma50 = float(latest_indicators.get("ma50", close))
    support = float(latest_indicators.get("support", close * 0.95))
    resistance = float(latest_indicators.get("resistance", close * 1.05))
    trend = latest_indicators.get("trend", "SIDEWAYS")
    vol_status = latest_indicators.get("volume_status", "NORMAL")

    rec_verdict = ai_recommendation.get("recommendation", "HOLD")
    rec_rationale = ai_recommendation.get("rationale", "")
    rec_actions = ai_recommendation.get("actionItems", [])
    rec_confidence = ai_recommendation.get("confidence", 90)

    q_clean = user_question.strip() if user_question else ""
    if not q_clean:
        return {
            "status": "error",
            "message": "Pertanyaan tidak boleh kosong."
        }

    tp_text = f"Rp {round(holding.target_price):,d}" if holding.target_price else "Belum ditentukan"
    sl_text = "Tidak ada hard stop loss (Saham Investasi)" if jenis == "investasi" else (f"Rp {round(holding.stop_loss):,d}" if holding.stop_loss else "Belum ditentukan")

    active_provider = provider or get_active_provider()
    has_valid_api = bool(get_ai_api_key())

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
                "Anda adalah AI Decision & Trading Copilot profesional untuk pasar saham IDX (Bursa Efek Indonesia). "
                "Tugas Anda adalah mendiskusikan rekomendasi AI yang telah diberikan, menjawab pertanyaan trader/investor dengan ramah, "
                "objektif, edukatif, dan berbasis data teknikal serta kaidah manajemen risiko ketat.\n\n"
                "PRINSIP UTAMA:\n"
                "1. Disiplin Profil Emiten: Jika jenis TRADING, utamakan disiplin Stop Loss, proteksi modal, dan trailing stop. Jika jenis INVESTASI, jangan rekomendasikan cut loss panik; fokus pada valuasi historis, dividen, dan akumulasi bertahap di Support Major.\n"
                "2. Angka Riil & Bulat: Seluruh harga saham, target pergerakan harga, dan nominal Rupiah WAJIB berupa BILANGAN BULAT tanpa pecahan/desimal/sen (contoh: Rp 5.250, bukan Rp 5250.00).\n"
                "3. Jawaban Kompak & Aplikatif: Berikan jawaban langsung ke pokok permasalahan dalam 1-3 paragraf ringkas dan berikan poin langkah aksi konkret."
            )

            prompt = f"""
            Konteks Pengguna & Portofolio:
            - Ticker: {ticker} ({ticker.replace('.JK', '')} Tbk)
            - Profil Kepemilikan: {jenis.upper()}
            - Posisi Saat Ini: {lot} Lot @ Avg Rp {round(avg_price):,d}
            - Harga Penutupan Terakhir (Close EOD): Rp {round(close):,d} (Floating PnL: {pnl_pct:+.2f}% / Rp {round(floating_nominal):,d})
            - Target Price: {tp_text}
            - Stop Loss: {sl_text}
            - Indikator Teknikal EOD:
              • MA20: Rp {round(ma20):,d} | MA50: Rp {round(ma50):,d}
              • RSI (14 Hari): {rsi:.1f}
              • Support: Rp {round(support):,d} | Resistance: Rp {round(resistance):,d}
              • Tren: {trend} | Volume: {vol_status}

            Rekomendasi AI Sebelumnya:
            - Putusan AI: {rec_verdict} (Keyakinan: {rec_confidence}%)
            - Rasional: {rec_rationale}
            - Action Items: {', '.join(rec_actions) if rec_actions else '-'}

            {history_context}
            Pertanyaan Pengguna Terbaru:
            "{q_clean}"

            Jawablah pertanyaan pengguna di atas dengan mengacu pada putusan rekomendasi AI di atas.
            """

            ai_answer, used_provider = call_llm(
                prompt=prompt,
                system_prompt=system_prompt,
                preferred_provider=active_provider
            )
            return {
                "status": "success",
                "source": used_provider,
                "question": q_clean,
                "answer": ai_answer
            }
        except Exception as e:
            print(f"[copilot_chat] {active_provider} error: {e}")

    # Fallback to intelligent rule-based response
    q_lower = q_clean.lower()
    if any(w in q_lower for w in ["kenapa", "alasan", "mengapa", "verdict", "dasar"]):
        if rec_verdict in ["CUT LOSS", "SELL ALL"]:
            answer = (
                f"Rekomendasi **{rec_verdict}** untuk {ticker} diberikan karena harga penutupan (Rp {round(close):,d}) "
                f"telah menembus batas risiko teknikal atau mendekati Stop Loss.\n\n"
                f"Sebagai posisi **{jenis.upper()}**, proteksi modal adalah prioritas nomor satu. Mempertahankan posisi "
                f"yang breakdown dari Support Rp {round(support):,d} berisiko memperlebar floating loss "
                f"(saat ini {pnl_pct:+.2f}% / Rp {round(floating_nominal):,d})."
            )
        elif rec_verdict in ["TRIM 50%", "TAKE PROFIT"]:
            answer = (
                f"Rekomendasi **{rec_verdict}** bertujuan untuk mengunci sebagian keuntungan (realized profit) "
                f"mengingat harga saat ini (Rp {round(close):,d}) mendekati area Resistance Rp {round(resistance):,d} "
                f"atau RSI telah berada di zona rawan jenuh beli (RSI {rsi:.1f}).\n\n"
                f"Dengan menjual separuh posisi, modal awal Anda teramankan sementara sisa lot dapat dipertahankan "
                f"menggunakan *Trailing Stop* untuk mengantisipasi potensi kenaikan lebih lanjut."
            )
        elif rec_verdict in ["AVERAGE DOWN", "BUY MORE"]:
            answer = (
                f"Rekomendasi **{rec_verdict}** didasarkan pada momentum teknikal di mana harga (Rp {round(close):,d}) "
                f"telah berada dekat dengan area Support kuat Rp {round(support):,d} dan indikator RSI ({rsi:.1f}) "
                f"menunjukkan indikasi oversold (jenuh jual).\n\n"
                f"Peluang *technical rebound* menuju target Resistance Rp {round(resistance):,d} memberikan rasio *Risk/Reward* yang menarik."
            )
        else: # HOLD
            answer = (
                f"Rekomendasi **HOLD** diberikan karena {ticker} saat ini bergerak dalam rentang konsolidasi wajar "
                f"antara Support Rp {round(support):,d} dan Resistance Rp {round(resistance):,d}.\n\n"
                f"Posisi teknikal belum mengonfirmasi breakdown batas risiko maupun breakout konfirmasi beli baru, "
                f"sehingga keputusan paling disiplin saat ini adalah *wait and see* sambil mempertahankan posisi Anda."
            )
    elif any(w in q_lower for w in ["target", "tp", "jual", "take profit", "resist"]):
        answer = (
            f"Untuk target penjualan {ticker}, perhatikan level-level teknikal berikut:\n\n"
            f"- **Target Terdekat (Resistance)**: Rp {round(resistance):,d}\n"
            f"- **Target Jangka Menengah (MA50/Swing)**: Rp {round(max(resistance, ma50)):,d}\n\n"
            f"Strategi terbaik: Pasang *sell limit* bertahap 50% lot saat harga menyentuh area Resistance Rp {round(resistance):,d} "
            f"untuk mengamankan profit terlebih dahulu."
        )
    elif any(w in q_lower for w in ["stop loss", "sl", "batas risiko", "cut loss", "rugi"]):
        if jenis == "investasi":
            answer = (
                f"Sebagai saham berkategori **INVESTASI**, posisi {ticker} tidak menggunakan hard Stop Loss jangka pendek.\n\n"
                f"Namun, batas evaluasi fundamental kritis berada di bawah Support Major Rp {round(support):,d}. "
                f"Selama fundamental emiten tetap sehat dan pembagian dividen konsisten, penurunan harga ke area Support justru merupakan peluang akumulasi bertahap."
            )
        else:
            sl_val = round(holding.stop_loss) if holding.stop_loss else round(support * 0.97)
            answer = (
                f"Untuk posisi **TRADING**, batas risiko ketat {ticker} adalah:\n\n"
                f"- **Hard Stop Loss**: Rp {sl_val:,d}\n"
                f"- **Batas Invalidasi Support**: Rp {round(support):,d}\n\n"
                f"Jika harga penutupan EOD ditutup di bawah level tersebut, segera lakukan Cut Loss tanpa ragu demi menjaga modal kerja Anda."
            )
    elif any(w in q_lower for w in ["cicil", "tambah", "beli lagi", "average down", "muatan"]):
        answer = (
            f"Jika Anda berencana menambah muatan (averaging down/buy more) pada {ticker}:\n\n"
            f"1. **Area Entry Ideal**: Tunggu pengujian di area Support Rp {round(support):,d}.\n"
            f"2. **Konfirmasi Sinyal**: Pastikan muncul candle pembalikan arah (*Hammer* atau *Bullish Pinbar*) dengan volume meningkat sebelum melakukan entry.\n"
            f"3. **Porsi Bertahap**: Beli secara bertahap (misal 30% lot di awal) untuk menghindari risiko jika harga melanjutkan penurunan."
        )
    else:
        answer = (
            f"Terkait pertanyaan Anda mengenai {ticker} (Close: Rp {round(close):,d}, PnL: {pnl_pct:+.2f}%):\n\n"
            f"Berdasarkan rekomendasi AI saat ini (**{rec_verdict}**), fokus utama Anda adalah mengawasi area Support Rp {round(support):,d} "
            f"dan Resistance Rp {round(resistance):,d}.\n\n"
            f"Pastikan setiap tindakan Anda tetap selaras dengan profil {jenis.upper()} Anda serta kaidah manajemen risiko yang disiplin."
        )

    return {
        "status": "success",
        "source": "rule_based",
        "question": q_clean,
        "answer": answer
    }


def discuss_recovery_scenario(
    holding: Holding,
    scenario_id: str,
    user_question: str | None,
    latest_indicators: dict,
    fundamental_info: dict,
    cash_balance: float = 168755.0,
    conversation_history: list = None,
    provider: Optional[str] = None,
    db: Optional[Session] = None,
    force_refresh: bool = False
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
    has_valid_api = bool(get_ai_api_key())
    ttl_seconds = get_ai_cache_ttl()
    today = date.today()

    # If user provided a specific follow-up question
    if user_question and user_question.strip():
        q_clean = user_question.strip()
        cache_key = f"qa_{ticker}_{scenario_id}_{hash(q_clean)}_{active_provider}"

        if not force_refresh and cache_key in _RECOVERY_DISCUSS_CACHE:
            cached_data, cached_ts = _RECOVERY_DISCUSS_CACHE[cache_key]
            if time.time() - cached_ts < ttl_seconds:
                res = dict(cached_data)
                res["cached"] = True
                res["cacheAgeSeconds"] = int(time.time() - cached_ts)
                return res
        
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
                res = {
                    "status": "success",
                    "source": used_provider,
                    "hasApiKey": True,
                    "scenarioId": scenario_id,
                    "scenarioTitle": scenario_title,
                    "question": q_clean,
                    "answer": ai_answer
                }
                _RECOVERY_DISCUSS_CACHE[cache_key] = (res, time.time())
                return res
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

    # =========================================================================
    # Initial Deep-Dive Breakdown (4 Pilar Analisis Skenario)
    # 1. Cek apakah hasil analisis AI sudah tersimpan di SQLite Database (jika bukan force_refresh)
    # =========================================================================
    if not force_refresh and db is not None:
        try:
            saved_deepdive = db.query(RecoveryDeepDive).filter(
                RecoveryDeepDive.ticker == ticker,
                RecoveryDeepDive.scenario_id == scenario_id,
                RecoveryDeepDive.date == today,
                RecoveryDeepDive.source == active_provider
            ).first()

            if saved_deepdive and saved_deepdive.deep_dive_data:
                parsed_data = json.loads(saved_deepdive.deep_dive_data)
                return {
                    "status": "success",
                    "source": saved_deepdive.source,
                    "fromDb": True,
                    "hasApiKey": True,
                    "scenarioId": scenario_id,
                    "scenarioTitle": scenario_title,
                    "deepDive": parsed_data,
                    "createdAt": saved_deepdive.created_at.isoformat() if saved_deepdive.created_at else None,
                    "suggestedQuestions": [
                        f"Berapa estimasi dividen tunai per tahun dari {lot} lot saya?",
                        "Apa tanda konfirmasi bahwa harga sudah selesai fase turun?",
                        "Bolehkah saya mencicil bertahap dengan saldo kas yang ada?"
                    ]
                }
        except Exception as db_read_err:
            print(f"[recovery_deepdive] Error checking DB for saved deepdive: {db_read_err}")

    # 2. Cek Fast In-Memory Cache (jika bukan force_refresh)
    cache_key = f"deepdive_{ticker}_{scenario_id}_{active_provider}"
    if not force_refresh and cache_key in _RECOVERY_DISCUSS_CACHE:
        cached_data, cached_ts = _RECOVERY_DISCUSS_CACHE[cache_key]
        if time.time() - cached_ts < ttl_seconds:
            res = dict(cached_data)
            res["cached"] = True
            res["cacheAgeSeconds"] = int(time.time() - cached_ts)
            return res

    # 3. Jika belum pernah dianalisis atau force_refresh, baru panggil AI
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

            # Simpan / update hasil analisis AI ke database SQLite untuk sesi hari ini
            if db is not None:
                try:
                    existing_deepdive = db.query(RecoveryDeepDive).filter(
                        RecoveryDeepDive.ticker == ticker,
                        RecoveryDeepDive.scenario_id == scenario_id,
                        RecoveryDeepDive.date == today,
                        RecoveryDeepDive.source == used_provider
                    ).first()

                    if existing_deepdive:
                        existing_deepdive.deep_dive_data = json.dumps(data)
                        existing_deepdive.created_at = datetime.now()
                    else:
                        new_deepdive = RecoveryDeepDive(
                            ticker=ticker,
                            scenario_id=scenario_id,
                            date=today,
                            source=used_provider,
                            deep_dive_data=json.dumps(data)
                        )
                        db.add(new_deepdive)
                    db.commit()
                except Exception as db_save_err:
                    print(f"[recovery_deepdive] Error saving deepdive to db: {db_save_err}")
                    db.rollback()

            res = {
                "status": "success",
                "source": used_provider,
                "fromDb": False,
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
            _RECOVERY_DISCUSS_CACHE[cache_key] = (res, time.time())
            return res
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


def discuss_screener_recommendation(
    screener_item: Dict[str, Any],
    user_question: Optional[str] = None,
    conversation_history: Optional[List[dict]] = None,
    db: Optional[Session] = None,
    provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Menjawab pertanyaan trader atau memberikan bedah AI mendalam mengapa saham dari Screener ini direkomendasikan,
    menghitung Skor Perhatian (1-10) di mana 10 berarti Wajib Dibeli Besok Pagi,
    serta memberikan panduan teknikal, trigger konfirmasi 09:00 WIB, invalidation level, dan alokasi risiko.
    """
    ticker = screener_item.get("ticker", "UNKNOWN.JK")
    name = screener_item.get("name", ticker)
    sector = screener_item.get("sector", "General")
    price = float(screener_item.get("price", 0))
    change_pct = float(screener_item.get("change_pct", screener_item.get("changePct", 0)))
    rsi = float(screener_item.get("rsi", 50.0))
    strategy = screener_item.get("strategy", "VALUE").upper()
    score_100 = float(screener_item.get("score", 85))
    why_buy = screener_item.get("why_buy", screener_item.get("whyBuy", screener_item.get("catalyst", "")))
    watch_trigger = screener_item.get("watch_trigger", screener_item.get("watchTrigger", ""))
    buy_area = screener_item.get("buy_area", screener_item.get("buyArea", f"Rp {int(price):,}"))
    target_price = float(screener_item.get("target_price", screener_item.get("targetPrice", price * 1.08)))
    stop_loss = float(screener_item.get("stop_loss", screener_item.get("stopLoss", price * 0.95)))
    rrr = screener_item.get("risk_reward_ratio", screener_item.get("riskRewardRatio", "1 : 2.0"))
    ma_status = screener_item.get("ma_status", screener_item.get("maStatus", "Normal"))

    # Hitung default Skor Perhatian 1-10
    if score_100 >= 90 or (score_100 >= 87 and ("2." in rrr or "3." in rrr or "4." in rrr)):
        default_conviction_score = 10
        default_conviction_label = "Wajib Dibeli Besok Pagi (Setup Sempurna)"
    elif score_100 >= 85:
        default_conviction_score = 9
        default_conviction_label = "Sangat Direkomendasikan Beli Besok Pagi"
    elif score_100 >= 80:
        default_conviction_score = 8
        default_conviction_label = "Prioritas Masuk Radar Beli"
    elif score_100 >= 75:
        default_conviction_score = 7
        default_conviction_label = "Layak Pantau / Akumulasi Bertahap"
    else:
        default_conviction_score = 6
        default_conviction_label = "Tunggu Konfirmasi Pantulan"

    active_provider = provider or get_active_provider()
    has_valid_api = bool(get_ai_api_key())

    q_clean = user_question.strip() if user_question else ""

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
                    history_context = "\nRiwayat Diskusi Sebelumnya:\n" + "\n".join(history_lines) + "\n"

            system_prompt = (
                "Anda adalah AI Senior Quantitative Analyst & Technical Strategist spesialis pasar saham Bursa Efek Indonesia (IDX). "
                "Tugas Anda adalah membedah secara objektif mengapa suatu saham masuk dalam rekomendasi EOD Screener, "
                "menilai tingkat kelayakan beli dengan Skor Perhatian (1-10) di mana SKOR 10 berarti 'WAJIB DIBELI BESOK PAGI' "
                "karena setup teknikalnya sudah matang dan RRR prima, serta menjawab pertanyaan trader secara taktis dan disiplin risiko.\n\n"
                "ATURAN DAN SKALA SKOR PERHATIAN (1-10):\n"
                "• 10/10: WAJIB DIBELI BESOK PAGI (Setup sempurna, breakout valid/oversold lantai kuat, RRR >= 1:2.0, volume akumulasi).\n"
                "• 8-9/10: SANGAT DIREKOMENDASIKAN (Kondisi sangat bagus, siap antre dengan konfirmasi pembukaan 09:00 WIB).\n"
                "• 6-7/10: LAYAK PANTAU / AKUMULASI (Bagus untuk swing atau cicil DCA bertahap di area support).\n"
                "• 4-5/10: SPEKULATIF / WAIT & SEE (Volatilitas tinggi atau dekat resisten).\n"
                "• 1-3/10: HINDARI SEMENTARA (Risiko breakdown lebih dominan).\n\n"
                "Format Wajib: Berikan jawaban dalam JSON valid dengan schema:\n"
                "{\n"
                '  "conviction_score": 10,\n'
                '  "conviction_label": "Wajib Dibeli Besok Pagi (Setup Sempurna)",\n'
                '  "conviction_reason": "Ringkasan 1-2 kalimat alasan skor conviction ini...",\n'
                '  "answer": "Penjelasan detail komprehensif membedah teknikal, alasan rekomendasi, SOP entry jam 09:00 WIB, dan menjawab pertanyaan pengguna jika ada...",\n'
                '  "suggested_questions": ["Pertanyaan taktis 1", "Pertanyaan taktis 2", "Pertanyaan taktis 3"]\n'
                "}\n"
                "Pastikan seluruh harga rupiah bulat (contoh: Rp 1.450)."
            )

            prompt = f"""
            Data Rekomendasi Screener EOD:
            - Saham: {ticker} ({name})
            - Sektor: {sector}
            - Harga Closing Terakhir: Rp {int(price):,} ({change_pct:+.2f}%)
            - Strategi Screener: {strategy}
            - AI Technical Score (0-100): {score_100:.0f}/100
            - Indikator: RSI={rsi:.1f} | Status={ma_status}
            - Area Beli Ideal: {buy_area}
            - Target Profit (TP): Rp {int(target_price):,}
            - Stop Loss (SL): Rp {int(stop_loss):,}
            - Risk/Reward Ratio: {rrr}
            - Alasan Sistem: {why_buy}
            - Wajib Dipantau Besok: {watch_trigger}

            {history_context}
            Pertanyaan Trader:
            "{q_clean if q_clean else 'Mengapa saham ini direkomendasikan dan berapa skor perhatian (1-10) untuk dibeli besok pagi?'}"
            """

            resp_text, used_provider = call_llm(
                prompt=prompt,
                system_prompt=system_prompt,
                preferred_provider=active_provider,
                json_mode=True
            )

            parsed = _extract_json(resp_text)
            conv_score = parsed.get("conviction_score", default_conviction_score)
            try:
                conv_score = int(conv_score)
                conv_score = min(max(conv_score, 1), 10)
            except Exception:
                conv_score = default_conviction_score

            conv_label = parsed.get("conviction_label", default_conviction_label)
            ans = parsed.get("answer") or parsed.get("rationale") or _clean_chat_response(resp_text)
            sugg = parsed.get("suggested_questions") or [
                f"Apakah aman pasang antrean buy di area {buy_area} saat pembukaan?",
                f"Berapa porsi lot maksimal dari saldo kas untuk {ticker}?",
                f"Apa tanda pembatalan setup jika market merah besok?"
            ]

            return {
                "status": "success",
                "source": used_provider,
                "ticker": ticker,
                "conviction_score": conv_score,
                "conviction_label": conv_label,
                "conviction_reason": parsed.get("conviction_reason", ""),
                "answer": ans,
                "suggested_questions": sugg[:3]
            }

        except Exception as e:
            print(f"[discuss_screener_recommendation] {active_provider} error: {e}, falling back to rule-based engine")

    # Fallback Deterministic Rule-Based Expert Engine
    if strategy == "BREAKOUT":
        rec_detail = (
            f"Saham {ticker} ({name}) berhasil menembus dan bertahan di atas garis penahan MA20 dengan indikator RSI {rsi:.1f}. "
            f"Fase sideways telah selesai dan fase ekspansi momentum bullish dimulai. "
            f"Rasio Risk:Reward tercatat menarik pada {rrr} dengan target penguatan menuju Rp {int(target_price):,} "
            f"dan batas proteksi ketat (Stop Loss) di Rp {int(stop_loss):,}."
        )
        action_sop = (
            f"1. **Buka Market (09:00–09:15 WIB)**: Amati apakah harga dibuka stabil di area beli {buy_area} dengan volume beli aktif.\n"
            f"2. **Eksekusi Entry**: Beli maksimal 20-25% dari saldo kas Anda agar portofolio tetap terdiversifikasi sehat.\n"
            f"3. **Proteksi & Exit**: Pasang Stop Order otomatis di sekuritas pada level Rp {int(stop_loss):,}, dan siapkan TP1 untuk kunci laba 50% lot di Rp {int(target_price):,}."
        )
    elif strategy == "OVERSOLD":
        rec_detail = (
            f"Saham {ticker} ({name}) mengalami tekanan jual jenuh ekstrem dengan RSI {rsi:.1f} tepat di atas lantai Support Mayor. "
            f"Secara statistik, probabilitas terjadinya pantulan teknikal (Technical Rebound / Buy on Weakness) sangat tinggi "
            f"dengan potensi gain menuju Rp {int(target_price):,} dan risiko terbatas pada level Stop Loss Rp {int(stop_loss):,} (RRR {rrr})."
        )
        action_sop = (
            f"1. **Buka Market (09:00 WIB)**: Jangan langsung HAKA (Hajar Kanan). Tunggu terbentuknya candle hijau penahan di area {buy_area}.\n"
            f"2. **Eksekusi Entry**: Masuk bertahap (50% lot pertama saat ada pantulan bid, 50% lot kedua saat volume naik).\n"
            f"3. **Invalidasi**: Jika harga breakdown menembus ke bawah Rp {int(stop_loss):,}, batalkan rencana beli atau segera cut-loss jika sudah terlanjur match."
        )
    else:  # VALUE
        rec_detail = (
            f"Saham {ticker} ({name}) merupakan emiten berbobot fundamental solid di sektor {sector} yang sedang berkonsolidasi sehat "
            f"di area lantai MA50 (Rp {int(price):,}). Valuasi saat ini berada di area diskon akumulasi institusi dengan rasio RRR {rrr}."
        )
        action_sop = (
            f"1. **Buka Market (09:00 WIB)**: Antre santai di area beli ideal {buy_area}.\n"
            f"2. **Strategi Akumulasi**: Lakukan Dollar-Cost Averaging (DCA) bertahap 2-3 tahap untuk investasi jangka menengah.\n"
            f"3. **Target & Evaluasi**: Target profit bertahap di Rp {int(target_price):,}, evaluasi jika support fundamental Rp {int(stop_loss):,} ditembus."
        )

    if q_clean:
        full_answer = (
            f"### 🎯 Jawaban AI terkait {ticker}\n\n"
            f"{rec_detail}\n\n"
            f"**Terkait Pertanyaan Anda:** *\"{q_clean}\"*\n"
            f"Dalam kaidah trading disiplin, langkah terbaik adalah menyesuaikan ukuran lot dengan saldo kas Anda dan mematuhi panduan level yang ada.\n\n"
            f"**📋 Checklist Aksi Jam 09:00 WIB Besok:**\n"
            f"{action_sop}"
        )
    else:
        full_answer = (
            f"### 💡 Bedah Rekomendasi AI: {ticker} ({name})\n\n"
            f"{rec_detail}\n\n"
            f"**📋 Checklist Aksi Jam 09:00 WIB Besok:**\n"
            f"{action_sop}"
        )

    return {
        "status": "success",
        "source": "rule_based",
        "ticker": ticker,
        "conviction_score": default_conviction_score,
        "conviction_label": default_conviction_label,
        "conviction_reason": f"Setup {strategy} dengan AI Score {score_100:.0f}/100 dan RRR {rrr}.",
        "answer": full_answer,
        "suggested_questions": [
            f"Apakah aman pasang antrean buy di area {buy_area} saat pembukaan 09:00 WIB?",
            f"Berapa alokasi lot yang ideal untuk saldo kas saya?",
            f"Apa level invalidasi jika IHSG mengalami koreksi besok?"
        ]
    }


def _rule_based_recovery_recommendation(
    ticker: str,
    jenis: str,
    lot: int,
    avg_price: float,
    close: float,
    rsi: float,
    support: float,
    resistance: float,
    cash_balance: float,
    div_yield: float,
    capital_required_avgdown: float,
) -> Dict[str, Any]:
    """Fallback rule-based recovery recommendation if AI is offline."""
    pnl_pct = ((close - avg_price) / avg_price) * 100
    is_oversold = rsi < 35.0
    near_support = abs(close - support) / close < 0.05
    is_cash_sufficient = cash_balance >= capital_required_avgdown
    has_high_dividend = div_yield >= 5.0

    # --- Cut Loss ---
    cl_confidence = 3
    if not is_oversold and close < support:
        cl_confidence += 3
    if jenis == "trading" and pnl_pct < -10:
        cl_confidence += 2
    if jenis == "investasi":
        cl_confidence = max(1, cl_confidence - 2)
    if has_high_dividend and jenis == "investasi":
        cl_confidence = max(1, cl_confidence - 2)
    cl_confidence = min(10, max(1, cl_confidence))
    cl_lot_pct = 100 if not is_oversold and close < support and jenis == "trading" else 50
    cl_recommended = jenis == "trading" and not is_oversold and close < support

    # --- Average Down ---
    ad_confidence = 3
    if is_oversold:
        ad_confidence += 3
    if near_support:
        ad_confidence += 2
    if is_cash_sufficient:
        ad_confidence += 1
    if jenis == "investasi" and has_high_dividend:
        ad_confidence += 1
    if jenis == "trading":
        ad_confidence = max(1, ad_confidence - 2)
    ad_confidence = min(10, max(1, ad_confidence))
    ad_lot_pct = 100 if is_cash_sufficient and is_oversold and jenis == "investasi" else 50
    ad_recommended = (is_oversold or near_support) and is_cash_sufficient

    # --- Hold ---
    hold_confidence = 5
    if has_high_dividend and jenis == "investasi":
        hold_confidence += 2
    if is_oversold and not is_cash_sufficient:
        hold_confidence += 1
    if jenis == "trading" and pnl_pct < -15:
        hold_confidence = max(1, hold_confidence - 2)
    hold_confidence = min(10, max(1, hold_confidence))
    hold_recommended = not cl_recommended or jenis == "investasi"

    cut_lot_text = f"{cl_lot_pct}% ({round(lot * cl_lot_pct / 100)} lot)"
    avg_lot_additional = max(1, round(capital_required_avgdown / (support * 100))) if support > 0 else 1
    avg_lot_text = f"Tambah {avg_lot_additional} lot di area support Rp {round(support):,}"
    hold_lot_text = f"Tahan seluruh {lot} lot sambil pantau pemantulan"

    ai_summary = (
        f"Berdasarkan analisis teknikal rule-based: RSI {rsi:.0f} ({'oversold' if is_oversold else 'normal'}), "
        f"harga {'mendekati' if near_support else 'di atas'} support Rp {round(support):,}. "
        f"Kas {'mencukupi' if is_cash_sufficient else 'belum mencukupi'} untuk average down. "
        f"Saham {jenis} dengan dividen yield {div_yield:.1f}%."
    )

    return {
        "source": "rule_based",
        "recommendations": {
            "cutLoss": {
                "recommended": cl_recommended,
                "confidence": cl_confidence,
                "lotSuggestion": cut_lot_text,
                "lotPct": cl_lot_pct,
                "reason": (
                    f"Harga Rp {round(close):,} telah menembus support Rp {round(support):,} dengan RSI {rsi:.0f} belum oversold. "
                    f"Untuk saham trading, disiplin membatasi kerugian menjadi prioritas utama."
                    if cl_recommended else
                    f"RSI {rsi:.0f} {'menunjukkan kondisi oversold — potensi rebound teknikal masih terbuka.' if is_oversold else 'masih normal.'} "
                    f"{'Dividen yield ' + str(round(div_yield, 1)) + '%/thn menjadi buffer passive income. ' if has_high_dividend else ''}"
                    f"Cut loss kurang disarankan saat ini."
                )
            },
            "averageDown": {
                "recommended": ad_recommended,
                "confidence": ad_confidence,
                "lotSuggestion": avg_lot_text,
                "lotPct": ad_lot_pct,
                "reason": (
                    f"RSI {rsi:.0f} dalam zona oversold dan harga mendekati support Rp {round(support):,}. "
                    f"{'Kas mencukupi untuk eksekusi averaging down.' if is_cash_sufficient else 'Namun saldo kas belum mencukupi untuk average down optimal.'}"
                    if ad_recommended else
                    f"{'Saldo kas tidak mencukupi (butuh Rp ' + f'{round(capital_required_avgdown):,}' + '). ' if not is_cash_sufficient else ''}"
                    f"{'Kondisi teknikal belum ideal untuk average down — harga belum menyentuh support major.' if not (is_oversold or near_support) else ''}"
                    f" Average down kurang disarankan saat ini."
                )
            },
            "hold": {
                "recommended": hold_recommended,
                "confidence": hold_confidence,
                "lotSuggestion": hold_lot_text,
                "lotPct": 100,
                "reason": (
                    f"{'Dividend yield ' + str(round(div_yield, 1)) + '%/thn memberikan passive income selama menunggu rebound. ' if has_high_dividend else ''}"
                    f"Tunggu pemantulan teknikal ke resistance Rp {round(resistance):,} untuk exit dengan kerugian minimal. "
                    f"Estimasi target rebound dalam 5–14 hari bursa."
                )
            }
        },
        "aiSummary": ai_summary
    }


def generate_recovery_recommendation(
    holding: "Holding",
    latest_indicators: dict,
    db: "Session",
    cash_balance: float = 0.0,
    fundamental_info: dict = None,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    Generate AI tri-scenario recovery recommendation (Cut Loss / Average Down / Hold)
    for a holding with floating loss. Saves result to AIAnalysis.recovery_recommendation.
    Falls back to rule-based engine if AI is offline.
    """
    import math
    ticker = holding.ticker
    jenis = getattr(holding, "jenis", "trading") or "trading"
    lot = holding.lot
    avg_price = float(holding.avg_price)
    close = float(latest_indicators.get("close", avg_price))
    rsi = float(latest_indicators.get("rsi", 50.0))
    support = float(latest_indicators.get("support", close * 0.95))
    resistance = float(latest_indicators.get("resistance", close * 1.05))
    ma20 = float(latest_indicators.get("ma20", close))
    today = date.today()

    f_info = fundamental_info or {}
    div_yield_raw = f_info.get("dividendYield")
    if div_yield_raw and div_yield_raw > 0:
        div_yield = div_yield_raw if div_yield_raw > 1.0 else (div_yield_raw * 100.0)
    else:
        div_yield = 0.0
    pe = f_info.get("trailingPE")
    pbv = f_info.get("priceToBook")

    # Compute capital required for average down (mid-support target)
    suggested_entry = round(support)
    target_avg = round((avg_price + suggested_entry) / 2)
    if target_avg > suggested_entry and target_avg < avg_price:
        raw_add_lot = (lot * (avg_price - target_avg)) / (target_avg - suggested_entry)
        add_lot = math.ceil(raw_add_lot)
        capital_required = add_lot * suggested_entry * 100
    else:
        add_lot = 1
        capital_required = suggested_entry * 100

    pnl_pct = ((close - avg_price) / avg_price) * 100

    # Check existing cache
    cached = db.query(AIAnalysis).filter(
        AIAnalysis.ticker == ticker,
        AIAnalysis.date == today
    ).first()

    if not force_refresh and cached and cached.recovery_recommendation:
        try:
            return json.loads(cached.recovery_recommendation)
        except Exception:
            pass

    has_valid_api = bool(get_ai_api_key())

    if not has_valid_api:
        result = _rule_based_recovery_recommendation(
            ticker=ticker, jenis=jenis, lot=lot, avg_price=avg_price,
            close=close, rsi=rsi, support=support, resistance=resistance,
            cash_balance=cash_balance, div_yield=div_yield,
            capital_required_avgdown=capital_required,
        )
        # Save to DB
        rec_json = json.dumps(result)
        if cached:
            cached.recovery_recommendation = rec_json
        else:
            new_analysis = AIAnalysis(
                ticker=ticker, date=today,
                recommendation="HOLD", analysis_text="Rule-based fallback (no AI key)",
                raw_data_snapshot=json.dumps({"source": "rule_based"}),
                recovery_recommendation=rec_json,
            )
            db.add(new_analysis)
        db.commit()
        return result

    active_provider = get_active_provider()

    system_prompt = (
        "Anda adalah AI Recovery Copilot profesional untuk pasar saham IDX (Bursa Efek Indonesia). "
        "Berikan rekomendasi 3-skenario penyelamatan modal berbasis data teknikal dan fundamental secara objektif."
    )

    tp_text = f"Rp {round(holding.target_price):,}" if holding.target_price else "Belum ditentukan"
    sl_text = "Tidak ada hard SL (Investasi)" if jenis == "investasi" else (f"Rp {round(holding.stop_loss):,}" if holding.stop_loss else "Belum ditentukan")

    prompt = f"""
Analisis 3 skenario recovery untuk saham berikut:

Data Posisi:
- Ticker: {ticker} ({jenis.upper()})
- Lot: {lot} lot, Avg Beli: Rp {round(avg_price):,} → Harga EOD: Rp {round(close):,} (Floating PnL: {pnl_pct:.1f}%)
- Target: {tp_text} | Stop Loss: {sl_text}
- Saldo Kas Tersedia: Rp {round(cash_balance):,}

Indikator Teknikal:
- MA20: Rp {round(ma20):,} | Support Major: Rp {round(support):,} | Resistance: Rp {round(resistance):,}
- RSI(14): {rsi:.1f}

Fundamental:
- Dividend Yield: {f'{div_yield:.1f}%/tahun' if div_yield > 0 else 'Tidak ada/rendah'}
- PE Ratio: {f'{pe:.1f}x' if pe else '-'}
- PBV: {f'{pbv:.2f}x' if pbv else '-'}

Berikan rekomendasi JSON berikut:
{{
  "recommendations": {{
    "cutLoss": {{
      "recommended": true/false,
      "confidence": 1-10,
      "lotSuggestion": "misalnya: Jual 50% ({round(lot*0.5)} lot) atau Jual 100% ({lot} lot)",
      "lotPct": 0-100,
      "reason": "2-3 kalimat reasoning objektif mengapa cut loss disarankan/tidak"
    }},
    "averageDown": {{
      "recommended": true/false,
      "confidence": 1-10,
      "lotSuggestion": "misalnya: Tambah {add_lot} lot di area Rp {round(support):,}",
      "lotPct": 0-100,
      "reason": "2-3 kalimat reasoning objektif mengapa average down disarankan/tidak"
    }},
    "hold": {{
      "recommended": true/false,
      "confidence": 1-10,
      "lotSuggestion": "misalnya: Tahan seluruh {lot} lot sambil pantau MA20",
      "lotPct": 100,
      "reason": "2-3 kalimat reasoning objektif mengapa hold disarankan/tidak"
    }}
  }},
  "aiSummary": "1 paragraf ringkasan keputusan strategis keseluruhan berdasarkan kondisi teknikal dan fundamental"
}}

ATURAN PENTING:
- Confidence 1-10: 1=sangat tidak yakin, 10=sangat yakin
- recommended: true jika skenario ini layak dieksekusi berdasarkan kondisi saat ini
- Bisa lebih dari 1 skenario yang recommended=true (jika kondisi mendukung mix strategi)
- Semua harga harus bilangan bulat tanpa desimal
- JANGAN rekomendasikan cut loss untuk saham investasi dengan dividend yield >5% kecuali ada alasan fundamental yang sangat kuat
"""

    try:
        response_text, used_provider = call_llm(
            prompt=prompt,
            system_prompt=system_prompt,
            preferred_provider=active_provider,
            json_mode=True,
        )
        data = _extract_json(response_text)
        recs = data.get("recommendations", {})

        def safe_scenario(raw: dict, default_confidence: int = 5) -> dict:
            return {
                "recommended": bool(raw.get("recommended", False)),
                "confidence": max(1, min(10, int(raw.get("confidence", default_confidence)))),
                "lotSuggestion": str(raw.get("lotSuggestion", "")),
                "lotPct": max(0, min(100, int(raw.get("lotPct", 50)))),
                "reason": str(raw.get("reason", "")),
            }

        ai_summary_raw = str(data.get("aiSummary", "")).strip()
        # Fallback: jika AI tidak mengembalikan aiSummary, buat ringkasan dari data teknikal
        if not ai_summary_raw:
            is_oversold_local = rsi < 35.0
            near_support_local = abs(close - support) / close < 0.05 if close > 0 else False
            ai_summary_raw = (
                f"Analisis dari {used_provider}: RSI {rsi:.0f} "
                f"({'oversold — potensi rebound' if is_oversold_local else 'normal'}), "
                f"harga Rp {round(close):,} {'mendekati' if near_support_local else 'belum di'} support Rp {round(support):,}. "
                f"Lihat detail keyakinan dan saran lot di masing-masing kartu skenario."
            )

        result = {
            "source": used_provider,
            "recommendations": {
                "cutLoss": safe_scenario(recs.get("cutLoss", {})),
                "averageDown": safe_scenario(recs.get("averageDown", {})),
                "hold": safe_scenario(recs.get("hold", {})),
            },
            "aiSummary": ai_summary_raw,
        }

    except Exception as e:
        print(f"[recovery_rec] AI error for {ticker}: {e}. Falling back to rule-based.")
        result = _rule_based_recovery_recommendation(
            ticker=ticker, jenis=jenis, lot=lot, avg_price=avg_price,
            close=close, rsi=rsi, support=support, resistance=resistance,
            cash_balance=cash_balance, div_yield=div_yield,
            capital_required_avgdown=capital_required,
        )

    # Save to DB
    rec_json = json.dumps(result)
    if cached:
        cached.recovery_recommendation = rec_json
    else:
        new_analysis = AIAnalysis(
            ticker=ticker, date=today,
            recommendation="RECOVERY_ANALYSIS",
            analysis_text=result.get("aiSummary", "")[:500],
            raw_data_snapshot=json.dumps({"source": result.get("source", "rule_based")}),
            recovery_recommendation=rec_json,
        )
        db.add(new_analysis)
    db.commit()
    return result


def purge_ai_chat_and_cache(db: Session, ticker: Optional[str] = None) -> Dict[str, Any]:
    """
    Menghapus histori percakapan AI (Copilot, Recovery, Screener) dan cache analisis AI
    saat sinkronisasi data pasar (EOD Sync) dilakukan, sehingga siklus analisis
    baru dimulai dengan data harga dan candle pasar terbaru.
    """
    from services.data_fetcher import normalize_ticker
    if ticker:
        norm = normalize_ticker(ticker)
        copilot_cnt = db.query(CopilotChatLog).filter(CopilotChatLog.ticker == norm).delete()
        recovery_cnt = db.query(RecoveryChatLog).filter(RecoveryChatLog.ticker == norm).delete()
        screener_cnt = db.query(ScreenerChatLog).filter(ScreenerChatLog.ticker == norm).delete()
        analysis_cnt = db.query(AIAnalysis).filter(AIAnalysis.ticker == norm).delete()
        deepdive_cnt = db.query(RecoveryDeepDive).filter(RecoveryDeepDive.ticker == norm).delete()
    else:
        copilot_cnt = db.query(CopilotChatLog).delete()
        recovery_cnt = db.query(RecoveryChatLog).delete()
        screener_cnt = db.query(ScreenerChatLog).delete()
        analysis_cnt = db.query(AIAnalysis).delete()
        deepdive_cnt = db.query(RecoveryDeepDive).delete()

    db.commit()
    return {
        "status": "success",
        "ticker": ticker or "ALL",
        "copilot_deleted": copilot_cnt,
        "recovery_deleted": recovery_cnt,
        "screener_deleted": screener_cnt,
        "analysis_deleted": analysis_cnt,
        "deepdive_deleted": deepdive_cnt
    }


