# 🤖 AGENTS.md — Asisten Saham IDX

Dokumentasi dan instruksi operasional untuk AI Coding Agent yang bekerja pada codebase **Asisten Saham**.

---

## 📌 1. Prinsip Utama & Aturan Baku Pengguna (User Rules)

1. **JANGAN MEMBUAT ASUMSI BARU — SELALU KONFIRMASI KE USER**:
   - Sebelum membuat keputusan arsitektur baru, mengubah strategi, mengimpor data, atau menambahkan asumsi baru, **selalu tanyakan dan konfirmasikan terlebih dahulu ke pengguna**.
2. **DESAIN UI**:
   - Wajib bergaya **Stockbit Clean Light Mode** (latar putih/abu-abu sangat terang `bg-slate-50`, kartu putih bersih `bg-white`, border tipis `border-slate-200`, teks kontras rapi `text-slate-900`/`text-slate-600`).
   - **TIDAK BOLEH** menggunakan tema gelap pekat (dark mode) ataupun warna neon mencolok.
3. **INTEGRITAS DATA (NO MOCK DATA)**:
   - Tidak boleh ada data tiruan (mock data) statis yang disamarkan sebagai data asli. Seluruh data berasal dari input portofolio nyata dan data live Yahoo Finance (`yfinance`).
4. **KOMPATIBILITAS PYTHON 3.14 (macOS)**:
   - Dilarang menggunakan library yang bergantung pada `numba` atau C-extensions lawas (seperti `pandas-ta`).
   - Gunakan **Native Pandas** untuk seluruh kalkulasi teknikal (MA, RSI, Support, Resistance).
5. **SUFFIX EMITEN BURSA EFEK INDONESIA**:
   - Semua ticker IDX di Yahoo Finance wajib memiliki suffix `.JK` (contoh: `BBRI.JK`, `SIDO.JK`, `DEWA.JK`). Gunakan helper `normalize_ticker(ticker)`.
6. **TRANSPARANSI AI**:
   - Jika API Key Google Gemini belum dikonfigurasi atau limit kuota habis, **berikan alert transparan** bahwa AI belum tersedia/limit habis. **DILARANG** memalsukan analisis rule-based sebagai hasil generate AI.
7. **DILARANG AUTO-COMMIT / AUTO-PUSH (NO AUTO-COMMIT)**:
   - AI **DILARANG KERAS** menjalankan perintah `git commit` maupun `git push` secara otomatis setelah membuat fitur/perubahan.
   - Seluruh perubahan kode dan pengujian hanya boleh dilakukan di file lokal.
   - `git commit` / `git push` **HANYA** boleh dijalankan jika pengguna memberikan perintah/izin eksplisit secara langsung.

---

## 🏗️ 2. Arsitektur & Tech Stack

| Layer | Teknologi | Catatan Khusus |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS | Port `3000` (`http://localhost:3000`) |
| **Interactive Chart** | TradingView Lightweight Charts v5 | Gunakan syntax `chart.addSeries(CandlestickSeries, ...)` |
| **Backend API** | Python FastAPI, Uvicorn | Port `8000` (`http://localhost:8000`, Docs: `/docs`) |
| **Database** | SQLite lokal (`assiten_saham.db`), SQLAlchemy ORM | Tabel: `holdings`, `price_history`, `trade_log`, `ai_analysis`, `screener_results`, `recovery_chat_logs` |
| **Data Pasar** | Yahoo Finance (`yfinance`) | EOD update pasca-closing market BEI (17:30 WIB) |
| **AI LLM Engine** | Multi-Provider: **Google Gemini** (`gemini-3.5-flash-lite`) & **OpenCode Zen** (`nemotron-3.5-lightning-free`) | Toggle via UI `[ ✨ Gemini ] [ ⚡ Zen ]`, API `/api/v1/analysis/providers` |

---

## 🗄️ 3. Konvensi Data & Skema

### Backend ↔ Frontend Field Mapping
- Backend (Python/SQLite): Menggunakan `snake_case` (contoh: `avg_price`, `target_price`, `stop_loss`, `buy_reason`, `high_watermark`, `trailing_stop_pct`).
- Frontend (TypeScript): Menggunakan `camelCase` (contoh: `avgPrice`, `targetPrice`, `stopLoss`, `buyReason`, `highWatermark`, `trailingStopPrice`).
- Serialisasi dilakukan di `portfolio_engine.py` dan serializer router.

