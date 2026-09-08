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
   - Jika service AI (API Key / Base URL) belum dikonfigurasi atau belum aktif, **berikan alert transparan** bahwa AI belum tersedia/offline. **DILARANG** memalsukan analisis rule-based sebagai hasil generate AI.
7. **DILARANG AUTO-COMMIT / AUTO-PUSH (NO AUTO-COMMIT)**:
   - AI **DILARANG KERAS** menjalankan perintah `git commit` maupun `git push` secara otomatis setelah membuat fitur/perubahan.
   - Seluruh perubahan kode dan pengujian hanya boleh dilakukan di file lokal.
   - `git commit` / `git push` **HANYA** boleh dijalankan jika pengguna memberikan perintah/izin eksplisit secara langsung.

---

## 🏗️ 2. Arsitektur & Tech Stack

| Layer | Teknologi | Catatan Khusus |
|---|---|---|
| **Frontend** | Next.js 16 (Static Export), TypeScript, Tailwind CSS | Build statis di `frontend/out/`, disajikan via FastAPI di port `8000` |
| **Interactive Chart** | TradingView Lightweight Charts v5 | Gunakan syntax `chart.addSeries(CandlestickSeries, ...)` |
| **Backend & Web Server** | Python FastAPI, Uvicorn | Port `8000` (`http://localhost:8000`, Docs: `/docs`) |
| **Database** | SQLite lokal (`assiten_saham.db`), SQLAlchemy ORM | Tabel: `holdings`, `price_history`, `trade_log`, `ai_analysis`, `screener_results`, `recovery_chat_logs` |
| **Data Pasar** | Yahoo Finance (`yfinance`) | EOD update pasca-closing market BEI (17:30 WIB) |
| **AI LLM Engine** | **Custom OpenAI-Compatible AI Gateway** (`AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`) & Rule-Based Expert Engine | Bebas pilih provider (OpenAI, 9Router, Ollama, Groq, LiteLLM, vLLM, dll), failover transparan |
| **Memory Optimization** | Heartbeat Auto-Shutdown Daemon | 0 MB RAM idle footprint (auto-shutdown 75s saat browser ditutup) |

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

### F. AI Copilot & Bedah Logika Skenario (`backend/services/ai_copilot.py`)
- **Custom OpenAI-Compatible AI Gateway & 9Router**:
  - Menggunakan standar OpenAI-compatible REST API (`/chat/completions`) yang dapat diarahkan ke provider apa saja (OpenAI, 9Router, Ollama, Groq, LiteLLM, vLLM, OpenCode, dll).
  - Variabel konfigurasi di `backend/.env`:
    - `AI_PROVIDER`: Identifier provider aktif (misal: `9router`, `custom_llm`).
    - `AI_API_KEY`: API key dari provider pilihan pengguna.
    - `AI_MODEL`: Nama model (misal: `gpt-4o-mini`, `9router`, `deepseek-chat`).
    - `AI_BASE_URL`: Base URL / endpoint proxy (misal: `http://localhost:20128/v1`, `https://api.openai.com/v1`).
  - **9Router Background Execution**: Dijalankan secara otomatis di port `20128` dengan flag `-t --host 127.0.0.1` (tray mode) agar tidak meminta input terminal TUI interaktif saat berjalan di latar belakang.
  - **Konsistensi Identifier Source**: Fungsi `call_llm` mengembalikan nama provider aktif secara dinamis (`9router`), dan Frontend mengecek `source !== "rule_based"` untuk menampilkan badge hijau **✨ Dibalas oleh 9Router AI** secara akurat.
  - **Hot-Reload Environment**: Menggunakan `load_dotenv(override=True)` sehingga perubahan key/model di `.env` langsung aktif tanpa perlu me-restart server.
- **Failover Transparan (Graceful Fallback)**:
  - Jika service AI belum aktif, endpoint offline, atau kuota/rate limit habis (HTTP 429), sistem otomatis beralih ke **Deterministic Rule-Based Expert Engine** (`source: "rule_based"`).
