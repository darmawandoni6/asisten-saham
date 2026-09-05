# 📈 Asisten Saham — Implementation Plan

> **Dibuat**: 5 September 2026
> **Status**: Planning Phase
> **Target User**: Personal (1 user, localhost)
> **Bursa**: IDX/BEI (suffix `.JK` via Yahoo Finance)

---

## Deskripsi Proyek

Aplikasi **Asisten Saham** personal berbasis web yang membantu pengambilan keputusan trading saham IDX/BEI secara lebih objektif dan terstruktur. Menggabungkan data historis EOD (End of Day) dari Yahoo Finance, analisis teknikal otomatis, dan AI Decision Copilot untuk menghasilkan rekomendasi aksi (HOLD/SELL/BUY) yang bebas dari bias emosi.

---

## Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Frontend** | Next.js 14 + TypeScript | SSR, App Router, ecosystem lengkap |
| **UI Library** | shadcn/ui + Tailwind CSS | Komponen modern, customizable |
| **Charts** | TradingView Lightweight Charts | Ringan, support candlestick + overlay |
| **Backend** | Python FastAPI | Native pandas/yfinance/pandas-ta, cocok untuk AI |
| **AI** | Google Gemini 2.0 Flash | Free tier, performa bagus, mudah diintegrasikan |
| **Technical Analysis** | pandas-ta | Library TA lengkap (MA, RSI, Bollinger, dll) |
| **Database** | SQLite (via SQLAlchemy) | Simple, lokal, tidak perlu server terpisah |
| **Scheduler** | APScheduler | Cron job Python native, ringan |
| **Notifikasi** | python-telegram-bot | Official Telegram Bot library |
| **Data Source** | yfinance | Gratis, support `.JK` suffix untuk IDX |

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend — Next.js 14 + TypeScript          │
│   Dashboard UI │ TradingView Charts │ Portfolio Forms        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST API
┌────────────────────────▼────────────────────────────────────┐
│                  Backend — FastAPI (Python)                   │
│  Portfolio Engine │ AI Copilot │ Technical Analysis          │
│  Recovery Engine  │ Screener   │ Telegram Bot                │
│                APScheduler (Cron 17:30 WIB)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴───────────────┐
        ▼                                ▼
   SQLite DB                      Yahoo Finance
   (lokal)                        (yfinance API)
```

---

## Struktur Proyek

```
assiten-saham/
├── frontend/                        # Next.js App
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Dashboard utama
│   │   ├── portfolio/page.tsx       # Manajemen portofolio
│   │   ├── screener/page.tsx        # EOD Screener
│   │   ├── recovery/page.tsx        # Recovery Engine
│   │   └── journal/page.tsx         # Trading Journal
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── ActionCard.tsx           # Smart Action Card (Hold/Sell/Buy)
│   │   ├── CandlestickChart.tsx     # TradingView chart
│   │   ├── AICopilotPanel.tsx       # AI analysis panel
│   │   ├── PortfolioTable.tsx       # Tabel portofolio
│   │   ├── RecoveryCard.tsx         # Floating loss card
│   │   └── ScreenerTable.tsx        # Hasil screener
│   └── lib/
│       └── api.ts                   # API client (fetch wrapper)
│
├── backend/                         # FastAPI App
│   ├── main.py                      # Entry point
│   ├── database.py                  # SQLAlchemy setup
│   ├── models.py                    # DB Models
│   ├── routers/
│   │   ├── portfolio.py             # CRUD portofolio
│   │   ├── stocks.py                # Data & chart harga
│   │   ├── analysis.py              # AI Copilot endpoint
│   │   ├── screener.py              # EOD Screener
│   │   └── recovery.py             # Recovery Engine
│   ├── services/
│   │   ├── data_fetcher.py          # yfinance integration
│   │   ├── technical.py             # pandas-ta indicators
│   │   ├── ai_copilot.py            # Gemini AI integration
│   │   ├── portfolio_engine.py      # Hold/Sell/Buy logic
│   │   ├── recovery_engine.py       # Floating loss analysis
│   │   ├── screener_engine.py       # Filter algorithms
│   │   └── telegram_bot.py         # Telegram notifications
│   ├── scheduler.py                 # APScheduler cron jobs
│   ├── .env.example                 # Template environment variables
│   └── requirements.txt
│
├── IMPLEMENTATION_PLAN.md           # File ini
├── TODO.md                          # Task checklist
├── draft.txt                        # Referensi fitur awal
└── README.md                        # Cara menjalankan aplikasi
```

---

## Database Schema (SQLite)

```sql
-- Tabel: holdings (portofolio saham yang dimiliki)
CREATE TABLE holdings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker      TEXT NOT NULL,        -- e.g. "BBRI.JK"
    avg_price   REAL NOT NULL,        -- Harga rata-rata beli
    lot         INTEGER NOT NULL,     -- Jumlah lot yang dimiliki
    target_price REAL,                -- Target profit
    stop_loss   REAL,                 -- Batas cut loss
    buy_reason  TEXT,                 -- Alasan beli (catatan)
    sector      TEXT,                 -- Sektor saham
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel: price_history (data OHLCV harian)
CREATE TABLE price_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker      TEXT NOT NULL,
    date        DATE NOT NULL,
    open        REAL, high REAL, low REAL, close REAL,
    volume      INTEGER,
    ma20        REAL, ma50 REAL, ma200 REAL,
    rsi         REAL,
    support     REAL, resistance REAL,
    UNIQUE(ticker, date)
);

