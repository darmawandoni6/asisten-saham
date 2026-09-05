"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { formatNumber, formatPercent, formatRupiah } from "@/lib/utils";
import { 
  LifeBuoy, 
  Calculator, 
  ShieldAlert, 
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Wallet,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Info,
  MessageSquare,
  Send,
  X,
  CheckSquare
} from "lucide-react";
import { api } from "@/lib/api";
import { RecoveryDiagnosis, Holding, RecoveryDiscussion } from "@/types";

export default function RecoveryPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>("");
  const [data, setData] = useState<RecoveryDiagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive Calculator State
  const [targetBuyPrice, setTargetBuyPrice] = useState<number>(0);
  const [targetAvgPrice, setTargetAvgPrice] = useState<number>(0);

  // Discussion / Deep-Dive State
  const [activeScenarioModal, setActiveScenarioModal] = useState<string | null>(null);
  const [discussionData, setDiscussionData] = useState<RecoveryDiscussion | null>(null);
  const [isDiscussionLoading, setIsDiscussionLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; text: string; source?: string }>>([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  const handleOpenDiscussion = async (scenarioId: string) => {
    setActiveScenarioModal(scenarioId);
    setIsDiscussionLoading(true);
    setChatHistory([]);
    setCustomQuestion("");
    try {
      const res = await api.discussRecovery(selectedTicker, { scenario_id: scenarioId });
      if (res) {
        setDiscussionData(res);
      }
    } catch (err) {
      console.warn("Error loading scenario discussion:", err);
    } finally {
      setIsDiscussionLoading(false);
    }
  };

  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim() || isSubmittingQuestion || !activeScenarioModal) return;
    const q = questionText.trim();
    setCustomQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", text: q }]);
    setIsSubmittingQuestion(true);
    try {
      const res = await api.discussRecovery(selectedTicker, {
        scenario_id: activeScenarioModal,
        user_question: q,
      });
      if (res && res.answer) {
        setChatHistory((prev) => [...prev, { role: "assistant", text: res.answer, source: res.source }]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: "Maaf, terjadi kendala saat memproses pertanyaan Anda. Silakan coba lagi." },
      ]);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleCloseDiscussion = () => {
    setActiveScenarioModal(null);
    setDiscussionData(null);
    setChatHistory([]);
    setCustomQuestion("");
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dash = await api.getDashboard();
      if (dash && dash.holdings) {
        // Find holdings in loss or recovery/averaging mode
        const candidates = dash.holdings.filter(
          (h: Holding) => h.floatingPnlPct < 0 || h.actionStatus === "RECOVERY_MODE" || h.actionStatus === "AVERAGING_REVIEW"
        );
        setHoldings(candidates);

        if (candidates.length > 0) {
          const initialTicker = candidates[0].ticker;
          setSelectedTicker(initialTicker);
          const rec = await api.getRecovery(initialTicker);
          if (rec) {
            setData(rec);
            setTargetBuyPrice(Math.round(rec.currentPrice * 0.95));
            setTargetAvgPrice(Math.round((rec.avgPrice + rec.currentPrice) / 2));
          }
        } else {
          setData(null);
        }
      }
    } catch (err) {
      console.warn("Error loading recovery data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectStock = async (stock: Holding) => {
    setSelectedTicker(stock.ticker);
    try {
      const rec = await api.getRecovery(stock.ticker);
      if (rec) {
        setData(rec);
        setTargetBuyPrice(Math.round(rec.currentPrice * 0.95));
        setTargetAvgPrice(Math.round((rec.avgPrice + rec.currentPrice) / 2));
      }
    } catch (e) {
      console.warn("Select recovery stock err:", e);
    }
  };

  const calculateAverageDown = () => {
    if (!data) return { addLot: 0, capital: 0, newAvg: 0 };
    const currentLot = data.lot;
    const currentAvg = data.avgPrice;

    if (targetAvgPrice <= targetBuyPrice || targetAvgPrice >= currentAvg) {
      return { addLot: 0, capital: 0, newAvg: currentAvg, error: "Target Avg harus di antara harga beli bawah dan Avg saat ini" };
    }

    const rawAddLot = (currentLot * (currentAvg - targetAvgPrice)) / (targetAvgPrice - targetBuyPrice);
    const addLot = Math.ceil(rawAddLot);
    const capital = addLot * targetBuyPrice * 100;
    const finalAvg = Math.round((currentLot * currentAvg + addLot * targetBuyPrice) / (currentLot + addLot));

    return { addLot, capital, newAvg: finalAvg };
  };

  const calcResult = calculateAverageDown();

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-16">
      <Topbar
        title="Recovery Engine (Floating Loss Assessment)"
        subtitle="Analisis penyelamatan saham floating loss & kalkulator average down presisi"
        onRefresh={loadData}
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Ticker Selector & Kas Summary */}
        {holdings.length > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm text-slate-600 font-semibold">Pilih Saham Floating Loss:</span>
              {holdings.map((h) => (
                <button
                  key={h.ticker}
                  type="button"
                  onClick={() => handleSelectStock(h)}
                  className={`px-4 py-2 rounded-xl text-sm font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    selectedTicker === h.ticker
                      ? "bg-purple-50 text-purple-800 border-purple-300 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <LifeBuoy className="w-4 h-4 text-purple-600" />
                  <span>{h.ticker}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                    {formatPercent(h.floatingPnlPct)}
                  </span>
                </button>
              ))}
            </div>

            {data?.cashBalance !== undefined && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm self-start sm:self-auto">
                <Wallet className="w-4.5 h-4.5 text-slate-500" />
                <span className="text-slate-600 font-medium">Sisa Kas Tersedia:</span>
                <span className="font-mono font-bold text-base text-slate-900">
                  {formatRupiah(data.cashBalance)}
                </span>
              </div>
            )}
          </div>
        ) : !isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs flex flex-col items-center justify-center max-w-lg mx-auto mt-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Semua Posisi Portofolio Terpantau Aman
            </h3>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
              Tidak ada saham yang mengalami floating loss dalam atau memerlukan Recovery Mode (&gt;10% floating loss). Fitur kalkulator average down presisi dan diagnosa penyelamatan modal akan otomatis aktif saat ada saham yang membutuhkan evaluasi recovery.
            </p>
            <Link
              href="/portfolio"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-2xs transition-colors"
            >
              <span>Buka Portofolio &amp; Trading Plan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {data && (
          <>
            {/* 1. Diagnosis Kerugian Card */}
            <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-bold text-slate-900 font-mono">
                        {data.ticker}
                      </h3>
                      <span className="text-sm font-sans text-slate-500">
                        ({data.name})
                      </span>
                      {data.jenis && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                          data.jenis === "investasi"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}>
                          {data.jenis}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{data.trendStatus}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:text-right">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                      Bobot di Portofolio
                    </span>
                    <span className="text-base font-bold font-mono text-slate-800">
                      {formatPercent(data.portfolioWeightPct)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                      Dampak ke Total Portofolio
                    </span>
                    <span className="text-base font-bold font-mono text-rose-600">
                      {formatPercent(data.portfolioImpactPct)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessment Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 mt-5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Harga EOD</span>
                  <span className="text-base font-mono font-bold text-slate-900">
                    Rp {formatNumber(data.currentPrice)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Avg Price Beli</span>
                  <span className="text-base font-mono font-bold text-slate-800">
                    Rp {formatNumber(data.avgPrice)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Floating Loss</span>
                  <div className="text-base font-mono font-bold text-rose-600">
                    {formatPercent(data.floatingLossPct)}
                  </div>
                  <span className="text-xs text-rose-500 font-mono font-medium">
                    ({formatRupiah(data.floatingLossNominal)})
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Major Support</span>
                  <span className="text-base font-mono font-bold text-emerald-700">
                    Rp {formatNumber(data.supportMajor)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block uppercase font-semibold">RSI Harian</span>
                  <div className="text-base font-mono font-bold text-purple-700 flex items-center gap-1.5">
                    {data.rsi}
                    <span className="text-xs text-purple-800 font-sans font-medium">
                      {data.rsi <= 35 ? "(Oversold)" : "(Netral)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1.B Snapshot Fundamental & Dividen */}
              {data.fundamentals && (data.fundamentals.dividendYield !== null || data.fundamentals.peRatio !== null) && (
                <div className="mt-5 p-4.5 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        Kondisi Fundamental &amp; Dividen {data.jenis === "investasi" ? "(Acuan Utama Saham Investasi)" : ""}
                      </span>
                    </div>
                    {data.fundamentals.dividendYieldText && (
                      <span className="text-sm font-bold font-mono px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                        Dividend Yield: {data.fundamentals.dividendYieldText}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-3">
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <span className="text-xs text-slate-500 block uppercase font-medium">P/E Ratio (Valuasi)</span>
                      <span className="text-base font-mono font-bold text-slate-800">
                        {data.fundamentals.peRatio ? `${data.fundamentals.peRatio.toFixed(1)}x` : "N/A"}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <span className="text-xs text-slate-500 block uppercase font-medium">PBV (Price to Book)</span>
                      <span className="text-base font-mono font-bold text-slate-800">
                        {data.fundamentals.pbv ? `${data.fundamentals.pbv.toFixed(1)}x` : "N/A"}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-xs text-slate-500 block uppercase font-medium">Peran Dividen</span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {data.fundamentals.dividendYield && data.fundamentals.dividendYield > 0.05
                          ? "Penyerap Floating Loss Pasif"
                          : "Non-Dividen / Yield Rendah"}
                      </span>
                    </div>
                  </div>

                  {data.fundamentals.verdict && (
                    <div className="text-sm text-slate-700 bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed flex items-start gap-2.5">
                      <Info className="w-4.5 h-4.5 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Analisis Nilai: </strong>
                        <span>{data.fundamentals.verdict}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Skenario Penyelamatan AI */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
                  <span>3 Skenario Penyelamatan AI (Pilih Sesuai Tipe &amp; Kas Anda)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Option A: Cut Loss / Trim */}
                <div className={`p-5 rounded-2xl border bg-white flex flex-col justify-between transition-all ${
                  data.scenarios.cutLoss.actionRecommended
                    ? "border-rose-300 ring-2 ring-rose-100 shadow-sm"
                    : "border-slate-200 shadow-2xs"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                        Skenario A
                      </span>
                      {data.scenarios.cutLoss.actionRecommended && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          Disarankan AI
                        </span>
                      )}
                    </div>

                    {/* Kesesuaian Tipe Badge */}
                    {data.scenarios.cutLoss.suitabilityTitle && (
                      <div className={`mb-3 p-3 rounded-xl border ${
                        data.scenarios.cutLoss.suitabilityColor || "bg-amber-50 border-amber-200 text-amber-800"
                      }`}>
                        <span className="font-bold block text-xs tracking-wide">
                          {data.scenarios.cutLoss.suitabilityTitle}
                        </span>
                        <span className="text-xs opacity-90 leading-snug block mt-1">
                          {data.scenarios.cutLoss.suitabilityReason}
                        </span>
                      </div>
                    )}

                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      {data.scenarios.cutLoss.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3.5">
                      {data.scenarios.cutLoss.description}
                    </p>

                    {/* Checklist Panduan Memilih */}
                    {data.scenarios.cutLoss.checklist && data.scenarios.cutLoss.checklist.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-3.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                          Pilih Opsi Ini Jika:
                        </span>
                        <ul className="space-y-1.5">
                          {data.scenarios.cutLoss.checklist.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                              <span className="text-rose-500 font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-3.5 border-t border-slate-100 flex flex-col gap-2.5">
                    <div className="text-xs font-mono text-rose-600 font-bold">
                      Potensi modal terselamatkan: {formatRupiah(data.scenarios.cutLoss.lossSavedIfSupportBroken)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDiscussion("cutLoss")}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-800 text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200 hover:border-rose-200 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-rose-600" />
                      <span>Bedah Logika &amp; Diskusi AI</span>
                    </button>
                  </div>
                </div>

                {/* Option B: Precision Average Down */}
                <div className={`p-5 rounded-2xl border bg-white flex flex-col justify-between transition-all ${
                  data.scenarios.averageDown.actionRecommended
                    ? "border-purple-300 ring-2 ring-purple-100 shadow-sm"
                    : "border-slate-200 shadow-2xs"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                        Skenario B
                      </span>
                      {data.scenarios.averageDown.actionRecommended && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                          Disarankan AI
                        </span>
                      )}
                    </div>

                    {/* Kesesuaian Tipe Badge */}
                    {data.scenarios.averageDown.suitabilityTitle && (
                      <div className={`mb-3 p-3 rounded-xl border ${
                        data.scenarios.averageDown.suitabilityColor || "bg-purple-50 border-purple-200 text-purple-800"
                      }`}>
                        <span className="font-bold block text-xs tracking-wide">
                          {data.scenarios.averageDown.suitabilityTitle}
                        </span>
                        <span className="text-xs opacity-90 leading-snug block mt-1">
                          {data.scenarios.averageDown.suitabilityReason}
                        </span>
                      </div>
                    )}

                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      {data.scenarios.averageDown.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3.5">
                      {data.scenarios.averageDown.description}
                    </p>

                    {/* Cash Feasibility Check Alert */}
                    {data.scenarios.averageDown.cashStatusNote && (
                      <div className={`p-3.5 rounded-xl border mb-3.5 text-xs ${
                        data.scenarios.averageDown.cashSufficient
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-amber-50 border-amber-200 text-amber-900"
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold mb-1 text-sm">
                          {data.scenarios.averageDown.cashSufficient ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          <span>
                            {data.scenarios.averageDown.cashSufficient
                              ? "Kondisi Kas: Mencukupi"
                              : "Kondisi Kas: Belum Mencukupi"}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">
                          {data.scenarios.averageDown.cashStatusNote}
                        </p>
                      </div>
                    )}

                    {/* Checklist Panduan Memilih */}
                    {data.scenarios.averageDown.checklist && data.scenarios.averageDown.checklist.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-3.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                          Pilih Opsi Ini Jika:
                        </span>
                        <ul className="space-y-1.5">
                          {data.scenarios.averageDown.checklist.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                              <span className="text-purple-600 font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-3.5 border-t border-slate-100 flex flex-col gap-2.5">
                    <div className="text-xs font-mono text-purple-800 font-bold">
                      Kebutuhan: Beli {data.scenarios.averageDown.minRequiredLot} Lot @ Rp {formatNumber(data.scenarios.averageDown.suggestedEntryPrice)} ({formatRupiah(data.scenarios.averageDown.capitalRequired)})
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDiscussion("averageDown")}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200 hover:border-purple-200 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <span>Bedah Logika &amp; Diskusi AI</span>
                    </button>
                  </div>
                </div>

                {/* Option C: Hold for BEP Rebound */}
                <div className={`p-5 rounded-2xl border bg-white flex flex-col justify-between transition-all ${
                  data.scenarios.holdForBep.actionRecommended
                    ? "border-amber-300 ring-2 ring-amber-100 shadow-sm"
                    : "border-slate-200 shadow-2xs"
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                        Skenario C
                      </span>
                      {data.scenarios.holdForBep.actionRecommended && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          Disarankan AI
                        </span>
                      )}
                    </div>

                    {/* Kesesuaian Tipe Badge */}
                    {data.scenarios.holdForBep.suitabilityTitle && (
                      <div className={`mb-3 p-3 rounded-xl border ${
                        data.scenarios.holdForBep.suitabilityColor || "bg-blue-50 border-blue-200 text-blue-800"
                      }`}>
                        <span className="font-bold block text-xs tracking-wide">
                          {data.scenarios.holdForBep.suitabilityTitle}
                        </span>
                        <span className="text-xs opacity-90 leading-snug block mt-1">
                          {data.scenarios.holdForBep.suitabilityReason}
                        </span>
                      </div>
                    )}

                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      {data.scenarios.holdForBep.title}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3.5">
                      {data.scenarios.holdForBep.description}
                    </p>

                    {/* Checklist Panduan Memilih */}
                    {data.scenarios.holdForBep.checklist && data.scenarios.holdForBep.checklist.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-3.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                          Pilih Opsi Ini Jika:
                        </span>
                        <ul className="space-y-1.5">
                          {data.scenarios.holdForBep.checklist.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                              <span className="text-amber-600 font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-3.5 border-t border-slate-100 flex flex-col gap-2.5">
                    <div className="text-xs font-mono text-amber-800 font-bold">
                      Target Exit Rebound: Rp {formatNumber(data.scenarios.holdForBep.realisticExitPrice)} ({data.scenarios.holdForBep.expectedDays})
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDiscussion("holdForBep")}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200 hover:border-amber-200 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <span>Bedah Logika &amp; Diskusi AI</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Kalkulator Average Down Presisi */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kalkulator Average Down Presisi
                  </h3>
                  <p className="text-sm text-slate-500">
                    Hitung jumlah lot dan modal tambahan yang dibutuhkan untuk mencapai target Avg Price aman
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inputs */}
                <div className="space-y-4 text-sm md:col-span-1">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Harga Rencana Cicil Bawah (Rp)
                    </label>
                    <input
                      type="number"
                      value={targetBuyPrice}
                      onChange={(e) => setTargetBuyPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-purple-600"
                    />
                    <span className="text-xs text-slate-500 mt-1 block">
                      Disarankan di Major Support: Rp {formatNumber(data.supportMajor)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Target Avg Price Baru Yang Diinginkan (Rp)
                    </label>
                    <input
                      type="number"
                      value={targetAvgPrice}
                      onChange={(e) => setTargetAvgPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-purple-600"
                    />
                    <span className="text-xs text-slate-500 mt-1 block">
                      Avg saat ini: Rp {formatNumber(data.avgPrice)}
                    </span>
                  </div>

                  {/* SOP Panduan Eksekusi */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <span className="font-bold text-slate-800 text-xs block">📌 Kapan Tombol Ditekan?</span>
                    <p className="leading-relaxed">
                      Tekan tombol &quot;Terapkan ke Trading Plan&quot; <strong>hanya jika</strong> harga sudah menyentuh level support dan terkonfirmasi rebound (candle hijau/hammer), serta kas tersedia telah mencukupi.
                    </p>
                  </div>
                </div>

                {/* Calculation Outputs */}
                <div className="md:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                      Hasil Simulasi Kalkulasi
                    </span>

                    {calcResult.error ? (
                      <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                        {calcResult.error}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-xs text-slate-500 uppercase block font-semibold mb-1">Lot Tambahan</span>
                          <span className="text-2xl font-mono font-bold text-purple-700">
                            +{formatNumber(calcResult.addLot)} Lot
                          </span>
                          <span className="text-xs text-slate-500 block mt-1">
                            Total lot jadi: {data.lot + calcResult.addLot} Lot
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-xs text-slate-500 uppercase block font-semibold mb-1">Modal Tambahan</span>
                          <span className="text-xl font-mono font-bold text-slate-900">
                            {formatRupiah(calcResult.capital)}
                          </span>
                          <span className="text-xs text-slate-500 block mt-1">
                            Di harga Rp {formatNumber(targetBuyPrice)}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          <span className="text-xs text-slate-500 uppercase block font-semibold mb-1">Avg Price Baru</span>
                          <span className="text-2xl font-mono font-bold text-emerald-700">
                            Rp {formatNumber(calcResult.newAvg)}
                          </span>
                          <span className="text-xs text-emerald-600 font-medium block mt-1">
                            Turun {data.avgPrice - calcResult.newAvg} Poin!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">
                        Break-even Price (BEP): <strong className="font-mono text-slate-900">Rp {formatNumber(calcResult.newAvg)}</strong>
                      </span>
                      {data.cashBalance !== undefined && calcResult.capital > data.cashBalance && (
                        <div className="text-xs text-amber-700 font-semibold mt-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Modal butuh {formatRupiah(calcResult.capital)}, kas tersedia {formatRupiah(data.cashBalance)} (Kurang {formatRupiah(calcResult.capital - data.cashBalance)})</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Simulasi average down ${calcResult.addLot} lot pada ${data.ticker} siap diaplikasikan ke trading plan!`)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shrink-0 cursor-pointer shadow-xs"
                    >
                      Terapkan ke Trading Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Diskusi / Bedah Logika Skenario AI */}
      {activeScenarioModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {selectedTicker} — {discussionData?.scenarioTitle || "Bedah Skenario"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {discussionData?.source === "gemini" ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Gemini 2.0 Flash
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        ⚡ Rule-Based Expert Engine
                      </span>
                    )}
                    <span className="text-xs text-slate-500">• Analisis Mendalam &amp; Tanya Jawab</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDiscussion}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
              {isDiscussionLoading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium text-sm text-slate-600">Sedang membedah logika finansial &amp; risiko skenario...</p>
                </div>
              ) : discussionData?.deepDive ? (
                <>
                  {/* 4 Deep Dive Cards */}
                  <div className="space-y-3">
                    {/* Core Logic */}
                    <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-sm mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Logika Utama: Mengapa Opsi Ini Terpilih?</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-sm">
                        {discussionData.deepDive.coreLogic}
                      </p>
                    </div>

                    {/* Invalidation Risk */}
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Kondisi Risiko &amp; Batas Invalidasi (Plan B):</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-sm">
                        {discussionData.deepDive.invalidationRisk}
                      </p>
                    </div>

                    {/* Cashflow & Timeline */}
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1.5">
                        <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Kalkulasi Arus Kas &amp; Estimasi Waktu:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-sm">
                        {discussionData.deepDive.cashflowAndTimeline}
                      </p>
                    </div>

                    {/* Tomorrow Action Plan */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                        <CheckSquare className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>Checklist Aksi Jam Bursa Besok Pagi:</span>
                      </div>
                      <ul className="space-y-2">
                        {discussionData.deepDive.tomorrowActionPlan.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Follow-Up Discussion Section */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span>Tanya Jawab Lanjutan (Q&amp;A)</span>
                      </span>
                      <span className="text-xs text-slate-500">Tanyakan keraguan Anda</span>
                    </div>

                    {/* Chat history */}
                    {chatHistory.length > 0 && (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {chatHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                              item.role === "user"
                                ? "bg-purple-100 text-purple-900 ml-8 border border-purple-200"
                                : "bg-slate-100 text-slate-800 mr-4 border border-slate-200"
                            }`}
                          >
                            <strong className="block text-xs uppercase font-mono mb-1 font-semibold opacity-75">
                              {item.role === "user" ? "Pertanyaan Anda" : "Jawaban AI Copilot"}
                            </strong>
                            <div className="whitespace-pre-line">{item.text}</div>
                          </div>
                        ))}
                        {isSubmittingQuestion && (
                          <div className="p-3.5 rounded-xl bg-slate-100 text-slate-500 mr-4 border border-slate-200 text-xs flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Menyusun jawaban objektif...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Question Chips */}
                    {discussionData.suggestedQuestions && discussionData.suggestedQuestions.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-500 block mb-1.5 font-medium">
                          Pertanyaan Cepat Rekomendasi:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {discussionData.suggestedQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAskQuestion(q)}
                              disabled={isSubmittingQuestion}
                              className="text-xs text-slate-700 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 px-3 py-1.5 rounded-lg border border-slate-200 text-left transition-colors cursor-pointer"
                            >
                              💬 {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (customQuestion.trim()) handleAskQuestion(customQuestion);
                      }}
                      className="flex items-center gap-2 mt-2"
                    >
                      <input
                        type="text"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="Ketik pertanyaan lanjutan untuk skenario ini..."
                        disabled={isSubmittingQuestion}
                        className="flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-purple-600 focus:bg-white text-slate-900 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!customQuestion.trim() || isSubmittingQuestion}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        <span>Kirim</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Tidak ada data analisis skenario yang tersedia.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Gunakan panduan ini secara objektif sebelum jam bursa buka.</span>
              <button
                type="button"
                onClick={handleCloseDiscussion}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
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
