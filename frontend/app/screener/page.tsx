"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { CandlestickChart } from "@/components/CandlestickChart";
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
  ArrowRight,
  LayoutGrid,
  List,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Eye,
  Target,
  Compass,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { api } from "@/lib/api";
import { ScreenerItem } from "@/types";

type SortField = "score" | "ticker" | "price" | "changePct" | "rsi" | "targetPrice" | "stopLoss" | "riskRewardRatio" | "strategy";
type SortDirection = "asc" | "desc";

export default function ScreenerPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "OVERSOLD" | "BREAKOUT" | "VALUE">("ALL");
  const [items, setItems] = useState<ScreenerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isKamusOpen, setIsKamusOpen] = useState(false);
  
  // Sorting state (purely frontend)
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // View mode: "cards" (Rich Intelligence Cards) vs "table" (Expandable Pro Table)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [selectedChartTicker, setSelectedChartTicker] = useState<string | null>(null);


  // Custom ticker analyzer state
  const [customTickerInput, setCustomTickerInput] = useState("");
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [customFeedback, setCustomFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const mapScreenerItem = (r: any): ScreenerItem => ({
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
    catalyst: r.catalyst || r.why_buy,
    actionStance: r.action_stance || (
      r.strategy === "OVERSOLD" ? "BUY ON WEAKNESS (Area Support)" :
      r.strategy === "BREAKOUT" ? "BUY ON BREAKOUT (Momentum MA20)" :
      "ACCUMULATE / DCA (Support MA50)"
    ),
    whyBuy: r.why_buy || r.catalyst,
    watchTrigger: r.watch_trigger || `Pantau konfirmasi pantulan harga di area support Rp ${formatNumber(r.support)} pada pembukaan jam bursa (09:00 WIB).`,
    buyArea: r.buy_area || `Rp ${formatNumber(r.support)} – Rp ${formatNumber(r.price)}`,
    targetPrice: r.target_price || r.resistance,
    stopLoss: r.stop_loss || Math.round(r.support * 0.97),
    riskRewardRatio: r.risk_reward_ratio || "1 : 2.0",
    potentialGainPct: r.potential_gain_pct || (r.price > 0 ? Math.round(((r.resistance - r.price) / r.price) * 100) : 0),
    potentialRiskPct: r.potential_risk_pct || (r.price > 0 ? Math.round(((r.price - (r.stop_loss || r.support)) / r.price) * 100) : 0),
    support: r.support,
    resistance: r.resistance,
  });

  const loadScreener = async () => {
    try {
      const res = await api.getScreener(activeTab);
      if (res) {
        setItems(res.map(mapScreenerItem));
      }
    } catch (err) {
      console.warn("Screener API fallback:", err);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setCustomFeedback(null);
    try {
      const res = await api.scanScreener();
      if (res) {
        setItems(res.map(mapScreenerItem));
      }
    } catch (err) {
      console.warn("Scan screener error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyzeCustomTicker = async () => {
    const rawTicker = customTickerInput.trim().toUpperCase();
    if (!rawTicker) return;

    setIsAnalyzingCustom(true);
    setCustomFeedback(null);

    try {
      const res = await api.analyzeScreenerTicker(rawTicker);
      if (res && res.ticker) {
        const newItem = mapScreenerItem(res);
        setItems((prev) => [newItem, ...prev.filter((p) => p.ticker !== res.ticker)]);
        setActiveTab("ALL");
        setCustomTickerInput("");
        setCustomFeedback({
          type: "success",
          message: `Saham ${res.ticker} (${res.name}) berhasil dianalisis! Strategi: ${res.strategy} | AI Score: ${res.score}/100.`
        });
      } else {
        setCustomFeedback({
          type: "error",
          message: `Gagal memuat data saham ${rawTicker}. Pastikan kode ticker terdaftar di Bursa Efek Indonesia (IDX).`
        });
      }
    } catch (err: any) {
      console.error("Custom ticker analysis error:", err);
      setCustomFeedback({
        type: "error",
        message: err.message || `Gagal menganalisis saham ${rawTicker}. Pastikan ticker terdaftar di BEI.`
      });
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  useEffect(() => {
    loadScreener();
  }, [activeTab]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "ticker" || field === "strategy" ? "asc" : "desc");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesTab = activeTab === "ALL" || item.strategy === activeTab;
    const matchesSearch = 
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === "ticker" || sortField === "strategy") {
      valA = (valA || "").toLowerCase();
      valB = (valB || "").toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }

    if (sortField === "riskRewardRatio") {
      valA = parseFloat((valA || "0").replace(/[^0-9.]/g, "")) || 0;
      valB = parseFloat((valB || "0").replace(/[^0-9.]/g, "")) || 0;
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }

    // Numeric sort
    valA = Number(valA) || 0;
    valB = Number(valB) || 0;
    return sortDirection === "asc" ? valA - valB : valB - valA;
  });


  const renderSortTh = (
    label: string, 
    field: SortField, 
    align: "left" | "right" = "left",
    tooltip?: string
  ) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={(e) => {
          e.stopPropagation();
          handleSort(field);
        }}
        className={`py-3.5 px-3 select-none cursor-pointer hover:bg-slate-100/80 transition-colors ${
          isActive ? "text-emerald-800 font-black bg-emerald-50/50" : "text-slate-600 font-bold"
        } ${align === "right" ? "text-right" : "text-left"}`}
        title={tooltip ? `${label}: ${tooltip} (Klik untuk mengurutkan)` : `Urutkan berdasarkan ${label}`}
      >
        <div className={`flex items-center gap-1.5 ${align === "right" ? "justify-end" : "justify-start"}`}>
          <span>{label}</span>
          {tooltip && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsKamusOpen(true);
              }}
              title={tooltip}
              className="text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <HelpCircle className="w-3 h-3 inline" />
            </span>
          )}
          {isActive ? (
            sortDirection === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 hover:opacity-100 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-16">
      <Topbar
        title="Pusat Rekomendasi Saham & Watchlist Terkurasi (EOD)"
        subtitle="Daftar saham pilihan berbasis evaluasi teknikal objektif pasca penutupan bursa (17:30 WIB)"
        onRefresh={loadScreener}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Custom On-Demand Stock Analyzer Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Compass className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Analisis Saham Pilihan Sendiri (On-Demand)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Ketik kode emiten BEI di luar Top 10 (contoh: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-semibold">BREN</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-semibold">AMMN</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-semibold">PGAS</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-semibold">MEDC</code>) untuk langsung dianalisis &amp; dimasukkan ke daftar rekomendasi.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyzeCustomTicker();
              }}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Ketik Kode Ticker (cth: BREN)..."
                  value={customTickerInput}
                  onChange={(e) => setCustomTickerInput(e.target.value.toUpperCase())}
                  disabled={isAnalyzingCustom}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono font-bold uppercase placeholder:font-normal placeholder:normal-case focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzingCustom || !customTickerInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                {isAnalyzingCustom ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Analisis Saham</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Feedback Alerts */}
          {customFeedback && (
            <div className={`mt-3.5 p-3 rounded-xl text-xs flex items-center justify-between border animate-in fade-in duration-150 ${
              customFeedback.type === "success" 
                ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {customFeedback.type === "success" ? "✅ Sukses:" : "⚠️ Gagal:"}
                </span>
                <span>{customFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setCustomFeedback(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-4 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="space-y-3.5">
          {/* Top Row: Category Tabs & Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Strategy Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                Semua Rekomendasi ({items.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("OVERSOLD")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "OVERSOLD"
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Oversold Rebound</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("BREAKOUT")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "BREAKOUT"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Breakout MA20</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("VALUE")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "VALUE"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Value Stocks</span>
              </button>
            </div>

            {/* Action Buttons: Kamus & Scan EOD */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsKamusOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Kamus Badge</span>
              </button>

              <button
                type="button"
                onClick={handleRunScan}
                disabled={isScanning}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Scan EOD (Top 10)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Row: Search Box, Quick Sort Dropdown, and View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            {/* Search & Sort Group */}
            <div className="flex items-center gap-2.5 flex-1 flex-wrap sm:flex-nowrap">
              {/* Search Box */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari ticker atau nama emiten..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              {/* Quick Sort Dropdown */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Urutkan:</span>
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [f, d] = e.target.value.split("-") as [SortField, SortDirection];
                    setSortField(f);
                    setSortDirection(d);
                  }}
                  className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                  title="Pilih Urutan Saham"
                >
                  <option value="score-desc">AI Score (Tertinggi)</option>
                  <option value="score-asc">AI Score (Terendah)</option>
                  <option value="changePct-desc">Perubahan (+ Tertinggi)</option>
                  <option value="changePct-asc">Perubahan (- Terendah)</option>
                  <option value="price-desc">Harga (Tertinggi)</option>
                  <option value="price-asc">Harga (Terendah)</option>
                  <option value="rsi-asc">RSI (Paling Oversold)</option>
                  <option value="rsi-desc">RSI (Paling Overbought)</option>
                  <option value="ticker-asc">Ticker (A – Z)</option>
                  <option value="ticker-desc">Ticker (Z – A)</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle & Count */}
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">
                Menampilkan <strong className="text-slate-700">{sortedItems.length}</strong> saham
              </span>

              <div className="flex items-center bg-slate-100/80 border border-slate-200 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "cards"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Tampilan Kartu Analisis Terbuka"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Mode Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Tampilan Tabel Ringkas"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Mode Tabel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section: Mode Cards vs Mode Table */}
        {sortedItems.length > 0 ? (
          viewMode === "cards" ? (
            /* ========================================================================= */
            /* 🅰️ VIEW MODE: RICH INTELLIGENCE CARDS                                    */
            /* ========================================================================= */
            <div className="space-y-4">
              {sortedItems.map((item, idx) => (
                <div
                  key={item.ticker}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all space-y-4"
                >
                  {/* Card Header: Ticker, Name, Strategy, AI Score & Chart Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-slate-900 text-base">
                            {item.ticker}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {item.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {item.sector}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            Rp {formatNumber(item.price)}
                          </span>
                          <span className={`text-xs font-mono font-bold ${
                            item.changePct >= 0 ? "text-emerald-700" : "text-rose-600"
                          }`}>
                            {formatPercent(item.changePct)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500 font-mono">
                            RSI: <strong className={item.rsi < 35 ? "text-purple-700" : item.rsi > 70 ? "text-rose-600" : "text-slate-800"}>{item.rsi}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      {/* Strategy Badge */}
                      <span className={`text-xs px-3 py-1 rounded-lg font-bold font-mono border ${
                        item.strategy === "OVERSOLD"
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : item.strategy === "BREAKOUT"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-amber-50 text-amber-900 border-amber-200"
                      }`}>
                        {item.actionStance || item.strategy}
                      </span>

                      {/* AI Score Pill */}
                      <button
                        type="button"
                        onClick={() => setIsKamusOpen(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono font-bold cursor-pointer hover:bg-emerald-100/80 transition-colors"
                        title="AI Score: Skor kematangan setup teknikal (0-100). Klik untuk buka kamus."
                      >
                        <span>AI Score:</span>
                        <span className="text-emerald-700 text-sm">{item.score}</span>
                        <HelpCircle className="w-3 h-3 text-emerald-600 opacity-70" />
                      </button>

                      {/* Interactive Chart Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedChartTicker(item.ticker)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chart</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Pillars Analysis Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    {/* Pilar 1: Alasan Rekomendasi (Why Buy) */}
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                        <span className="text-emerald-600">💡</span>
                        <span>Alasan Rekomendasi</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-sans">
                        {item.whyBuy || item.catalyst}
                      </p>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Status MA: <strong className="text-slate-800">{item.maStatus}</strong>
                      </div>
                    </div>

                    {/* Pilar 2: Hal Wajib Dipantau Besok (Watch Trigger) */}
                    <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-950 font-bold uppercase tracking-wider text-[11px]">
                        <Eye className="w-3.5 h-3.5 text-amber-700" />
                        <span>Wajib Dipantau Besok (09:00 WIB)</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-sans">
                        {item.watchTrigger}
                      </p>
                      <div className="text-[11px] text-amber-900/80 font-medium pt-1">
                        👉 <em>Disiplin entry hanya saat trigger terkonfirmasi.</em>
                      </div>
                    </div>

                    {/* Pilar 3: Panduan Level Eksekusi & Risk/Reward Ratio */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                          <Target className="w-3.5 h-3.5 text-blue-600" />
                          <span>Panduan Level &amp; Rasio</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsKamusOpen(true)}
                          className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer"
                          title="Risk to Reward Ratio (RRR). Klik untuk buka penjelasan matematis."
                        >
                          <span>RRR {item.riskRewardRatio}</span>
                          <HelpCircle className="w-2.5 h-2.5 text-emerald-700 opacity-80" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 block text-[10px]">Area Beli Ideal</span>
                          <strong className="text-slate-900 font-bold">{item.buyArea}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                          <span className="text-emerald-700 block text-[10px]">Target Profit (TP)</span>
                          <strong className="text-emerald-900 font-bold">
                            Rp {formatNumber(item.targetPrice || item.resistance)} (+{item.potentialGainPct}%)
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-200/60">
                          <span className="text-rose-700 block text-[10px]">Stop Loss (SL)</span>
                          <strong className="text-rose-900 font-bold">
                            Rp {formatNumber(item.stopLoss || item.support)} (-{item.potentialRiskPct}%)
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 block text-[10px]">Support / Resist</span>
                          <strong className="text-slate-800 font-bold">
                            {formatNumber(item.support)} / {formatNumber(item.resistance)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ========================================================================= */
            /* 🅱️ VIEW MODE: PRO TABLE + EXPANDABLE DETAILS                             */
            /* ========================================================================= */
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      {renderSortTh("# Ticker", "ticker")}
                      {renderSortTh("Sikap Aksi / Rekomendasi", "strategy")}
                      {renderSortTh("Harga Close", "price")}
                      {renderSortTh("Perubahan", "changePct")}
                      {renderSortTh("RSI", "rsi", "left", "Relative Strength Index (0-100). Indikator momentum jenuh jual (<35) atau jenuh beli (>70).")}
                      <th className="py-3.5 px-3 font-bold text-slate-600">Area Beli Disarankan</th>
                      {renderSortTh("Target TP", "targetPrice")}
                      {renderSortTh("Stop Loss", "stopLoss")}
                      {renderSortTh("Risk:Reward", "riskRewardRatio", "left", "Risk:Reward Ratio (RRR). Perbandingan batas risiko Stop Loss vs potensi keuntungan Take Profit. Standar ideal: minimal 1 : 1.5 s/d 1 : 2.0 ke atas.")}
                      {renderSortTh("AI Score", "score", "left", "AI Technical Score (0-100). Tingkat kematangan setup teknikal berbasis konvergensi MA20/MA50, RSI, dan jarak support/resist.")}
                      <th className="py-3.5 px-3 text-right font-bold text-slate-600">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {sortedItems.map((item, idx) => {
                      const isExpanded = expandedTicker === item.ticker;
                      return (
                        <React.Fragment key={item.ticker}>
                          <tr 
                            onClick={() => setExpandedTicker(isExpanded ? null : item.ticker)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400 font-bold">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <div className="font-mono font-bold text-slate-900 text-xs">
                                    {item.ticker}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {item.name}
                                  </div>
                                </div>
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

                            <td className="py-3.5 px-3 font-mono font-bold">
                              <span className={item.rsi < 35 ? "text-purple-700" : item.rsi > 70 ? "text-rose-600" : "text-slate-700"}>
                                {item.rsi}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono text-slate-700 text-[11px]">
                              {item.buyArea}
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold text-emerald-800 text-[11px]">
                              Rp {formatNumber(item.targetPrice || item.resistance)}
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold text-rose-800 text-[11px]">
                              Rp {formatNumber(item.stopLoss || item.support)}
                            </td>

                            <td className="py-3.5 px-3 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold">
                                {item.riskRewardRatio}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">
                                  {item.score}
                                </span>
                                <div className="w-10 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-600 rounded-full" 
                                    style={{ width: `${item.score}%` }} 
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChartTicker(item.ticker);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                  title="Lihat Chart"
                                >
                                  <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row: 3 Pillars */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70">
                              <td colSpan={11} className="p-4 border-y border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                                    <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                                      <span>💡</span>
                                      <span>Alasan Rekomendasi:</span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed">
                                      {item.whyBuy || item.catalyst}
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                                    <div className="font-bold text-amber-950 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                                      <Eye className="w-3.5 h-3.5 text-amber-700" />
                                      <span>Wajib Dipantau Besok (09:00 WIB):</span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed">
                                      {item.watchTrigger}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-2xs">
            <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-800 text-sm">Belum Ada Hasil Rekomendasi</p>
            <p className="text-xs text-slate-500 mt-1 mb-5 max-w-md mx-auto">
              Klik tombol &quot;Scan EOD (Top 10)&quot; untuk memindai 35+ saham teraktif BEI dan menghasilkan 10 rekomendasi terbaik pasca penutupan pasar.
            </p>
            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memindai Saham BEI...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Jalankan Scan EOD Sekarang</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Screener Philosophy Info Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filosofi &amp; Disiplin Eksekusi Rekomendasi</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Daftar ini adalah <strong>watchlist intelijen terkurasi</strong> pasca penutupan pasar pukul 17:30 WIB. Setiap saham dilengkapi alasan teknikal objektif (*Why Buy*), hal wajib dipantau besok pagi (*Watch Trigger*), serta kalkulasi rasio *Risk/Reward* (RRR). Jangan langsung melakukan pembelian sebelum syarat pantauan jam 09:00 WIB terkonfirmasi di bursa.
          </p>
        </div>
      </div>

      {/* Modal Interactive Candlestick Chart */}
      {selectedChartTicker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-4xl w-full">
            <CandlestickChart
              ticker={selectedChartTicker}
              candles={[]}
              onClose={() => setSelectedChartTicker(null)}
            />
          </div>
        </div>
      )}

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
                    Kamus Strategi, AI Score &amp; Risk:Reward
                  </h3>
                  <p className="text-xs text-slate-500">
                    Panduan formula teknikal, arti AI Score, dan matematika probabilitas Risk:Reward
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
              {/* 1. Risk to Reward Ratio (RRR) Section */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold font-mono border border-emerald-300">
                    🎯 RISK : REWARD RATIO (RRR)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">Matematika Ketahanan Modal</span>
                </div>
                <strong className="block text-slate-900 text-sm">
                  Kunci Profit Konsisten: Mengapa RRR &ge; 1 : 2.0 Sangat Krusial?
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  RRR membandingkan <strong>berapa rupiah risiko yang Anda korbankan (Stop Loss)</strong> terhadap <strong>berapa rupiah potensi keuntungan yang Anda incar (Target TP)</strong>.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-[11px] space-y-1">
                    <span className="font-bold text-slate-900 block">📐 Rumus Sederhana:</span>
                    <p className="text-slate-600 font-mono">
                      1 : (Target TP - Entry) / (Entry - Stop Loss)
                    </p>
                    <span className="text-emerald-800 font-medium block text-[10px]">
                      Contoh: Beli 1.000, SL 950 (-5%), TP 1.100 (+10%) &rarr; <strong>RRR = 1 : 2.0</strong>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-[11px] space-y-1">
                    <span className="font-bold text-slate-900 block">🏆 Simulasi Win-Rate 40%:</span>
                    <p className="text-slate-600">
                      Dari 10 trade: <strong>6x Rugi (-Rp 300)</strong> vs <strong>4x Cuan (+Rp 400)</strong>.
                    </p>
                    <span className="text-emerald-800 font-bold block text-[10px]">
                      Hasil Akhir: Portofolio Tetap Untung Bersih +Rp 100!
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-950 font-bold">
                    &ge; 1 : 2.0 (Sangat Layak)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-medium">
                    1 : 1.5 (Cukup Layak)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">
                    &lt; 1 : 1.0 (Hindari / Tidak Sepadan)
                  </span>
                </div>
              </div>

              {/* 2. AI Score Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    🤖 AI TECHNICAL SCORE (0 – 100)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Filter Probabilitas Statistik</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  AI Score mengukur <strong>kematangan kondisi teknikal</strong> saat penutupan bursa (posisi harga terhadap MA20/MA50, momentum RSI, dan jarak ke support/resistance).
                </p>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950 leading-snug">
                  ⚠️ <strong>PENTING:</strong> AI Score tinggi <strong>BUKAN jaminan pasti naik besok</strong>, melainkan indikator bahwa secara historis saham ini berada pada titik probabilitas rebound/breakout yang lebih menguntungkan. Disiplin tunggu trigger pembukaan pukul 09:00 WIB.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                    <strong className="block text-emerald-800 font-bold">&ge; 85 (Hijau Zamrud)</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Peluang Utama (Setup Sangat Matang, Risk/Reward Optimal).
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-200">
                    <strong className="block text-blue-800 font-bold">75 – 84 (Biru / Amber)</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Sinyal Baik (Tunggu konfirmasi volume &amp; candle hijau esok pagi).
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <strong className="block text-slate-700 font-bold">&lt; 75 (Abu-abu)</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Sinyal Moderat (Hanya pantau di watchlist).
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Strategy Badges */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  🏷️ 3 Tipe Strategi Screener
                </span>
                
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

