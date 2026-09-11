'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  Clock,
  Compass,
  LifeBuoy,
  Search,
  ShieldAlert,
  Sparkles,
  Square,
  TrendingUp,
} from 'lucide-react';

import { Topbar } from '@/components/Topbar';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'FLOW' | 'FEATURES' | 'STATUS' | 'RULES' | 'CHECKLIST'>('FLOW');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (id: number) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Panduan Cara Pakai & SOP Trading"
        subtitle="Standar operasional prosedur trading EOD & panduan lengkap fitur Asisten Saham"
      />

      <div className="mx-auto w-full max-w-6xl space-y-8 p-6">
        {/* Hero Banner: EOD Philosophy */}
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-6 shadow-2xs md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                Filosofi EOD Decision Copilot
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Trading Disiplin Tanpa Emosi Jam Bursa
              </h2>
              <p className="text-xs leading-relaxed text-slate-600 md:text-sm">
                Mayoritas trader merugi karena membuat keputusan saat pasar sedang bergejolak (FOMO, panik, dan ragu cut
                loss). Asisten Saham didesain untuk menganalisis pasar{' '}
                <strong>pasca-penutupan bursa (17:30 WIB)</strong> saat pikiran tenang dan data harian sudah valid,
                sehingga esok pagi Anda cukup mengeksekusi rencana tanpa ragu.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row md:flex-col">
              <Link
                href="/portfolio"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500"
              >
                <Briefcase className="h-4 w-4" />
                <span>Mulai Input Saham</span>
              </Link>
              <Link
                href="/screener"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
              >
                <Search className="h-4 w-4 text-emerald-600" />
                <span>Scan Peluang EOD</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-1">
          {[
            { id: 'FLOW', label: '1. Siklus Rutinitas 17:30', icon: Clock },
            { id: 'FEATURES', label: '2. Panduan 5 Fitur', icon: Compass },
            {
              id: 'STATUS',
              label: '3. Kamus Lengkap & Glosarium',
              icon: BookOpen,
            },
            { id: 'RULES', label: '4. SOP Anti-Nyangkut', icon: ShieldAlert },
            {
              id: 'CHECKLIST',
              label: '5. Checklist Pemula',
              icon: CheckSquare,
            },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Siklus Rutinitas 17:30 */}
        {activeTab === 'FLOW' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Alur Kerja Harian Trader Disiplin</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Ikuti 4 langkah terstruktur setiap sore hari bursa (Senin s.d. Jumat)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Step 1 */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div>
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 font-mono text-sm font-bold text-slate-800">
                    01
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-slate-900">Bursa Tutup (17:30 WIB)</h4>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Data closing harian BEI/IDX selesai dibentuk. Harga closing menjadi data paling valid karena
                    mencerminkan konsensus akhir seluruh pelaku pasar.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Data Closing Valid</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div>
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 font-mono text-sm font-bold text-emerald-800">
                    02
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-slate-900">Cek Smart Dashboard</h4>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Buka Dashboard untuk melihat kartu aksi harian: Apakah ada saham berlabel{' '}
                    <strong>Cut Loss (Merah)</strong>, <strong>Take Profit (Hijau)</strong>, atau{' '}
                    <strong>Trailing Stop (Oranye)</strong>?
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Cek Warna Aksi</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div>
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 font-mono text-sm font-bold text-blue-800">
                    03
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-slate-900">Evaluasi AI Copilot & Chart</h4>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Klik <strong>AI Copilot</strong> untuk membaca ulasan teknikal berbasis MA20/50 & RSI. Buka{' '}
                    <strong>Chart</strong> untuk melihat letak candle terhadap garis Target Price dan Stop Loss Anda.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-blue-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Validasi Objektif</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div>
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 font-mono text-sm font-bold text-purple-800">
                    04
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-slate-900">Pasang Order di Sekuritas</h4>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Pasang antrean order jual/beli (Automatic Order / GTC) di aplikasi sekuritas Anda malam hari atau
                    sebelum jam 09:00 WIB. Jam bursa cukup dipantau tanpa stres.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-purple-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Eksekusi Tanpa Ragu</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Panduan 5 Fitur Utama */}
        {activeTab === 'FEATURES' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Panduan Lengkap 5 Fitur Utama</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Ketahui fungsi spesifik setiap menu dan kapan saat tepat menggunakannya
              </p>
            </div>

            <div className="space-y-4">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
                  <Link
                    href="/"
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Buka Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <strong className="mb-1 block text-slate-900">Portfolio Summary Cards</strong>
                    <p className="leading-relaxed text-slate-600">
                      Memantau total equity pasar, floating PnL (Rp & %), serta rasio alokasi saham vs cash cadangan.
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
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">2. Portofolio &amp; Trading Plan</h4>
                      <p className="text-xs text-slate-500">
                        Pencatatan posisi riil, kas RDN manual, &amp; eksekusi lot
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/portfolio"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    <span>Buka Portofolio</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
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
                      Tombol <em>[ 🏷️ Jual ]</em> memungkinkan Anda melepas sebagian lot (preset 25%, 50% TP1) atau
                      menutup total posisi dengan kalkulasi Realized PnL instan.
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
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
                  <Link
                    href="/recovery"
                    className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800"
                  >
                    <span>Buka Recovery</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
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
                      Menghitung persis berapa lot &amp; rupiah modal tambahan yang dibutuhkan untuk menurunkan harga
                      BEP.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <strong className="mb-1 block text-slate-900">3 Skenario Penyelamatan</strong>
                    <p className="leading-relaxed text-slate-600">
                      Pilihan solusi konkrit: Cut Loss langsung, Average Down di Support Mayor, atau Exit saat pantulan
                      BEP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
                  <Link
                    href="/screener"
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    <span>Buka Screener</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* 3 Strategi Screening Otomatis */}
                <div>
                  <h5 className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                    3 Strategi Screening Otomatis
                  </h5>
                  <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-800">
                          OVERSOLD
                        </span>
                        <strong className="text-slate-900">Oversold Rebound</strong>
                      </div>
                      <p className="leading-relaxed text-slate-600">
                        Mendeteksi saham yang tertekan jenuh jual (RSI &lt; 35) di area Major Support. Karakter:{' '}
                        <em>Buy on Weakness</em>, risiko penurunan terbatas, potensi pantulan teknikal cepat.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                          BREAKOUT
                        </span>
                        <strong className="text-slate-900">Breakout MA20</strong>
                      </div>
                      <p className="leading-relaxed text-slate-600">
                        Harga menembus garis Moving Average 20 hari dari bawah ke atas. Karakter:{' '}
                        <em>Trend Following</em>, momentum bullish baru dimulai dengan konfirmasi volume sehat.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                          VALUE
                        </span>
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
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                        <Sparkles className="h-3 w-3 text-amber-700" />
                        SOP PRAKTIK HARIAN
                      </span>
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
                          Gunakan tombol <strong>Filter Anggaran</strong> di Screener (misal: <em>&le; Rp 2.000</em>{' '}
                          atau <em>&le; Rp 1.000</em>). Perhatikan label estimasi modal per lot (contoh:{' '}
                          <em>Rp 60.000/lot</em> atau <em>Rp 150.000/lot</em>).
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
                              <strong>Oversold (RSI &lt; 35):</strong> Cocok jika suka berburu diskon di support kuat
                              dan sabar menanti pantulan teknikal.
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
                              <strong>Value Stocks:</strong> Cocok jika ingin swing santai atau akumulasi bertahap di
                              atas MA50 dengan tren medium solid.
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
                            <strong>2. Risk/Reward Ratio (RRR &ge; 1 : 2.0):</strong> Pastikan potensi keuntungan
                            minimal 2x lipat lebih besar dibanding risiko kerugian cut loss.
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                            <strong>3. Watch Trigger 09:00 WIB:</strong> Baca catatan syarat konfirmasi sebelum beli
                            (misal: antrean bid tebal atau candle pembukaan hijau).
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
                          <strong className="text-xs text-slate-900">
                            Pasang Order Disiplin di Aplikasi Sekuritas
                          </strong>
                        </div>
                        <p className="leading-relaxed text-slate-600">
                          Setelah yakin dengan pilihan Anda, klik tombol <em>&quot;+ Plan Beli&quot;</em> untuk
                          menyimpannya ke portofolio, lalu pasang order di sekuritas:
                        </p>
                        <div className="mt-2 space-y-1.5 text-slate-600">
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2 text-emerald-900">
                            <strong>Antrean Beli:</strong> Pasang bid di <em>Area Beli Ideal</em> (jangan kejar harga di
                            resisten).
                          </div>
                          <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-2 text-rose-900">
                            <strong>Automatic Stop Loss:</strong> Pasang fitur <em>Stop Order / GTC</em> di sekuritas
                            persis di harga SL untuk mengunci risiko.
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
              </div>

              {/* Feature 5 */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">5. AI Trading Journal &amp; Post-Mortem</h4>
                      <p className="text-xs text-slate-500">
                        Evaluasi transaksi, psikologi trader, &amp; metrik realized PnL otomatis
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/journal"
                    className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-800"
                  >
                    <span>Buka Journal</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <strong className="mb-1 block text-slate-900">Pencatatan Otomatis dari Portofolio</strong>
                    <p className="leading-relaxed text-slate-600">
                      Setiap penjualan via tombol <em>[ 🏷️ Jual ]</em> (baik Take Profit maupun Cut Loss) langsung
                      tercatat di jurnal tanpa perlu input manual yang merepotkan.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <strong className="mb-1 block text-slate-900">Evaluasi Psikologi Trading</strong>
                    <p className="leading-relaxed text-slate-600">
                      Labeli status mental saat eksekusi: <em>DISCIPLINED</em> (taat trading plan), <em>FOMO_BUY</em>{' '}
                      (beli karena tergiur candle hijau), atau <em>PANIC_SELL</em> (jual panik di dasar).
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <strong className="mb-1 block text-slate-900">Metrik Performa &amp; Post-Mortem</strong>
                    <p className="leading-relaxed text-slate-600">
                      Sistem menghitung <strong>Win Rate %</strong>, <strong>Total Realized PnL</strong>, dan{' '}
                      <strong>Profit Factor</strong> untuk melihat apakah sistem trading Anda menghasilkan profit
                      konsisten.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Kamus Lengkap Badge & Glosarium */}
        {activeTab === 'STATUS' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Kamus Lengkap Badge, Status &amp; Glosarium Bursa</h3>
              <p className="mt-1 text-sm text-slate-500">
                Panduan komprehensif arti setiap badge warna di Screener, Recovery Engine, Dashboard, serta istilah
                kunci pasar modal
              </p>
            </div>

            {/* Bagian A: Badge Strategi Screener */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
                    <span className="rounded-full border border-purple-200 bg-purple-100 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-800">
                      OVERSOLD
                    </span>
                    <span className="text-xs font-semibold text-purple-700">RSI &lt; 35</span>
                  </div>
                  <strong className="block text-sm text-slate-900">Jenuh Jual Ekstrem di Major Support</strong>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Harga sudah turun sangat dalam dan menyentuh lantai support kuat. Tekanan jual habis, ruang
                    penurunan terbatas.
                  </p>
                  <div className="rounded-lg border border-purple-100 bg-white p-2.5 text-xs font-medium text-purple-900">
                    👉 <strong>Aksi:</strong> <em>Buy on Weakness</em> saat muncul konfirmasi pantulan (candle hijau).
                  </div>
                </div>

                {/* Breakout */}
                <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-800">
                      BREAKOUT
                    </span>
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
                    <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-800">
                      VALUE
                    </span>
                    <span className="text-xs font-semibold text-amber-800">Support MA50</span>
                  </div>
                  <strong className="block text-sm text-slate-900">Akumulasi Sehat &amp; Valuasi Wajar</strong>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Saham berfundamental kokoh (Blue Chip) yang sedang berkonsolidasi stabil di atas garis penopang
                    MA50.
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
                      Fondasi Profit
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
                    💡 <strong>Simulasi 10 Trade:</strong> Jika 6 trade rugi (-Rp 300) dan 4 trade untung (+Rp 400),
                    total modal tetap <strong>cuan bersih +Rp 100</strong>.
                  </p>
                </div>

                {/* AI Score Deep Dive */}
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold tracking-wider text-slate-900 uppercase">
                      🤖 AI Technical Score (0 – 100)
                    </span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800">
                      Filter Probabilitas
                    </span>
                  </div>
                  <strong className="block text-xs font-bold text-slate-900">
                    Tingkat Kematangan Setup &amp; Konvergensi Indikator
                  </strong>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Mengukur seberapa ideal titik masuk saat closing bursa (posisi MA, momentum RSI, dan jarak
                    support/resist).
                  </p>
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-1.5 px-2.5 text-[11px]">
                      <strong className="font-bold text-emerald-800">&ge; 85 (Hijau Zamrud)</strong>
                      <span className="text-slate-600">Peluang Utama (Setup Sangat Matang)</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-1.5 px-2.5 text-[11px]">
                      <strong className="font-bold text-blue-800">75 – 84 (Biru / Amber)</strong>
                      <span className="text-slate-600">Sinyal Baik (Tunggu Trigger Pagi)</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-1.5 px-2.5 text-[11px]">
                      <strong className="font-bold text-slate-700">&lt; 75 (Abu-abu)</strong>
                      <span className="text-slate-600">Sinyal Moderat (Hanya Watchlist)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian B: Badge Kelayakan Recovery Engine */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono font-bold text-emerald-800">
                    STRATEGI UTAMA INVESTASI
                  </span>
                  <p className="leading-relaxed text-slate-700">
                    Khusus saham investasi berfundamental kuat dan berdividen tunai. Menghindari cut loss di dasar harga
                    dan mengandalkan pemulihan pasif dividen.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-mono font-bold text-amber-800">
                    PILIHAN TERBAIK JIKA KAS TERBATAS
                  </span>
                  <p className="leading-relaxed text-slate-700">
                    Skenario menahan posisi untuk menunggu pantulan (*Hold for Rebound*) menuju Resistance MA20 tanpa
                    menuntut suntikan modal sepeser pun.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-purple-200 bg-purple-50/40 p-3.5">
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-mono font-bold text-purple-800">
                    STRATEGI AGRESIF TRADING
                  </span>
                  <p className="leading-relaxed text-slate-700">
                    Untuk saham trading dengan likuiditas tinggi. Menuntut kecepatan eksekusi cicil di Major Support dan
                    langsung exit cepat di area BEP baru.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 font-mono font-bold text-rose-800">
                    KURANG DIREKOMENDASIKAN UNTUK INVESTASI
                  </span>
                  <p className="leading-relaxed text-slate-700">
                    Peringatan darurat bahwa melakukan cut loss panik pada saham investasi berdividen tinggi adalah
                    tindakan yang merugikan modal jangka panjang.
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian C: Kamus 5 Warna Aksi Dashboard */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 font-bold text-emerald-700">
                  📊
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    C. Kamus 5 Warna Smart Action Cards (Dashboard)
                  </h4>
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
                      <span className="rounded bg-rose-100 px-2 py-0.5 font-mono text-xs font-bold text-rose-800">
                        SELL / CUT LOSS
                      </span>
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
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800">
                        TAKE PROFIT / TRIM
                      </span>
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

                {/* Orange */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 md:flex-row md:items-center">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="rounded bg-orange-100 px-2 py-0.5 font-mono text-xs font-bold text-orange-800">
                        TRAILING STOP WARNING
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Kondisi: Saham yang sedang profit turun &gt; 7% dari harga tertingginya
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                        <strong>Aksi Wajib:</strong> Jual sisa posisi Anda untuk mengunci keuntungan sebelum tren
                        bullish benar-benar berbalik menjadi tren turun tajam.
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
                      <span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-xs font-bold text-purple-800">
                        RECOVERY MODE / AVERAGING REVIEW
                      </span>
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

                {/* Yellow */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
                        HOLD / MONITOR
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Kondisi: Harga berada di antara batas SL dan TP dengan tren sehat
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                        <strong>Aksi Wajib:</strong> Pertahankan posisi (*do nothing*). Biarkan saham bekerja sesuai
                        rencana tanpa tergoda untuk gonta-ganti posisi tanpa alasan teknikal.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 md:self-auto">
                    Kondisi Aman
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian D: Glosarium Istilah Kunci Bursa */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">RSI (Relative Strength Index)</strong>
                  <p className="leading-relaxed text-slate-600">
                    Indikator momentum dengan skala 0–100. Angka di bawah 30 menandakan harga sudah jenuh jual
                    (*oversold* / sangat murah), sedangkan di atas 70 menandakan jenuh beli (*overbought* / rentan
                    koreksi).
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">MA20 &amp; MA50 (Moving Average)</strong>
                  <p className="leading-relaxed text-slate-600">
                    Rata-rata harga penutupan selama 20 hari (tren jangka pendek) dan 50 hari (tren jangka menengah).
                    Harga di atas MA20 menandakan fase *bullish*, sedangkan di bawah MA50 menandakan fase *bearish*.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">High Watermark &amp; Trailing Stop</strong>
                  <p className="leading-relaxed text-slate-600">
                    <em>High Watermark</em> adalah rekor harga tertinggi yang pernah disentuh saham sejak Anda beli.{' '}
                    <em>Trailing Stop</em> adalah batas pengaman otomatis (7% di bawah High Watermark) untuk mengunci
                    cuan maksimal.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">Break-even Price (BEP)</strong>
                  <p className="leading-relaxed text-slate-600">
                    Titik harga rata-rata impas di mana posisi Anda tidak untung dan tidak rugi (0%). Tujuan kalkulator
                    average down adalah menurunkan level BEP ini agar modal lebih cepat terselamatkan.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">Cash Feasibility (Kecukupan Kas)</strong>
                  <p className="leading-relaxed text-slate-600">
                    Fitur validasi cerdas yang mengecek apakah saldo kas aktif di akun sekuritas Anda mencukupi untuk
                    melakukan pembelian lot tambahan, mencegah Anda kekurangan dana di tengah jalan.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">Risk : Reward Ratio (RRR)</strong>
                  <p className="leading-relaxed text-slate-600">
                    Perbandingan antara batas risiko kerugian (jarak harga entry ke Stop Loss) dengan potensi target
                    keuntungan (jarak harga entry ke Take Profit). Nilai &ge; 1 : 2.0 memungkinkan portofolio tetap
                    untung meski *win rate* hanya 40%.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">AI Technical Score</strong>
                  <p className="leading-relaxed text-slate-600">
                    Skor kuantitatif (0–100) yang mengukur tingkat kematangan dan konvergensi indikator teknikal (MA,
                    RSI, Support/Resist) pasca penutupan bursa sebagai saringan probabilitas statistik harian.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">Realized PnL vs Floating PnL</strong>
                  <p className="leading-relaxed text-slate-600">
                    <em>Floating PnL</em> adalah laba/rugi berjalan dari posisi saham yang masih aktif di Portofolio.{' '}
                    <em>Realized PnL</em> adalah laba/rugi riil yang sudah terkunci saat posisi dipangkas/dijual dan
                    tercatat di Jurnal Trading.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">Scale-Out (Pangkas Lot Parsial)</strong>
                  <p className="leading-relaxed text-slate-600">
                    Strategi menjual sebagian lot (misal 50% di TP1) untuk mengamankan keuntungan nyata ke kas,
                    sementara sisa posisi dibiarkan mengikuti potensi tren reli berikutnya dengan trailing stop.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">Saldo Kas RDN (Manual)</strong>
                  <p className="leading-relaxed text-slate-600">
                    Pencatatan kas tunai mandiri yang diinput pengguna sesuai saldo rekening dana nasabah (RDN) di
                    sekuritas untuk mengukur ketersediaan modal dan alokasi risiko portofolio.
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <strong className="block text-sm font-bold text-slate-900">Dividend Yield</strong>
                  <p className="leading-relaxed text-slate-600">
                    Persentase dividen tunai tahunan yang dibagikan emiten terhadap harga saham saat ini. Arus kas pasif
                    ini berfungsi sebagai benteng pemulihan modal bagi saham bertipe investasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SOP Anti-Nyangkut (Risk Rules) */}
        {activeTab === 'RULES' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">4 Aturan Emas Trading Disiplin (Anti-Nyangkut)</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Prinsip manajemen risiko yang diterapkan oleh trader profesional di seluruh dunia
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 font-mono text-xs font-bold text-emerald-800">
                  #1
                </span>
                <h4 className="text-sm font-bold text-slate-900">No Plan, No Trade</h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  Jangan pernah membeli satu lot saham pun sebelum menentukan level <strong>Target Price</strong> dan
                  batas <strong>Stop Loss</strong> yang terukur. Beli berdasarkan analisa teknikal atau valuasi, bukan
                  rumor grup chat.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 font-mono text-xs font-bold text-rose-800">
                  #2
                </span>
                <h4 className="text-sm font-bold text-slate-900">Patuhi Stop Loss Tanpa Kompromi</h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  Cut loss 5%–7% sangat mudah dikembalikan oleh satu kali transaksi profit berikutnya. Namun floating
                  loss 50% membutuhkan kenaikan 100% hanya untuk balik modal (*Break-Even*).
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 font-mono text-xs font-bold text-blue-800">
                  #3
                </span>
                <h4 className="text-sm font-bold text-slate-900">Kunci Profit Bertahap (Scale-Out)</h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  Saat saham naik menyentuh target, segera jual 50% posisi Anda. Hal ini menjamin bahwa apapun yang
                  terjadi di masa depan, transaksi tersebut berakhir sebagai transaksi yang menghasilkan uang.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 font-mono text-xs font-bold text-purple-800">
                  #4
                </span>
                <h4 className="text-sm font-bold text-slate-900">Jangan Average Down Membabi Buta</h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  Menambah lot pada saham yang sedang terjun bebas hanya mempercepat kehabisan modal (*catching a
                  falling knife*). Hanya lakukan average down jika dihitung dengan kalkulator presisi di area Support
                  Mayor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Checklist Pemula */}
        {activeTab === 'CHECKLIST' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Checklist Memulai Aplikasi Asisten Saham</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Centang setiap langkah setelah Anda mencobanya untuk memastikan Anda menguasai seluruh alur aplikasi
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              {[
                {
                  id: 1,
                  title: 'Atur Saldo Kas RDN & Catat Saham Pertama di Portofolio',
                  desc: 'Klik menu Portofolio, sesuaikan Saldo Kas RDN Anda via tombol [ ✏️ Edit ], lalu masukkan ticker saham IDX yang Anda miliki beserta Avg Beli, TP, dan SL.',
                  linkText: 'Buka Portofolio',
                  href: '/portfolio',
                },
                {
                  id: 2,
                  title: 'Buka Smart Dashboard dan Periksa Kartu Aksi',
                  desc: 'Lihat ringkasan total portofolio Anda dan periksa status warna saham yang baru saja Anda masukkan.',
                  linkText: 'Buka Dashboard',
                  href: '/',
                },
                {
                  id: 3,
                  title: 'Buka Candlestick Chart Interaktif',
                  desc: 'Di Dashboard atau Portofolio, klik tombol chart untuk melihat candlestick dan garis MA20/MA50.',
                  linkText: 'Lihat di Dashboard',
                  href: '/',
                },
                {
                  id: 4,
                  title: 'Jalankan Scan Peluang Pasar di EOD Screener',
                  desc: "Buka menu EOD Screener lalu klik tombol 'Scan EOD'. Terapkan Filter Anggaran (misal: ≤ Rp 2.000) dan ikuti SOP 4 Langkah untuk memilih saham dengan RRR ≥ 1:2.0.",
                  linkText: 'Buka Screener',
                  href: '/screener',
                },
                {
                  id: 5,
                  title: 'Uji Coba Pangkas / Jual Lot Saham ke Trading Journal',
                  desc: 'Coba klik tombol [ 🏷️ Jual ] pada baris saham di Portofolio untuk melihat kalkulasi Realized PnL instan dan pencatatannya otomatis ke menu Trading Journal.',
                  linkText: 'Buka Journal',
                  href: '/journal',
                },
              ].map(item => {
                const isDone = !!checkedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition-all ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button type="button" className="mt-0.5 text-emerald-600 focus:outline-none">
                        {isDone ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                      <div>
                        <h4
                          className={`text-xs font-bold ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                        >
                          {item.title}
                        </h4>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{item.desc}</p>
                      </div>
                    </div>

                    <Link
                      href={item.href}
                      onClick={e => e.stopPropagation()}
                      className="flex shrink-0 items-center gap-1 self-center text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      <span>{item.linkText}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
