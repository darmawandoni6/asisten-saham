'use client';

import Link from 'next/link';

import { ArrowRight, Briefcase, LifeBuoy, Search, Sparkles, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function GuideFeaturesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900">Panduan Lengkap 4 Fitur Utama</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Ketahui fungsi spesifik setiap menu dan kapan saat tepat menggunakannya
        </p>
      </div>

      <div className="space-y-4">
        {/* Feature 1: Smart Decision Dashboard */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
          <CardContent className="p-0">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">1. Smart Decision Dashboard</h4>
                  <p className="text-xs text-slate-500">Pusat komando EOD harian Anda</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-emerald-700 hover:text-emerald-800">
                <Link href="/" className="flex items-center gap-1 text-xs font-semibold">
                  <span>Buka Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">Portfolio Summary Cards</strong>
                <p className="leading-relaxed text-slate-600">
                  Memantau total equity pasar, floating PnL (Rp &amp; %), serta rasio alokasi saham vs cash cadangan.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">Smart Action Cards</strong>
                <p className="leading-relaxed text-slate-600">
                  Kartu status harian saham Anda dengan warna tegas (Cut Loss, TP, Hold, Trailing Stop, Recovery).
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">Daily Action Sheet</strong>
                <p className="leading-relaxed text-slate-600">
                  Daftar aksi yang diurutkan dari yang paling darurat (Cut Loss) hingga rekomendasi santai (Hold).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature 2: Portofolio & Trading Plan */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
          <CardContent className="p-0">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">2. Portofolio &amp; Trading Plan</h4>
                  <p className="text-xs text-slate-500">Pencatatan posisi riil, kas RDN manual, &amp; eksekusi lot</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-blue-700 hover:text-blue-800">
                <Link href="/portfolio" className="flex items-center gap-1 text-xs font-semibold">
                  <span>Buka Portofolio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">Input Plan &amp; Saldo Kas Manual</strong>
                <p className="leading-relaxed text-slate-600">
                  Tentukan Avg Beli, TP, dan SL. Saldo Kas RDN dapat diedit mandiri via tombol <em>[ ✏️ Edit ]</em>{' '}
                  sesuai rekening sekuritas Anda.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">Pangkas / Jual Lot Saham</strong>
                <p className="leading-relaxed text-slate-600">
                  Tombol <em>[ 🏷️ Jual ]</em> memungkinkan Anda melepas sebagian lot (preset 25%, 50% TP1) atau menutup
                  total posisi dengan kalkulasi Realized PnL instan.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">Money Management Sektor</strong>
                <p className="leading-relaxed text-slate-600">
                  Visualisasi alokasi modal per sektor industri untuk menjaga diversifikasi risiko portofolio tetap
                  sehat (&le; 25–30% per sektor).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature 3: Recovery Engine */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
          <CardContent className="p-0">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">3. Recovery Engine</h4>
                  <p className="text-xs text-slate-500">Penyelamat modal saham floating loss &gt; 10%</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-purple-700 hover:text-purple-800">
                <Link href="/recovery" className="flex items-center gap-1 text-xs font-semibold">
                  <span>Buka Recovery</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">Diagnosa Kerugian AI</strong>
                <p className="leading-relaxed text-slate-600">
                  Menganalisis apakah penurunan harga masih wajar atau sudah merusak struktur tren jangka panjang.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">Kalkulator Precision Avg Down</strong>
                <p className="leading-relaxed text-slate-600">
                  Menghitung persis berapa lot &amp; rupiah modal tambahan yang dibutuhkan untuk menurunkan harga BEP.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <strong className="mb-1 block text-slate-900">3 Skenario Penyelamatan</strong>
                <p className="leading-relaxed text-slate-600">
                  Pilihan solusi konkrit: Cut Loss langsung, Average Down di Support Mayor, atau Exit saat pantulan BEP.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature 4: EOD Stock Screener & SOP */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
          <CardContent className="space-y-6 p-0">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">4. EOD Stock Screener &amp; Intelijen Saham</h4>
                  <p className="text-xs text-slate-500">
                    Peluang baru pasca-closing (17:30 WIB), filter anggaran, &amp; kalkulasi modal per lot
                  </p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-amber-700 hover:text-amber-800">
                <Link href="/screener" className="flex shrink-0 items-center gap-1 text-xs font-semibold">
                  <span>Buka Screener</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {/* 3 Strategi Screening Otomatis */}
            <div>
              <h5 className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                3 Strategi Screening Otomatis
              </h5>
              <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge className="rounded bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-800 hover:bg-purple-100">
                      OVERSOLD
                    </Badge>
                    <strong className="text-slate-900">Oversold Rebound</strong>
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    Mendeteksi saham yang tertekan jenuh jual (RSI &lt; 35) di area Major Support. Karakter:{' '}
                    <em>Buy on Weakness</em>, risiko penurunan terbatas, potensi pantulan teknikal cepat.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-800 hover:bg-blue-100">
                      BREAKOUT
                    </Badge>
                    <strong className="text-slate-900">Breakout MA20</strong>
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    Harga menembus garis Moving Average 20 hari dari bawah ke atas. Karakter: <em>Trend Following</em>,
                    momentum bullish baru dimulai dengan konfirmasi volume sehat.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 hover:bg-emerald-100">
                      VALUE
                    </Badge>
                    <strong className="text-slate-900">Value Stocks</strong>
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    Saham di atas MA50 dengan RSI netral (35–60). Karakter: Akumulasi bertahap, tren jangka menengah
                    stabil, cocok untuk swing santai atau investasi bertahap.
                  </p>
                </div>
              </div>
            </div>

            {/* SOP 4 Langkah Cara Memilih Saham di Screener */}
            <div className="space-y-4 rounded-xl border border-amber-200/80 bg-amber-50/40 p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <Badge
                    variant="outline"
                    className="inline-flex items-center gap-1 rounded-full border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase"
                  >
                    <Sparkles className="h-3 w-3 text-amber-700" />
                    SOP PRAKTIK HARIAN
                  </Badge>
                  <h5 className="mt-1 text-sm font-bold text-slate-900">
                    SOP 4 Langkah Cara Memilih Saham di Screener (Khusus Modal Terukur)
                  </h5>
                </div>
                <span className="text-xs font-medium text-slate-500">Proses Seleksi Disiplin &le; 5 Menit</span>
              </div>

              <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                {/* Langkah 1 */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-mono text-xs font-bold text-amber-800">
                        1
                      </div>
                      <strong className="text-xs text-slate-900">
                        Sesuaikan dengan Saldo Kas RDN (Filter Anggaran)
                      </strong>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      Gunakan tombol <strong>Filter Anggaran</strong> di Screener (misal: <em>&le; Rp 2.000</em> atau{' '}
                      <em>&le; Rp 1.000</em>). Perhatikan label estimasi modal per lot (contoh: <em>Rp 60.000/lot</em>{' '}
                      atau <em>Rp 150.000/lot</em>).
                    </p>
                    <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2 text-slate-600">
                      💡 <strong>Aturan Anti All-In:</strong> Jangan habiskan seluruh saldo kas untuk 1 emiten.
                      Alokasikan maksimal 20% – 25% modal per posisi agar portofolio tetap fleksibel dan tidak panik
                      saat pasar fluktuatif.
                    </div>
                  </div>
                </div>

                {/* Langkah 2 */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-mono text-xs font-bold text-amber-800">
                        2
                      </div>
                      <strong className="text-xs text-slate-900">Tentukan Strategi Sesuai Karakter Trader</strong>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      Pilih gaya trading yang paling selaras dengan kesiapan mental dan waktu Anda:
                    </p>
                    <ul className="mt-2 space-y-1.5 text-slate-600">
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-purple-600">•</span>
                        <span>
                          <strong>Oversold (RSI &lt; 35):</strong> Cocok jika suka berburu diskon di support kuat dan
                          sabar menanti pantulan teknikal.
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-blue-600">•</span>
                        <span>
                          <strong>Breakout MA20:</strong> Cocok jika menyukai saham yang sedang aktif bergerak naik
                          mengikuti konfirmasi momentum baru.
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-emerald-600">•</span>
                        <span>
                          <strong>Value Stocks:</strong> Cocok jika ingin swing santai atau akumulasi bertahap di atas
                          MA50 dengan tren medium solid.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-mono text-xs font-bold text-amber-800">
                        3
                      </div>
                      <strong className="text-xs text-slate-900">Periksa 3 Pilar Intelijen di Kartu Saham</strong>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      Jangan membeli hanya karena harganya murah. Validasi metrik objektif pada kartu saham:
                    </p>
                    <div className="mt-2 space-y-1.5">
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <strong>1. AI Technical Score (&ge; 80 – 85):</strong> Semakin tinggi skor, semakin kuat
                        konvergensi indikator teknikalnya.
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <strong>2. Risk/Reward Ratio (RRR &ge; 1 : 2.0):</strong> Pastikan potensi keuntungan minimal 2x
                        lipat lebih besar dibanding risiko kerugian cut loss.
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <strong>3. Watch Trigger 09:00 WIB:</strong> Baca catatan syarat konfirmasi sebelum beli (misal:
                        antrean bid tebal atau candle pembukaan hijau).
                      </div>
                    </div>
                  </div>
                </div>

                {/* Langkah 4 */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-mono text-xs font-bold text-amber-800">
                        4
                      </div>
                      <strong className="text-xs text-slate-900">Pasang Order Disiplin di Aplikasi Sekuritas</strong>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      Setelah yakin dengan pilihan Anda, klik tombol <em>&quot;+ Plan Beli&quot;</em> untuk menyimpannya
                      ke portofolio, lalu pasang order di sekuritas:
                    </p>
                    <div className="mt-2 space-y-1.5 text-slate-600">
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2 text-emerald-900">
                        <strong>Antrean Beli:</strong> Pasang bid di <em>Area Beli Ideal</em> (jangan kejar harga di
                        resisten).
                      </div>
                      <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-2 text-rose-900">
                        <strong>Automatic Stop Loss:</strong> Pasang fitur <em>Stop Order / GTC</em> di sekuritas persis
                        di harga SL untuk mengunci risiko.
                      </div>
                      <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-900">
                        <strong>Take Profit 1:</strong> Pasang antrean jual untuk 50% lot saat harga menyentuh TP1,
                        sisanya kawal dengan trailing stop.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
