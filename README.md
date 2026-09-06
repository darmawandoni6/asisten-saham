# 📈 Asisten Saham (IDX Decision Copilot)

Aplikasi **Asisten Saham** personal berbasis web yang dirancang khusus untuk memandu keputusan trading dan investasi saham di **Bursa Efek Indonesia (IDX/BEI)** pasca-penutupan pasar (End of Day / 17:30 WIB) secara disiplin, objektif, dan bebas dari bias emosi jam bursa.

---

## 🌟 Fitur Unggulan

### 1. 📊 Smart Decision Dashboard (`/`)
* **Kartu Keputusan Berwarna (5 Action Status)**:
  - 🔴 **SELL / CUT LOSS**: Harga closing menembus batas Stop Loss ketat.
  - 🟢 **TAKE PROFIT / TRIM**: Harga menyentuh target profit (disarankan amankan laba 50%).
  - 🟡 **HOLD / MONITOR**: Tren berjalan aman sesuai rencana trading.
  - 🟠 **TRAILING STOP WARNING**: Harga berbalik arah > 7% dari puncak tertinggi (*high watermark*).
  - 🟣 **RECOVERY MODE**: Saham trading yang mengalami floating loss > 10%.
  - 🔵 **AVERAGING DOWN REVIEW**: Saham investasi yang mengalami koreksi dalam (> 30%) untuk evaluasi cicil beli.
* **Daily Action Sheet**: Rangkuman urutan aksi prioritas pasca penutupan bursa untuk persiapan order esok pagi.

### 2. 🧠 Multi-Provider AI Decision Copilot Panel
* Evaluasi kondisi teknikal terkini (Close, MA20, MA50, RSI, Support/Resistance) terhadap **Avg Beli** dan **Trading Plan**.
* **Dukungan Multi-Provider LLM (Google Gemini & OpenCode Zen)**:
  - Pengguna dapat memilih model AI yang digunakan melalui **Provider Switcher Toggle** `[ ✨ Gemini ] [ ⚡ Zen ]` secara instan langsung di UI.
  - Mendukung **Google Gemini** (`gemini-3.5-flash-lite`) via Google AI Studio.
  - Mendukung **OpenCode Zen** (`nemotron-3.5-lightning-free`, `claude`, `deepseek`, dll.) via OpenAI-compatible endpoint (`https://opencode.ai/zen/v1`).
* **Prinsip Transparansi & Graceful Fallback AI**:
  - Menampilkan alert informatif jika API Key belum dipasang (lengkap dengan panduan setup).
  - Jika kuota/rate limit habis (HTTP 429), sistem otomatis dan transparan melakukan *failover* ke **Deterministic Rule-Based Expert Engine** tanpa crash atau error layar kosong.

### 3. 💼 Portfolio & Trading Plan Management (`/portfolio`)
* **Pencatatan Saldo Kas RDN Manual**: Saldo kas RDN dapat diinput dan diperbarui kapan saja secara manual sesuai saldo nyata rekening sekuritas via tombol `[ ✏️ Edit ]`.
* **Diferensiasi Posisi**: Membedakan saham **Trading** (dengan proteksi Stop Loss ketat) dan **Investasi** (tanpa hard Stop Loss, fokus pada horizon panjang & dividen).
* **Pangkas / Jual Lot Saham (`[ 🏷️ Jual ]`)**:
  - Modal interaktif untuk memangkas sebagian lot atau menutup seluruh posisi saham dengan preset cepat: **25%**, **50% (TP1 Kunci Profit)**, dan **100% (Exit Total)**.
  - Menghitung *real-time* total nilai transaksi, Realized PnL (nominal & %), dan sisa lot yang tersisa di portofolio.
  - Otomatis mencatat transaksi yang ditutup ke Jurnal Trading lengkap dengan evaluasi psikologi (*Disiplin*, *FOMO*, *Panic Sell*).
* **Auto-Fetch Sektor**: Otomatis menarik data sektor & industri resmi emiten langsung dari Yahoo Finance.
* **Money Management**: Visualisasi alokasi modal per sektor industri untuk memantau diversifikasi risiko.

