# ✅ TODO — Asisten Saham

> Status: **Tahap 0–24 Selesai (Fullstack Operasional & Wilder's RSI Calibrated) 🚀**
> Frontend: Next.js 16 Static Export + shadcn/ui (@base-ui/react) + Stockbit Clean Light Mode (`http://localhost:8000`)
> Backend: FastAPI + SQLite + yfinance + EOD Skill + 9Router AI Gateway (`http://localhost:8000`)

---

## 📐 Tahap 0 — Project Setup [SELESAI ✅]

- [x] Struktur folder `/frontend` dan `/backend` di root project
- [x] Dokumentasi `README.md` & `IMPLEMENTATION_PLAN.md`
- [x] Database setup & skema tabel SQLite (`assiten_saham.db`)
- [x] Template konfigurasi (`requirements.txt`, `.env.example`, `main.py`)

---

## 🎨 TAHAP 1 — FE Slicing (Stockbit Style) [SELESAI ✅]
> Desain: Clean Modern Stockbit Style (Light Mode Elegan, Latar Putih Bersih, Bebas Neon)

- [x] 1.1 Setup Frontend (Next.js 16 + TypeScript + Tailwind CSS + TradingView v5)
- [x] 1.2 Layout & Navigasi (Sidebar & Topbar Stockbit Clean)
- [x] 1.3 Halaman Dashboard (Summary Cards, 5 Action Cards, Daily Action Sheet)
- [x] 1.4 Halaman Portfolio (Tabel, Modal Input Plan, Sektor Alokasi, Scale-Out Matrix)
- [x] 1.5 Halaman Recovery Engine (Diagnosis, 3 Skenario AI, Kalkulator Avg Down)
- [x] 1.6 Fitur AI Copilot Panel (Modal Rekomendasi Terstruktur & Narasi EOD)
- [x] 1.7 Halaman EOD Screener (Preset Tabs, Search, Tabel Sinyal)
- [x] 1.8 Candlestick Chart (TradingView Light Mode dengan MA20/MA50 overlay)
- [x] 1.9 Halaman Guide & SOP Trading (5 Tab Interaktif)

---

## ⚙️ TAHAP 2 — Backend Development [SELESAI ✅]
> Service, algoritma, dan API endpoints RESTful dengan data DB SQLite & yfinance.

- [x] 2.1 Virtualenv & Dependencies (FastAPI, SQLAlchemy, yfinance, apscheduler, numpy, pandas)
- [x] 2.2 Service: Data Fetcher (`services/data_fetcher.py` — yfinance helper untuk `.JK`)
- [x] 2.3 Service: Technical Analysis (`services/technical.py` — MA20, MA50, MA200, RSI, Support/Resistance)
- [x] 2.4 Router: Portfolio CRUD (`routers/portfolio.py` — GET, POST, PUT, DELETE holdings)
- [x] 2.5 Service: Portfolio Engine (`services/portfolio_engine.py` — Rule status 5 kartu & tracking high watermark)
- [x] 2.6 Router: Stocks & Chart (`routers/stocks.py` — GET /api/v1/dashboard, GET chart, manual fetch)
- [x] 2.7 Service: AI Copilot (`services/ai_copilot.py` & `routers/analysis.py` — OpenAI-compatible gateway + rule-based fallback)
- [x] 2.8 Service: Recovery Engine (`services/recovery_engine.py` & `routers/recovery.py` — Diagnosis & kalkulator avg down)
- [x] 2.9 Service: Screener Engine (`services/screener_engine.py` & `routers/screener.py` — Filter Oversold, Breakout, Value)
- [x] 2.10 Scheduler & Telegram Bot (`scheduler.py` & `services/telegram_bot.py` — Cron EOD 17:30 WIB)

---

## 🔌 TAHAP 3 — Integrasi FE ↔ BE [SELESAI ✅]
> End-to-End terhubung dengan data real-time, sinkronisasi DB, dan fallback offline.

- [x] 3.1 API Client wrapper (`frontend/lib/api.ts`)
- [x] 3.2 Dashboard terhubung ke `/api/v1/dashboard` & Sinkronisasi EOD
- [x] 3.3 Portfolio Management terhubung ke `/api/v1/portfolio` (Create, Read, Delete)
- [x] 3.4 Candlestick Chart terhubung ke `/api/v1/stocks/{ticker}/chart`
- [x] 3.5 AI Copilot Panel terhubung ke `/api/v1/analysis/{ticker}`
- [x] 3.6 Recovery Engine & Kalkulator terhubung ke `/api/v1/recovery`
- [x] 3.7 Screener terhubung ke `/api/v1/screener`
- [x] 3.8 Verifikasi seluruh alur kerja end-to-end (FastAPI port 8000 + Frontend Static Export)

---

## 🎯 TAHAP 4 — Portofolio Riil, Diferensiasi Investasi & AI Alert [SELESAI ✅]
> Penyesuaian portofolio nyata pengguna, penanganan saham investasi, dan transparansi AI.

- [x] 4.1 Migrasi DB: Penambahan kolom `jenis` ('trading' | 'investasi') pada tabel `holdings`
- [x] 4.2 Auto-Import 6 Saham Riil Pengguna (CRSN, DEWA, GTSI, INET, SIDO, SURI) dengan kalkulasi AI TP/SL
- [x] 4.3 Logika Khusus Saham Investasi: Penonaktifan hard Stop Loss, status `AVERAGING_REVIEW`, dan horizon dividen
- [x] 4.4 Auto-Fetch Sektor & Industri otomatis dari Yahoo Finance saat pencatatan saham
- [x] 4.5 Transparansi AI Copilot: Alert jelas saat API Key belum ada atau kuota limit (429) tercapai
- [x] 4.6 Pembaruan dokumentasi komprehensif `README.md` & pembuatan instruksi `AGENTS.md`

---

## 🚀 TAHAP 5 — Recovery Engine Deep-Dive & Workspace Skill [SELESAI ✅]
> Penguatan variabel pengambilan keputusan, diskusi interaktif AI, dan skill EOD otomatis.

- [x] 5.1 4 Variabel Pengambil Keputusan Recovery (*Cash Feasibility*, *Profil Trading vs Investasi*, *Checklist Kriteria*, *Snapshot Dividen/Fundamental*)
- [x] 5.2 Fitur Bedah Logika Skenario & Tanya Jawab Interaktif AI (Endpoint `/discuss` dengan 4 pilar analisis mendalam)
- [x] 5.3 Optimasi Skala Tipografi (+1x Scale-Up) di halaman Recovery & Modal Diskusi
- [x] 5.4 Pembuatan Workspace Skill Antigravity `idx-eod-sync` (`SKILL.md` dan script `sync_eod.py`)
- [x] 5.5 Perbaikan Absolute Database Path SQLite (`backend/assiten_saham.db`)
- [x] 5.6 Pemutakhiran dokumentasi `README.md` & `AGENTS.md`
- [x] 5.7 Pemasangan Kamus Lengkap Badge & Glosarium (Pusat `/guide` Tab 3 + Quick Modal `[ℹ️ Kamus Badge]` di Screener)
- [x] 5.8 EOD Screener Top 25 Rekomendasi Terkurasi & Analisis Saham Kustom On-Demand (`/screener`)
- [x] 5.9 3-Pilar Watchlist Intelijen Screener, Client-Side (FE-Only) Sorting & Edukasi Interaktif RRR / AI Score

---

## 📌 TAHAP 6 — Integrasi Live AI LLM & Multi-Turn Conversational Memory (1-Day Ephemeral) [SELESAI ✅]
> Menghubungkan Google Gemini secara live dan menyempurnakan memori percakapan multi-turn di chat recovery dengan retensi 1 hari (auto-purge saat market close).

- [x] 6.1 Konfigurasi Environment & Key Setup (`backend/.env` dengan `GEMINI_API_KEY`)
- [x] 6.2 Integrasi Multi-Turn Chat Memory di Backend (`backend/routers/recovery.py` & `backend/services/ai_copilot.py` dengan model `RecoveryChatLog`)
- [x] 6.3 Pengiriman & Penyimpanan State `chatHistory` (Endpoint GET/DELETE `/chat-history`, auto-load saat buka modal diskusi)
- [x] 6.4 Auto-Purge Pasca-Closing: Pembersihan otomatis riwayat chat pada penutupan bursa (17:30 WIB) via `APScheduler`
- [x] 6.5 Uji Coba End-to-End percakapan multi-turn live dengan model Gemini Flash & tombol Bersihkan Riwayat di UI

---

## ⚡ TAHAP 7 — Multi-Provider LLM Architecture (Google Gemini & OpenCode Zen) [SELESAI ✅]
> Dukungan hybrid multi-provider LLM dengan UI toggle selector dan hot-reload configuration.

- [x] 7.1 Backend Multi-Provider Engine (`services/ai_copilot.py` — Google Gemini & OpenCode Zen OpenAI-compatible client)
- [x] 7.2 API Router Endpoints (`GET /api/v1/analysis/providers`, `POST /api/v1/analysis/provider`, parameter `provider` di discuss/analyze)
- [x] 7.3 Frontend UI Provider Switcher (`[ ✨ Gemini ] [ ⚡ Zen ]`) pada modal Recovery Discussion & AI Copilot Panel
- [x] 7.4 Hot-Reload Environment Variables (`load_dotenv(override=True)` untuk instant runtime key sync)
- [x] 7.5 Integrasi Native Markdown Renderer (`frontend/components/MarkdownText.tsx` tanpa dependency external)
- [x] 7.6 Standarisasi format seluruh harga saham IDX sebagai integer (bilangan bulat)
- [x] 7.7 Pemutakhiran dokumentasi `README.md` & `AGENTS.md`

---

## ⚡ TAHAP 8 — Ultra-Light Single Process & Auto-Shutdown Architecture [SELESAI ✅]
> Eliminasi background Node.js server, penyajian frontend statis via FastAPI di port 8000, dan heartbeat auto-shutdown (0 MB RAM saat idle).

- [x] 8.1 Konfigurasi Static HTML Export Next.js (`next.config.ts` dengan `output: 'export'`)
- [x] 8.2 Frontend Heartbeat Component (`frontend/components/HeartbeatSender.tsx` — ping setiap 15 detik)
- [x] 8.3 Backend Auto-Shutdown Engine (`backend/routers/system.py` — mematikan server otomatis jika browser ditutup $\ge 75$ detik)
- [x] 8.4 Single-Process Mounting FastAPI (`backend/main.py` — melayani API + Web statis di `http://localhost:8000`)
- [x] 8.5 Pembuatan Native macOS Desktop Launcher (`Asisten Saham.app`) dengan ikon retina 1024x1024
- [x] 8.6 Pengabaian artifact lokal & launcher di `.gitignore`
- [x] 8.7 Pemutakhiran dokumentasi `README.md`, `AGENTS.md`, dan `TODO.md`

---

## 💰 TAHAP 9 — Manual Trading Balance & Lot Management [SELESAI ✅]
> Pencatatan saldo kas RDN manual dan manajemen pemangkasan lot saham di portofolio.

- [x] 9.1 Saldo Kas RDN Manual: Diinput dan diedit mandiri oleh user via `EditBalanceModal.tsx` (`user_settings` key `cash_balance`).
- [x] 9.2 Modal Jual / Pangkas Lot Saham (`SellHoldingModal.tsx`):
  - Dukungan hapus total (100%) atau pangkas sebagian lot (preset 25%, 50% TP1, 100%).
  - Kalkulasi *live* nilai transaksi, Realized PnL nominal & persentase, serta sisa lot di portofolio.
  - Tagging evaluasi psikologi (*Disiplin Plan*, *FOMO Buy*, *Panic Sell*) & catatan refleksi trader.

---

## 📅 TAHAP 10 — IDX Market Calendar & Active Trading Cycle Chat Retention [SELESAI ✅]
> Deteksi hari bursa aktif & libur nasional/cuti bersama BEI, serta retensi chat recovery berbasis siklus bursa (bukan hari kalender).

- [x] 10.1 Modul Kalender Bursa BEI (`backend/services/market_calendar.py`):
  - Deteksi akhir pekan (Sabtu-Minggu), daftar lengkap Libur Nasional & Cuti Bersama BEI resmi 2025–2026.
  - Helper penentu hari bursa aktif (`is_active_trading_day`), hari bursa berikutnya, dan status sesi pasar.
- [x] 10.2 Retensi Chat Berbasis Siklus Bursa (`backend/routers/recovery.py`):
  - Penghapusan pembersihan kaku kalender harian (`session_date < today`).
  - Chat diskusi recovery dipertahankan sepanjang akhir pekan (Jumat sore s/d Senin 17:30) dan hari libur nasional sampai EOD market close aktif berikutnya.
- [x] 10.3 Scheduler EOD Holiday-Aware (`backend/scheduler.py`):
  - Pengecekan hari bursa aktif sebelum menjalankan penarikan data EOD dan reset chat.
- [x] 10.4 Live Market Status Indicator di Topbar (`frontend/components/Topbar.tsx` & API `/api/v1/system/market-status`).
- [x] 10.5 Pemutakhiran dokumentasi `README.md`, `AGENTS.md`, dan `TODO.md`.

---

## ⚡ TAHAP 11 — Triple-Provider LLM Engine (Gemini, OpenCode Zen, & OpenRouter) [SELESAI ✅]
> Integrasi 3 provider AI mandiri, cache 5 menit configurable di `.env`, fail-safe JSON parsing, dan EOD AI pre-warming.

- [x] 11.1 Integrasi & Sanitasi OpenCode Zen & OpenRouter:
  - Dukungan penuh untuk OpenCode Zen (`https://opencode.ai/zen/v1`) dan OpenRouter (`https://openrouter.ai/api/v1`).
  - Normalisasi nama model dengan prefix `free/` dan penanganan token reasoning (`reasoning: {enabled: true}`).
- [x] 11.2 UI Triple-Provider Switcher:
  - Toggle pill 3 arah `[ ✨ Gemini ] [ ⚡ Zen ] [ 🌐 Router ]` di modal recovery dan dashboard.
- [x] 11.3 In-Memory & DB AI Caching (Configurable TTL):
  - Konfigurasi `AI_CACHE_TTL_SECONDS=300` (5 menit), `AI_MAX_TOKENS=2000`, `AI_TIMEOUT_SECONDS=45` di `backend/.env`.
  - Cache in-memory instan `_RECOVERY_DISCUSS_CACHE` untuk diskusi skenario recovery & Q&A.
  - Database caching ber-TTL untuk `AIAnalysis` di SQLite.
- [x] 11.4 Fail-Safe Multi-Stage JSON Extractor:
  - Ekstraksi tangguh terhadap CoT / reasoning models (Minimax, Cohere, Nemotron, Deepseek) dengan regex & partial recovery.
- [x] 11.5 EOD AI Pre-Warming:
  - Scheduler otomatis melakukan pre-computing analisis AI pasca-closing 17:30 WIB sehingga dashboard langsung terbuka instan tanpa jeda loading.
- [x] 11.6 Developer Tooling:
  - Pembuatan `Makefile` untuk manajemen server dev (`make dev`, `make dev-be`, `make dev-fe`, `make build`, dll).

---

## 💾 TAHAP 12 — AI Deep-Dive Database Persistence, Attribution Badges & Switch Debounce [SELESAI ✅]
> Persistensi analisis bedah skenario ke database lokal SQLite, badge visual AI attribution di modal & chat bubble, serta proteksi debounce switching provider.

- [x] 12.1 SQLite Table `RecoveryDeepDive` (`backend/models.py` & `models.py`):
  - Skema tabel `recovery_deepdives` dengan kolom `ticker`, `scenario_id`, `date`, `source`, `deep_dive_data`, dan constraint unik.
- [x] 12.2 Instant DB History Retrieval (0 Token & 0ms Latency):
  - Pengecekan riwayat database terlebih dahulu saat tombol *Bedah Logika & Diskusi AI* ditekan (`fromDb: true`).
  - Pemanggilan AI eksternal hanya dilakukan on-demand jika belum pernah dianalisis atau saat ada pertanyaan chat baru.
- [x] 12.3 Visual Attribution Badges (Modal Header & Chat History):
  - Badge provider di header modal (`Google Gemini AI`, `OpenCode Zen AI`, `OpenRouter AI`, `Rule-Based`) dan status cache `💾 Tersimpan di Database (0 Token)`.
  - Badge identitas penjawab pada setiap bubble chat assistant (`Dibalas oleh [Provider]`).
- [x] 12.4 Frontend Provider Switch Debounce:
  - Proteksi debounce timer (350ms) dan pelacakan request id di `frontend/app/recovery/page.tsx` saat beralih provider untuk mencegah spamming dan race conditions.
- [x] 12.5 On-Demand Retry Mechanism for Rule-Based Fallbacks:
  - Tombol `[ 🔄 Coba Lagi dengan AI ]` pada bubble chat yang dibalas oleh Rule-Based dan tombol `[ 🔄 Coba Ulang dengan AI ]` pada banner bedah skenario.
  - Parameter `force_refresh: true` untuk mem-bypass cache / DB dan memperbarui jawaban ke model AI pilihan.

---

## 🔀 TAHAP 13 — Dedicated 9Router Gateway Migration (Single Unified AI Engine) [SELESAI ✅]
> Migrasi seluruh integrasi LLM aplikasi ke 9Router AI Gateway lokal (`http://localhost:20128/v1`) sebagai satu-satunya provider AI utama.

- [x] 13.1 Konfigurasi & Konektivitas 9Router:
  - Integrasi endpoint OpenAI-compatible `http://localhost:20128/v1` dengan model `9router` dan autentikasi Bearer API Key di `backend/.env`.
  - Dukungan auto-routing 9Router ke 100+ model dan kompresi token hemat biaya.
- [x] 13.2 Penyederhanaan AI Engine Backend:
  - `backend/services/ai_copilot.py` dikonfigurasi untuk menjadikan 9Router sebagai satu-satunya provider aktif.
  - Penanganan payload non-streaming (`stream: False`), ekstraksi JSON CoT/reasoning, dan fallback transparan ke deterministic rule-based jika 9Router offline.
- [x] 13.3 Clean UI Stockbit Style:
  - Penyederhanaan panel AI Copilot ([`AICopilotPanel.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/AICopilotPanel.tsx)) dan modal diskusi ([`recovery/page.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/app/recovery/page.tsx)) dengan badge visual `[ ✨ 9Router AI ]`.
  - Penghapusan toggle switch yang tidak diperlukan demi tampilan antarmuka yang bersih dan terfokus.

---

## 💬 TAHAP 14 — Interactive Chat & Ephemeral Session Retention di AICopilotPanel [SELESAI ✅]
> Menambahkan opsi tanya jawab / chat interaktif langsung di panel AI Copilot ([`AICopilotPanel.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/AICopilotPanel.tsx)) atas rekomendasi yang diberikan, persistensi database per emiten, pembersihan saat reses EOD (17:30 WIB), dan reset riwayat saat analisa ulang.

- [x] 14.1 Database Model `CopilotChatLog` (`backend/models.py`):
  - Skema tabel `copilot_chat_logs` dengan kolom `ticker`, `role`, `message`, `source`, `session_date`, dan `created_at`.
- [x] 14.2 AI Copilot Q&A Discussion Engine (`backend/services/ai_copilot.py`):
  - Fungsi `discuss_copilot_recommendation` yang memanfaatkan konteks portofolio, indikator teknikal EOD, putusan rekomendasi, serta riwayat percakapan multi-turn.
  - Failover terintegrasi ke intelligent rule-based expert jika gateway AI offline / batas kuota tercapai.
- [x] 14.3 API Endpoints & Force Refresh Chat Wiping (`backend/routers/analysis.py`):
  - `GET /api/v1/analysis/{ticker}/chat-history`: Pengambilan riwayat chat sesi hari ini.
  - `POST /api/v1/analysis/{ticker}/chat`: Pengiriman pertanyaan baru dan penyimpanan respons.
  - `DELETE /api/v1/analysis/{ticker}/chat-history`: Pembersihan riwayat chat secara manual.
  - `POST /api/v1/analysis/{ticker}?force_refresh=true`: Pembersihan otomatis seluruh histori chat dan cache saat pengguna meminta analisis ulang.
- [x] 14.4 Siklus Pembersihan Otomatis saat Reses EOD (`backend/scheduler.py`):
  - `CopilotChatLog` otomatis dibersihkan bersama `RecoveryChatLog` saat market close hari bursa aktif (17:30 WIB) via `APScheduler`.
- [x] 14.5 Komponen UI Stockbit Clean Light Mode (`frontend/components/AICopilotPanel.tsx`):
  - Quick question chips dinamis sesuai rekomendasi (HOLD, CUT LOSS, AVERAGE DOWN, TRIM 50%).
  - Tampilan chat bubble rapi dengan Markdown rendering, badge transparansi provider (`9Router AI` / `Rule-Based`), dan tombol retry.
  - Input field responsif dengan keyboard submission (`Enter`) dan auto-scroll.
  - Tombol manual *Bersihkan Riwayat* dan reset otomatis pada tombol *Analisis Ulang*.

---

## 🎨 TAHAP 15 — Integrasi Komponen Resmi shadcn/ui & Radix UI Primitives [SELESAI ✅]
> Mengintegrasikan registry komponen resmi standar shadcn/ui (berbasis `@radix-ui/react-*` dan `class-variance-authority`) pada seluruh UI.

- [x] 15.1 Registry Komponen shadcn/ui di `frontend/components/ui/`:
  - [`button.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/button.tsx): Varian `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `emerald`.
  - [`badge.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/badge.tsx): Varian `default`, `secondary`, `destructive`, `outline`, `emerald`, `purple`, `amber`.
  - [`card.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/card.tsx): `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
  - [`scroll-area.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/scroll-area.tsx): `ScrollArea`, `ScrollBar` (Radix UI).
  - [`input.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/input.tsx): `Input` form control.
  - [`dialog.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/dialog.tsx): `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogClose`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` (Radix UI Dialog).
  - [`separator.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/separator.tsx): `Separator` (Radix UI).
  - [`label.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/label.tsx), [`select.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/select.tsx), [`alert.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/alert.tsx), [`sidebar.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/sidebar.tsx).

---

## 🧹 TAHAP 16 — Code Formatting & Prettier Integration [SELESAI ✅]
> Menambahkan Prettier dan plugin sorting import otomatis untuk standarisasi format kode frontend.

- [x] 16.1 Instalasi Prettier & Plugin: `prettier` dan `@trivago/prettier-plugin-sort-imports`.
- [x] 16.2 Konfigurasi & Ignore Files: [`.prettierrc`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/.prettierrc) & [`.prettierignore`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/.prettierignore).
- [x] 16.3 NPM Helper Scripts: `npm run format` & `npm run format:check`.

---

## 🏗️ TAHAP 17 — Penghapusan Journal & Refaktorisasi Modular Frontend [SELESAI ✅]
> Penghapusan halaman journal yang tidak esensial, refaktorisasi modular seluruh halaman utama (max 500 lines), pembuatan custom hooks & subkomponen shadcn/ui.

- [x] 17.1 Penghapusan Halaman & Router Trading Journal:
  - Penghapusan `frontend/app/journal/page.tsx`, `backend/routers/journal.py`, dan model/service terkait.
  - Pembersihan link navigasi sidebar dan method API client.
- [x] 17.2 Refaktorisasi Modular Screener Page (`frontend/app/screener/page.tsx` $\le$ 50 baris):
  - Ekstraksi ke subkomponen `components/screener/` (`ScreenerToolbar`, `ScreenerCardView`, `ScreenerTableView`, `ScreenerCardItem`, `ScreenerAIDiscussion`, `ScreenerCustomAnalyzer`, `ScreenerEmptyState`, `ScreenerPhilosophyCard`, `ScreenerKamusModal`).
  - Ekstraksi helper ke `screenerUtils.ts` dan custom hooks `useScreener.ts` & `useScreenerDiscussion.ts`.
- [x] 17.3 Refaktorisasi Modular Guide Page (`frontend/app/guide/page.tsx` $\le$ 50 baris):
  - Ekstraksi ke subkomponen `components/guide/` (`GuideHeroBanner`, `GuideTabNav`, `GuideFlowTab`, `GuideFeaturesTab`, `GuideStatusDictionaryTab`, `GuideRiskRulesTab`, `GuideChecklistTab`).
  - Ekstraksi state & tabs ke custom hook `useGuide.ts`.
- [x] 17.4 Verifikasi Kualitas & Build:
  - 100% lolos `npm run format:check` dan `npm run build` static export.

---

## 🎛️ TAHAP 18 — Unified Dashboard Action View & View Switcher [SELESAI ✅]
> Menggabungkan Smart Action Cards dan Daily Action Sheet menjadi satu antarmuka terpadu di Dashboard dengan View Switcher (Cards ⊞ / Table ☰), pengurutan prioritas urgensi otomatis, dan akses aksi interaktif lengkap (Chart & AI Copilot).

- [x] 18.1 Eliminasi Redundansi Tampilan Dashboard:
  - Menggabungkan daftar kartu bertingkat dan tabel menjadi satu section utama "Keputusan & Status Aksi Saham".
- [x] 18.2 Segmented Toggle View Switcher:
  - Tombol pengalih mode tampilan Stockbit Clean (Mode Kartu ⊞ / Mode Tabel ☰) di header section.
- [x] 18.3 Penyelarasan Fitur & Aksi Interaktif:
  - Penambahan tombol *Buka Chart* (`LineChart`) dan *AI Copilot* (`Sparkles`) pada setiap baris tabel `DailyActionSheet`.
  - Penempatan tombol cepat *Kirim Telegram* di header section utama.
- [x] 18.4 Pengurutan Prioritas Urgensi Konsisten:
  - Penyelarasan `PRIORITY_MAP` (#1 Cut Loss s/d #7 Hold) untuk kedua mode tampilan.
- [x] 18.5 Pembaruan Dokumentasi:
  - Pembaruan deskripsi fitur Dashboard pada `README.md` dan `TODO.md`.

---

## 💼 TAHAP 19 — Portfolio Management Upgrade, @base-ui/react Dropdown & Auto-Sync Balance [SELESAI ✅]
> Peningkatan menyeluruh halaman portofolio: Edit Trading Plan, KPI Metrics Bar, Filter & Sorting Tabel, Dropdown Menu Aksi berbasis `@base-ui/react`, Smart Averaging (Tambah Lot), dan Sinkronisasi Saldo Kas RDN Otomatis.

- [x] 19.1 Standarisasi Headless Primitives `@base-ui/react`:
  - Seluruh komponen shadcn/ui wajib menggunakan `@base-ui/react` (ditambahkan aturan baku di `AGENTS.md` Rule 10).
  - Implementasi komponen [`dropdown-menu.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/dropdown-menu.tsx) berbasis `@base-ui/react/menu`.
- [x] 19.2 Dropdown Menu pada Kolom Aksi Tabel Portofolio:
  - Pengubahan kolom aksi menjadi dropdown menu rapi (*Beli Lagi, Jual/Pangkas Lot, Buka Chart, Edit Trading Plan, Hapus Saham*).
- [x] 19.3 Modal Edit Trading Plan ([`EditHoldingModal.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/portfolio/EditHoldingModal.tsx)):
  - Edit parameter harga rata-rata, lot, target profit, stop loss, sektor, dan alasan beli secara langsung.
- [x] 19.4 Portfolio KPI Summary Metrics Bar ([`PortfolioMetricsBar.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/portfolio/PortfolioMetricsBar.tsx)):
  - 4 kartu metrik di bagian atas: Total Portofolio (Aset), Modal Beli (Cost Basis), Floating PnL, dan Saldo Kas RDN.
- [x] 19.5 Smart Averaging (Tambah Lot Otomatis):
  - Form tambah saham mendeteksi emiten aktif, menghitung harga rata-rata baru secara *real-time*, dan menggabungkan lot di database tanpa duplikasi baris.
- [x] 19.6 Sinkronisasi Saldo Kas RDN Otomatis:
  - Pembelian memotong kas otomatis dan penjualan menambahkan dana penjualan otomatis ke saldo kas RDN.
- [x] 19.7 Interactive Scale-Out Matrix & Filter Tabs:
  - Dropdown pilihan emiten aktif untuk simulasi nilai real profit taking bertahap.
  - Tab filter cepat (`Semua`, `Trading`, `Investasi`) dan sorting kolom interaktif.

---

## ⚡ TAHAP 20 — Smart Dynamic Target Label & Exit Rebound Mode [SELESAI ✅]
> Penerapan label dinamis cerdas untuk membedakan target di atas modal (🎯 Target Profit / TP) dengan target teknikal di bawah modal saat posisi terkoreksi (⚡ Target Exit Rebound / ER) di seluruh UI dan logika AI TP/SL.

- [x] 20.1 Deteksi Otomatis Mode Exit Rebound di Backend ([`ai_tp_sl.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/services/ai_tp_sl.py)):
  - Jika resisten teknikal 20 hari berada di bawah harga modal beli (`tp < avg_price`), sistem otomatis mengklasifikasikan sebagai `EXIT_REBOUND` dengan rasional objektif untuk meminimalkan kerugian saat harga memantul.
  - Menyediakan alternatif target profit murni (`profitTargetAlt` = +10% dari modal) bagi pengguna yang ingin target di atas modal.
- [x] 20.2 Decision Matrix & Proximity Alerts Exit Rebound ([`portfolio_engine.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/services/portfolio_engine.py)):
  - Status `EXIT_REBOUND` saat harga menyentuh target exit dan `ER_PROXIMITY_WARNING` saat mendekati target exit ($\le 2\%$).
- [x] 20.3 Smart Dynamic Badge di UI Frontend:
  - **Portfolio Table** & **Dashboard Action Cards**: Otomatis menampilkan badge amber `⚡ Exit Rebound: Rp xxx` saat target $<$ modal, dan badge emerald `🎯 TP: Rp xxx` saat target $\ge$ modal.
  - **TradingView Candlestick Chart**: Menyesuaikan label horizontal price line (`Exit Rebound` vs `Target`) dan warna garis secara dinamis.
  - **Modal Add/Edit Trading Plan**: Menampilkan notifikasi transparan jika target resisten di bawah modal dan tombol cepat satu klik untuk memilih antara *Gunakan Exit Rebound* atau *Gunakan Target Profit +10%*.

---

## 🧩 TAHAP 21 — Strict Single-Component Architecture & Dialog Animation Optimization [SELESAI ✅]
> Penerapan standar ketat "1 File = 1 Komponen JSX", eliminasi cascading render warnings (`useEffect` `setState`), serta pelestarian siklus animasi penutup (*exit transitions*) pada seluruh dialog modal (`@base-ui/react`).

- [x] 21.1 Refaktorisasi 1 File = 1 Komponen JSX:
  - `AddHoldingModal.tsx`: Penggabungan seluruh dialog tambah saham & averaging ke 1 komponen tunggal.
  - `EditHoldingModal.tsx`: Penggabungan seluruh form edit plan ke 1 komponen tunggal.
  - `SellHoldingModal.tsx`: Penggabungan kalkulasi pangkas/jual lot ke 1 komponen tunggal.
  - `EditBalanceModal.tsx`: Penggabungan form modal saldo kas RDN ke 1 komponen tunggal.
- [x] 21.2 Pola Sinkronisasi State Bebas Efek (*Render-Time State Adjustment*):
  - Menggantikan `useEffect` synchronous `setState` dengan pola React resmi pelacakan perubahan prop (`isOpen !== prevIsOpen` / `holding.id !== prevHoldingId`).
  - Menghilangkan 100% potensi cascading render warnings di React compiler.
- [x] 21.3 Pelestarian Animasi Dialog (`@base-ui/react`):
  - Menghapus conditional unmounting `{isOpen && ...}` dan `if (!isOpen) return null` agar siklus transisi keluar (`data-[state=closed]:animate-out`, `fade-out-0`, `zoom-out-95`) berjalan mulus dan tuntas.
- [x] 21.4 Error Alert Fallback pada Candlestick Chart:
  - Penambahan `<Alert variant="destructive">` pada [`CandlestickChart.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/CandlestickChart.tsx) bila data histori harga tidak tersedia / gagal dimuat.

---

## 🩺 TAHAP 22 — AI Tri-Scenario Recovery Engine & 3-Mode Lot Averaging Calculator [SELESAI ✅]
> Peningkatan menyeluruh modul Recovery Engine: 3 skenario rekomendasi AI otomatis (Cut Loss, Average Down, Hold), sistem keyakinan 1–10, skill workspace CLI Antigravity, serta transformasi Kalkulator Penambahan Lot 3 Mode (Jumlah Lot, Target Avg, Anggaran Kas) dengan shadcn/ui `@base-ui/react` Tabs.

- [x] 22.1 AI Tri-Scenario Recovery Recommendation Engine ([`ai_copilot.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/services/ai_copilot.py)):
  - 3 skenario simultan: *Cut Loss* (pangkas 50%/100%), *Precision Average Down*, dan *Hold for Exit Rebound*.
  - Skor keyakinan objektif 1–10 per skenario, saran alokasi lot riil, alasan teknikal & fundamental.
  - Multi-tagging rekomendasi (bisa merekomendasikan >1 skenario untuk kombinasi strategi).
  - Kolom `recovery_recommendation` pada tabel `ai_analysis` SQLite.
  - Failover transparan ke deterministic rule-based engine bila AI offline/rate limited.
- [x] 22.2 Workspace Skills Antigravity ([`.agents/skills/idx-recovery-plan/`](file:///Users/donidarmawan/Documents/me/assiten-saham/.agents/skills/idx-recovery-plan/)):
  - Script CLI `sync_recovery.py` untuk pemindaian kerugian, penentuan 3 skenario AI, dan visual confidence bar terminal.
  - Pembaruan `sync_eod.py` untuk sinkronisasi saldo kas dinamis dan trigger generate recovery recommendation otomatis pasca-closing.
- [x] 22.3 Kalkulator Penambahan Lot & Averaging 3 Mode ([`AverageDownCalculatorCard.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/recovery/AverageDownCalculatorCard.tsx)):
  - **Mode 1 (Jumlah Lot)**: Input harga beli + jumlah lot tambahan $\rightarrow$ output total lot, modal tambahan, dan avg price baru.
  - **Mode 2 (Target Avg)**: Input harga beli + target avg price baru $\rightarrow$ output lot bulat minimum ($\lceil \dots \rceil$) dan modal yang dibutuhkan.
  - **Mode 3 (Anggaran Modal)**: Input harga beli + budget kas (Rp) $\rightarrow$ output lot bulat maksimal ($\lfloor \dots \rfloor$), modal terpakai, dan sisa kas.
  - **Alert Pecahan Budget & Auto-Update**: Notifikasi informatif jika modal menghasilkan sisa kas dengan tombol cepat *⚡ Sesuaikan Input* atau *➕ Tambah Lot*.
  - **Standar Resmi shadcn/ui Tabs**: Komponen [`tabs.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/tabs.tsx) berbasis `@base-ui/react` dengan warna aktif kontras spesifik per mode (Purple, Blue, Emerald).

---

## 🔍 TAHAP 23 — EOD Screener Revamp: Top 10 Fundamental Picks, 1–10 AI Score, Expanded Rows & AI Discussion [SELESAI ✅]
> Revamp total modul EOD Stock Screener (`/screener`): Pemindaian kurasi Top 10 saham terbaik dengan 4 metrik fundamental (Market Cap, Free Float %, ROE %, DER), skala penilaian skor keyakinan AI 1–10, ulasan objektif AI hibrida teknikal-fundamental, layout tabel expanded row modular, serta panel diskusi AI interaktif multi-turn.

- [x] 23.1 Kurasi Top 10 Rekomendasi & 4 Metrik Fundamental ([`screener_engine.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/services/screener_engine.py) & [`data_fetcher.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/services/data_fetcher.py)):
  - Fungsi `fetch_stock_fundamentals(ticker)` menarik data Market Cap, Free Float %, ROE %, DER, Sektor, dan Nama Emiten dari Yahoo Finance.
  - Skala Skor Keyakinan AI 1–10 (`conviction_score`) terbobot teknikal (MA, RSI, Breakout) dan fundamental (ROE > 10%, DER < 1.5x, Likuiditas Market Cap).
  - Algoritma `scan_market_pool(db, top_n=10)` memfilter dan menyajikan 10 saham terbaik berdasarkan skor AI tertinggi.
- [x] 23.2 Integrasi Informasi Lengkap Saham & Perubahan Nominal ([`routers/screener.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/routers/screener.py) & [`types/index.ts`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/types/index.ts)):
  - Serialisasi data lengkap: Kode Ticker & Nama Emiten, Jenis Saham (Sektor), Harga Terakhir & Biaya per Lot (`Rp {price * 100}/lot`), Perubahan Harga Nominal Rupiah (`change_nominal`) & Persentase (`change_pct`), RSI(14), Skor Keyakinan 1–10, AI Reason, dan 4 Pill Fundamental (Market Cap terformat, Free Float %, ROE %, DER).
- [x] 23.3 Expanded Row Layout pada Tabel Screener ([`ScreenerTableView.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/screener/ScreenerTableView.tsx)):
  - Baris utama tetap ringkas & compact (7 kolom: `# Ticker`, `Harga Close`, `Perubahan`, `RSI`, `Risk:Reward`, `Skor AI`, `Aksi`).
  - Sektor/Jenis Saham, 4 Pill Fundamental, dan Level Trading (Area Beli, Target TP, Stop Loss) dipindahkan secara elegan ke **Expanded Rows** (`colSpan={7}`) di atas panel diskusi AI.
- [x] 23.4 Diskusi AI Multi-Turn Terkontekstualisasi ([`ScreenerAIDiscussion.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/screener/ScreenerAIDiscussion.tsx) & [`ai_copilot.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/services/ai_copilot.py)):
  - Chat interaktif per emiten untuk membedah alasan rekomendasi AI dan menjawab pertanyaan spesifik pengguna (*"Kenapa masuk rekomendasi?", "Bisa beli besok?", "Bagaimana prospek fundamental & dividen?", "Apakah utang aman?"*).
  - Snapshot strip 4 metrik fundamental di header chat dan tombol pertanyaan cepat.
  - Tombol **`[ 🗑️ Hapus Chat ]`** untuk membersihkan riwayat chat per emiten secara instan.
  - Tombol & Alert **`[ 🔄 Coba Ulang dengan AI / Hubungkan AI Lagi ]`** otomatis jika respons berasal dari *Rule-Based Expert Engine*.
  - Terhubung ke tabel `screener_chat_logs` lokal SQLite dengan retensi siklus trading dan auto-purge saat *Scan Sinyal EOD*.
- [x] 23.5 On-Demand Custom Stock Analyzer & Budget Filter ([`useScreener.ts`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/hooks/useScreener.ts) & [`page.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/app/screener/page.tsx)):
  - Input kode ticker apa saja (misal `MEDC`, `BREN`, `PGAS`) untuk analisis instan 3 bulan dengan skor 1-10 dan indikator fundamental lengkap.
  - Budget Filter Bar (`≤ Rp 2.000`, `≤ Rp 1.000`, `≤ Rp 500`, `Semua`) dan instant in-memory client-side sorting.
- [x] 23.6 Workspace Skill Antigravity ([`.agents/skills/idx-eod-screener/`](file:///Users/donidarmawan/Documents/me/assiten-saham/.agents/skills/idx-eod-screener/)):
  - Script CLI `scan_screener.py` untuk pemindaian pool saham likuid BEI, filter strategi (`BREAKOUT`, `VALUE`, `OVERSOLD`), filter anggaran harga maksimal (`--max-price`), serta analisis on-demand kode ticker apa saja (`--ticker`).
  - Output visual terminal: Confidence bar Skor AI 1–10, badge kesesuaian profil (`⚡ Cocok Trading`, `🏛️ Cocok Investasi`, `✨ Trading & Investasi`), 4 metrik fundamental (MC, Float %, ROE %, DER), level transaksi (Area Beli, TP, SL), dan estimasi modal per lot.
- [x] 23.7 Tipografi Global & Perbaikan Hidrasi DOM ([`globals.css`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/app/globals.css) & [`badge.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/ui/badge.tsx)):
  - Pengaturan basis font root `html { font-size: 18px; }` sehingga `1rem = 18px` untuk skala tampilan yang lebih jelas dan nyaman dibaca (+12.5%).
  - Refactoring elemen komponen `Badge` dari `<div>` ke `<span>` semantik untuk mencegah React Hydration Error (*In HTML, <div> cannot be a descendant of <p>*).

---

## 🔬 TAHAP 24 — Kalibrasi RSI Wilder, Resilience Launcher & Unified 9Router Config [SELESAI ✅]
> Kalibrasi standar perhitungan RSI 14-hari menggunakan J. Welles Wilder's Exponential Smoothing (RMA), ketahanan peluncur aplikasi desktop macOS terhadap proses zombie, serta unifikasi konfigurasi environment ke `backend/.env`.

- [x] 24.1 Kalibrasi RSI Wilder's Smoothing ([`technical.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/services/technical.py) & [`ai_tp_sl.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/services/ai_tp_sl.py)):
  - Menggantikan Simple Moving Average (SMA) dengan Exponential Moving Average berbobot Wilder (`ewm(alpha=1/14, min_periods=14, adjust=False)`) agar sesuai dengan standar industri TradingView, Yahoo Finance, dan Google Finance.
- [x] 24.2 Ketahanan Launcher & Auto-Shutdown Cleanup ([`start_app.sh`](file:///Users/donidarmawan/Documents/me/assiten-saham/start_app.sh) & [`system.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/routers/system.py)):
  - Penambahan parameter `--connect-timeout 2 --max-time 3` pada health check `curl` agar launcher tidak menggantung (*hang*) saat ada proses zombie.
  - Implementasi fungsi `safe_exit()` yang secara aman menghentikan seluruh grup proses supervisor Uvicorn saat auto-shutdown aktif.
- [x] 24.3 Unifikasi Konfigurasi Environment ([`database.py`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/database.py) & [`backend/.env`](file:///Users/donidarmawan/Documents/me/assiten-saham/backend/.env)):
  - Menjadikan `backend/.env` sebagai *single source of truth* konfigurasi aplikasi dan menghapus file duplikat `.env` di root folder.
- [x] 24.4 Peningkatan Antarmuka Screener & Aset Aplikasi:
  - Peningkatan ukuran teks respons percakapan AI di [`ScreenerAIDiscussion.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/screener/ScreenerAIDiscussion.tsx) dan *sticky header* pada kartu screener [`ScreenerCardItem.tsx`](file:///Users/donidarmawan/Documents/me/assiten-saham/frontend/components/screener/ScreenerCardItem.tsx).
  - Pemasangan dan penelusuran aset ikon aplikasi resmi macOS retina di `scripts/app.icns`.



