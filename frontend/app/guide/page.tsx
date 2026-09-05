"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { 
  Compass, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  LifeBuoy, 
  Search, 
  BookOpen, 
  Briefcase, 
  TrendingUp, 
  Calculator, 
  Sparkles, 
  ArrowRight,
  HelpCircle,
  CheckSquare,
  Square,
  Layers,
  AlertOctagon,
  LineChart
} from "lucide-react";

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<"FLOW" | "FEATURES" | "STATUS" | "RULES" | "CHECKLIST">("FLOW");
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (id: number) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-16">
      <Topbar
        title="Panduan Cara Pakai & SOP Trading"
        subtitle="Standar operasional prosedur trading EOD & panduan lengkap fitur Asisten Saham"
      />

      <div className="p-6 space-y-8 max-w-6xl mx-auto w-full">
        {/* Hero Banner: EOD Philosophy */}
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-6 md:p-8 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wider uppercase border border-emerald-200 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Filosofi EOD Decision Copilot
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Trading Disiplin Tanpa Emosi Jam Bursa
              </h2>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Mayoritas trader merugi karena membuat keputusan saat pasar sedang bergejolak (FOMO, panik, dan ragu cut loss). Asisten Saham didesain untuk menganalisis pasar <strong>pasca-penutupan bursa (17:30 WIB)</strong> saat pikiran tenang dan data harian sudah valid, sehingga esok pagi Anda cukup mengeksekusi rencana tanpa ragu.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <Link
                href="/portfolio"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                <span>Mulai Input Saham</span>
              </Link>
              <Link
                href="/screener"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors"
              >
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Scan Peluang EOD</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          {[
            { id: "FLOW", label: "1. Siklus Rutinitas 17:30", icon: Clock },
            { id: "FEATURES", label: "2. Panduan 5 Fitur", icon: Compass },
            { id: "STATUS", label: "3. Kamus Lengkap & Glosarium", icon: BookOpen },
            { id: "RULES", label: "4. SOP Anti-Nyangkut", icon: ShieldAlert },
            { id: "CHECKLIST", label: "5. Checklist Pemula", icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Siklus Rutinitas 17:30 */}
        {activeTab === "FLOW" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Alur Kerja Harian Trader Disiplin</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ikuti 4 langkah terstruktur setiap sore hari bursa (Senin s.d. Jumat)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs relative flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-mono font-bold text-sm flex items-center justify-center mb-3">
                    01
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Bursa Tutup (17:30 WIB)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Data closing harian BEI/IDX selesai dibentuk. Harga closing menjadi data paling valid karena mencerminkan konsensus akhir seluruh pelaku pasar.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Data Closing Valid</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs relative flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-mono font-bold text-sm flex items-center justify-center mb-3">
                    02
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Cek Smart Dashboard</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Buka Dashboard untuk melihat kartu aksi harian: Apakah ada saham berlabel <strong>Cut Loss (Merah)</strong>, <strong>Take Profit (Hijau)</strong>, atau <strong>Trailing Stop (Oranye)</strong>?
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cek Warna Aksi</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs relative flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-mono font-bold text-sm flex items-center justify-center mb-3">
                    03
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Evaluasi AI Copilot & Chart</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Klik <strong>AI Copilot</strong> untuk membaca ulasan teknikal berbasis MA20/50 & RSI. Buka <strong>Chart</strong> untuk melihat letak candle terhadap garis Target Price dan Stop Loss Anda.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validasi Objektif</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs relative flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-mono font-bold text-sm flex items-center justify-center mb-3">
                    04
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Pasang Order di Sekuritas</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pasang antrean order jual/beli (Automatic Order / GTC) di aplikasi sekuritas Anda malam hari atau sebelum jam 09:00 WIB. Jam bursa cukup dipantau tanpa stres.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-purple-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Eksekusi Tanpa Ragu</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Panduan 5 Fitur Utama */}
        {activeTab === "FEATURES" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Panduan Lengkap 5 Fitur Utama</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ketahui fungsi spesifik setiap menu dan kapan saat tepat menggunakannya
              </p>
            </div>

            <div className="space-y-4">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
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
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Portfolio Summary Cards</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Memantau total equity pasar, floating PnL (Rp & %), serta rasio alokasi saham vs cash cadangan.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Smart Action Cards</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Kartu status harian saham Anda dengan warna tegas (Cut Loss, TP, Hold, Trailing Stop, Recovery).
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Daily Action Sheet</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Daftar aksi yang diurutkan dari yang paling darurat (Cut Loss) hingga rekomendasi santai (Hold).
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">2. Portofolio &amp; Trading Plan</h4>
                      <p className="text-xs text-slate-500">Pencatatan posisi riil &amp; manajemen risiko</p>
                    </div>
                  </div>
                  <Link
                    href="/portfolio"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    <span>Buka Portofolio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Form Tambah Saham</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Wajib tentukan Avg Beli, Target Profit (TP), dan batas Stop Loss (SL) sejak awal sebelum membeli.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Money Management Sektor</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Mencegah risiko kebangkrutan dengan membatasi alokasi dana maksimal 25-30% per sektor industri.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Selling Scale-Out Matrix</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Metode jual bertahap: TP1 jual 50%, TP2 jual 25%, dan sisa 25% diproteksi Trailing Stop 7%.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                      <LifeBuoy className="w-5 h-5" />
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
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Diagnosa Kerugian AI</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Menganalisis apakah penurunan harga masih wajar atau sudah merusak struktur tren jangka panjang.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">Kalkulator Precision Avg Down</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Menghitung persis berapa lot &amp; rupiah modal tambahan yang dibutuhkan untuk menurunkan harga BEP.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 mb-1">3 Skenario Penyelamatan</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Pilihan solusi konkrit: Cut Loss langsung, Average Down di Support Mayor, atau Exit saat pantulan BEP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 4 & 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Feature 4 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">4. EOD Stock Screener</h4>
                        <p className="text-xs text-slate-500">Cari peluang baru pasca-closing</p>
                      </div>
                    </div>
                    <Link
                      href="/screener"
                      className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      <span>Buka Screener</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                    Filter otomatis saham likuid IDX berdasarkan 3 strategi unggulan: <strong>Oversold Rebound (RSI &lt; 35)</strong>, <strong>Breakout MA20</strong>, dan <strong>Value Stocks</strong>. Klik tombol <em>"Plan Beli"</em> untuk memasukkannya ke trading plan.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">5. AI Trading Journal</h4>
                        <p className="text-xs text-slate-500">Evaluasi transaksi &amp; psikologi</p>
                      </div>
                    </div>
                    <Link
                      href="/journal"
                      className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-800"
                    >
                      <span>Buka Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                    Catat setiap penjualan yang selesai (untung maupun rugi). Tandai apakah eksekusi Anda <strong>Disiplin Plan</strong>, <strong>FOMO Buy</strong>, atau <strong>Panic Sell</strong>. AI Post-Mortem akan menganalisis bias emosional Anda secara berkala.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Kamus Lengkap Badge & Glosarium */}
        {activeTab === "STATUS" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Kamus Lengkap Badge, Status &amp; Glosarium Bursa</h3>
              <p className="text-sm text-slate-500 mt-1">
                Panduan komprehensif arti setiap badge warna di Screener, Recovery Engine, Dashboard, serta istilah kunci pasar modal
              </p>
            </div>

            {/* Bagian A: Badge Strategi Screener */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  🔍
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">A. Badge Strategi EOD Screener</h4>
                  <p className="text-xs text-slate-500">Formula teknikal yang mendasari pemilihan saham otomatis</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Oversold */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold font-mono border border-purple-200">
                      OVERSOLD
                    </span>
                    <span className="text-xs text-purple-700 font-semibold">RSI &lt; 35</span>
                  </div>
                  <strong className="block text-sm text-slate-900">Jenuh Jual Ekstrem di Major Support</strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Harga sudah turun sangat dalam dan menyentuh lantai support kuat. Tekanan jual habis, ruang penurunan terbatas.
                  </p>
                  <div className="p-2.5 rounded-lg bg-white border border-purple-100 text-xs text-purple-900 font-medium">
                    👉 <strong>Aksi:</strong> <em>Buy on Weakness</em> saat muncul konfirmasi pantulan (candle hijau).
                  </div>
                </div>

                {/* Breakout */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono border border-blue-200">
                      BREAKOUT
                    </span>
                    <span className="text-xs text-blue-700 font-semibold">Close &ge; MA20</span>
                  </div>
                  <strong className="block text-sm text-slate-900">Momentum Tren Kenaikan Baru</strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Harga menembus dan bertahan di atas MA20 dengan RSI &ge; 55 dan volume aktif. Fase sideways selesai.
                  </p>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 text-xs text-blue-900 font-medium">
                    👉 <strong>Aksi:</strong> <em>Buy on Momentum</em> untuk menunggangi tren akselerasi jangka pendek.
                  </div>
                </div>

                {/* Value */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold font-mono border border-amber-200">
                      VALUE
                    </span>
                    <span className="text-xs text-amber-800 font-semibold">Support MA50</span>
                  </div>
                  <strong className="block text-sm text-slate-900">Akumulasi Sehat &amp; Valuasi Wajar</strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Saham berfundamental kokoh (Blue Chip) yang sedang berkonsolidasi stabil di atas garis penopang MA50.
                  </p>
                  <div className="p-2.5 rounded-lg bg-white border border-amber-100 text-xs text-amber-900 font-medium">
                    👉 <strong>Aksi:</strong> Cicil beli bertahap (*DCA*) untuk tabungan investasi jangka panjang.
                  </div>
                </div>
              </div>

              {/* AI Score & Risk:Reward Deep Dive Sub-Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* RRR Deep Dive */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      🎯 Risk : Reward Ratio (RRR)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold font-mono">
                      Fondasi Profit
                    </span>
                  </div>
                  <strong className="block text-slate-900 text-xs font-bold">
                    Matematika Peluang: Menang Walau Win-Rate Hanya 40%
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    RRR membandingkan batas risiko rugi Stop Loss terhadap target keuntungan TP:
                  </p>
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs font-mono space-y-1">
                    <div className="text-slate-800 font-bold">
                      RRR = 1 : (TP - Entry) / (Entry - SL)
                    </div>
                    <div className="text-slate-600 text-[11px] font-sans">
                      Contoh: Beli Rp 1.000, SL Rp 950 (-5%), TP Rp 1.100 (+10%) &rarr; <strong>RRR = 1 : 2.0</strong>
                    </div>
                  </div>
                  <p className="text-emerald-950 text-xs leading-relaxed">
                    💡 <strong>Simulasi 10 Trade:</strong> Jika 6 trade rugi (-Rp 300) dan 4 trade untung (+Rp 400), total modal tetap <strong>cuan bersih +Rp 100</strong>.
                  </p>
                </div>

                {/* AI Score Deep Dive */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      🤖 AI Technical Score (0 – 100)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold font-mono">
                      Filter Probabilitas
                    </span>
                  </div>
                  <strong className="block text-slate-900 text-xs font-bold">
                    Tingkat Kematangan Setup &amp; Konvergensi Indikator
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mengukur seberapa ideal titik masuk saat closing bursa (posisi MA, momentum RSI, dan jarak support/resist).
                  </p>
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-white border border-emerald-200 text-[11px]">
                      <strong className="text-emerald-800 font-bold">&ge; 85 (Hijau Zamrud)</strong>
                      <span className="text-slate-600">Peluang Utama (Setup Sangat Matang)</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-white border border-blue-200 text-[11px]">
                      <strong className="text-blue-800 font-bold">75 – 84 (Biru / Amber)</strong>
                      <span className="text-slate-600">Sinyal Baik (Tunggu Trigger Pagi)</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-[11px]">
                      <strong className="text-slate-700 font-bold">&lt; 75 (Abu-abu)</strong>
                      <span className="text-slate-600">Sinyal Moderat (Hanya Watchlist)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian B: Badge Kelayakan Recovery Engine */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  🛟
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">B. Badge Kelayakan di Recovery Engine</h4>
                  <p className="text-xs text-slate-500">Label kesesuaian skenario penyelamatan modal berdasarkan profil saham &amp; kas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                    STRATEGI UTAMA INVESTASI
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    Khusus saham investasi berfundamental kuat dan berdividen tunai. Menghindari cut loss di dasar harga dan mengandalkan pemulihan pasif dividen.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold font-mono">
                    PILIHAN TERBAIK JIKA KAS TERBATAS
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    Skenario menahan posisi untuk menunggu pantulan (*Hold for Rebound*) menuju Resistance MA20 tanpa menuntut suntikan modal sepeser pun.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold font-mono">
                    STRATEGI AGRESIF TRADING
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    Untuk saham trading dengan likuiditas tinggi. Menuntut kecepatan eksekusi cicil di Major Support dan langsung exit cepat di area BEP baru.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
                    KURANG DIREKOMENDASIKAN UNTUK INVESTASI
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    Peringatan darurat bahwa melakukan cut loss panik pada saham investasi berdividen tinggi adalah tindakan yang merugikan modal jangka panjang.
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian C: Kamus 5 Warna Aksi Dashboard */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  📊
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">C. Kamus 5 Warna Smart Action Cards (Dashboard)</h4>
                  <p className="text-xs text-slate-500">Panduan instruksi aksi sebelum market buka pukul 09:00 WIB</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Red */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-bold font-mono">
                        SELL / CUT LOSS
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Kondisi: Harga Closing menembus batas Stop Loss (SL)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        <strong>Aksi Wajib:</strong> Segera pasang order jual besok pagi. Jangan pernah berharap atau menunda, karena proteksi modal Anda adalah prioritas nomor satu.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-200/80 text-rose-800 text-xs font-bold shrink-0 self-start md:self-auto">
                    Prioritas #1 (Darurat)
                  </span>
                </div>

                {/* Green */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                        TAKE PROFIT / TRIM
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Kondisi: Harga Closing menyentuh atau melampaui Target Price (TP)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        <strong>Aksi Wajib:</strong> Realisasikan keuntungan bertahap (jual 50% posisi). Jangan biarkan floating profit yang sudah didapat kembali menjadi floating loss.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-200/80 text-emerald-800 text-xs font-bold shrink-0 self-start md:self-auto">
                    Prioritas #2 (Amankan Cuan)
                  </span>
                </div>

                {/* Orange */}
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-bold font-mono">
                        TRAILING STOP WARNING
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Kondisi: Saham yang sedang profit turun &gt; 7% dari harga tertingginya
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        <strong>Aksi Wajib:</strong> Jual sisa posisi Anda untuk mengunci keuntungan sebelum tren bullish benar-benar berbalik menjadi tren turun tajam.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-orange-200/80 text-orange-800 text-xs font-bold shrink-0 self-start md:self-auto">
                    Prioritas #3 (Proteksi Cuan)
                  </span>
                </div>

                {/* Purple */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <LifeBuoy className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-xs font-bold font-mono">
                        RECOVERY MODE / AVERAGING REVIEW
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Kondisi: Saham mengalami floating loss dalam (&gt; 10% trading atau &gt; 30% investasi)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        <strong>Aksi Wajib:</strong> Buka menu Recovery Engine. Jangan averaging down tanpa kalkulator presisi dan konfirmasi sinyal Rebound di Support Mayor.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-200/80 text-purple-800 text-xs font-bold shrink-0 self-start md:self-auto">
                    Prioritas Khusus (Nyangkut)
                  </span>
                </div>

                {/* Yellow */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                        HOLD / MONITOR
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Kondisi: Harga berada di antara batas SL dan TP dengan tren sehat
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        <strong>Aksi Wajib:</strong> Pertahankan posisi (*do nothing*). Biarkan saham bekerja sesuai rencana tanpa tergoda untuk gonta-ganti posisi tanpa alasan teknikal.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold shrink-0 self-start md:self-auto">
                    Kondisi Aman
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian D: Glosarium Istilah Kunci Bursa */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  📖
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">D. Glosarium Istilah Kunci Pasar Modal</h4>
                  <p className="text-xs text-slate-500">Istilah teknis yang digunakan di seluruh antarmuka aplikasi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold text-sm">RSI (Relative Strength Index)</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Indikator momentum dengan skala 0–100. Angka di bawah 30 menandakan harga sudah jenuh jual (*oversold* / sangat murah), sedangkan di atas 70 menandakan jenuh beli (*overbought* / rentan koreksi).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold text-sm">MA20 &amp; MA50 (Moving Average)</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Rata-rata harga penutupan selama 20 hari (tren jangka pendek) dan 50 hari (tren jangka menengah). Harga di atas MA20 menandakan fase *bullish*, sedangkan di bawah MA50 menandakan fase *bearish*.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold text-sm">High Watermark &amp; Trailing Stop</strong>
                  <p className="text-slate-600 leading-relaxed">
                    <em>High Watermark</em> adalah rekor harga tertinggi yang pernah disentuh saham sejak Anda beli. <em>Trailing Stop</em> adalah batas pengaman otomatis (7% di bawah High Watermark) untuk mengunci cuan maksimal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold text-sm">Break-even Price (BEP)</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Titik harga rata-rata impas di mana posisi Anda tidak untung dan tidak rugi (0%). Tujuan kalkulator average down adalah menurunkan level BEP ini agar modal lebih cepat terselamatkan.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold text-sm">Cash Feasibility (Kecukupan Kas)</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Fitur validasi cerdas yang mengecek apakah saldo kas aktif di akun sekuritas Anda mencukupi untuk melakukan pembelian lot tambahan, mencegah Anda kekurangan dana di tengah jalan.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold text-sm">Risk : Reward Ratio (RRR)</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Perbandingan antara batas risiko kerugian (jarak harga entry ke Stop Loss) dengan potensi target keuntungan (jarak harga entry ke Take Profit). Nilai &ge; 1 : 2.0 memungkinkan portofolio tetap untung meski *win rate* hanya 40%.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold text-sm">AI Technical Score</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Skor kuantitatif (0–100) yang mengukur tingkat kematangan dan konvergensi indikator teknikal (MA, RSI, Support/Resist) pasca penutupan bursa sebagai saringan probabilitas statistik harian.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold text-sm">Dividend Yield</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Persentase dividen tunai tahunan yang dibagikan emiten terhadap harga saham saat ini. Arus kas pasif ini berfungsi sebagai benteng pemulihan modal bagi saham bertipe investasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SOP Anti-Nyangkut (Risk Rules) */}
        {activeTab === "RULES" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">4 Aturan Emas Trading Disiplin (Anti-Nyangkut)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prinsip manajemen risiko yang diterapkan oleh trader profesional di seluruh dunia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold text-xs flex items-center justify-center">
                  #1
                </span>
                <h4 className="text-sm font-bold text-slate-900">No Plan, No Trade</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jangan pernah membeli satu lot saham pun sebelum menentukan level <strong>Target Price</strong> dan batas <strong>Stop Loss</strong> yang terukur. Beli berdasarkan analisa teknikal atau valuasi, bukan rumor grup chat.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 font-mono font-bold text-xs flex items-center justify-center">
                  #2
                </span>
                <h4 className="text-sm font-bold text-slate-900">Patuhi Stop Loss Tanpa Kompromi</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cut loss 5%–7% sangat mudah dikembalikan oleh satu kali transaksi profit berikutnya. Namun floating loss 50% membutuhkan kenaikan 100% hanya untuk balik modal (*Break-Even*).
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs flex items-center justify-center">
                  #3
                </span>
                <h4 className="text-sm font-bold text-slate-900">Kunci Profit Bertahap (Scale-Out)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Saat saham naik menyentuh target, segera jual 50% posisi Anda. Hal ini menjamin bahwa apapun yang terjadi di masa depan, transaksi tersebut berakhir sebagai transaksi yang menghasilkan uang.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-mono font-bold text-xs flex items-center justify-center">
                  #4
                </span>
                <h4 className="text-sm font-bold text-slate-900">Jangan Average Down Membabi Buta</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menambah lot pada saham yang sedang terjun bebas hanya mempercepat kehabisan modal (*catching a falling knife*). Hanya lakukan average down jika dihitung dengan kalkulator presisi di area Support Mayor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Checklist Pemula */}
        {activeTab === "CHECKLIST" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Checklist Memulai Aplikasi Asisten Saham</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Centang setiap langkah setelah Anda mencobanya untuk memastikan Anda menguasai seluruh alur aplikasi
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
              {[
                {
                  id: 1,
                  title: "Catat Saham Pertama Anda di Portofolio & Plan",
                  desc: "Klik menu Portofolio & Plan lalu masukkan ticker saham IDX yang Anda miliki beserta Avg Beli, TP, dan SL.",
                  linkText: "Buka Portofolio",
                  href: "/portfolio"
                },
                {
                  id: 2,
                  title: "Buka Smart Dashboard dan Periksa Kartu Aksi",
                  desc: "Lihat ringkasan total portofolio Anda dan periksa status warna saham yang baru saja Anda masukkan.",
                  linkText: "Buka Dashboard",
                  href: "/"
                },
                {
                  id: 3,
                  title: "Buka Candlestick Chart Interaktif",
                  desc: "Di Dashboard atau Portofolio, klik tombol chart untuk melihat candlestick dan garis MA20/MA50.",
                  linkText: "Lihat di Dashboard",
                  href: "/"
                },
                {
                  id: 4,
                  title: "Jalankan Scan Peluang Pasar di EOD Screener",
                  desc: "Buka menu EOD Screener lalu klik tombol 'Scan EOD' untuk memindai bursa pasca-penutupan market.",
                  linkText: "Buka Screener",
                  href: "/screener"
                },
                {
                  id: 5,
                  title: "Simulasikan Rencana Transaksi di Trading Journal",
                  desc: "Buka menu Trading Journal dan coba fitur 'Catat Transaksi' untuk melihat evaluasi psikologis AI.",
                  linkText: "Buka Journal",
                  href: "/journal"
                },
              ].map((item) => {
                const isDone = !!checkedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      isDone
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                        : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-0.5 text-emerald-600 focus:outline-none"
                      >
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <div>
                        <h4 className={`text-xs font-bold ${isDone ? "line-through text-slate-500" : "text-slate-900"}`}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={item.href}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 shrink-0 flex items-center gap-1 self-center"
                    >
                      <span>{item.linkText}</span>
                      <ArrowRight className="w-3 h-3" />
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
