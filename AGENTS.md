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
8. **STANDAR CODE FORMATTING & LINTING (PRETTIER & ESLINT)**:
   - Frontend menggunakan **Prettier** dengan plugin `@trivago/prettier-plugin-sort-imports` (`frontend/.prettierrc`).
   - Setiap perubahan file frontend wajib mematuhi aturan format (`npm run format` / `npm run format:check`) dan lolos build (`npm run build`).
9. **MODULARITAS KOMPONEN & BATAS UKURAN FILE (MAX 500 LINES)**:
   - Setiap file halaman frontend (`page.tsx`) dan komponen wajib **maksimal 500 baris kode**.
   - Pecah logika kompleks menjadi **subkomponen modular**, **custom hooks** (`frontend/hooks/`), dan **helper function** terpisah.
10. **KOMPONEN UI RESMI WAJIB BERBASIS `@base-ui/react`**:
   - Seluruh implementasi komponen **shadcn/ui** wajib **SELALU menggunakan `@base-ui/react`** sebagai headless primitives library (misal `Dialog`, `Select`, `DropdownMenu`, `ScrollArea`, `Input`, `Label`, `Separator`, dll).
   - Dilarang menginstal atau mencampur dependensi headless lain jika primitif komponennya sudah didukung oleh `@base-ui/react`.
11. **STANDAR 1 FILE = 1 KOMPONEN JSX & ANIMASI DIALOG**:
   - Setiap file `.tsx` non-library wajib hanya mendefinisikan **1 komponen JSX utama** (tidak boleh mendefinisikan helper component function terpisah di file yang sama).
   - Dialog dan modal wajib di-render secara penuh tanpa conditional unmounting `{isOpen && ...}` pada parent agar siklus animasi buka/tutup (*enter/exit animations*) dari `@base-ui/react` tidak terputus.
   - Sinkronisasi nilai form saat modal dibuka wajib menggunakan pola resmi React pelacakan prop render-time (`isOpen !== prevIsOpen`), dan **dilarang menggunakan synchronous `setState` di dalam `useEffect`**.

---

## 🏗️ 2. Arsitektur & Tech Stack

| Layer | Teknologi | Catatan Khusus |
|---|---|---|
| **Frontend** | Next.js 16 (Static Export), TypeScript, Tailwind CSS, shadcn/ui (`@base-ui/react`) | Build statis di `frontend/out/`, disajikan via FastAPI di port `8000` |
| **Interactive Chart** | TradingView Lightweight Charts v5 | Gunakan syntax `chart.addSeries(CandlestickSeries, ...)` |
| **Backend & Web Server** | Python FastAPI, Uvicorn | Port `8000` (`http://localhost:8000`, Docs: `/docs`) |
| **Database** | SQLite lokal (`assiten_saham.db`), SQLAlchemy ORM | Tabel: `holdings`, `price_history`, `ai_analysis`, `screener_results`, `recovery_chat_logs`, `copilot_chat_logs`, `screener_chat_logs` |
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
- **Status Peringatan Jarak Dekat (Proximity Warnings) & Mode Exit Rebound**:
  - `SL_PROXIMITY_WARNING` (Orange): Jarak harga ke SL $\le 2\% \rightarrow$ Instruksi: *"SIAGA 1 — Pasang Stop Order di sekuritas"*.
  - `TP_PROXIMITY_WARNING` (Teal): Jarak harga ke TP $\le 2\% \rightarrow$ Instruksi: *"PERSIAPAN TP — Pasang antrean Sell 50% Lot"*.
  - `EXIT_REBOUND` (Amber): Target resisten teknikal berada di bawah harga modal beli (`target_price < avg_price`) dan harga penutupan menyentuh target $\rightarrow$ Instruksi: *"EXIT REBOUND — Jual untuk meminimalkan kerugian saat pantulan harga terjadi"*.
  - `ER_PROXIMITY_WARNING` (Amber): Jarak harga ke Target Exit Rebound $\le 2\% \rightarrow$ Instruksi: *"PERSIAPAN EXIT REBOUND — Pasang antrean jual untuk meminimalkan rugi"*.