### Model `Holding` (`backend/models.py`)
- `ticker` (String, e.g. `BBRI.JK`)
- `jenis` (String: `'trading'` | `'investasi'`)
- `sector` (String, e.g. `'Energy'`, `'Consumer Defensive'`, auto-fetched dari Yahoo Finance)
- `avg_price` (Float)
- `lot` (Integer)
- `target_price` (Float, nullable)
- `stop_loss` (Float, nullable — `None` untuk saham investasi)
- `high_watermark` (Float, rekor harga tertinggi sejak beli)
- `trailing_stop_pct` (Float, default 7.0%)

---

## 📈 4. Logika Bisnis Utama (Core Business Logic)

### A. Diferensiasi Saham: Trading vs Investasi
- **Trading (`jenis = 'trading'`)**:
  - Wajib disiplin Stop Loss ketat.
  - Jika harga closing $\le$ Stop Loss $\rightarrow$ Status `SELL_CUT_LOSS` (Merah).
  - Trailing stop aktif (7% di bawah High Watermark).
  - Jika floating loss $\le -10\%$ $\rightarrow$ `RECOVERY_MODE` (Ungu).
- **Investasi (`jenis = 'investasi'`)**:
  - **TIDAK ADA hard Stop Loss** (`stopLoss = null`).
  - Target profit jangka panjang (+30% s/d all-time high).
  - Jika floating loss $\le -30\%$ $\rightarrow$ Status `AVERAGING_REVIEW` (Indigo).
  - Evaluasi fokus pada dividen, laporan keuangan, dan averaging down di Major Support.

### B. Rumus Kalkulator Average Down Presisi (`backend/services/recovery_engine.py`)
Untuk menurunkan rata-rata modal dari $Avg_{lama}$ ke $Avg_{target}$ dengan beli di harga $Harga_{beli}$:
$$\text{Lot Tambahan} = \left\lceil \frac{\text{Lot Lama} \times (\text{Avg Lama} - \text{Target Avg})}{\text{Target Avg} - \text{Harga Beli Bawah}} \right\rceil$$
$$\text{Modal Tambahan} = \text{Lot Tambahan} \times \text{Harga Beli Bawah} \times 100$$

### C. Auto-Fetch Sektor (`backend/services/data_fetcher.py`)
- Fungsi `fetch_stock_profile(ticker)` menarik data sektor & industri resmi via `yfinance.Ticker(ticker).info`.
- Dipanggil otomatis saat input saham jika field sektor tidak diisi manual.

### D. Dynamic Adaptive TP & SL + Proximity Alerts (Opsi B)
- **Aturan Update Harian EOD**:
  - `Target Price`: Adaptif mengikuti resistance harian candle terbaru.
  - `Stop Loss`: Hanya boleh naik (*trailing up*), **DILARANG turun di bawah SL awal** demi menjaga disiplin risiko.
- **Status Peringatan Jarak Dekat (Proximity Warnings)**:
  - `SL_PROXIMITY_WARNING` (Orange): Jarak harga ke SL $\le 2\% \rightarrow$ Instruksi: *"SIAGA 1 — Pasang Stop Order di sekuritas"*.
  - `TP_PROXIMITY_WARNING` (Teal): Jarak harga ke TP $\le 2\% \rightarrow$ Instruksi: *"PERSIAPAN TP — Pasang antrean Sell 50% Lot"*.

### E. Status Fitur Eksternal
- **Telegram Bot Notification**: Status saat ini adalah **Under Development** (diarahkan ke log sistem internal, belum dikaitkan ke API live).

### F. Multi-Provider AI Copilot & Bedah Logika Skenario (`backend/services/ai_copilot.py`)
- **Dukungan Multi-Provider**:
  - **Google Gemini**: Menggunakan `gemini-3.5-flash-lite` via `google-generativeai`.
  - **OpenCode Zen**: Menggunakan OpenAI-compatible client via endpoint `https://opencode.ai/zen/v1` (`nemotron-3.5-lightning-free`, `deepseek`, `claude`).
  - **Provider Switcher UI**: Pengguna dapat beralih provider secara instan via pill `[ ✨ Gemini ] [ ⚡ Zen ]` di modal recovery dan dashboard.
  - **API Endpoints**: `GET /api/v1/analysis/providers` (status konfigurasi), `POST /api/v1/analysis/provider` (ganti provider aktif).
  - **Hot-Reload Environment**: Menggunakan `load_dotenv(override=True)` sehingga perubahan key di `.env` langsung aktif tanpa perlu me-restart server.
