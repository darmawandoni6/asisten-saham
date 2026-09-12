# 📈 Asisten Saham (IDX Decision Copilot)

Aplikasi **Asisten Saham** personal berbasis web yang dirancang khusus untuk memandu keputusan trading dan investasi saham di **Bursa Efek Indonesia (IDX/BEI)** pasca-penutupan pasar (End of Day / 17:30 WIB) secara disiplin, objektif, dan bebas dari bias emosi jam bursa.

---

## 🌟 Fitur Unggulan

### 1. 📊 Smart Decision Dashboard (`/`)
* **Unified Action Decisions & View Switcher (Cards ⊞ / Table ☰)**:
  - Menggabungkan kartu visual (*Smart Action Cards*) dan lembar prioritas harian (*Daily Action Sheet*) menjadi satu antarmuka terpadu tanpa redundansi.
  - Pengguna bebas berganti mode antara **Tampilan Kartu (Visual Grid)** dan **Tampilan Tabel (Action Sheet Ringkas)** dengan 1-klik toggle switcher.
* **Pengurutan Prioritas Urgensi Otomatis**:
  - Seluruh saham di portofolio otomatis diurutkan berdasarkan tingkat urgensi eksekusi harian:
    - 🔴 **SELL / CUT LOSS**: Harga closing menembus batas Stop Loss ketat.
    - 🟠 **SIAGA 1 (DEKAT STOP LOSS)**: Jarak harga ke Stop Loss $\le 2\%$, siaga pasang stop order otomatis di sekuritas.
    - 🟠 **TRAILING STOP WARNING**: Harga berbalik arah > 7% dari puncak tertinggi (*high watermark*).
    - 🟣 **RECOVERY MODE / AVERAGING DOWN REVIEW**: Saham yang mengalami floating loss dalam untuk evaluasi pemulihan modal.
    - 🟡 **EXIT REBOUND**: Harga menyentuh target resisten di bawah modal untuk meminimalkan kerugian saat pantulan (*Cut on Strength*).
    - 🟡 **PERSIAPAN EXIT REBOUND**: Jarak harga ke Target Exit Rebound $\le 2\%$.
    - 🟢 **TAKE PROFIT / TRIM**: Harga menyentuh target profit (disarankan amankan laba 50% lot).
    - 🔵 **PERSIAPAN TAKE PROFIT**: Jarak harga ke target TP $\le 2\%$.
    - ⚪ **HOLD / MONITOR**: Tren berjalan aman sesuai rencana trading.
* **Fitur Aksi Lengkap pada Semua Mode**:
  - Akses interaktif **Buka Candlestick Chart** (MA20/MA50 overlay) dan **AI Copilot** tersedia secara setara di mode Kartu maupun mode Tabel.
  - Tombol cepat **Kirim Notifikasi Telegram** di header section untuk mengirimkan ringkasan aksi harian ke bot Telegram.

### 2. 🧠 AI Decision Copilot Panel (Custom OpenAI-Compatible Gateway)
* Evaluasi kondisi teknikal terkini (Close, MA20, MA50, RSI, Support/Resistance) terhadap **Avg Beli** dan **Trading Plan**.
* **Integrasi OpenAI-Compatible LLM Gateway Bebas Provider**:
  - Mendukung provider apa saja (OpenAI, 9Router, Ollama, Groq, OpenCode, LiteLLM, vLLM, Local LLM) via endpoint standar `/chat/completions`.
  - Pengguna bebas mengonfigurasi `AI_API_KEY`, `AI_MODEL`, dan `AI_BASE_URL` sesuai kebutuhan.
  - *Hot-reload* konfigurasi environment `.env` secara instan tanpa perlu me-restart server.
* **Prinsip Transparansi & Graceful Fallback AI**:
  - Menampilkan alert informatif jika API Key atau service AI belum aktif.
  - Jika kuota/rate limit habis (HTTP 429) atau endpoint offline, sistem otomatis dan transparan melakukan *failover* ke **Deterministic Rule-Based Expert Engine** (`source: "rule_based"`) tanpa crash atau error layar kosong.

