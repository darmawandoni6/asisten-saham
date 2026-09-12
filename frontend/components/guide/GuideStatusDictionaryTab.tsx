'use client';

import { AlertOctagon, AlertTriangle, CheckCircle2, LifeBuoy, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const GLOSSARY_TERMS = [
  {
    term: 'RSI (Relative Strength Index)',
    desc: 'Indikator momentum dengan skala 0–100. Angka di bawah 30 menandakan harga sudah jenuh jual (oversold / sangat murah), sedangkan di atas 70 menandakan jenuh beli (overbought / rentan koreksi).',
  },
  {
    term: 'MA20 & MA50 (Moving Average)',
    desc: 'Rata-rata harga penutupan selama 20 hari (tren jangka pendek) dan 50 hari (tren jangka menengah). Harga di atas MA20 menandakan fase bullish, sedangkan di bawah MA50 menandakan fase bearish.',
  },
  {
    term: 'High Watermark & Trailing Stop',
    desc: 'High Watermark adalah rekor harga tertinggi yang pernah disentuh saham sejak Anda beli. Trailing Stop adalah batas pengaman otomatis (7% di bawah High Watermark) untuk mengunci cuan maksimal.',
  },
  {
    term: 'Break-even Price (BEP)',
    desc: 'Titik harga rata-rata impas di mana posisi Anda tidak untung dan tidak rugi (0%). Tujuan kalkulator average down adalah menurunkan level BEP ini agar modal lebih cepat terselamatkan.',
  },
  {
    term: 'Cash Feasibility (Kecukupan Kas)',
    desc: 'Fitur validasi cerdas yang mengecek apakah saldo kas aktif di akun sekuritas Anda mencukupi untuk melakukan pembelian lot tambahan, mencegah Anda kekurangan dana di tengah jalan.',
  },
  {
    term: 'Risk : Reward Ratio (RRR)',
    desc: 'Perbandingan matematis antara jarak risiko kerugian (entry ke Stop Loss) dengan potensi keuntungan (entry ke Take Profit). Nilai ≥ 1 : 1.5 memungkinkan portofolio tetap untung meski win rate hanya 40%.',
  },
  {
    term: 'Skor Keyakinan AI (1 – 10)',
    desc: 'Skala penilaian holistik (1 s/d 10) yang memadukan probabilitas setup teknikal, 4 pilar fundamental (Market Cap, Float %, ROE %, DER), dan validasi RRR untuk menyaring keputusan beli esok pagi.',
  },
  {
    term: 'Kesesuaian Profil (Trading vs Investasi)',
    desc: 'Klasifikasi cerdas yang membedakan saham: ⚡ Cocok Trading (momentum/siklikal, wajib SL ketat), 🏛️ Cocok Investasi (fundamental solid di support/undervalued), dan ✨ Trading & Investasi (bluechip breakout).',
  },
  {
    term: '4 Pilar Fundamental Screener',
    desc: 'Metrik kesehatan emiten terintegrasi: Market Cap (kapitalisasi pasar), Free Float % (saham publik), ROE % (tingkat profitabilitas laba bersih), dan DER (beban utang terhadap ekuitas).',
  },
  {
    term: 'Realized PnL vs Floating PnL',
    desc: 'Floating PnL adalah laba/rugi berjalan dari posisi saham yang masih aktif di Portofolio. Realized PnL adalah laba/rugi riil yang sudah terkunci saat posisi dipangkas/dijual.',
  },
  {
    term: 'Scale-Out (Pangkas Lot Parsial)',
    desc: 'Strategi menjual sebagian lot (misal 50% di TP1) untuk mengamankan keuntungan nyata ke kas, sementara sisa posisi dibiarkan mengikuti potensi tren reli berikutnya dengan trailing stop.',
  },
  {
    term: 'Target Exit Rebound (⚡ ER)',
    desc: 'Level target harga resisten teknikal pasar yang berada di bawah harga modal beli. Digunakan sebagai titik keluar optimal saat harga memantul untuk meminimalkan kerugian (Cut on Strength) pada posisi yang sedang recovery.',
  },
  {
    term: 'Smart Dynamic Target (🎯 TP vs ⚡ ER)',
    desc: 'Sistem pelabelan cerdas yang membedakan otomatis antara target profit murni di atas modal (Badge Emerald TP) dan target penyelamatan modal di bawah harga beli (Badge Amber Exit Rebound).',
  },
  {
    term: 'Saldo Kas RDN (Manual)',
    desc: 'Pencatatan kas tunai mandiri yang diinput pengguna sesuai saldo rekening dana nasabah (RDN) di sekuritas untuk mengukur ketersediaan modal dan alokasi risiko portofolio.',
  },
  {
    term: 'Dividend Yield',
    desc: 'Persentase dividen tunai tahunan yang dibagikan emiten terhadap harga saham saat ini. Arus kas pasif ini berfungsi sebagai benteng pemulihan modal bagi saham bertipe investasi.',
  },
];

export function GuideStatusDictionaryTab() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Kamus Lengkap Badge, Status &amp; Glosarium Bursa</h3>
        <p className="mt-1 text-sm text-slate-500">
          Panduan komprehensif arti setiap badge warna di Screener, Recovery Engine, Dashboard, serta istilah kunci
          pasar modal
        </p>
      </div>

      {/* Bagian A: Badge Strategi Screener */}
      <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
        <CardContent className="space-y-4 p-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 font-bold text-purple-700">
              🔍
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">A. Badge Strategi EOD Screener</h4>
              <p className="text-xs text-slate-500">Formula teknikal yang mendasari pemilihan saham otomatis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Oversold */}
            <div className="space-y-2 rounded-xl border border-purple-200 bg-purple-50/40 p-4">
              <div className="flex items-center justify-between">
                <Badge className="rounded-full border-purple-200 bg-purple-100 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-800 hover:bg-purple-100">
                  OVERSOLD
                </Badge>
                <span className="text-xs font-semibold text-purple-700">RSI &lt; 35</span>
              </div>
              <strong className="block text-sm text-slate-900">Jenuh Jual Ekstrem di Major Support</strong>
              <p className="text-xs leading-relaxed text-slate-600">
                Harga sudah turun sangat dalam dan menyentuh lantai support kuat. Tekanan jual habis, ruang penurunan
                terbatas.
              </p>
              <div className="rounded-lg border border-purple-100 bg-white p-2.5 text-xs font-medium text-purple-900">
                👉 <strong>Aksi:</strong> <em>Buy on Weakness</em> saat muncul konfirmasi pantulan (candle hijau).
              </div>
            </div>

            {/* Breakout */}
            <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between">
                <Badge className="rounded-full border-blue-200 bg-blue-100 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-800 hover:bg-blue-100">
                  BREAKOUT
                </Badge>
                <span className="text-xs font-semibold text-blue-700">Close &ge; MA20</span>
              </div>
              <strong className="block text-sm text-slate-900">Momentum Tren Kenaikan Baru</strong>
              <p className="text-xs leading-relaxed text-slate-600">
                Harga menembus dan bertahan di atas MA20 dengan RSI &ge; 55 dan volume aktif. Fase sideways selesai.
              </p>
              <div className="rounded-lg border border-blue-100 bg-white p-2.5 text-xs font-medium text-blue-900">
                👉 <strong>Aksi:</strong> <em>Buy on Momentum</em> untuk menunggangi tren akselerasi jangka pendek.
              </div>
            </div>

            {/* Value */}
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex items-center justify-between">
                <Badge className="rounded-full border-amber-200 bg-amber-100 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-800 hover:bg-amber-100">
                  VALUE
                </Badge>
                <span className="text-xs font-semibold text-amber-800">Support MA50</span>
              </div>
              <strong className="block text-sm text-slate-900">Akumulasi Sehat &amp; Valuasi Wajar</strong>
              <p className="text-xs leading-relaxed text-slate-600">
                Saham berfundamental kokoh (Blue Chip) yang sedang berkonsolidasi stabil di atas garis penopang MA50.
              </p>
              <div className="rounded-lg border border-amber-100 bg-white p-2.5 text-xs font-medium text-amber-900">
                👉 <strong>Aksi:</strong> Cicil beli bertahap (*DCA*) untuk tabungan investasi jangka panjang.
              </div>
            </div>
          </div>

          {/* AI Score & Risk:Reward Deep Dive Sub-Cards */}
          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* RRR Deep Dive */}
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold tracking-wider text-slate-900 uppercase">
                  🎯 Risk : Reward Ratio (RRR)
                </span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
                  Jarak Matematis
                </span>
              </div>
              <strong className="block text-xs font-bold text-slate-900">
                Matematika Peluang: Menang Walau Win-Rate Hanya 40%
              </strong>
              <p className="text-xs leading-relaxed text-slate-600">
                RRR membandingkan batas risiko rugi Stop Loss terhadap target keuntungan TP:
              </p>
              <div className="space-y-1 rounded-lg border border-emerald-200 bg-white p-2.5 font-mono text-xs">
                <div className="font-bold text-slate-800">RRR = 1 : (TP - Entry) / (Entry - SL)</div>
                <div className="font-sans text-[11px] text-slate-600">
                  Contoh: Beli Rp 1.000, SL Rp 950 (-5%), TP Rp 1.100 (+10%) &rarr; <strong>RRR = 1 : 2.0</strong>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-emerald-950">
                💡 <strong>Standar:</strong> &ge; 1 : 1.5 (Layak) | &ge; 1 : 2.0 (Sangat Layak) | &lt; 1 : 1.0
                (Hindari).
              </p>
            </div>

            {/* AI Score Deep Dive */}
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold tracking-wider text-slate-900 uppercase">
                  ⭐ Skor Keyakinan AI (1 – 10)
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800">
                  Probabilitas &amp; Kualitas
                </span>
              </div>
              <strong className="block text-xs font-bold text-slate-900">
                Kombinasi Teknikal, 4 Fundamental &amp; Validasi RRR
              </strong>
              <p className="text-xs leading-relaxed text-slate-600">
                Menyaring probabilitas tren MA/RSI, 4 pilar fundamental (ROE, DER, Float, MC), dan validasi RRR.
              </p>
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-1.5 px-2.5 text-[11px]">
                  <strong className="font-bold text-emerald-800">🔥 Skor 10/10 (Wajib Beli)</strong>
                  <span className="text-slate-600">Setup Prima (Tren Valid, RRR &ge; 1 : 1.8)</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-1.5 px-2.5 text-[11px]">
                  <strong className="font-bold text-blue-800">⚡ Skor 8 – 9/10 (Siaga 1 Beli)</strong>
                  <span className="text-slate-600">Momentum Kuat (Konfirmasi 09:00 WIB)</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-1.5 px-2.5 text-[11px]">
                  <strong className="font-bold text-slate-700">👀 Skor 6 – 7/10 (Layak Pantau)</strong>
                  <span className="text-slate-600">Tunggu Pullback / Cicil DCA Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profil Kesesuaian: Trading vs Investasi */}
          <div className="mt-3 space-y-2 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-bold tracking-wider text-slate-900 uppercase">
                🧭 Kesesuaian Profil Emiten (Trading vs Investasi)
              </span>
              <span className="text-[11px] font-bold text-sky-800">Disiplin Gaya Transaksi</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
              <div className="space-y-1 rounded-lg border border-sky-200 bg-white p-3">
                <Badge variant="outline" className="border-sky-200 bg-sky-50 font-bold text-sky-800">
                  ⚡ Cocok Trading
                </Badge>
                <p className="text-slate-600">Setup momentum/breakout atau emiten siklikal/beban utang lebih tinggi.</p>
                <span className="block font-bold text-rose-700">👉 Wajib disiplin Stop Loss ketat!</span>
              </div>
              <div className="space-y-1 rounded-lg border border-indigo-200 bg-white p-3">
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 font-bold text-indigo-800">
                  🏛️ Cocok Investasi
                </Badge>
                <p className="text-slate-600">
                  Fundamental solid (MC &ge; 10T, ROE &ge; 10%, DER rendah) di area support.
                </p>
                <span className="block font-bold text-indigo-800">👉 Cicil akumulasi bertahap (DCA).</span>
              </div>
              <div className="space-y-1 rounded-lg border border-emerald-200 bg-white p-3">
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 font-bold text-emerald-800">
                  ✨ Trading &amp; Investasi
                </Badge>
                <p className="text-slate-600">
                  Emiten blue chip berfundamental prima yang sedang mengalami bullish breakout.
                </p>
                <span className="block font-bold text-emerald-800">👉 Fleksibel untuk swing maupun hold dividen.</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bagian B: Badge Kelayakan Recovery Engine */}
      <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
        <CardContent className="space-y-4 p-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 font-bold text-purple-700">
              🛟
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">B. Badge Kelayakan di Recovery Engine</h4>
              <p className="text-xs text-slate-500">
                Label kesesuaian skenario penyelamatan modal berdasarkan profil saham &amp; kas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
            <div className="space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
              <Badge className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono font-bold text-emerald-800 hover:bg-emerald-100">
                STRATEGI UTAMA INVESTASI
              </Badge>
              <p className="leading-relaxed text-slate-700">
                Khusus saham investasi berfundamental kuat dan berdividen tunai. Menghindari cut loss di dasar harga dan
                mengandalkan pemulihan pasif dividen.
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5">
              <Badge className="rounded-full bg-amber-100 px-2.5 py-0.5 font-mono font-bold text-amber-800 hover:bg-amber-100">
                PILIHAN TERBAIK JIKA KAS TERBATAS
              </Badge>
              <p className="leading-relaxed text-slate-700">
                Skenario menahan posisi untuk menunggu pantulan (*Hold for Rebound*) menuju Resistance MA20 tanpa
                menuntut suntikan modal sepeser pun.
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-purple-200 bg-purple-50/40 p-3.5">
              <Badge className="rounded-full bg-purple-100 px-2.5 py-0.5 font-mono font-bold text-purple-800 hover:bg-purple-100">
                STRATEGI AGRESIF TRADING
              </Badge>
              <p className="leading-relaxed text-slate-700">
                Untuk saham trading dengan likuiditas tinggi. Menuntut kecepatan eksekusi cicil di Major Support dan
                langsung exit cepat di area BEP baru.
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
              <Badge className="rounded-full bg-rose-100 px-2.5 py-0.5 font-mono font-bold text-rose-800 hover:bg-rose-100">
                KURANG DIREKOMENDASIKAN UNTUK INVESTASI
              </Badge>
              <p className="leading-relaxed text-slate-700">
                Peringatan darurat bahwa melakukan cut loss panik pada saham investasi berdividen tinggi adalah tindakan
                yang merugikan modal jangka panjang.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bagian C: Kamus 5 Warna Aksi Dashboard */}
      <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
        <CardContent className="space-y-4 p-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 font-bold text-emerald-700">
              📊
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">C. Kamus 5 Warna Smart Action Cards (Dashboard)</h4>
              <p className="text-xs text-slate-500">Panduan instruksi aksi sebelum market buka pukul 09:00 WIB</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Red */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4 md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white">
                  <AlertOctagon className="h-4 w-4" />
                </div>
                <div>
                  <Badge className="rounded bg-rose-100 px-2 py-0.5 font-mono text-xs font-bold text-rose-800 hover:bg-rose-100">
                    SELL / CUT LOSS
                  </Badge>
                  <h4 className="mt-1 text-sm font-bold text-slate-900">
                    Kondisi: Harga Closing menembus batas Stop Loss (SL)
                  </h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    <strong>Aksi Wajib:</strong> Segera pasang order jual besok pagi. Jangan pernah berharap atau
                    menunda, karena proteksi modal Anda adalah prioritas nomor satu.
                  </p>
                </div>
              </div>
              <span className="shrink-0 self-start rounded-full bg-rose-200/80 px-3 py-1 text-xs font-bold text-rose-800 md:self-auto">
                Prioritas #1 (Darurat)
              </span>
            </div>

            {/* Green */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <Badge className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                    TAKE PROFIT / TRIM
                  </Badge>
                  <h4 className="mt-1 text-sm font-bold text-slate-900">
                    Kondisi: Harga Closing menyentuh atau melampaui Target Price (TP)
                  </h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    <strong>Aksi Wajib:</strong> Realisasikan keuntungan bertahap (jual 50% posisi). Jangan biarkan
                    floating profit yang sudah didapat kembali menjadi floating loss.
                  </p>
                </div>
              </div>
              <span className="shrink-0 self-start rounded-full bg-emerald-200/80 px-3 py-1 text-xs font-bold text-emerald-800 md:self-auto">
                Prioritas #2 (Amankan Cuan)
              </span>
            </div>

            {/* Amber - Exit Rebound */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <Badge className="rounded bg-amber-100 px-2 py-0.5 font-mono text-xs font-bold text-amber-800 hover:bg-amber-100">
                    EXIT REBOUND / PERSIAPAN EXIT
                  </Badge>
                  <h4 className="mt-1 text-sm font-bold text-slate-900">
                    Kondisi: Harga menyentuh Target Exit di bawah harga modal (Cut on Strength)
                  </h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    <strong>Aksi Wajib:</strong> Jual posisi untuk meminimalkan kerugian saat pantulan harga terjadi,
                    sebelum harga kembali tertekan oleh resisten pasokan pasar.
                  </p>
                </div>
              </div>
              <span className="shrink-0 self-start rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900 md:self-auto">
                Prioritas #2 (Penyelamatan Modal)
              </span>
            </div>

            {/* Orange */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <Badge className="rounded bg-orange-100 px-2 py-0.5 font-mono text-xs font-bold text-orange-800 hover:bg-orange-100">
                    TRAILING STOP WARNING
                  </Badge>
                  <h4 className="mt-1 text-sm font-bold text-slate-900">
                    Kondisi: Saham yang sedang profit turun &gt; 7% dari harga tertingginya
                  </h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    <strong>Aksi Wajib:</strong> Jual sisa posisi Anda untuk mengunci keuntungan sebelum tren bullish
                    benar-benar berbalik menjadi tren turun tajam.
                  </p>
                </div>
              </div>
              <span className="shrink-0 self-start rounded-full bg-orange-200/80 px-3 py-1 text-xs font-bold text-orange-800 md:self-auto">
                Prioritas #3 (Proteksi Cuan)
              </span>
            </div>

            {/* Purple */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4 md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <div>
                  <Badge className="rounded bg-purple-100 px-2 py-0.5 font-mono text-xs font-bold text-purple-800 hover:bg-purple-100">
                    RECOVERY MODE / AVERAGING REVIEW
                  </Badge>
                  <h4 className="mt-1 text-sm font-bold text-slate-900">
                    Kondisi: Saham mengalami floating loss dalam (&gt; 10% trading atau &gt; 30% investasi)
                  </h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    <strong>Aksi Wajib:</strong> Buka menu Recovery Engine. Jangan averaging down tanpa kalkulator
                    presisi dan konfirmasi sinyal Rebound di Support Mayor.
                  </p>
                </div>
              </div>
              <span className="shrink-0 self-start rounded-full bg-purple-200/80 px-3 py-1 text-xs font-bold text-purple-800 md:self-auto">
                Prioritas Khusus (Nyangkut)
              </span>
            </div>

            {/* Gray / Slate */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <Badge className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 hover:bg-slate-100">
                    HOLD / MONITOR
                  </Badge>
                  <h4 className="mt-1 text-sm font-bold text-slate-900">
                    Kondisi: Harga berada di antara batas SL dan TP dengan tren sehat
                  </h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    <strong>Aksi Wajib:</strong> Pertahankan posisi (*do nothing*). Biarkan saham bekerja sesuai rencana
                    tanpa tergoda untuk gonta-ganti posisi tanpa alasan teknikal.
                  </p>
                </div>
              </div>
              <span className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 md:self-auto">
                Kondisi Aman
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bagian D: Glosarium Istilah Kunci Bursa */}
      <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
        <CardContent className="space-y-4 p-0">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 font-bold text-emerald-700">
              📖
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">D. Glosarium Istilah Kunci Pasar Modal</h4>
              <p className="text-xs text-slate-500">Istilah teknis yang digunakan di seluruh antarmuka aplikasi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
            {GLOSSARY_TERMS.map(item => (
              <div key={item.term} className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <strong className="block text-sm font-bold text-slate-900">{item.term}</strong>
                <p className="leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