- **Smart Dynamic Target Labeling**:
  - Jika `targetPrice >= avgPrice`: Ditampilkan sebagai **🎯 TP (Target Profit)** dengan tema Emerald/Hijau.
  - Jika `targetPrice < avgPrice`: Ditampilkan sebagai **⚡ Exit Rebound** dengan tema Amber/Orange untuk merefleksikan bahwa target tersebut bertujuan meminimalkan kerugian (*Cut on Strength*).

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
- **AI Chat Retention & Reset saat Sinkronisasi (Sync Purge)**:
  - Model: `CopilotChatLog` (`copilot_chat_logs`), `RecoveryChatLog` (`recovery_chat_logs`), `ScreenerChatLog` (`screener_chat_logs`).
  - **Selalu Disimpan Permanen**: Seluruh percakapan AI (Copilot Dashboard, Recovery Discussion, dan Screener Discussion) selalu disimpan permanen di database lokal SQLite dan tidak terhapus oleh pergantian tanggal, navigasi halaman, atau restart browser.
  - **Dibersihkan (Reset) Hanya Saat Sinkronisasi (EOD Sync)**: Histori chat AI dan cache analisis (`AIAnalysis`, `RecoveryDeepDive`) otomatis di-reset saat sinkronisasi data pasar baru dijalankan (melalui tombol Sinkronisasi EOD `POST /api/v1/stocks/fetch-all`, CLI `sync_eod.py`, jadwal harian 17:30 WIB di `backend/scheduler.py`, atau tombol manual *Bersihkan Riwayat* di UI), sehingga siklus percakapan selalu relevan dengan data candle closing bursa terbaru.
  - Dilengkapi endpoint API lengkap: `GET`/`DELETE` untuk `/api/v1/analysis/{ticker}/chat-history`, `/api/v1/recovery/{ticker}/chat-history`, dan `/api/v1/screener/{ticker}/chat-history`.

### G. Workspace Skills (`.agents/skills/`)
- **`idx-eod-sync` (`.agents/skills/idx-eod-sync/`)**: Modul skill otomatis Antigravity untuk menjalankan penarikan data closing bursa, menghitung indikator teknikal, mendiagnosis portofolio, dan mencetak laporan eksekutif pasca-closing.
- **`idx-recovery-plan` (`.agents/skills/idx-recovery-plan/`)**: Modul skill otomatis Antigravity untuk menganalisis saham floating loss menggunakan AI Tri-Scenario Recovery Engine (Cut Loss, Precision Average Down, Hold for Exit Rebound), menghitung skor keyakinan 1–10, saran alokasi lot riil, serta mencetak rencana eksekusi penyelamatan modal.
- **`idx-eod-screener` (`.agents/skills/idx-eod-screener/`)**: Modul skill otomatis Antigravity untuk memindai pasar saham BEI, mengkurasi Top Picks dengan 4 pilar fundamental (Market Cap, Float %, ROE %, DER), menghitung Risk:Reward Ratio (RRR), memberikan skor keyakinan AI 1–10, mengklasifikasikan kesesuaian profil (`⚡ Cocok Trading`, `🏛️ Cocok Investasi`, `✨ Trading & Investasi`), serta menganalisis saham kustom on-demand.
- Database SQLite di `backend/database.py` dan `.env` dipatok absolut ke `/Users/donidarmawan/Documents/me/assiten-saham/backend/assiten_saham.db` sehingga eksekusi dari CLI / skill Antigravity dari folder kerja mana pun selalu merujuk ke database yang sama persis tanpa duplikasi file kosong di root folder.

### H. Kamus Lengkap Badge & Glosarium Terintegrasi
- **Pusat Kamus (`/guide` Tab 3)**: Memetakan 4 kategori (Badge Screener `OVERSOLD`/`BREAKOUT`/`VALUE` + AI Score scale, Badge Kelayakan Recovery, 5 Warna Status Aksi Dashboard, dan Glosarium Istilah Pasar Modal).
- **Quick Modal Bantuan (`/screener`)**: Komponen modal pop-up `[ℹ️ Kamus Badge]` di samping tombol scan untuk referensi instan tanpa meninggalkan halaman.

### I. EOD Screener Top 10 Curated Picks, 4 Fundamental Metrics & AI Intelligence
- **Top 10 Rekomendasi Terkurasi**: Pool emiten likuid BEI $\le$ Rp 2.000 pada `STOCK_PROFILES` di `backend/services/screener_engine.py` dipindai dan dikurasi menjadi **Top 10 picks** (`scan_market_pool(db, top_n=10)`) berdasarkan Skor Keyakinan AI 1–10 (`conviction_score`).
- **4 Metrik Fundamental Terintegrasi**: Fungsi `fetch_stock_fundamentals(ticker)` di `backend/services/data_fetcher.py` mengambil:
  1. *Market Cap*: Nilai kapitalisasi pasar (format Triliun/Miliar Rp).
  2. *Free Float %*: `(floatShares / sharesOutstanding) * 100`.
  3. *Return on Equity (ROE %)*: Laba bersih / ekuitas emiten.
  4. *Debt to Equity Ratio (DER)*: Rasio total utang / ekuitas (khusus perbankan/finansial ditampilkan `N/A`).
