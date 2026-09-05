from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from models import Holding
from services.data_fetcher import fetch_and_store_stock_data
from services.portfolio_engine import evaluate_holding_status
from services.telegram_bot import send_telegram_notification
from datetime import datetime

scheduler = BackgroundScheduler()

def run_eod_market_pipeline():
    print(f"[{datetime.now()}] Menjalankan pipeline EOD otomatis...")
    db = SessionLocal()
    try:
        holdings = db.query(Holding).all()
        urgent_actions = []

        for h in holdings:
            df = fetch_and_store_stock_data(h.ticker, db, period="3mo")
            if not df.empty:
                last_row = df.iloc[-1]
                candle = {
                    "close": float(last_row["close"]),
                    "open": float(last_row["open"]),
                    "ma20": float(last_row["ma20"]),
                    "ma50": float(last_row["ma50"]),
                    "rsi": float(last_row["rsi"])
                }
                card = evaluate_holding_status(h, candle, db)
                if card["actionStatus"] in ["SELL_CUT_LOSS", "TRAILING_STOP_WARNING", "TAKE_PROFIT"]:
                    urgent_actions.append(f"• *{card['ticker']}*: {card['actionStatus']} ({card['actionReason']})")

        if urgent_actions:
            msg = "🔔 *Asisten Saham — EOD Alert 17:30 WIB*\n\n" + "\n".join(urgent_actions)
            send_telegram_notification(msg)
            print("[Scheduler] Telegram notification terkirim.")

        # Purge temporary 1-day recovery discussion chat history on market close
        from models import RecoveryChatLog
        deleted_chats = db.query(RecoveryChatLog).delete()
        db.commit()
        print(f"[Scheduler] EOD Market Close: {deleted_chats} riwayat chat diskusi recovery berhasil dibersihkan.")
    except Exception as e:
        print(f"[Scheduler] Error pipeline: {e}")
    finally:
        db.close()

def start_scheduler():
    # Schedule Monday - Friday at 17:30
    scheduler.add_job(
        run_eod_market_pipeline,
        trigger="cron",
        day_of_week="mon-fri",
        hour=17,
        minute=30,
        id="eod_fetcher"
    )
    scheduler.start()
    print("[Scheduler] APScheduler aktif berjalan (Senin-Jumat 17:30 WIB).")