### 3. 💼 Portfolio & Trading Plan Management (`/portfolio`)
* **KPI Metrics Summary Bar**: 4 kartu ringkasan portofolio di bagian atas: Total Portofolio (Aset), Modal Beli (Cost Basis), Floating PnL, dan Saldo Kas RDN.
* **Bantuan AI TP/SL Cerdas & Mode Exit Rebound**:
  - Algoritma menghitung resisten 20 hari & support 50 hari dari 200 hari data historis bursa.
  - **Smart Dynamic Target**: Jika resisten berada di atas modal beli, sistem memberi label **🎯 TP (Target Profit)**. Jika resisten di bawah modal (posisi minus), sistem otomatis mengubah label menjadi **⚡ Exit Rebound** dengan alasan objektif meminimalkan kerugian saat harga memantul.
  - Menyediakan tombol pilihan 1-klik: *Gunakan Exit Rebound* (tekan rugi) atau *Gunakan Target Profit +10%* (di atas modal).
* **Smart Averaging (Tambah Lot Otomatis)**: Jika ticker yang diinput sudah ada di portofolio, sistem otomatis menggabungkan lot, menghitung harga rata-rata tertimbang baru (*weighted average*), dan mencatat transaksi ke log.
* **Sinkronisasi Saldo Kas RDN Otomatis**: Pembelian memotong kas otomatis dan penjualan menambahkan seluruh hasil penjualan ke kas RDN (penyesuaian manual tetap didukung via modal `[ ✏️ Edit ]`).
* **Dropdown Menu Aksi & Filter Tabel**: Kolom aksi rapi berbasis `@base-ui/react` (*Beli Lagi, Jual/Pangkas Lot, Buka Chart, Edit Plan, Hapus Saham*) lengkap dengan tab filter cepat (`Semua`, `Trading`, `Investasi`) dan sorting kolom instan.
* **Interactive Scale-Out Matrix**: Dropdown pilihan saham untuk simulasi interaktif mengunci keuntungan bertahap (TP1 50% Lot).
* **Diferensiasi Posisi**: Membedakan saham **Trading** (dengan proteksi Stop Loss ketat) dan **Investasi** (tanpa hard Stop Loss, fokus pada horizon panjang & dividen).
* **Pangkas / Jual Lot Saham (`[ 🏷️ Jual ]`)**:
  - Modal interaktif untuk memangkas sebagian lot atau menutup seluruh posisi saham dengan preset cepat: **25%**, **50% (TP1 Kunci Profit)**, dan **100% (Exit Total)**.
  - Menghitung *real-time* total nilai transaksi, Realized PnL (nominal & %), dan sisa lot yang tersisa di portofolio.
* **Auto-Fetch Sektor**: Otomatis menarik data sektor & industri resmi emiten langsung dari Yahoo Finance.
* **Money Management Sektor**: Visualisasi alokasi modal per sektor industri untuk memantau diversifikasi risiko.

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
* **Filter Anggaran Terjangkau (Budget Filter Bar)**: Pilihan filter cepat khusus modal terukur (**`≤ Rp 2.000 (Default)`**, **`≤ Rp 1.000`**, **`≤ Rp 500`**, dan **`Semua Harga`**), lengkap dengan label estimasi modal riil per lot (**`Rp {price * 100}/lot`**) pada tampilan Kartu maupun Tabel.
* **Pusat Intelijen 3 Pilar (Bukan Tombol Beli Statis)**:
  - 💡 **Pilar 1 (Alasan Rekomendasi / Why Buy)**: Ulasan teknikal objektif berbasis data historis (status MA20/50, RSI oversold, momentum breakout).
  - 👁️ **Pilar 2 (Hal Wajib Dipantau Besok / Watch Trigger 09:00 WIB)**: Syarat objektif saat market buka pagi hari sebelum melakukan entry.
  - 🎯 **Pilar 3 (Panduan Level & Risk:Reward Ratio)**: Area beli ideal, Target TP, Stop Loss, dan rasio *Risk:Reward* (RRR) otomatis.