- **Skala Skor Keyakinan AI 1–10**:
  - Skor keyakinan objektif menggabungkan parameter teknikal (MA20/50, RSI, Breakout) dan penguat fundamental (+1.0 untuk ROE > 10%, +0.5 untuk DER < 1.0x, +0.5 untuk MC > 10T).
  - Alasan AI hibrida menyajikan evaluasi kondisi teknikal dan kesehatan fundamental secara terpadu.
- **Budget Filter Bar & Estimasi Modal per Lot (`frontend/app/screener/page.tsx`)**:
  - Filter anggaran cepat khusus modal terukur: `≤ Rp 2.000 (Default)`, `≤ Rp 1.000`, `≤ Rp 500`, dan `Semua Harga`.
  - Tampilan Kartu & Tabel menampilkan label estimasi modal riil per lot (`Rp {price * 100}/lot`) untuk mempermudah alokasi kas RDN tanpa over-sizing.
- **On-Demand Custom Stock Analyzer**: Endpoint `POST /api/v1/screener/analyze` memungkinkan pengguna memasukkan kode ticker BEI apa saja (contoh: `BREN`, `AMMN`, `PGAS`, `MEDC`). Sistem otomatis mengambil data 3 bulan dari Yahoo Finance, menghitung indikator teknikal + fundamental, menentukan strategi & AI Score 1–10, serta menyimpannya ke database `ScreenerResult`.

### J. Expanded Row Table Layout & Multi-Turn AI Screener Discussion
- **Tabel Screener Modern dengan Expanded Rows (`ScreenerTableView.tsx`)**:
  - Baris utama tetap bersih dan ringkas (7 kolom: `# Ticker`, `Harga Close`, `Perubahan Nominal & %`, `RSI`, `Risk:Reward`, `Skor AI 1-10`, `Aksi`).
  - Sektor/Jenis Saham, 4 Pill Fundamental (Market Cap, Float %, ROE %, DER), dan Level Trading (Area Beli, Target TP, Stop Loss) diposisikan pada baris ekspansi (*expanded rows* `colSpan={7}`) di atas modul diskusi AI.
- **Multi-Turn AI Discussion (`ScreenerAIDiscussion.tsx` & `ai_copilot.py`)**:
  - Diskusi interaktif langsung untuk setiap emiten di screener via endpoint `POST /api/v1/screener/{ticker}/discuss`.
  - Terkoneksi ke 9Router / OpenAI LLM dengan fallback transparan ke Rule-Based Expert Engine.
  - Percakapan multi-turn disimpan permanen di tabel `screener_chat_logs` SQLite dan dibersihkan otomatis saat sinkronisasi data pasar baru.
- **Client-Side (FE-Only) Sorting**: Pengurutan tabel sepenuhnya diproses in-memory di React state (`sortedItems`) pada seluruh kolom (Ticker, Sektor, Harga, Perubahan %, RSI, Market Cap, ROE, DER, RRR, Skor AI) tanpa re-query backend.
- **Edukasi Interaktif RRR & AI Score**:
  - Rumus RRR: $1 : (\text{TP} - \text{Entry}) / (\text{Entry} - \text{SL})$. Standar transaksi ideal $\ge 1 : 2.0$.
  - AI Conviction Score (1–10): Filter probabilitas statistik data historis & kesehatan fundamental.
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
  - Skrip pendukung (`start_app.sh`, `stop_app.sh`, `build_app.sh`, `scripts/`) kini di-track penuh di Git untuk kemudahan eksekusi via CLI maupun peluncur aplikasi desktop.

### L. Automatic Trading Balance & Smart Lot Management
- **Sinkronisasi Saldo Kas RDN Otomatis (Auto-Sync Cash Balance)**:
  - Pembelian saham baru maupun penambahan lot (`create_holding`) otomatis memotong modal belanja ($\text{Harga Beli} \times \text{Lot} \times 100$) dari saldo kas RDN.
  - Penjualan saham (`sell_holding`) otomatis menambahkan seluruh dana hasil penjualan ke saldo kas RDN.
  - Penyesuaian manual tetap didukung via modal `[ ✏️ Edit ]` (`EditBalanceModal.tsx`) untuk koreksi setor/tarik dana dan fee broker.
- **Smart Add / Beli Tambahan & Averaging Otomatis**:
  - Jika ticker yang dimasukkan pada form tambah saham sudah ada di portofolio, sistem otomatis melebur posisi, menghitung harga rata-rata baru (*weighted average*), dan mencatat transaksi ke `TradeLog`.
