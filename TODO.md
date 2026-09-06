# ✅ TODO — Asisten Saham

> Status: **Tahap 0–5 Selesai (Fullstack Operasional) 🚀 | Tahap 6: Live AI & Chat Memory [PLANNED ⏳]**
> Frontend: Next.js 16 + Stockbit Clean Light Mode (`http://localhost:3000`)
> Backend: FastAPI + SQLite + yfinance + EOD Skill (`http://localhost:8000`)

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
- [x] 1.8 Halaman Trading Journal (Performance Metrics, Post-Mortem AI, Trade Log)
- [x] 1.9 Candlestick Chart (TradingView Light Mode dengan MA20/MA50 overlay)

---

## ⚙️ TAHAP 2 — Backend Development [SELESAI ✅]
> Service, algoritma, dan API endpoints RESTful dengan data DB SQLite & yfinance.

- [x] 2.1 Virtualenv & Dependencies (FastAPI, SQLAlchemy, yfinance, apscheduler, numpy, pandas)
- [x] 2.2 Service: Data Fetcher (`services/data_fetcher.py` — yfinance helper untuk `.JK`)
- [x] 2.3 Service: Technical Analysis (`services/technical.py` — MA20, MA50, MA200, RSI, Support/Resistance)
- [x] 2.4 Router: Portfolio CRUD (`routers/portfolio.py` — GET, POST, PUT, DELETE holdings)
- [x] 2.5 Service: Portfolio Engine (`services/portfolio_engine.py` — Rule status 5 kartu & tracking high watermark)
- [x] 2.6 Router: Stocks & Chart (`routers/stocks.py` — GET /api/v1/dashboard, GET chart, manual fetch)
- [x] 2.7 Service: AI Copilot (`services/ai_copilot.py` & `routers/analysis.py` — Gemini 2.0 Flash + rule-based fallback)
- [x] 2.8 Service: Recovery Engine (`services/recovery_engine.py` & `routers/recovery.py` — Diagnosis & kalkulator avg down)
- [x] 2.9 Service: Screener Engine (`services/screener_engine.py` & `routers/screener.py` — Filter Oversold, Breakout, Value)
- [x] 2.10 Scheduler & Telegram Bot (`scheduler.py` & `services/telegram_bot.py` — Cron EOD 17:30 WIB)
- [x] 2.11 Trading Journal BE (`routers/journal.py` — CRUD trade log & AI post-mortem)

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
- [x] 3.8 Trading Journal terhubung ke `/api/v1/journal`
- [x] 3.9 Verifikasi seluruh alur kerja end-to-end (Backend port 8000 + Frontend port 3000)

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
- [x] 5.8 EOD Screener Top 10 Rekomendasi Terkurasi & Analisis Saham Kustom On-Demand (`/screener`)
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

## 💰 TAHAP 9 — Manual Trading Balance, Lot Management & Trading Journal Sync [SELESAI ✅]
> Pencatatan saldo kas RDN manual, manajemen pemangkasan lot saham di portofolio, dan pencatatan riwayat Realized PnL ke jurnal.

- [x] 9.1 Saldo Kas RDN Manual: Diinput dan diedit mandiri oleh user via `EditBalanceModal.tsx` (`user_settings` key `cash_balance`).
- [x] 9.2 Modal Jual / Pangkas Lot Saham (`SellHoldingModal.tsx`):
  - Dukungan hapus total (100%) atau pangkas sebagian lot (preset 25%, 50% TP1, 100%).
  - Kalkulasi *live* nilai transaksi, Realized PnL nominal & persentase, serta sisa lot di portofolio.
  - Tagging evaluasi psikologi (*Disiplin Plan*, *FOMO Buy*, *Panic Sell*) & catatan refleksi trader.
- [x] 9.3 Pencatatan Otomatis ke AI Trading Journal (`/journal`):
  - Setiap eksekusi jual (Gain / Loss) otomatis masuk ke `TradeLog` (`trade_log`).
  - Rekalkulasi metrik performa Post-Mortem (*Win Rate %*, *Total Realized PnL*, *Profit Factor*).
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