* **Client-Side (FE-Only) Sorting**: Pengurutan tabel super cepat tanpa beban query database pada seluruh kolom (Ticker, Strategi, Harga Close, Perubahan %, RSI, TP, SL, RRR, AI Score).
* **Top 25 Rekomendasi Terkurasi & Universe Likuid Terjangkau**: Pemindaian universe saham likuid BEI (termasuk emiten berfundamental sehat di bawah Rp 2.000 seperti `MBMA`, `ENRG`, `IATA`, `BRIS`, `AKRA`, `SIDO`, `DEWA`, `BUMI`, `ELSA`, `ERAA`, `MAPA`, `BBTN`) pasca-closing market yang otomatis disortir berdasarkan AI Score tertinggi.
* **Analisis Saham Kustom (On-Demand)**: Pengguna dapat mengetik kode ticker BEI apa saja (contoh: `BREN`, `AMMN`, `PGAS`, `MEDC`) untuk langsung dianalisis kondisi teknikalnya dan dimasukkan ke daftar screener.
* **Quick Modal Bantuan (`[ℹ️ Kamus Badge]`) & Tooltips**: Pop-up interaktif untuk melihat formula strategi, matematika **Risk : Reward Ratio (RRR $\ge$ 1 : 2.0)**, dan arti tingkatan **AI Score (0–100)** secara instan.

### 6. 📈 Interactive Candlestick Chart
* Grafik candlestick harian berbasis **TradingView Lightweight Charts v5**.
* Overlay garis teknikal **MA20** (amber), **MA50** (biru), garis **Avg Beli** (dashed grey), **Target Price** (solid green), dan **Stop Loss** (solid red).

### 7. 🧭 Panduan Cara Pakai & SOP Trading (`/guide`)
* Halaman panduan terintegrasi dengan 5 tab interaktif:
  - *Tab 1*: Siklus Rutinitas 17:30 WIB (Alur sore hingga jam buka bursa).
  - *Tab 2*: **Panduan 4 Fitur Utama & SOP 4 Langkah Memilih Saham di Screener** (Filter Anggaran, Pilih Strategi, 3 Pilar Intelijen, Order Disiplin di Sekuritas).
  - *Tab 3*: **Kamus Lengkap Badge & Glosarium** (Badge Screener, Kelayakan Recovery, 5 Warna Aksi Dashboard, dan Glosarium Istilah Pasar Modal).
  - *Tab 4*: SOP Anti-Nyangkut (4 Aturan Emas Manajemen Risiko).
  - *Tab 5*: Checklist Interaktif Pemula.

### 8. 🤖 Workspace Skill: `idx-eod-sync` (Antigravity Customization)
* Modul kemampuan AI terintegrasi di folder `.agents/skills/idx-eod-sync/`.
* Pengguna cukup mengetik di chat: *"Tolong update EOD hari ini"* atau *"Sync portofolio saya"*, AI secara otomatis akan menjalankan penarikan data Yahoo Finance, menghitung ulang indikator, dan memunculkan tabel evaluasi portofolio pasca-closing langsung di jendela chat.

### 9. ⚡ Ultra-Light Architecture & Auto-Shutdown (0 MB RAM saat Idle)
* **Single-Process FastAPI Port 8000**: Frontend Next.js di-export menjadi static web bundle (`frontend/out`) dan disajikan langsung oleh FastAPI. Server Node.js **tidak perlu berjalan di background** (hemat ~100MB RAM permanen).
* **Auto-Shutdown Heartbeat Engine**: Tab browser mengirim sinyal detak jantung berkala (`/api/v1/system/heartbeat`). Ketika seluruh tab browser ditutup selama $\ge 75$ detik, server otomatis mati secara bersih sehingga memori RAM kembali **0 MB (0% CPU)**.
* **macOS Desktop App Launcher (`Asisten Saham.app`)**: Aplikasi desktop 1-klik dengan ikon grafik candlestick Stockbit, siap disematkan di Dock atau Desktop untuk membuka aplikasi secara instan.

