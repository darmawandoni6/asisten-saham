from datetime import date, datetime, time as dtime, timedelta
from typing import Optional, Dict, Tuple
import pytz
import urllib.request
import json
import threading

# Zona waktu resmi Bursa Efek Indonesia (WIB / UTC+7)
WIB = pytz.timezone("Asia/Jakarta") if "Asia/Jakarta" in pytz.all_timezones else None

# Daftar Baseline Hari Libur Nasional & Cuti Bersama Bursa Efek Indonesia (BEI / IDX)
# Sumber: SKB 3 Menteri & Jadwal Libur Resmi PT Bursa Efek Indonesia
BASELINE_IDX_HOLIDAYS: Dict[str, str] = {
    # === 2025 ===
    "2025-01-01": "Tahun Baru 2025 Masehi",
    "2025-01-27": "Isra Mi'raj Nabi Muhammad SAW",
    "2025-01-28": "Cuti Bersama Tahun Baru Imlek 2576 Kongzili",
    "2025-01-29": "Tahun Baru Imlek 2576 Kongzili",
    "2025-03-28": "Cuti Bersama Hari Suci Nyepi (Tahun Baru Saka 1947)",
    "2025-03-29": "Hari Suci Nyepi (Tahun Baru Saka 1947)",
    "2025-03-31": "Hari Raya Idul Fitri 1446 H",
    "2025-04-01": "Hari Raya Idul Fitri 1446 H",
    "2025-04-02": "Cuti Bersama Hari Raya Idul Fitri 1446 H",
    "2025-04-03": "Cuti Bersama Hari Raya Idul Fitri 1446 H",
    "2025-04-04": "Cuti Bersama Hari Raya Idul Fitri 1446 H",
    "2025-04-07": "Cuti Bersama Hari Raya Idul Fitri 1446 H",
    "2025-04-18": "Wafat Yesus Kristus (Jumat Agung)",
    "2025-04-20": "Kebangkitan Yesus Kristus (Paskah)",
    "2025-05-01": "Hari Buruh Internasional",
    "2025-05-12": "Hari Raya Waisak 2569 BE",
    "2025-05-13": "Cuti Bersama Hari Raya Waisak 2569 BE",
    "2025-05-29": "Kenaikan Yesus Kristus",
    "2025-05-30": "Cuti Bersama Kenaikan Yesus Kristus",
    "2025-06-01": "Hari Lahir Pancasila",
    "2025-06-06": "Hari Raya Idul Adha 1446 H",
    "2025-06-09": "Cuti Bersama Hari Raya Idul Adha 1446 H",
    "2025-06-27": "1 Muharram / Tahun Baru Islam 1447 H",
    "2025-08-17": "Hari Kemerdekaan Republik Indonesia Ke-80",
    "2025-09-05": "Maulid Nabi Muhammad SAW",
    "2025-12-25": "Hari Raya Natal",
    "2025-12-26": "Cuti Bersama Hari Raya Natal",
    "2025-12-31": "Libur Akhir Tahun Bursa Efek Indonesia",

    # === 2026 ===
    "2026-01-01": "Tahun Baru 2026 Masehi",
    "2026-01-16": "Isra Mi'raj Nabi Muhammad SAW",
    "2026-02-16": "Cuti Bersama Tahun Baru Imlek 2577 Kongzili",
    "2026-02-17": "Tahun Baru Imlek 2577 Kongzili",
    "2026-03-19": "Hari Suci Nyepi (Tahun Baru Saka 1948)",
    "2026-03-20": "Cuti Bersama Hari Suci Nyepi",
    "2026-03-20": "Hari Raya Idul Fitri 1447 H",
    "2026-03-21": "Hari Raya Idul Fitri 1447 H",
    "2026-03-23": "Cuti Bersama Hari Raya Idul Fitri 1447 H",
    "2026-03-24": "Cuti Bersama Hari Raya Idul Fitri 1447 H",
    "2026-03-25": "Cuti Bersama Hari Raya Idul Fitri 1447 H",
    "2026-04-03": "Wafat Yesus Kristus (Jumat Agung)",
    "2026-05-01": "Hari Buruh Internasional",
    "2026-05-14": "Kenaikan Yesus Kristus",
    "2026-05-15": "Cuti Bersama Kenaikan Yesus Kristus",
    "2026-05-31": "Hari Raya Waisak 2570 BE",
    "2026-06-01": "Hari Lahir Pancasila",
    "2026-05-27": "Hari Raya Idul Adha 1447 H",
    "2026-06-16": "Tahun Baru Islam 1448 H",
    "2026-08-17": "Hari Kemerdekaan Republik Indonesia Ke-81",
    "2026-08-25": "Maulid Nabi Muhammad SAW",
    "2026-12-25": "Hari Raya Natal",
    "2026-12-26": "Cuti Bersama Hari Raya Natal",
    "2026-12-31": "Libur Akhir Tahun Bursa Efek Indonesia",
}

