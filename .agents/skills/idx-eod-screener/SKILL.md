---
name: idx-eod-screener
description: >-
  Scans the Indonesia Stock Exchange (IDX / BEI) market pool or analyzes on-demand tickers for EOD trading & investing opportunities.
  Evaluates technical setups (MA20/50, RSI, Support, Resistance), 4 fundamental health metrics (Market Cap, Free Float %, ROE %, DER),
  calculates Risk:Reward Ratio (RRR), computes AI Conviction Scores (1–10), classifies Profile Suitability (Trading vs Investasi vs Both),
  and saves curated Top 10 Picks into the local SQLite database. Activate this skill whenever the user asks to run the stock screener,
  find recommended stocks to buy tomorrow, scan market opportunities, or analyze a custom IDX ticker.
---

# 🔎 IDX EOD Market Screener & Stock Intelligence Engine

Use this skill when the user requests to scan the Indonesia Stock Exchange (IDX / BEI) market for new buying opportunities, analyze a specific ticker for suitability, or evaluate curated stock picks for tomorrow's trading session.

---

## 🎯 Purpose
1. **Pindaian Pasar Otomatis (Market Pool Scan)**: Memindai pool saham likuid BEI (fokus $\le$ Rp 2.000 / modal terjangkau $\le$ Rp 200.000 per lot) pasca-closing market.
2. **On-Demand Single Stock Analyzer**: Menganalisis kode ticker BEI apa saja secara langsung (contoh: `BREN`, `AMMN`, `MEDC`, `PGAS`) dengan menarik data historis 3 bulan dan metrik fundamental live.
3. **Penyaringan Multi-Strategi**:
   - 🚀 **`BREAKOUT`**: Momentum akselerasi di atas MA20 dengan RSI $\ge 50$ dan volume akumulasi aktif.
   - 🛡️ **`VALUE`**: Saham berfundamental sehat yang berkonsolidasi kuat di atas penopang MA50.
   - 📉 **`OVERSOLD`**: Rebound teknikal dari area jenuh jual (RSI $\le 35$) di dekat Major Support.
4. **4 Pilar Fundamental & Valuasi Terpadu**:
   - *Market Cap*: Bobot kapitalisasi pasar (Triliun/Miliar Rp).
   - *Free Float %*: Ketersediaan saham publik di pasar.
   - *Return on Equity (ROE %)*: Tingkat efisiensi profitabilitas laba bersih.
   - *Debt to Equity Ratio (DER)*: Rasio utang terhadap modal (khusus perbankan disesuaikan).
5. **Skor Keyakinan AI 1–10 & Validasi RRR**:
   - Menggabungkan probabilitas teknikal, penguat fundamental, dan validasi *Risk-to-Reward Ratio* ($\text{RRR} \ge 1:1.8$ untuk skor 10/10).
6. **Klasifikasi Kesesuaian Profil (Profile Suitability)**:
   - **`⚡ Cocok Trading`**: Saham momentum / siklikal / utang tinggi $\rightarrow$ wajib disiplin *Stop Loss* ketat.
   - **`🏛️ Cocok Investasi`**: Saham fundamental prima di area *support* / valuasi terdiskon $\rightarrow$ akumulasi bertahap / DCA.
   - **`✨ Trading & Investasi`**: Saham *bluechip* / fundamental solid yang sedang mengalami akselerasi *breakout*.

---

## 🛠️ Execution Workflow

### Step 1: Eksekusi Script Screener
Jalankan helper script menggunakan virtual environment backend:

```bash
# 1. Pindai seluruh market pool & simpan Top 10 picks ke database
./backend/venv/bin/python .agents/skills/idx-eod-screener/scripts/scan_screener.py

# 2. Analisis saham tertentu secara on-demand (contoh: BREN.JK, MEDC.JK, atau AKRA.JK)
./backend/venv/bin/python .agents/skills/idx-eod-screener/scripts/scan_screener.py --ticker BREN.JK

# 3. Filter berdasarkan strategi tertentu (BREAKOUT, VALUE, atau OVERSOLD)
./backend/venv/bin/python .agents/skills/idx-eod-screener/scripts/scan_screener.py --strategy BREAKOUT

# 4. Filter batas modal/harga maksimal (contoh: saham <= Rp 1.000)
./backend/venv/bin/python .agents/skills/idx-eod-screener/scripts/scan_screener.py --max-price 1000

# 5. Tampilkan Top N teratas (misal: Top 5)
./backend/venv/bin/python .agents/skills/idx-eod-screener/scripts/scan_screener.py --top 5
```

*Catatan: Jika server backend FastAPI aktif, pemindaian juga dapat dipicu melalui REST API:*
```bash
# Trigger full market scan
curl -s -X POST http://localhost:8000/api/v1/screener/scan

# Analisis single ticker on-demand
curl -s -X POST http://localhost:8000/api/v1/screener/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticker": "MEDC"}'
```

---

## 📊 Step 2: Sajikan Laporan Eksekutif Screener ke User

Setelah script selesai dieksekusi, tampilkan ringkasan dengan struktur Stockbit Clean:

1. **Top Picks Rekomendasi Beli Besok Pagi**:
   - Highlight saham dengan **Skor Keyakinan Tertinggi ($\ge 8/10$)** dan **RRR Menarik ($\ge 1 : 1.5$)**.
2. **Tabel Ringkasan Screener**:
   - `# Ticker & Nama` | `Sektor` | `Harga Close` | `Strategi` | `Kesesuaian (Badge)` | `Skor AI (1-10)` | `RRR` | `Area Beli` | `Target TP` | `Stop Loss` | `Modal/Lot`
3. **Bedah 4 Metrik Fundamental**:
   - Market Cap, ROE %, DER, dan Free Float % untuk emiten prioritas.
4. **Action Plan Sebelum Market Open (09:00 WIB)**:
   - Instruksi disiplin pasang antrean beli (GTC / Limit Order) dan batas *Stop Loss*.

---

## ⚠️ Aturan Khusus (User Rules)
- **Disiplin Suffix BEI**: Seluruh kode ticker wajib berakhiran `.JK` (contoh: `BBRI.JK`, `TOWR.JK`).
- **Integritas Skor & RRR**: Dilarang memberikan skor 10/10 jika $\text{RRR} < 1 : 1.8$. Jika $\text{RRR} < 1 : 1.0$, batasi skor maksimal 6/10.
- **Budget Realistis**: Sertakan estimasi modal per lot ($\text{Harga} \times 100$) agar pengguna dapat mengalokasikan kas RDN tanpa *over-sizing*.
- **Integrasi UI**: Seluruh hasil pemindaian langsung tersinkronisasi ke database SQLite dan dapat diakses interaktif di antarmuka Web UI `http://localhost:8000/screener` lengkap dengan grafik candlestick TradingView dan modul diskusi AI multi-turn.