- **4 Pilar Analisis Mendalam**:
  1. `coreLogic`: Logika objektif pemilihan skenario berdasarkan profil emiten & kecukupan kas.
  2. `invalidationRisk`: Batas risiko dan level harga invalidasi (Plan B) bila tren breakdown.
  3. `cashflowAndTimeline`: Estimasi arus kas dividen riil per tahun & estimasi rentang waktu rebound.
  4. `tomorrowActionPlan`: Checklist 3 langkah aksi konkret sebelum market buka pukul 09:00 WIB.
- **Active Trading Cycle Chat Retention**:
  - Model: `RecoveryChatLog` (`recovery_chat_logs`).
  - Menyimpan riwayat percakapan interaktif khusus untuk sesi siklus hari bursa berjalan (*Trading Cycle Session*).
  - **TIDAK DIHAPUS oleh pergantian tanggal kalender biasa**.
  - Chat bertahan sepanjang akhir pekan (Jumat sore s/d Senin 17:30 WIB) dan sepanjang hari libur nasional/cuti bersama BEI.
  - Otomatis dibersihkan (*purged*) **HANYA saat penutupan bursa hari bursa aktif (17:30 WIB)** via `APScheduler` di `backend/scheduler.py` atau tombol manual *Bersihkan Riwayat*.
  - Dilengkapi endpoint `GET /api/v1/recovery/{ticker}/chat-history` dan `DELETE /api/v1/recovery/{ticker}/chat-history` (tombol *Bersihkan Riwayat* di UI).

### G. Workspace Skill: `idx-eod-sync` (`.agents/skills/idx-eod-sync/`)
- Modul skill otomatis Antigravity untuk menjalankan penarikan data closing bursa, menghitung indikator teknikal, mendiagnosis portofolio, dan mencetak laporan eksekutif pasca-closing.
- Database SQLite di `backend/database.py` dan `.env` dipatok absolut ke `/Users/donidarmawan/Documents/me/assiten-saham/backend/assiten_saham.db` sehingga eksekusi dari CLI / skill Antigravity dari folder kerja mana pun selalu merujuk ke database yang sama persis tanpa duplikasi file kosong di root folder.

### H. Kamus Lengkap Badge & Glosarium Terintegrasi
- **Pusat Kamus (`/guide` Tab 3)**: Memetakan 4 kategori (Badge Screener `OVERSOLD`/`BREAKOUT`/`VALUE` + AI Score scale, Badge Kelayakan Recovery, 5 Warna Status Aksi Dashboard, dan Glosarium Istilah Pasar Modal).
- **Quick Modal Bantuan (`/screener`)**: Komponen modal pop-up `[ℹ️ Kamus Badge]` di samping tombol scan untuk referensi instan tanpa meninggalkan halaman.

### I. EOD Screener Top Picks, Budget Filter & Analisis Kustom On-Demand
- **Expanded Universe Saham Likuid Terjangkau**: Pool emiten pada `STOCK_PROFILES` di `backend/services/screener_engine.py` diperluas mencakup saham likuid dan fundamental stabil dengan harga $\le$ Rp 2.000 (seperti `MBMA`, `ENRG`, `IATA`, `BRIS`, `AKRA`, `SIDO`, `DEWA`, `BUMI`, `ELSA`, `ERAA`, `MAPA`, `BBTN`, dll) dengan kuota screening Top 25 picks (`scan_market_pool(db, top_n=25)`).
- **Budget Filter Bar & Estimasi Modal per Lot (`frontend/app/screener/page.tsx`)**:
  - Filter anggaran cepat khusus modal terukur: `≤ Rp 2.000 (Default)`, `≤ Rp 1.000`, `≤ Rp 500`, dan `Semua Harga`.
  - Tampilan Kartu & Tabel menampilkan label estimasi modal riil per lot (`Rp {price * 100}/lot`) untuk mempermudah alokasi kas RDN tanpa over-sizing.
- **On-Demand Custom Analyzer**: Endpoint `POST /api/v1/screener/analyze` memungkinkan pengguna memasukkan kode ticker BEI di luar daftar rekomendasi (contoh: `BREN`, `AMMN`, `PGAS`, `MEDC`). Sistem otomatis mengambil data 3 bulan dari Yahoo Finance, menghitung indikator teknikal (MA, RSI, Support, Resistance), menentukan strategi & AI Score, serta menyimpannya ke database `ScreenerResult`.