# Dynamic in-memory registry combining baseline and live-synced holidays
DYNAMIC_HOLIDAYS: Dict[str, str] = dict(BASELINE_IDX_HOLIDAYS)

def sync_online_holidays():
    """
    Menyinkronkan hari libur & cuti bersama secara background dari API publik
    untuk mengantisipasi revisi SKB 3 Menteri atau penetapan libur dadakan.
    """
    global DYNAMIC_HOLIDAYS
    current_year = datetime.now().year
    years_to_fetch = [current_year - 1, current_year, current_year + 1]

    for yr in years_to_fetch:
        try:
            url = f"https://date.nager.at/api/v3/PublicHolidays/{yr}/ID"
            req = urllib.request.Request(url, headers={"User-Agent": "AsistenSaham/1.0"})
            with urllib.request.urlopen(req, timeout=4) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    for item in data:
                        d_str = item.get("date")
                        name = item.get("localName") or item.get("name")
                        if d_str and name and d_str not in DYNAMIC_HOLIDAYS:
                            DYNAMIC_HOLIDAYS[d_str] = name
        except Exception:
            pass

# Jalankan sync online secara asynchronous di background
threading.Thread(target=sync_online_holidays, daemon=True).start()

def get_now_wib() -> datetime:
    """Mengembalikan waktu saat ini dalam zona waktu WIB (UTC+7)."""
    if WIB:
        return datetime.now(WIB)
    return datetime.now()

def is_weekend(target_date: date) -> bool:
    """Memeriksa apakah tanggal adalah akhir pekan (Sabtu=5, Minggu=6)."""
    return target_date.weekday() >= 5

def get_holiday_name(target_date: date) -> Optional[str]:
    """Mengembalikan nama hari libur jika tanggal termasuk dalam kalender libur BEI."""
    date_str = target_date.strftime("%Y-%m-%d")
    return DYNAMIC_HOLIDAYS.get(date_str)

def is_market_active_today_empirical(target_date: date) -> Optional[bool]:
    """
    Pengecekan Nyata (Empirical Ground Truth):
    Menarik data indeks IHSG (^JKSE) dari Yahoo Finance untuk memastikan apakah ada
    aktivitas perdagangan riil pada tanggal target di Bursa Efek Indonesia.
    - True: Ada transaksi / candle resmi terbentuk di BEI.
    - False: Terbukti 0 transaksi (Bursa tutup / cuti bersama SKB menteri).
    - None: Inconclusive / Belum tutup pasar / Terjadi gangguan koneksi.
    """
    try:
        import yfinance as yf
        ticker = yf.Ticker("^JKSE")
        hist = ticker.history(period="5d", interval="1d")
        if hist.empty:
            return None

        # Periksa apakah ada candle untuk tanggal target
        matching_candles = [idx for idx in hist.index if idx.date() == target_date]
        if matching_candles:
            candle_row = hist.loc[matching_candles[0]]
            # Jika ada volume atau open/close valid
            if float(candle_row.get("Close", 0)) > 0:
                return True

        # Jika target_date adalah hari ini dan waktu sudah melewati penutupan pasar (> 16:15 WIB)
        # tetapi tidak ada candle terbentuk sama sekali, artinya pasar memang LIBUR di BEI.
        now_wib = get_now_wib()
        if target_date == now_wib.date() and now_wib.time() >= dtime(16, 15, 0):
            return False

        # Jika target_date di masa lalu dan tidak ada candle
        if target_date < now_wib.date():
            return False

        return None
    except Exception as e:
        print(f"[MarketCalendar] Empirical check fallback: {e}")
        return None

def is_active_trading_day(target_date: date, verify_empirical: bool = False) -> bool:
    """
    Menentukan apakah tanggal adalah Hari Bursa Aktif (Active Trading Day).
    1. Cek Akhir Pekan (Sabtu & Minggu) -> False
    2. Cek Kalender Libur & Cuti Bersama (Built-in + Online Synced) -> False
    3. Jika verify_empirical=True (dipanggil oleh Scheduler EOD 17:30 WIB):
       Cek data riil IHSG Yahoo Finance (^JKSE). Jika terbukti tidak ada transaksi -> False.
    """
    if is_weekend(target_date):
        return False

    if get_holiday_name(target_date) is not None:
        return False

    if verify_empirical:
        empirical_status = is_market_active_today_empirical(target_date)
        if empirical_status is False:
            print(f"[MarketCalendar] Empirical Check: Tidak ada aktivitas perdagangan di IHSG pada {target_date}. Ditandai sebagai Hari Libur Bursa.")
            return False

    return True

def get_next_active_trading_day(start_date: date) -> date:
    """Mencari tanggal hari bursa aktif berikutnya."""
    current = start_date + timedelta(days=1)
    while not is_active_trading_day(current):
        current += timedelta(days=1)
    return current