- **Failover Transparan (Graceful Fallback)**:
  - Jika kuota/rate limit habis (HTTP 429) atau API belum dikonfigurasi, sistem otomatis beralih ke **Deterministic Rule-Based Expert Engine** (`source: "rule_based"`).
- **4 Pilar Analisis Mendalam**:
  1. `coreLogic`: Logika objektif pemilihan skenario berdasarkan profil emiten & kecukupan kas.
  2. `invalidationRisk`: Batas risiko dan level harga invalidasi (Plan B) bila tren breakdown.
  3. `cashflowAndTimeline`: Estimasi arus kas dividen riil per tahun & estimasi rentang waktu rebound.
  4. `tomorrowActionPlan`: Checklist 3 langkah aksi konkret sebelum market buka pukul 09:00 WIB.
- **1-Day Ephemeral Chat History**:
  - Model: `RecoveryChatLog` (`recovery_chat_logs`).
  - Menyimpan riwayat percakapan interaktif khusus untuk sesi hari perdagangan berjalan.
  - Otomatis dibersihkan (*purged*) saat penutupan bursa (17:30 WIB) via `APScheduler` di `backend/scheduler.py` atau saat pergantian tanggal bursa.
  - Dilengkapi endpoint `GET /api/v1/recovery/{ticker}/chat-history` dan `DELETE /api/v1/recovery/{ticker}/chat-history` (tombol *Bersihkan Riwayat* di UI).

### G. Workspace Skill: `idx-eod-sync` (`.agents/skills/idx-eod-sync/`)
- Modul skill otomatis Antigravity untuk menjalankan penarikan data closing bursa, menghitung indikator teknikal, mendiagnosis portofolio, dan mencetak laporan eksekutif pasca-closing.
- Database SQLite di `backend/database.py` dipatok absolut ke `backend/assiten_saham.db` agar script skill dapat dipanggil dari folder mana saja tanpa error `no such table`.

### H. Kamus Lengkap Badge & Glosarium Terintegrasi
- **Pusat Kamus (`/guide` Tab 3)**: Memetakan 4 kategori (Badge Screener `OVERSOLD`/`BREAKOUT`/`VALUE` + AI Score scale, Badge Kelayakan Recovery, 5 Warna Status Aksi Dashboard, dan Glosarium Istilah Pasar Modal).
- **Quick Modal Bantuan (`/screener`)**: Komponen modal pop-up `[ℹ️ Kamus Badge]` di samping tombol scan untuk referensi instan tanpa meninggalkan halaman.

### I. EOD Screener Top 10 & Analisis Saham Kustom On-Demand
- **Top 10 Curated Picks**: Fungsi `scan_market_pool(db, top_n=10)` memindai universe LQ45 & saham likuid BEI pasca penutupan pasar, lalu membatasi hasil ke 10 saham dengan AI Score tertinggi untuk menjaga fokus trader.
- **On-Demand Custom Analyzer**: Endpoint `POST /api/v1/screener/analyze` memungkinkan pengguna memasukkan kode ticker BEI di luar daftar rekomendasi (contoh: `BREN`, `AMMN`, `PGAS`, `MEDC`). Sistem otomatis mengambil data 3 bulan dari Yahoo Finance, menghitung indikator teknikal (MA, RSI, Support, Resistance), menentukan strategi & AI Score, serta menyimpannya ke database `ScreenerResult`.

### J. 3-Pilar Intelijen Rekomendasi, Client-Side Sorting & Edukasi RRR
- **Pusat Intelijen 3 Pilar (Bukan Tombol Beli Statis)**:
  1. `Alasan Rekomendasi (Why Buy)`: Landasan teknikal objektif mengapa saham terpilih dari data historis (status MA, oversold RSI, breakout).
  2. `Wajib Dipantau Besok (Watch Trigger 09:00 WIB)`: Syarat konfirmasi saat pembukaan market sebelum melakukan entry.
  3. `Panduan Level & Risk/Reward Ratio (RRR)`: Area beli ideal, target resistance (TP), batas support/invalidasi (SL), dan rasio *Risk:Reward* (RRR) otomatis.
