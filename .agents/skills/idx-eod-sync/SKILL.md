---
name: idx-eod-sync
description: >-
  Synchronizes End-of-Day (EOD) market data for IDX (Indonesia Stock Exchange) stocks from Yahoo Finance,
  updates technical indicators, recalculates portfolio PnL, evaluates decision matrix status, and generates
  an actionable post-market summary report. Activate this skill whenever the user asks to sync/update EOD data,
  refresh stock market data, pull latest closing prices, or evaluate their portfolio after market close.
---

# 📈 IDX EOD Market Sync & Portfolio Health Check

Use this skill when the user requests to update, sync, or evaluate daily End-of-Day (EOD) market data for their Indonesia Stock Exchange (IDX / BEI) portfolio.

## 🎯 Purpose
1. Pulls final closing prices and OHLCV candlestick data from Yahoo Finance for all holdings with `.JK` suffix.
2. Calculates technical indicators natively using Pandas (MA20, MA50, RSI harian, Support, Resistance).
3. Evaluates the core decision matrix status (`SELL_CUT_LOSS`, `TAKE_PROFIT`, `SL_PROXIMITY_WARNING`, `TP_PROXIMITY_WARNING`, `TRAILING_STOP_WARNING`, `RECOVERY_MODE`, `AVERAGING_REVIEW`, `HOLD_MONITOR`).
4. Updates the local SQLite database (`assiten_saham.db`).
5. Presents an executive summary and urgent action items directly to the user.

---

## 🛠️ Execution Workflow

### Step 1: Run the Sync Helper Script
Execute the Python sync script located in `scripts/sync_eod.py` using the project's backend virtual environment:

```bash
# Sync all holdings in portfolio
./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py

# Or sync a single specific ticker (e.g., SIDO.JK)
./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py --ticker SIDO.JK
```

*Note: Alternatively, if the FastAPI backend server is already running, you can also trigger the sync via HTTP endpoint:*
```bash
curl -s -X POST http://localhost:8000/api/v1/stocks/fetch-all
```

---

## 📊 Step 2: Present the Executive EOD Report to User

After the sync completes, format the output clearly with the following structure:

1. **Ringkasan Portofolio Pasca-Closing**:
   - Total Nilai Ekuitas (Rp) & Total Modal (Rp)
   - Total Floating PnL (Rp & %)
   - Kas Aktif Tersedia (Rp 168.755)
2. **Tabel Status Saham**:
   - Ticker | Tipe (Trading/Investasi) | Avg Beli | Closing Hari Ini | PnL (%) | RSI | Status Aksi
3. **Peringatan Siaga & Aksi Besok Pagi**:
   - Highlight saham yang berstatus **Darurat / Mendesak** (misalnya `SELL_CUT_LOSS`, `TAKE_PROFIT`, atau `SL_PROXIMITY_WARNING`).
   - Berikan instruksi konkret yang harus dipasang di aplikasi sekuritas sebelum market open pukul 09:00 WIB.

---

## ⚠️ Important Guidelines
- **Suffix BEI**: Seluruh ticker IDX wajib berakhiran `.JK` (contoh: `BBRI.JK`, `SIDO.JK`).
- **Trading vs Investasi**: 
  - Saham trading wajib patuh pada batas Stop Loss ketat.
  - Saham investasi tidak memiliki *hard stop loss*, evaluasi fokus pada dividen, major support, dan averaging down.
- **Stockbit Clean Tone**: Gunakan bahasa yang objektif, disiplin, dan bebas bias emosi/spekulasi.