def get_market_status(target_dt: Optional[datetime] = None) -> dict:
    """
    Menganalisis status pasar BEI saat ini (Open/Closed, Sesi, Hari Libur, Jam Operasional).
    """
    now = target_dt or get_now_wib()
    today = now.date()
    current_time = now.time()
    weekday = today.weekday()

    holiday = get_holiday_name(today)
    is_weekend_day = is_weekend(today)

    if is_weekend_day:
        next_day = get_next_active_trading_day(today)
        return {
            "isOpen": False,
            "status": "CLOSED_WEEKEND",
            "badgeText": "Weekend (Pasar Tutup)",
            "description": f"Pasar tutup di akhir pekan. Buka kembali {next_day.strftime('%A, %d %b %Y')} pukul 09:00 WIB.",
            "isTradingDay": False,
            "holidayName": None,
            "nextTradingDate": str(next_day),
            "currentTime": now.strftime("%H:%M:%S WIB")
        }

    if holiday:
        next_day = get_next_active_trading_day(today)
        return {
            "isOpen": False,
            "status": "CLOSED_HOLIDAY",
            "badgeText": f"Libur: {holiday}",
            "description": f"Pasar tutup ({holiday}). Buka kembali {next_day.strftime('%A, %d %b %Y')} pukul 09:00 WIB.",
            "isTradingDay": False,
            "holidayName": holiday,
            "nextTradingDate": str(next_day),
            "currentTime": now.strftime("%H:%M:%S WIB")
        }

    # Jadwal Sesi Hari Kerja Normal
    # Jumat: Sesi 1 (09:00 - 11:30), Istirahat (11:30 - 14:00), Sesi 2 (14:00 - 15:50)
    # Senin - Kamis: Sesi 1 (09:00 - 12:00), Istirahat (12:00 - 13:30), Sesi 2 (13:30 - 15:50)
    # Pre-close & Post-close: 15:50 - 16:15
    is_friday = (weekday == 4)

    t_0900 = dtime(9, 0, 0)
    t_break_start = dtime(11, 30, 0) if is_friday else dtime(12, 0, 0)
    t_break_end = dtime(14, 0, 0) if is_friday else dtime(13, 30, 0)
    t_sesi2_end = dtime(15, 50, 0)
    t_post_close = dtime(16, 15, 0)

    if current_time < t_0900:
        return {
            "isOpen": False,
            "status": "PRE_MARKET",
            "badgeText": "Pra-Pembukaan",
            "description": "Pasar belum buka. Sesi 1 dimulai pukul 09:00 WIB.",
            "isTradingDay": True,
            "holidayName": None,
            "nextTradingDate": str(today),
            "currentTime": now.strftime("%H:%M:%S WIB")
        }
    elif t_0900 <= current_time < t_break_start:
        return {
            "isOpen": True,
            "status": "SESSION_1",
            "badgeText": "Market Open (Sesi 1)",
            "description": f"Sesi 1 berlangsung s/d {t_break_start.strftime('%H:%M')} WIB.",
            "isTradingDay": True,
            "holidayName": None,
            "nextTradingDate": str(today),
            "currentTime": now.strftime("%H:%M:%S WIB")
        }
    elif t_break_start <= current_time < t_break_end:
        return {
            "isOpen": False,
            "status": "MARKET_BREAK",
            "badgeText": "Istirahat Siang",
            "description": f"Jeda antar sesi. Sesi 2 dimulai pukul {t_break_end.strftime('%H:%M')} WIB.",
            "isTradingDay": True,
            "holidayName": None,
            "nextTradingDate": str(today),
            "currentTime": now.strftime("%H:%M:%S WIB")
        }
    elif t_break_end <= current_time < t_sesi2_end:
        return {
            "isOpen": True,
            "status": "SESSION_2",
            "badgeText": "Market Open (Sesi 2)",
            "description": "Sesi 2 berlangsung s/d 15:50 WIB.",
            "isTradingDay": True,
            "holidayName": None,
            "nextTradingDate": str(today),
            "currentTime": now.strftime("%H:%M:%S WIB")
        }
    elif t_sesi2_end <= current_time < t_post_close:
        return {
            "isOpen": False,
            "status": "POST_CLOSING",
            "badgeText": "Post-Closing",
            "description": "Pasca penutupan pasar (Matching order closing price).",
            "isTradingDay": True,
            "holidayName": None,
            "nextTradingDate": str(today),
            "currentTime": now.strftime("%H:%M:%S WIB")
        }
    else:
        next_day = get_next_active_trading_day(today)
        return {
            "isOpen": False,
            "status": "CLOSED_EOD",
            "badgeText": "Market Closed (EOD)",
            "description": f"Pasar hari ini telah ditutup. Buka kembali {next_day.strftime('%A, %d %b %Y')} pukul 09:00 WIB.",
            "isTradingDay": True,
            "holidayName": None,
            "nextTradingDate": str(next_day),
            "currentTime": now.strftime("%H:%M:%S WIB")
        }
