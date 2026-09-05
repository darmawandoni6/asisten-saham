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

---

## 📌 TAHAP 6 — Integrasi Live AI LLM & Multi-Turn Conversational Memory [PLANNED ⏳]
> Menghubungkan Google Gemini 2.0 Flash secara live dan menyempurnakan memori percakapan multi-turn di chat recovery.

- [ ] 6.1 Konfigurasi Environment & Key Setup (`backend/.env` dengan `GEMINI_API_KEY`)
- [ ] 6.2 Integrasi Multi-Turn Chat Memory di Backend (`backend/routers/recovery.py` & `backend/services/ai_copilot.py` menerima array `chat_history`)
- [ ] 6.3 Pengiriman State `chatHistory` dari Frontend (`frontend/app/recovery/page.tsx` line 62) ke API
- [ ] 6.4 Handling Token Context Window & Pruning riwayat percakapan lama agar tetap hemat kuota
- [ ] 6.5 Uji Coba End-to-End percakapan multi-turn live dengan model Gemini 2.0 Flash