### J. 3-Pilar Intelijen Rekomendasi, SOP 4 Langkah & Edukasi RRR
- **Pusat Intelijen 3 Pilar (Bukan Tombol Beli Statis)**:
  1. `Alasan Rekomendasi (Why Buy)`: Landasan teknikal objektif mengapa saham terpilih dari data historis (status MA, oversold RSI, breakout).
  2. `Wajib Dipantau Besok (Watch Trigger 09:00 WIB)`: Syarat konfirmasi saat pembukaan market sebelum melakukan entry.
  3. `Panduan Level & Risk/Reward Ratio (RRR)`: Area beli ideal, target resistance (TP), batas support/invalidasi (SL), dan rasio *Risk:Reward* (RRR) otomatis.
- **SOP 4 Langkah Cara Memilih Saham di Screener (Tertanam di `/guide` Tab 2)**:
  1. *Langkah 1 (Filter Anggaran)*: Sesuaikan dengan Saldo Kas RDN, patuhi aturan alokasi $\le$ 20–25% modal per saham (anti *all-in*).
  2. *Langkah 2 (Pilih Strategi)*: Selaraskan karakter trader (Oversold = *Buy on Weakness*, Breakout = *Trend Following*, Value = *Medium-term Swing*).
  3. *Langkah 3 (Validasi 3 Pilar)*: Wajib periksa AI Score $\ge 80-85$, RRR $\ge 1 : 2.0$, dan baca trigger pembukaan jam 09:00 WIB.
  4. *Langkah 4 (Order Disiplin di Sekuritas)*: Antre di area beli ideal, pasang Stop Order (GTC) otomatis, dan pasang TP1 untuk kunci laba 50% lot.
- **Client-Side (FE-Only) Sorting**: Pengurutan tabel sepenuhnya diproses in-memory di React state (`sortedItems`) pada seluruh kolom (Ticker, Strategi, Harga, Perubahan %, RSI, TP, SL, RRR, AI Score) tanpa re-query backend.
- **Edukasi Interaktif RRR & AI Score**:
  - Rumus RRR: $1 : (\text{TP} - \text{Entry}) / (\text{Entry} - \text{SL})$. Standar transaksi ideal $\ge 1 : 2.0$.
  - AI Score (0–100): Filter probabilitas statistik data historis (bukan ramalan masa depan).
  - Terintegrasi di Quick Modal Kamus, Tooltips tabel/kartu, dan Glosarium `/guide` (Tab 3).

### K. Ultra-Light Architecture & Auto-Shutdown Engine (`backend/routers/system.py`)
- **Single-Process FastAPI Port 8000**:
  - Frontend Next.js di-export secara statis (`output: 'export'`) ke direktori `frontend/out/`.
  - Backend FastAPI (`backend/main.py`) bertindak sebagai single unified server yang melayani REST API (`/api/v1/*`) sekaligus menyajikan aset frontend statis di `http://localhost:8000`.
  - Server Node.js tidak perlu berjalan di background (menghemat 100MB RAM permanen).
- **Heartbeat Daemon & Auto-Shutdown**:
  - Komponen frontend `<HeartbeatSender />` (`frontend/components/HeartbeatSender.tsx`) mengirim sinyal detak jantung berkala (`POST /api/v1/system/heartbeat`) setiap 15 detik selama tab browser aktif.
  - Background daemon thread di `backend/routers/system.py` memantau sinyal heartbeat. Jika seluruh tab browser ditutup selama $\ge 75$ detik (setelah grace period 90 detik pasca boot), server FastAPI otomatis menghentikan prosesnya sendiri secara bersih (`os._exit(0)`).
  - Menghasilkan **0 MB RAM (0% CPU)** saat aplikasi tidak digunakan.
- **Desktop Launcher & Native macOS Applet**:
  - `Asisten Saham.app` dikompilasi sebagai **Native macOS Applet** (`osacompile`) dengan aset icon resmi `Contents/Resources/app.icns`.
  - Disinkronkan ke `~/Desktop/Asisten Saham.app` dan `/Applications/Asisten Saham.app` (Dock) dengan detached process (`nohup`) sehingga dapat langsung diklik ganda dari Desktop maupun Dock tanpa terminal window.
  - Skrip pendukung (`start_app.sh`, `stop_app.sh`, `*.command`) diabaikan di `.gitignore` untuk menjaga repositori tetap bersih.