- **Pangkas / Jual Lot Saham (`SellHoldingModal.tsx`)**:
  - Tombol `[ 🏷️ Jual ]` atau opsi pada Dropdown Menu Aksi portofolio digunakan untuk memangkas sebagian lot atau menutup seluruh posisi.
  - Pilihan cepat preset lot: `25%`, `50%` (TP1 Kunci Profit), dan `100%` (Tutup Posisi Total).
  - Kalkulasi *real-time*: Total Nilai Penjualan, Realized PnL nominal & persentase, serta sisa lot di portofolio.
  - Jika `sell_lot < holding.lot`, jumlah lot holding diperbarui dengan sisa lot. Jika `sell_lot == holding.lot`, holding dihapus dari daftar aktif.

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

# 2. Build & Code Formatting Verification (Harus 0 TypeScript error & lolos Prettier)
make build      # atau: cd frontend && npm run build
cd frontend && npm run format       # Format semua file frontend dengan Prettier
cd frontend && npm run format:check # Verifikasi formatting frontend

# 3. Sinkronisasi Data EOD via Workspace Skill
./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py
./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py --ticker SIDO.JK

# 4. Rencana Recovery AI 3-Skenario via Workspace Skill
./backend/venv/bin/python .agents/skills/idx-recovery-plan/scripts/sync_recovery.py
./backend/venv/bin/python .agents/skills/idx-recovery-plan/scripts/sync_recovery.py --ticker DEWA.JK --force

# 5. Pindaian Pasar & Analisis Saham EOD Screener via Workspace Skill
./backend/venv/bin/python .agents/skills/idx-eod-screener/scripts/scan_screener.py
./backend/venv/bin/python .agents/skills/idx-eod-screener/scripts/scan_screener.py --ticker BREN.JK
./backend/venv/bin/python .agents/skills/idx-eod-screener/scripts/scan_screener.py --top 5 --strategy BREAKOUT

# 6. Tes Endpoint Sinkronisasi EOD via API
curl -s -X POST http://localhost:8000/api/v1/stocks/fetch-all

# 7. Tes Endpoint Bedah Logika Skenario AI
curl -s -X POST http://localhost:8000/api/v1/recovery/SIDO.JK/discuss \
  -H "Content-Type: application/json" \
  -d '{"scenario_id": "holdForBep", "user_question": "apakah dividen aman?"}'

# 8. Tes Endpoint Analisis AI & Dashboard
curl -s -X POST http://localhost:8000/api/v1/analysis/SIDO.JK
curl -s http://localhost:8000/api/v1/dashboard
```

---

## 📁 6. Struktur Direktori Utama

```
assiten-saham/
├── .agents/                   # Antigravity Customizations
│   └── skills/
│       ├── idx-eod-sync/      # Workspace Skill: Sinkronisasi EOD
│       │   ├── SKILL.md       # Panduan operasional & instruksi agent
│       │   └── scripts/
│       │       └── sync_eod.py# Script eksekutor penarik data Yahoo Finance
│       ├── idx-recovery-plan/ # Workspace Skill: AI Tri-Scenario Recovery
│       │   ├── SKILL.md       # Panduan operasional analisis recovery
│       │   └── scripts/
│       │       └── sync_recovery.py # Script eksekutor recovery plan
│       └── idx-eod-screener/  # Workspace Skill: EOD Market Screener & Intelligence
│           ├── SKILL.md       # Panduan operasional pemindaian pasar
│           └── scripts/
│               └── scan_screener.py # Script eksekutor pemindaian pasar & on-demand
├── AGENTS.md                  # Panduan operasional AI Agent (file ini)
├── README.md                  # Dokumentasi proyek untuk pengguna
├── TODO.md                    # Tracking checklist fitur
├── saham.txt                  # Catatan portofolio riil pengguna
├── backend/                   # FastAPI Backend
│   ├── database.py            # SQLite engine & session
│   ├── models.py              # Model SQLAlchemy
│   ├── scheduler.py           # APScheduler cron job 17:30 WIB
│   ├── routers/               # API Routers (stocks, portfolio, recovery, screener, analysis, system)
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
    │   └── guide/             # Panduan Cara Pakai & SOP Trading
    ├── components/            # Komponen UI Stockbit Style & Subcomponents
    │   ├── guide/             # Subkomponen Halaman Guide (Tabs, Hero, Glossary)
    │   ├── portfolio/         # Subkomponen Portfolio (Tabel, Header, Modals)
    │   ├── recovery/          # Subkomponen Recovery (Diagnosis, Scenarios, Calc)
    │   ├── screener/          # Subkomponen Screener (Card, Table, Analyzer, Chat)
    │   └── ui/                # Komponen Resmi shadcn/ui (Button, Card, Dialog, dll)
    ├── hooks/                 # Custom React Hooks (useGuide, useScreener, usePortfolio, dll)
    ├── lib/api.ts             # REST client wrapper
    └── types/index.ts         # TypeScript Interfaces
```