### 4. 🛟 Recovery Engine & Floating Loss Assessment (`/recovery`)
* **Diagnosis Kerugian Komprehensif**: Mengukur kedalaman persentase minus, bobot emiten, dan dampaknya terhadap total portofolio.
* **4 Variabel Pengambil Keputusan (Decision Clarifier)**:
  - *Cash Feasibility Check*: Membandingkan kebutuhan modal cicil dengan saldo kas riil secara otomatis.
  - *Kesesuaian Profil*: Label kelayakan strategi spesifik untuk saham *Trading* vs *Investasi*.
  - *Checklist "PILIH OPSI INI JIKA"*: 3 poin kriteria acuan kapan harus memilih Skenario A, B, atau C.
  - *Snapshot Fundamental & Dividen*: Menampilkan Dividend Yield tahunan, P/E ratio, dan PBV untuk membentengi psikologi investor.
* **3 Skenario Penyelamatan AI**:
  - *Opsi A*: Cut Loss / Pangkas Posisi (amankan sisa modal jika breakdown Major Support).
  - *Opsi B*: Precision Average Down (cicil beli di Major Support saat RSI Oversold).
  - *Opsi C*: Hold for Rebound / Exit at BEP (tunggu pemantulan teknikal ke area Resistance MA20).
* **Kalkulator Average Down Presisi**: Menghitung secara matematis jumlah lot dan modal rupiah tambahan yang dibutuhkan untuk menurunkan harga rata-rata ke level impas yang diinginkan.
* **💬 Bedah Logika Skenario & Diskusi AI (Deep-Dive & Follow-Up Q&A)**:
  - Tombol **`"Bedah Logika & Diskusi AI"`** pada tiap kartu skenario.
  - Modal interaktif menyajikan 4 pilar analisis mendalam: Logika Utama, Batas Risiko & Invalidasi (Plan B), Arus Kas & Estimasi Waktu, serta Checklist Aksi Jam Bursa Besok Pagi.
  - Tanya jawab interaktif lanjutan (Q&A) dengan Gemini 2.0 Flash / Rule-Based Expert Engine.
* **🔎 Skala Tipografi Nyaman (+1x Scale-Up)**: Teks penjelasan, metrik, dan checklist aksi disesuaikan agar sangat ergonomis dan mudah dibaca di layar desktop/laptop.

### 5. 🔍 EOD Stock Screener & 3-Pilar Watchlist Intelijen (`/screener`)
* **Pusat Intelijen 3 Pilar (Bukan Tombol Beli Statis)**:
  - 💡 **Pilar 1 (Alasan Rekomendasi / Why Buy)**: Ulasan teknikal objektif berbasis data historis (status MA20/50, RSI oversold, momentum breakout).
  - 👁️ **Pilar 2 (Hal Wajib Dipantau Besok / Watch Trigger 09:00 WIB)**: Syarat objektif saat market buka pagi hari sebelum melakukan entry.
  - 🎯 **Pilar 3 (Panduan Level & Risk:Reward Ratio)**: Area beli ideal, Target TP, Stop Loss, dan rasio *Risk:Reward* (RRR) otomatis.
* **Client-Side (FE-Only) Sorting**: Pengurutan tabel super cepat tanpa beban query database pada seluruh kolom (Ticker, Strategi, Harga Close, Perubahan %, RSI, TP, SL, RRR, AI Score).
* **Top 10 Rekomendasi Terkurasi**: Pemindaian universe likuid BEI (LQ45 & saham aktif) pasca-closing market yang otomatis disortir dan dibatasi ke **Top 10 saham terbaik** berdasarkan AI Score tertinggi.
* **Analisis Saham Kustom (On-Demand)**: Pengguna dapat mengetik kode ticker BEI apa saja (contoh: `BREN`, `AMMN`, `PGAS`, `MEDC`) untuk langsung dianalisis kondisi teknikalnya dan dimasukkan ke daftar screener.
* **Quick Modal Bantuan (`[ℹ️ Kamus Badge]`) & Tooltips**: Pop-up interaktif untuk melihat formula strategi, matematika **Risk : Reward Ratio (RRR $\ge$ 1 : 2.0)**, dan arti tingkatan **AI Score (0–100)** secara instan.

