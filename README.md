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

### 2. 🧠 AI Decision Copilot Panel
* Evaluasi kondisi teknikal terkini (Close, MA20, MA50, RSI, Support/Resistance) terhadap **Avg Beli** dan **Trading Plan**.
* **Prinsip Transparansi AI**:
  - Menampilkan alert informatif jika API Key Gemini belum dipasang (lengkap dengan panduan setup).
  - Menampilkan alert jika batas kuota/token Gemini API telah habis (rate limit), tanpa memalsukan analisis.
  - Saat aktif, menghasilkan rekomendasi naratif mendalam dari model **Google Gemini 2.0 Flash**.

### 3. 💼 Portfolio & Trading Plan Management (`/portfolio`)
* **Diferensiasi Posisi**: Membedakan saham **Trading** (dengan proteksi Stop Loss ketat) dan **Investasi** (tanpa hard Stop Loss, fokus pada horizon panjang & dividen).
* **Auto-Fetch Sektor**: Otomatis menarik data sektor & industri resmi emiten langsung dari Yahoo Finance.
* **Money Management**: Visualisasi alokasi modal per sektor industri untuk memantau diversifikasi risiko.
* **Selling Engine**: Scale-Out Matrix (TP1 jual 50%, TP2 jual 25%, sisa 25% trailing stop).

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
* Pencatatan riwayat transaksi realised (*Win Rate*, *Profit Factor*, *Total Realized PnL*).
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

---

## 🎨 Filosofi Desain UI
* **Stockbit Clean Light Mode**: Latar putih bersih (`bg-slate-50` & `bg-white`), border abu-abu tipis presisi (`border-slate-200`), tipografi font mono untuk angka bursa, dan warna aksi tegas yang elegan tanpa neon.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Charts** | TradingView Lightweight Charts (v5) |
| **Backend API** | Python FastAPI, Uvicorn |
| **Database** | SQLite lokal (`assiten_saham.db`), SQLAlchemy ORM |
| **Data Market** | Yahoo Finance (`yfinance`) dengan format ticker `.JK` |
| **Technical Analysis** | Native Pandas (kompatibel penuh dengan Python 3.14 macOS) |
| **AI LLM** | Google Gemini 2.0 Flash (`google-generativeai`) |
| **Scheduler** | APScheduler (Senin–Jumat pukul 17:30 WIB) |

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Persiapan Backend (Python FastAPI)

```bash
cd backend

# Buat dan aktifkan virtualenv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Buat file konfigurasi environment
cp .env.example .env

# Jalankan server FastAPI
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend aktif di: `http://localhost:8000`
* Dokumentasi Interaktif Swagger UI: `http://localhost:8000/docs`

### 2. Persiapan Frontend (Next.js)

```bash
cd frontend

# Install packages
npm install

# Jalankan server Next.js development
npm run dev
```
* Frontend aktif di: `http://localhost:3000`

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

## 🔒 Konfigurasi API Key (`backend/.env`)

Edit file `backend/.env` untuk mengaktifkan fitur AI Copilot dan Notifikasi Telegram:

```env
# Google Gemini API Key (Dapatkan gratis di https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here

# Telegram Bot (Opsional — untuk notifikasi EOD ke smartphone)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

*(Catatan: Tanpa memasukkan API Key, seluruh kalkulasi teknikal, chart, portofolio, dan kalkulator average down tetap beroperasi 100% secara lokal).*

---

## 📚 Panduan AI Coding Agent
Bagi pengembang atau AI Agent yang melanjutkan pengembangan codebase ini, silakan merujuk ke instruksi baku di file [`AGENTS.md`](./AGENTS.md).