-- Tabel: trade_log (log transaksi beli/jual)
CREATE TABLE trade_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker      TEXT NOT NULL,
    action      TEXT NOT NULL,        -- BUY / SELL / TRIM / CUT_LOSS / AVG_DOWN
    price       REAL NOT NULL,
    lot         INTEGER NOT NULL,
    realized_pnl REAL,               -- Null jika masih open
    note        TEXT,
    timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel: ai_analysis (cache hasil analisis AI per hari)
CREATE TABLE ai_analysis (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker          TEXT NOT NULL,
    date            DATE NOT NULL,
    recommendation  TEXT,             -- HOLD / SELL / BUY / CUT_LOSS / TRIM / AVG_DOWN
    analysis_text   TEXT,             -- Narasi AI
    raw_data_snapshot TEXT,           -- JSON snapshot indikator saat analisis
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, date)
);

-- Tabel: screener_results (hasil EOD screener harian)
CREATE TABLE screener_results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        DATE NOT NULL,
    ticker      TEXT NOT NULL,
    strategy    TEXT NOT NULL,        -- oversold / breakout / value / custom
    score       REAL,
    details     TEXT,                 -- JSON detail indikator
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Rencana Delivery — 3 Phase

### 🚀 Phase 1 — Fondasi & Core (MVP)
*Setelah selesai: bisa monitoring portofolio harian*

1. Setup struktur folder (frontend + backend)
2. Setup Next.js 14 + shadcn/ui + Tailwind CSS
3. Setup FastAPI + SQLAlchemy + SQLite
4. **Fitur 4**: Portfolio CRUD — input ticker, avg price, lot, TP, SL
5. **Fitur 7**: Data Fetcher — pull EOD via yfinance, hitung MA20/50/200 & RSI
6. **Fitur 1**: Smart Decision Dashboard — Action Cards berwarna per saham
7. **Fitur 7**: Candlestick Chart — TradingView + overlay MA + garis avg price
8. **Fitur 1**: Daily Action Sheet — ringkasan saham yang butuh perhatian

### 🧠 Phase 2 — AI & Recovery Engine
*Setelah selesai: punya rekomendasi AI dan tools recovery*

9.  **Fitur 2**: AI Decision Copilot — analisis EOD via Gemini API
10. **Fitur 2**: Output terstruktur (tabel indikator + narasi + aksi konkrit)
11. **Fitur 3**: Recovery Engine — diagnosis floating loss
12. **Fitur 3**: 3 skenario penyelamatan (Cut Loss / Avg Down / Hold for BEP)
13. **Fitur 3**: Kalkulator Average Down presisi
14. **Fitur 5**: Dynamic Trailing Stop — otomatis naik saat harga naik
15. **Fitur 5**: Scale-Out / Partial TP Matrix

### 📊 Phase 3 — Screener, Notifikasi & Journal
*Setelah selesai: proaktif cari peluang + alert harian otomatis*

16. **Fitur 6**: EOD Screener — preset Oversold (RSI < 30 + Rebound)
17. **Fitur 6**: EOD Screener — preset Breakout / Golden Cross
18. **Fitur 6**: EOD Screener — preset Undervalued / Value Stocks
19. **Fitur 6**: Custom Filter kombinasi teknikal & fundamental
20. **Fitur 8**: Telegram Bot — ringkasan harian otomatis post-closing
21. **Fitur 4**: Pyramiding & Average Up Calculator
22. **Fitur 4**: Money Management & Risk-to-Reward Calculator
23. **Fitur 8**: Trading Journal — log transaksi + Realized PnL
24. **Fitur 8**: Post-Mortem AI — deteksi pola psikologi (Panic Sell / FOMO)

---

## Business Logic Penting

### Action Card Status Logic
```
SELL / CUT LOSS 🔴   → close price ≤ stop_loss
TAKE PROFIT     🟢   → close price ≥ target_price
TRAILING STOP   🟠   → profit > 10% DAN harga turun > 7% dari puncak
RECOVERY MODE   🟣   → floating loss > 10%
HOLD / MONITOR  🟡   → kondisi normal, tren aman
```

### Default Parameter (bisa dikonfigurasi)
- **Trailing Stop**: 7% dari harga tertinggi sejak beli
- **Scale-Out TP1**: Jual 30% di target price 1
- **Scale-Out TP2**: Jual 30% di target price 2
- **Recovery threshold**: floating loss > 10%

### AI Output Format (per saham)
```
📊 ANALISIS EOD — {TICKER} | {TANGGAL}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Harga Close  : Rp {close}
Avg Price    : Rp {avg_price} ({pnl_pct}%)
Target Price : Rp {target}
Stop Loss    : Rp {stop_loss}

INDIKATOR TEKNIKAL:
  MA20    : {ma20} | {status}
  MA50    : {ma50} | {status}
  RSI(14) : {rsi}  | {status}
  Support : {support} | Resistance: {resistance}

{emoji} REKOMENDASI: {action}
"{narasi 1-2 kalimat objektif}"
```

---

## Environment Variables yang Dibutuhkan

```env
# backend/.env
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
DATABASE_URL=sqlite:///./assiten_saham.db
```

---

## Cara Menjalankan (setelah setup)

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # isi API keys
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev   # buka http://localhost:3000

# API Docs (auto-generated FastAPI)
# buka http://localhost:8000/docs
```
