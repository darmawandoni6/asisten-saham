"use client";

import React, { useState, useEffect } from "react";
import { Holding } from "@/types";
import { formatNumber, formatPercent } from "@/lib/utils";
import { 
  Sparkles, 
  RefreshCw, 
  Target, 
  X,
  Bot,
  AlertTriangle,
  Clock,
  KeyRound,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { api } from "@/lib/api";

interface AICopilotPanelProps {
  holding: Holding;
  onClose?: () => void;
}

export function AICopilotPanel({ holding, onClose }: AICopilotPanelProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAIAnalysis = async () => {
    try {
      const res = await api.analyzeStock(holding.ticker);
      setData(res);
    } catch (err: any) {
      setData({
        status: "error",
        error_type: "AI_ERROR",
        message: "Gagal terhubung ke server backend AI.",
        detail: err?.message || "Pastikan server backend berjalan di port 8000."
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAIAnalysis();
  }, [holding.ticker]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAIAnalysis();
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "CUT LOSS":
      case "SELL ALL":
        return "bg-rose-50 text-rose-800 border-rose-300";
      case "TRIM 50%":
      case "BUY MORE":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "AVERAGE DOWN":
        return "bg-purple-50 text-purple-800 border-purple-300";
      default:
        return "bg-amber-50 text-amber-900 border-amber-300";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative">
      {/* Close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-lg text-slate-900">
                {holding.ticker}
              </h3>
              <span className="text-xs text-slate-500">
                ({holding.name})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gemini 2.0 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluasi EOD — Tipe: <span className="font-semibold uppercase font-mono">{holding.jenis}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
          <span>{isRefreshing ? "Menganalisis..." : "Analisis Ulang AI"}</span>
        </button>
      </div>

      {/* State 1: Loading */}
      {isLoading && (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h4 className="text-sm font-bold text-slate-800">Menghubungkan ke Google Gemini AI...</h4>
          <p className="text-xs text-slate-500 mt-1">
            Mengolah data teknikal EOD dan trading plan {holding.ticker}
          </p>
        </div>
      )}

      {/* State 2: Alert AI Belum Tersedia (No API Key) */}
      {!isLoading && data?.status === "unavailable" && (
        <div className="py-8">
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-amber-900">
                      AI Belum Tersedia
                    </h4>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800 border border-amber-300">
                      API Key Diperlukan
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {data.message || "Fitur AI Decision Copilot saat ini belum tersedia karena API Key Google Gemini belum dikonfigurasi di sistem."}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white/90 border border-amber-200 text-xs text-slate-700 space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Langkah Mudah Mengaktifkan Fitur AI:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                    <li>
                      Buka Google AI Studio:{" "}
                      <a 
                        href="https://aistudio.google.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-700 underline font-semibold inline-flex items-center gap-0.5"
                      >
                        aistudio.google.com <ExternalLink className="w-2.5 h-2.5" />
                      </a>{" "}
                      (Gratis dengan akun Google).
                    </li>
                    <li>Klik <strong>Get API Key</strong> dan salin key Anda.</li>
                    <li>
                      Simpan di file <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[10px]">backend/.env</code>:
                      <div className="mt-1 p-2 bg-slate-900 text-emerald-400 rounded font-mono text-[11px]">
                        GEMINI_API_KEY=AIzaSy...
                      </div>
                    </li>
                    <li>Klik tombol <strong>Coba Analisis Lagi</strong> di bawah setelah API Key disimpan.</li>
                  </ol>
                </div>

                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Analisis Lagi</span>
                  </button>
                  <span className="text-[11px] text-amber-700">
                    Sistem akan otomatis mendeteksi begitu key dimasukkan.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State 3: Alert Limit / Token Habis (Quota Exceeded) */}
      {!isLoading && data?.status === "error" && data?.error_type === "QUOTA_EXCEEDED" && (
        <div className="py-8">
          <div className="rounded-xl border border-rose-300 bg-rose-50/70 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-rose-900">
                      Limit / Kuota AI Habis
                    </h4>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800 border border-rose-300">
                      Rate Limit Exceeded
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    {data.message || "AI belum dapat menjawab saat ini karena limit token atau kuota harian Gemini API telah habis."}
                  </p>
                  <p className="text-[11px] text-rose-600 mt-1">
                    {data.detail || "Mohon tunggu beberapa menit sebelum mencoba analisis ulang."}
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Lagi Nanti</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State 4: Generic Error */}
      {!isLoading && data?.status === "error" && data?.error_type !== "QUOTA_EXCEEDED" && (
        <div className="py-8">
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-2 flex-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Kendala Memuat AI Copilot
                </h4>
                <p className="text-xs text-slate-600">
                  {data.message}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State 5: Success — Full Gemini AI Analysis Output */}
      {!isLoading && data?.status === "success" && (
        <>
          {/* Structured Recommendation Banner */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider text-[10px]">
                AI Decision Copilot Verdict
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-base font-bold font-mono px-3.5 py-1.5 rounded-lg border flex items-center gap-2 ${getRecommendationBadge(data.recommendation)}`}>
                  <Target className="w-4 h-4" />
                  REKOMENDASI: {data.recommendation}
                </span>
                <span className="text-xs text-slate-500">
                  Confidence: <span className="font-bold text-slate-900 font-mono">{data.confidence}%</span>
                </span>
              </div>
            </div>

            {/* Current Condition summary */}
            <div className="flex items-center gap-4 text-xs font-mono bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Close EOD</span>
                <span className="font-bold text-slate-900">Rp {formatNumber(data.currentPrice)}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Avg Beli</span>
                <span className="font-bold text-slate-700">Rp {formatNumber(data.avgPrice)}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Floating PnL</span>
                <span className={`font-bold ${data.pnlPct >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {formatPercent(data.pnlPct)}
                </span>
              </div>
            </div>
          </div>

          {/* AI Narrative Breakdown */}
          <div className="mt-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Rasional & Evaluasi Emosi Pasar (Gemini 2.0 Flash)
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed">
              {data.rationale}
            </div>
          </div>

          {/* Technical Indicators Snapshot Grid */}
          <div className="mt-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Snapshot Indikator Teknikal EOD
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Moving Average</span>
                <div className="mt-1 text-xs font-mono font-bold text-slate-800">
                  MA20: Rp {formatNumber(data.indicators?.ma20 || 0)}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  MA50: Rp {formatNumber(data.indicators?.ma50 || 0)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">RSI (14 Hari)</span>
                <div className="mt-1 text-sm font-mono font-bold text-slate-900 flex items-center gap-1.5">
                  {data.indicators?.rsi || 50}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-medium ${
                    (data.indicators?.rsi || 50) > 70 
                      ? "bg-rose-100 text-rose-800" 
                      : (data.indicators?.rsi || 50) < 30 
                      ? "bg-purple-100 text-purple-800" 
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {(data.indicators?.rsi || 50) > 70 ? "Overbought" : (data.indicators?.rsi || 50) < 30 ? "Oversold" : "Netral"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Support / Resistance</span>
                <div className="mt-1 text-xs font-mono text-emerald-700 font-bold">
                  Supp: Rp {formatNumber(data.indicators?.support || 0)}
                </div>
                <div className="text-xs font-mono text-rose-600 font-bold">
                  Res: Rp {formatNumber(data.indicators?.resistance || 0)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Tren & Volume</span>
                <div className="mt-1 text-xs font-bold text-blue-700">
                  {data.indicators?.trend || "SIDEWAYS"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Volume: {data.indicators?.volume_status === "ABOVE_AVG" ? "Di Atas Rata-rata" : "Normal"}
                </div>
              </div>
            </div>
          </div>

          {/* Action Plan Guidance */}
          {data.actionItems && data.actionItems.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Panduan Langkah Konkrit (Action Items)
              </h4>
              <div className="space-y-2">
                {data.actionItems.map((item: string, idx: number) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                      {idx + 1}
                    </div>
                    <p className="leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