### 6. 📔 AI Trading Journal & Post-Mortem (`/journal`)
* **Pencatatan Otomatis dari Portofolio**: Setiap eksekusi jual (Take Profit maupun Cut Loss) dari tabel portofolio otomatis masuk ke riwayat jurnal transaksi tanpa perlu input manual ulang.
* **Metrik Performa Realized**: Akumulasi *Total Realized PnL*, *Win Rate %*, dan *Profit Factor* dihitung otomatis secara akurat.
* **Post-Mortem AI Diagnosis**: Deteksi bias kebiasaan psikologis trader (*FOMO Buy, Panic Sell, Disiplin Plan*).

### 7. 📈 Interactive Candlestick Chart
* Grafik candlestick harian berbasis **TradingView Lightweight Charts v5**.
* Overlay garis teknikal **MA20** (amber), **MA50** (biru), garis **Avg Beli** (dashed grey), **Target Price** (solid green), dan **Stop Loss** (solid red).

### 8. 🧭 Panduan Cara Pakai & SOP Trading (`/guide`)
* Halaman panduan terintegrasi dengan 5 tab interaktif:
  - *Tab 1*: Siklus Rutinitas 17:30 WIB (Alur sore hingga jam buka bursa).
  - *Tab 2*: Panduan 5 Fitur Utama.
  - *Tab 3*: **Kamus Lengkap Badge & Glosarium** (Badge Screener, Kelayakan Recovery, 5 Warna Aksi Dashboard, dan Glosarium Istilah Pasar Modal).
  - *Tab 4*: SOP Anti-Nyangkut (4 Aturan Emas Manajemen Risiko).
  - *Tab 5*: Checklist Interaktif Pemula.

### 9. 🤖 Workspace Skill: `idx-eod-sync` (Antigravity Customization)
* Modul kemampuan AI terintegrasi di folder `.agents/skills/idx-eod-sync/`.
* Pengguna cukup mengetik di chat: *"Tolong update EOD hari ini"* atau *"Sync portofolio saya"*, AI secara otomatis akan menjalankan penarikan data Yahoo Finance, menghitung ulang indikator, dan memunculkan tabel evaluasi portofolio pasca-closing langsung di jendela chat.

### 10. ⚡ Ultra-Light Architecture & Auto-Shutdown (0 MB RAM saat Idle)
* **Single-Process FastAPI Port 8000**: Frontend Next.js di-export menjadi static web bundle (`frontend/out`) dan disajikan langsung oleh FastAPI. Server Node.js **tidak perlu berjalan di background** (hemat ~100MB RAM permanen).
* **Auto-Shutdown Heartbeat Engine**: Tab browser mengirim sinyal detak jantung berkala (`/api/v1/system/heartbeat`). Ketika seluruh tab browser ditutup selama $\ge 75$ detik, server otomatis mati secara bersih sehingga memori RAM kembali **0 MB (0% CPU)**.
* **macOS Desktop App Launcher (`Asisten Saham.app`)**: Aplikasi desktop 1-klik dengan ikon grafik candlestick Stockbit, siap disematkan di Dock atau Desktop untuk membuka aplikasi secara instan.

### 11. 📅 Kalender Bursa BEI & Retensi Chat Berbasis Siklus Trading
* **3-Layer Dynamic Holiday Engine**:
  - *Layer 1 (Empirical Ground Truth)*: Mengecek transaksi riil IHSG (`^JKSE`) via Yahoo Finance pada 17:30 WIB. Jika 0 transaksi, bursa otomatis terdeteksi libur walau ada revisi SKB 3 Menteri dadakan.
  - *Layer 2 (Dynamic Online Sync)*: Menyinkronkan kalender libur nasional terbaru dari feed API publik secara background.
  - *Layer 3 (Built-in Calendar)*: Memetakan kalender resmi BEI 2025–2026 secara offline.
* **Retensi Chat Siklus Trading (*Trading Cycle Retention*)**:
  - Riwayat chat recovery **tidak dihapus oleh pergantian hari kalender biasa**, melainkan bertahan sepanjang akhir pekan (Jumat sore s/d Senin 17:30 WIB) dan hari libur nasional.
  - Chat otomatis di-reset **hanya saat penutupan sesi pasar bursa aktif (17:30 WIB)**.
* **Live Market Status di Topbar**: Menampilkan badge status pasar BEI secara *real-time* (`🟢 Market Open (Sesi 1/2)`, `🟡 Istirahat Siang`, `⚪ Weekend (Pasar Tutup)`, atau `⚪ Libur: [Nama Libur]`).

---