### 10. 📅 Kalender Bursa BEI & Retensi Chat Berbasis Siklus Trading
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
* **shadcn/ui Standards**: Menggunakan komponen UI resmi shadcn (`Card`, `Badge`, `Button`, `Dialog`, `Input`, `Label`, `Select`, `Alert`, `Separator`, `ScrollArea`, `Sidebar`).

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16 (Static Export), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons |
| **Code Formatting** | Prettier & `@trivago/prettier-plugin-sort-imports` |
| **Charts** | TradingView Lightweight Charts (v5) |
| **Backend & Web Server** | Python FastAPI, Uvicorn (Port `8000`) |
| **Database** | SQLite lokal (`assiten_saham.db`), SQLAlchemy ORM |
| **Data Market** | Yahoo Finance (`yfinance`) dengan format ticker `.JK` |
| **Technical Analysis** | Native Pandas (kompatibel penuh dengan Python 3.14 macOS) |
| **AI LLM Engine** | **Custom OpenAI-Compatible AI Gateway** (Configurable Model & Endpoint) & Rule-Based Expert Engine |
| **Market Calendar** | 3-Layer Holiday Engine (BEI Calendar, Online API Sync & Empirical IHSG Check) |
| **Scheduler** | APScheduler (Senin–Jumat pukul 17:30 WIB holiday-aware) |
| **Memory Optimization** | Heartbeat Auto-Shutdown Daemon (0 MB RAM idle footprint) |

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Cara Cepat (Desktop App 1-Klik)
* **Double-click** `Asisten Saham.app` di Desktop, Dock macOS, atau folder proyek.
* Aplikasi dikompilasi sebagai **Native macOS Applet** (`osacompile`) yang otomatis menyalakan **9Router AI Gateway** (:20128) dan server **FastAPI** (:8000), lalu membuka browser ke `http://localhost:8000`.
* Saat selesai, cukup **tutup tab browser**, server akan otomatis mati dalam 75 detik (0 MB RAM).

### 2. Cara Terminal / CLI (Makefile & Skrip Otomatis)

```bash
# Menjalankan seluruh stack (9Router :20128 + FastAPI Web/API :8000)
make start
# atau
./start_app.sh

# Mode Development dengan Hot-Reloading Next.js di :3000
make dev
# atau
./start_app.sh --dev

# Menjalankan hanya 9Router AI Gateway di latar belakang (:20128)
make 9router

# Menghentikan seluruh server yang berjalan (:8000, :3000, :20128)
make stop
# atau
./stop_app.sh

# Membangun ulang aset frontend statis & memperbarui Native Launcher
make build
# atau
./build_app.sh
```
* Akses aplikasi: `http://localhost:8000`
* 9Router Gateway: `http://localhost:20128`
* Dokumentasi API Swagger: `http://localhost:8000/docs`

### 3. Pemutakhiran Data Pasar EOD (3 Cara Fleksibel)

Data pasar BEI otomatis ditarik setiap Senin–Jumat pukul 17:30 WIB. Namun Anda dapat melakukan update manual kapan saja:

* **Cara 1 — Web Browser**: Klik tombol **`[🔄 Tarik EOD]`** di header kanan atas halaman mana saja.
* **Cara 2 — Antigravity Chat Skill**: Cukup ketik di chat: `/idx-eod-sync` atau *"Tolong update EOD hari ini"*.
* **Cara 3 — Terminal / Makefile**:
  ```bash
  # Update seluruh portofolio via skill script
  make sync-eod
  # atau
  ./backend/venv/bin/python .agents/skills/idx-eod-sync/scripts/sync_eod.py

  # Atau via cURL (saat server backend aktif)
  curl -s -X POST http://localhost:8000/api/v1/stocks/fetch-all
  ```

---

## 🔒 Konfigurasi AI Gateway (`backend/.env`)

Edit file `backend/.env` untuk mengonfigurasi AI Copilot (OpenAI-compatible provider pilihan Anda) dan Notifikasi Telegram:

```env
# 1. Custom OpenAI-Compatible AI Gateway (Bebas pilih: OpenAI, 9Router, Ollama, Groq, OpenCode, LiteLLM, vLLM, dll)
AI_API_KEY=your_api_key_here
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1

# 2. Default Active AI Provider ("custom_llm")
AI_PROVIDER=custom_llm

# 3. AI Latency & Performance Settings (Configurable)
AI_CACHE_TTL_SECONDS=300
AI_MAX_TOKENS=2000
AI_TIMEOUT_SECONDS=45

# 4. Telegram Bot (Opsional — untuk notifikasi EOD ke smartphone)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

*(Catatan: Tanpa memasukkan API Key atau jika service AI belum berjalan, seluruh analisis teknikal, chart, portofolio, dan kalkulator recovery tetap beroperasi 100% secara lokal dan transparan melalui Rule-Based Expert Engine).*

---

## 📚 Panduan AI Coding Agent
Bagi pengembang atau AI Agent yang melanjutkan pengembangan codebase ini, silakan merujuk ke instruksi baku di file [`AGENTS.md`](./AGENTS.md).
