"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { formatNumber, formatPercent } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  Zap,
  Inbox,
  Loader2,
  HelpCircle,
  X,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { ScreenerItem } from "@/types";

export default function ScreenerPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "OVERSOLD" | "BREAKOUT" | "VALUE">("ALL");
  const [items, setItems] = useState<ScreenerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isKamusOpen, setIsKamusOpen] = useState(false);

  const loadScreener = async () => {
    try {
      const res = await api.getScreener(activeTab);
      if (res) {
        setItems(res.map((r: any) => ({
          ticker: r.ticker,
          name: r.name,
          sector: r.sector,
          price: r.price,
          changePct: r.change_pct,
          volume: r.volume,
          rsi: r.rsi,
          maStatus: r.ma_status,
          strategy: r.strategy,
          score: r.score,
          catalyst: r.catalyst,
          support: r.support,
          resistance: r.resistance,
        })));
      }
    } catch (err) {
      console.warn("Screener API fallback:", err);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const res = await api.scanScreener();
      if (res) {
        setItems(res.map((r: any) => ({
          ticker: r.ticker,
          name: r.name,
          sector: r.sector,
          price: r.price,
          changePct: r.change_pct,
          volume: r.volume,
          rsi: r.rsi,
          maStatus: r.ma_status,
          strategy: r.strategy,
          score: r.score,
          catalyst: r.catalyst,
          support: r.support,
          resistance: r.resistance,
        })));
      }
    } catch (err) {
      console.warn("Scan screener error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    loadScreener();
  }, [activeTab]);

  const filteredItems = items.filter((item) => {
    const matchesTab = activeTab === "ALL" || item.strategy === activeTab;
    const matchesSearch = 
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-16">
      <Topbar
        title="EOD Stock Screener (Pemilih Saham Otomatis)"
        subtitle="Filter peluang harian berbasis algoritma teknikal, volume spike, & valuasi pasca-closing"
        onRefresh={loadScreener}
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Preset Strategy Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "ALL"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Semua Sinyal ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("OVERSOLD")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "OVERSOLD"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Oversold Rebound (RSI &lt; 30)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("BREAKOUT")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "BREAKOUT"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Breakout / Golden Cross</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("VALUE")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "VALUE"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Undervalued / Value Stocks</span>
            </button>
          </div>

          {/* Search Box & Scan Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari Ticker / Nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsKamusOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <span>Kamus Badge</span>
            </button>

            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Scan EOD</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Screener Results Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Ticker</th>
                  <th className="py-3 px-3">Strategi</th>
                  <th className="py-3 px-3">Harga Close</th>
                  <th className="py-3 px-3">Perubahan</th>
                  <th className="py-3 px-3">RSI (14)</th>
                  <th className="py-3 px-3">Status MA</th>
                  <th className="py-3 px-3">Katalis & Alasan Sinyal</th>
                  <th className="py-3 px-3">AI Score</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.ticker} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {item.ticker}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono border ${
                          item.strategy === "OVERSOLD"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : item.strategy === "BREAKOUT"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {item.strategy}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        Rp {formatNumber(item.price)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold">
                        <span className={item.changePct >= 0 ? "text-emerald-700" : "text-rose-600"}>
                          {formatPercent(item.changePct)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        <span className={`font-bold ${
                          item.rsi < 30 ? "text-purple-700" : item.rsi > 70 ? "text-rose-600" : "text-slate-700"
                        }`}>
                          {item.rsi}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-700 text-[11px]">
                        {item.maStatus}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                        {item.catalyst}
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">
                            {item.score}
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-600 rounded-full" 
                              style={{ width: `${item.score}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => alert(`Saham ${item.ticker} siap ditambahkan ke Trading Plan!`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors ml-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Plan Beli</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-xs">Belum Ada Hasil Screening</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
                        Klik tombol &quot;Scan EOD&quot; untuk memindai sinyal teknikal (Oversold, Breakout, Value) dari saham IDX.
                      </p>
                      <button
                        type="button"
                        onClick={handleRunScan}
                        disabled={isScanning}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memindai Bursa IDX...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Jalankan Scan EOD Sekarang</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Screener Parameters Info Box */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Kriteria Otomatis Screener EOD</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Screener dijalankan oleh scheduler setiap hari bursa pukul 17:30 WIB pasca-closing market. Data historis diolah melalui backend service untuk mendeteksi saham yang memenuhi kriteria oversold rebound, golden cross breakout dengan konfirmasi lonjakan volume di atas rata-rata 20 hari, atau saham dividend yield tinggi dengan valuasi diskon.
          </p>
        </div>
      </div>

      {/* Modal Bantuan Cepat: Kamus Badge Screener */}
      {isKamusOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kamus Badge Strategi Screener
                  </h3>
                  <p className="text-xs text-slate-500">
                    Panduan formula teknikal, arti warna badge, dan skala AI Score
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKamusOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* 3 Strategy Badges */}
              <div className="space-y-3">
                {/* Oversold */}
                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold font-mono border border-purple-200">
                      OVERSOLD (Ungu)
                    </span>
                    <span className="text-xs font-semibold text-purple-700">RSI &lt; 35 • Support Mayor</span>
                  </div>
                  <strong className="block text-slate-900 text-sm">Jenuh Jual Ekstrem (Buy on Weakness)</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Harga sudah turun sangat dalam dan menyentuh lantai support kuat. Tekanan jual habis, ruang penurunan terbatas.
                  </p>
                  <p className="text-purple-900 font-medium pt-1">
                    👉 <strong>Rekomendasi Aksi:</strong> Beli bertahap saat candle hijau/pantulan reversal muncul. Pasang SL ketat di bawah support.
                  </p>
                </div>

                {/* Breakout */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono border border-blue-200">
                      BREAKOUT (Biru)
                    </span>
                    <span className="text-xs font-semibold text-blue-700">Close &ge; MA20 • RSI &ge; 55</span>
                  </div>
                  <strong className="block text-slate-900 text-sm">Momentum Tren Kenaikan Baru (Trend Following)</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Harga menembus dan bertahan di atas MA20 dengan volume aktif. Fase sideways selesai dan tren akselerasi dimulai.
                  </p>
                  <p className="text-blue-900 font-medium pt-1">
                    👉 <strong>Rekomendasi Aksi:</strong> <em>Buy on Momentum</em> untuk menunggangi tren akselerasi jangka pendek.
                  </p>
                </div>

                {/* Value */}
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold font-mono border border-amber-200">
                      VALUE (Kuning Emas)
                    </span>
                    <span className="text-xs font-semibold text-amber-800">Support MA50 • Blue Chip</span>
                  </div>
                  <strong className="block text-slate-900 text-sm">Akumulasi Sehat &amp; Valuasi Wajar</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Saham berfundamental kuat (Blue Chip/LQ45) yang berkonsolidasi stabil di atas garis penopang MA50.
                  </p>
                  <p className="text-amber-900 font-medium pt-1">
                    👉 <strong>Rekomendasi Aksi:</strong> Cicil beli santai (*DCA*) untuk portofolio investasi jangka menengah-panjang.
                  </p>
                </div>
              </div>

              {/* AI Score Guide */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  🔢 Panduan Tingkatan AI Score (0 – 100)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                    <strong className="block text-emerald-800 font-bold">&ge; 85 (Hijau Zamrud)</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Peluang Utama (Sangat Matang, Risk/Reward Maksimal).
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-200">
                    <strong className="block text-blue-800 font-bold">75 – 84 (Biru / Amber)</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Sinyal Baik (Tunggu konfirmasi candle hijau esok pagi).
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <strong className="block text-slate-700 font-bold">&lt; 75 (Abu-abu)</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Sinyal Moderat (Cukup pantau di watchlist).
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <Link
                href="/guide"
                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                <span>Buka Panduan &amp; SOP Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsKamusOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