## 🎨 Filosofi Desain UI
* **Stockbit Clean Light Mode**: Latar putih bersih (`bg-slate-50` & `bg-white`), border abu-abu tipis presisi (`border-slate-200`), tipografi font mono untuk angka bursa, dan warna aksi tegas yang elegan tanpa neon.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16 (Static Export), TypeScript, Tailwind CSS, Lucide Icons |
| **Charts** | TradingView Lightweight Charts (v5) |
| **Backend & Web Server** | Python FastAPI, Uvicorn (Port `8000`) |
| **Database** | SQLite lokal (`assiten_saham.db`), SQLAlchemy ORM |
| **Data Market** | Yahoo Finance (`yfinance`) dengan format ticker `.JK` |
| **Technical Analysis** | Native Pandas (kompatibel penuh dengan Python 3.14 macOS) |
| **AI LLM Engine** | Multi-Provider: **Google Gemini** (`gemini-3.5-flash-lite`) & **OpenCode Zen** (`nemotron-3.5-lightning-free`, `deepseek`, `claude`) |
| **Market Calendar** | 3-Layer Holiday Engine (BEI Calendar, Online API Sync & Empirical IHSG Check) |
| **Scheduler** | APScheduler (Senin–Jumat pukul 17:30 WIB holiday-aware) |
| **Memory Optimization** | Heartbeat Auto-Shutdown Daemon (0 MB RAM idle footprint) |


---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Cara Cepat (Desktop App 1-Klik)
* **Double-click** `Asisten Saham.app` di Desktop atau folder proyek.
* Server akan otomatis menyala dan browser langsung terbuka ke `http://localhost:8000`.
* Saat selesai, cukup **tutup tab browser**, server akan otomatis mati dalam 75 detik.

### 2. Cara Terminal / CLI (Mode Ultra-Light Single Process)

```bash
# Menjalankan server tunggal (FastAPI melayani API + Frontend)
./start_app.sh

# Mode Development dengan Hot-Reloading Next.js di :3000
./start_app.sh --dev

# Menghentikan server secara manual
./stop_app.sh

# Membangun ulang aset frontend statis jika ada perubahan kode UI
./build_app.sh
```
* Akses aplikasi: `http://localhost:8000`
* Dokumentasi API Swagger: `http://localhost:8000/docs`

### 3. Pemutakhiran Data Pasar EOD (3 Cara Fleksibel)

Data pasar BEI otomatis ditarik setiap Senin–Jumat pukul 17:30 WIB. Namun Anda dapat melakukan update manual kapan saja:

* **Cara 1 — Web Browser**: Klik tombol **`[🔄 Tarik EOD]`** di header kanan atas halaman mana saja.
* **Cara 2 — Antigravity Chat Skill**: Cukup ketik di chat: *"Tolong update EOD hari ini"*.
* **Cara 3 — Terminal / CLI**:
  ```bash
  # Update seluruh portofolio
  ./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py

  # Atau via cURL (saat server backend aktif)
  curl -s -X POST http://localhost:8000/api/v1/stocks/fetch-all
  ```

---

## 🔒 Konfigurasi API Key Multi-Provider (`backend/.env`)

Edit file `backend/.env` untuk mengaktifkan fitur AI Copilot (Google Gemini & OpenCode Zen) dan Notifikasi Telegram:

```env
# 1. Google Gemini API (Dapatkan gratis di https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# 2. OpenCode Zen API (Dapatkan di https://opencode.ai)
OPENCODE_API_KEY=sk-your_opencode_api_key_here
OPENCODE_MODEL=nemotron-3.5-lightning-free
OPENCODE_BASE_URL=https://opencode.ai/zen/v1

# 3. Default Active Provider ("gemini" | "opencode_zen")
AI_PROVIDER=gemini

# 4. Telegram Bot (Opsional — untuk notifikasi EOD ke smartphone)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

*(Catatan: Tanpa memasukkan API Key, seluruh kalkulasi teknikal, chart, portofolio, dan kalkulator average down tetap beroperasi 100% secara lokal dan transparan melalui Rule-Based Expert Engine).*


---

## 📚 Panduan AI Coding Agent
Bagi pengembang atau AI Agent yang melanjutkan pengembangan codebase ini, silakan merujuk ke instruksi baku di file [`AGENTS.md`](./AGENTS.md).