### L. Manual Trading Balance, Lot Management & Trading Journal Sync
- **Pencatatan Saldo Kas RDN Manual**:
  - Saldo kas RDN diinput dan diperbarui secara manual oleh pengguna sesuai kenyataan rekening sekuritas via modal `[ ✏️ Edit ]` (`EditBalanceModal.tsx`).
  - Aplikasi bertindak sebagai asisten pencatatan personal dan tidak memotong/menambah saldo kas secara otomatis di belakang layar.
- **Pangkas / Jual Lot Saham (`SellHoldingModal.tsx`)**:
  - Tombol `[ 🏷️ Jual ]` pada kolom Aksi tabel portofolio digunakan untuk memangkas sebagian lot atau menutup seluruh posisi.
  - Pilihan cepat preset lot: `25%`, `50%` (TP1 Kunci Profit), dan `100%` (Tutup Posisi Total).
  - Kalkulasi *real-time*: Total Nilai Penjualan, Realized PnL nominal & persentase, serta sisa lot di portofolio.
  - Jika `sell_lot < holding.lot`, jumlah lot holding diperbarui dengan sisa lot. Jika `sell_lot == holding.lot`, holding dihapus dari daftar aktif.
- **Pencatatan ke AI Trading Journal (`/journal`)**:
  - Transaksi penjualan otomatis dicatat ke tabel `trade_log` dengan aksi `SELL` (untung) atau `CUT_LOSS` (rugi).
  - Menyimpan evaluasi psikologi (`DISCIPLINED`, `FOMO_BUY`, `PANIC_SELL`) & catatan refleksi trader.
  - Metrik Post-Mortem (*Win Rate %*, *Total Realized PnL*, *Profit Factor*) dihitung dari transaksi yang ditutup.

### M. IDX Market Calendar, Holiday Engine & Live Session Status (`backend/services/market_calendar.py`)
- **Kalender Resmi BEI & Libur Nasional**:
  - Memetakan akhir pekan (Sabtu & Minggu) dan seluruh Hari Libur Nasional & Cuti Bersama BEI resmi 2025–2026.
  - Fungsi `is_active_trading_day(target_date)` menentukan apakah tanggal tertentu adalah hari perdagangan aktif.
  - Endpoint `GET /api/v1/system/market-status` menyediakan status sesi live (`OPEN_SESSION_1`, `MARKET_BREAK`, `OPEN_SESSION_2`, `POST_CLOSING`, `CLOSED_EOD`, `CLOSED_WEEKEND`, `CLOSED_HOLIDAY`).
- **Live Status Indicator di Topbar**:
  - Komponen `Topbar.tsx` secara dinamis menampilkan pill status pasar BEI dengan warna indikator Stockbit Clean (Emerald untuk sesi buka, Amber untuk jeda istirahat, Slate untuk market closed/libur) beserta tooltip deskriptif.

---

## 🛠️ 5. Perintah Pengujian & Operasional

```bash
# 1. Operasional Cepat via Makefile
make start      # Jalankan Ultra-Light Single Process (:8000) & 9Router (:20128)
make dev        # Mode Development: 9Router (:20128) + FastAPI (:8000) + Next.js (:3000)
make 9router    # Jalankan hanya 9Router AI Gateway (:20128)
make stop       # Hentikan seluruh proses (:8000, :3000, :20128)
make sync-eod   # Sinkronisasi data closing EOD Yahoo Finance

# 2. Build Verification (Harus 0 TypeScript error)
make build      # atau: cd frontend && npm run build

# 3. Sinkronisasi Data EOD via Workspace Skill
./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py
./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py --ticker SIDO.JK

# 4. Tes Endpoint Sinkronisasi EOD via API
curl -s -X POST http://localhost:8000/api/v1/stocks/fetch-all

# 5. Tes Endpoint Bedah Logika Skenario AI
curl -s -X POST http://localhost:8000/api/v1/recovery/SIDO.JK/discuss \
  -H "Content-Type: application/json" \
  -d '{"scenario_id": "holdForBep", "user_question": "apakah dividen aman?"}'

# 6. Tes Endpoint Analisis AI & Dashboard
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
│       ├── ai_copilot.py      # Integrasi OpenAI-compatible AI gateway & status transparansi
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