- **Client-Side (FE-Only) Sorting**: Pengurutan tabel sepenuhnya diproses in-memory di React state (`sortedItems`) pada seluruh kolom (Ticker, Strategi, Harga, Perubahan %, RSI, TP, SL, RRR, AI Score) tanpa re-query backend.
- **Edukasi Interaktif RRR & AI Score**:
  - Rumus RRR: $1 : (\text{TP} - \text{Entry}) / (\text{Entry} - \text{SL})$. Standar transaksi ideal $\ge 1 : 2.0$.
  - AI Score (0–100): Filter probabilitas statistik data historis (bukan ramalan masa depan).
  - Terintegrasi di Quick Modal Kamus, Tooltips tabel/kartu, dan Glosarium `/guide` (Tab 3).

---


## 🛠️ 5. Perintah Pengujian & Operasional

```bash
# 1. Jalankan Backend
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 2. Jalankan Frontend
cd frontend
npm run dev

# 3. Build Verification (Harus 0 TypeScript error)
cd frontend
npm run build

# 4. Sinkronisasi Data EOD via Workspace Skill
./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py
./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py --ticker SIDO.JK

# 5. Tes Endpoint Sinkronisasi EOD via API
curl -s -X POST http://localhost:8000/api/v1/stocks/fetch-all

# 6. Tes Endpoint Bedah Logika Skenario AI
curl -s -X POST http://localhost:8000/api/v1/recovery/SIDO.JK/discuss \
  -H "Content-Type: application/json" \
  -d '{"scenario_id": "holdForBep"}'

# 7. Tes Endpoint Analisis AI & Dashboard
curl -s -X POST http://localhost:8000/api/v1/analysis/SIDO.JK
curl -s http://localhost:8000/api/v1/dashboard
```

---

## 📁 6. Struktur Direktori Utama

```
assiten-saham/
├── .agents/                   # Antigravity Customizations
│   └── skills/
│       └── idx-eod-sync/      # Workspace Skill: Sinkronisasi EOD
│           ├── SKILL.md       # Panduan operasional & instruksi agent
│           └── scripts/
│               └── sync_eod.py# Script eksekutor penarik data Yahoo Finance
├── AGENTS.md                  # Panduan operasional AI Agent (file ini)
├── README.md                  # Dokumentasi proyek untuk pengguna
├── TODO.md                    # Tracking checklist fitur
├── saham.txt                  # Catatan portofolio riil pengguna
├── backend/                   # FastAPI Backend
│   ├── database.py            # SQLite engine & session
│   ├── models.py              # Model SQLAlchemy
│   ├── scheduler.py           # APScheduler cron job 17:30 WIB
│   ├── routers/               # API Routers (stocks, portfolio, recovery, screener, journal, analysis)
│   └── services/
│       ├── data_fetcher.py    # Yahoo Finance puller & auto-profile
│       ├── technical.py       # Indikator teknikal (native pandas)
│       ├── ai_copilot.py      # Integrasi Gemini & status transparansi
│       ├── ai_tp_sl.py        # Algoritma hitung TP/SL 200 hari
│       ├── portfolio_engine.py# Decision matrix status kartu
│       ├── recovery_engine.py # Diagnosis & kalkulator avg down
│       └── screener_engine.py # Screener live scan BEI
└── frontend/                  # Next.js 16 App Router
    ├── app/
    │   ├── page.tsx           # Smart Decision Dashboard
    │   ├── portfolio/         # Portfolio & Trading Plan Management
    │   ├── recovery/          # Recovery Engine & Assessment
    │   ├── screener/          # EOD Stock Screener
    │   ├── journal/           # Trading Journal & Post-Mortem
    │   └── guide/             # Panduan Cara Pakai & SOP Trading
    ├── components/            # Komponen UI Stockbit Style
    ├── lib/api.ts             # REST client wrapper
    └── types/index.ts         # TypeScript Interfaces
```
