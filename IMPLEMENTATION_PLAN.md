# 📈 Asisten Saham — Implementation Plan

> **Status**: Production Ready (Tahap 0–17 Selesai ✅)
> **Target User**: Personal (1 user, localhost)
> **Bursa**: IDX/BEI (suffix `.JK` via Yahoo Finance)

---

## Deskripsi Proyek

Aplikasi **Asisten Saham** personal berbasis web yang membantu pengambilan keputusan trading dan investasi saham IDX/BEI secara lebih objektif dan terstruktur pasca penutupan bursa (End of Day / 17:30 WIB). Menggabungkan data historis EOD dari Yahoo Finance, analisis teknikal otomatis, dan AI Decision Copilot untuk menghasilkan rekomendasi aksi yang bebas dari bias emosi jam bursa.

---

## Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| **Frontend** | Next.js 16 + TypeScript (Static Export) | Static export ke `frontend/out/`, ringan & cepat |
| **UI Library** | shadcn/ui + Tailwind CSS | Komponen modern, clean Stockbit Light Mode |
| **Charts** | TradingView Lightweight Charts (v5) | Ringan, support candlestick + overlay MA/TP/SL |
| **Backend** | Python FastAPI + Uvicorn | Port `8000`, single-process melayani API + Static Web |
| **AI Gateway** | Custom OpenAI-Compatible (9Router / OpenAI / Ollama) | Standardized `/chat/completions`, failover to rule-based |
| **Technical Analysis** | Native Pandas | Bebas dependensi C-extension/numba, kompatibel Python 3.14 macOS |
| **Database** | SQLite (via SQLAlchemy) | File lokal `assiten_saham.db`, persisten |
| **Scheduler** | APScheduler | Cron job Python 17:30 WIB holiday-aware |
| **Notifikasi** | Telegram Bot (Under Development) | Integrasi notifikasi alert |
| **Data Source** | Yahoo Finance (`yfinance`) | Support format ticker `.JK` |

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│             Single Process Server (FastAPI :8000)           │
│                                                             │
│   Static Web Bundle (`frontend/out/`)                       │
│   ├── Smart Decision Dashboard (/)                          │
│   ├── Portfolio & Plan (/portfolio)                         │
│   ├── Recovery Engine (/recovery)                           │
│   ├── EOD Screener (/screener)                              │
│   └── Panduan & SOP Trading (/guide)                        │
│                                                             │
│   REST API Endpoints (/api/v1/*)                            │
│   ├── Portfolio Engine │ Technical Analysis                 │
│   ├── Recovery Engine  │ EOD Screener                       │
│   ├── AI Copilot (OpenAI-compatible / 9Router :20128)       │
│   └── System Heartbeat & Auto-Shutdown Engine               │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴───────────────┐
        ▼                                ▼
   SQLite DB                      Yahoo Finance
   (`assiten_saham.db`)           (yfinance API)
```

---

## Struktur Proyek

```
assiten-saham/
├── frontend/                        # Next.js 16 App Router
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Smart Decision Dashboard
│   │   ├── portfolio/page.tsx       # Manajemen Portofolio & Plan
│   │   ├── screener/page.tsx        # EOD Screener & Intelijen
│   │   ├── recovery/page.tsx        # Recovery Engine
│   │   └── guide/page.tsx           # Panduan Cara Pakai & SOP
│   ├── components/
│   │   ├── guide/                   # Subkomponen Guide Page
│   │   ├── portfolio/               # Subkomponen Portfolio Page
│   │   ├── recovery/                # Subkomponen Recovery Page
│   │   ├── screener/                # Subkomponen Screener Page
│   │   └── ui/                      # Komponen Resmi shadcn/ui
│   ├── hooks/                       # Custom React Hooks
│   └── lib/
│       └── api.ts                   # API client (fetch wrapper)
│
├── backend/                         # FastAPI App
│   ├── main.py                      # Single process server entry point
│   ├── database.py                  # SQLAlchemy engine & session
│   ├── models.py                    # DB Models
│   ├── routers/
│   │   ├── portfolio.py             # CRUD portofolio & balance
│   │   ├── stocks.py                # Data & chart harga EOD
│   │   ├── analysis.py              # AI Copilot endpoints & chat
│   │   ├── screener.py              # EOD Screener endpoints
│   │   ├── recovery.py              # Recovery Engine endpoints
│   │   └── system.py                # Heartbeat & auto-shutdown
│   ├── services/
│   │   ├── data_fetcher.py          # yfinance integration & auto-profile
│   │   ├── technical.py             # Native pandas indicators
│   │   ├── ai_copilot.py            # AI Gateway & rule-based engine
│   │   ├── portfolio_engine.py      # Status kartu keputusan & tracking
│   │   ├── recovery_engine.py       # Diagnosis & kalkulator avg down
│   │   ├── screener_engine.py       # Filter Oversold, Breakout, Value
│   │   └── market_calendar.py       # Kalender libur BEI & status sesi
│   ├── scheduler.py                 # APScheduler cron jobs 17:30 WIB
│   ├── .env.example                 # Template environment variables
│   └── requirements.txt
│
├── .agents/skills/idx-eod-sync/     # Workspace Skill Antigravity
├── AGENTS.md                        # Panduan AI Coding Agent
├── TODO.md                          # Tracking Checklist Fitur
└── README.md                        # Panduan Operasional Proyek
```

---

## Database Schema (SQLite)

```sql
-- Tabel: holdings (portofolio saham yang dimiliki)
CREATE TABLE holdings (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker            TEXT NOT NULL,        -- e.g. "BBRI.JK"
    jenis             TEXT NOT NULL,        -- trading / investasi
    avg_price         REAL NOT NULL,        -- Harga rata-rata beli
    lot               INTEGER NOT NULL,     -- Jumlah lot yang dimiliki
    target_price      REAL,                 -- Target profit
    stop_loss         REAL,                 -- Batas cut loss (null untuk investasi)
    high_watermark    REAL,                 -- Rekor harga tertinggi sejak beli
    trailing_stop_pct REAL DEFAULT 7.0,     -- Jarak trailing stop (%)
    buy_reason        TEXT,                 -- Alasan beli (catatan)
    sector            TEXT,                 -- Sektor saham
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Tabel: ai_analysis (cache hasil analisis AI per hari)
CREATE TABLE ai_analysis (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker          TEXT NOT NULL,
    date            DATE NOT NULL,
    recommendation  TEXT,             -- HOLD / SELL ALL / TRIM 50% / CUT LOSS / AVERAGE DOWN / BUY MORE
    analysis_text   TEXT,             -- Narasi AI
    raw_data_snapshot TEXT,           -- JSON snapshot indikator saat analisis
    source          TEXT,             -- 9router / custom_llm / rule_based
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
