---
name: idx-recovery-plan
description: >-
  Evaluates underwater / floating loss portfolio stocks using the AI Tri-Scenario Recovery Engine (Cut Loss, Average Down, Hold),
  calculates precision average down math, assigns 1-10 conviction scores and lot allocation suggestions, and generates
  an actionable recovery plan for IDX stocks. Activate this skill whenever the user asks to analyze losing stocks, plan recovery/averaging down,
  evaluate floating loss, or generate a recovery plan.
---

# 🩺 IDX AI Tri-Scenario Recovery Plan & Loss Assessment

Use this skill when the user requests an evaluation, action plan, or AI recommendation for stocks currently experiencing floating losses in their Indonesia Stock Exchange (IDX / BEI) portfolio.

---

## 🎯 Purpose
1. **Pemeriksaan Kerugian Portofolio**: Memindai seluruh emiten yang mengalami floating loss (`floatingPnl < 0`), berstatus `RECOVERY_MODE` (loss $\ge 10\%$ trading), atau `AVERAGING_REVIEW` (loss $\ge 30\%$ investasi).
2. **AI Tri-Scenario Recommendation**: Menganalisis 3 skenario penyelamatan modal secara simultan:
   - 🛑 **Skenario A (Cut Loss)**: Menghitung keyakinan (1–10), saran lot pangkas posisi (mis. 50% vs 100%), dan batas invalidasi.
   - 📉 **Skenario B (Precision Average Down)**: Menghitung modal tambahan, lot tambahan presisi, kecukupan saldo kas RDN, dan area entry pantulan.
   - ⏸️ **Skenario C (Hold / Exit Rebound)**: Menilai kelayakan menahan posisi berdasarkan dividen yield, target resistance MA20, dan potensi rebound.
3. **Multi-Tagging & Conviction Score**: AI memberikan skor 1–10 per skenario dan dapat merekomendasikan lebih dari 1 opsi (mis. kombinasi Hold 50% + Cut 50%).
4. **Penyimpanan Permanen**: Hasil analisis tersimpan otomatis di SQLite lokal (`ai_analysis.recovery_recommendation`) untuk disajikan di antarmuka Web UI.

---

## 🛠️ Execution Workflow

### Step 1: Jalankan Recovery Script
Eksekusi helper script menggunakan virtual environment backend:

```bash
# Analisis seluruh saham floating loss di portofolio
./backend/venv/bin/python .agents/skills/idx-recovery-plan/scripts/sync_recovery.py

# Analisis ticker tertentu (contoh: DEWA.JK atau SIDO.JK)
./backend/venv/bin/python .agents/skills/idx-recovery-plan/scripts/sync_recovery.py --ticker DEWA.JK

# Paksa AI generate ulang (bypass cache hari ini)
./backend/venv/bin/python .agents/skills/idx-recovery-plan/scripts/sync_recovery.py --force
```

*Catatan: Alternatifnya, jika server backend aktif, regenerasi juga dapat dipicu via HTTP endpoint:*
```bash
curl -s -X POST http://localhost:8000/api/v1/recovery/DEWA.JK/regenerate-recommendation
```

---

## 📊 Step 2: Sajikan Laporan Eksekutif Recovery ke User

Setelah script selesai, tampilkan ringkasan terstruktur dengan format berikut:

1. **Status Kerugian Portofolio**:
   - Total Saldo Kas RDN
   - Daftar Saham Floating Loss (Ticker, Tipe Trading/Investasi, Avg Beli, Harga Terkini, Floating Loss Rp & %)
2. **Matriks 3 Skenario AI per Saham**:
   - **Skenario A (Cut Loss)**: Skor Keyakinan (1–10) | Saran Lot | Alasan
   - **Skenario B (Average Down)**: Skor Keyakinan (1–10) | Saran Lot & Kebutuhan Modal | Alasan & Status Kas
   - **Skenario C (Hold)**: Skor Keyakinan (1–10) | Saran Lot & Target Rebound | Alasan
3. **Kesimpulan Strategis AI**:
   - 1 paragraf ringkasan arahan eksekusi besok pagi pukul 09:00 WIB.

---

## ⚠️ Aturan Khusus (User Rules)
- **Saham Investasi vs Dividen**: Dilarang merekomendasikan Cut Loss untuk saham investasi dengan Dividend Yield $\ge 5\%$ kecuali terdapat kerusakan fundamental mayor.
- **Disiplin Trading**: Saham trading yang menjebol Support Major / Stop Loss diprioritaskan pembatasan risiko (*capital preservation*).
- **Format UI**: Rekomendasi di web dapat diakses interaktif di `http://localhost:8000/recovery` dengan tombol diskusi tanya jawab mendalam per skenario.
