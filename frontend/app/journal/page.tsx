"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/Topbar";
import { TradeLogItem } from "@/types";
import { formatNumber, formatPercent, formatRupiah } from "@/lib/utils";
import { 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Flame, 
  X,
  Inbox
} from "lucide-react";
import { api } from "@/lib/api";

const INITIAL_POST_MORTEM = {
  winRatePct: 0.0,
  totalRealizedPnl: 0,
  profitFactor: 0.0,
  totalTrades: 0,
  dominantPattern: "Belum ada transaksi tercatat",
  aiFeedback: "Belum ada riwayat transaksi yang ditutup. Catat hasil penjualan atau cut loss Anda pada tombol 'Catat Transaksi' untuk mulai menganalisis performa dan mendeteksi bias emosi trading.",
  recommendations: [
    "Catat setiap hasil transaksi secara jujur dan disiplin.",
    "Selalu tentukan Target Profit dan Stop Loss sebelum mengeksekusi order beli."
  ]
};

export default function JournalPage() {
  const [tradeLogs, setTradeLogs] = useState<TradeLogItem[]>([]);
  const [postMortem, setPostMortem] = useState(INITIAL_POST_MORTEM);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Trade Form
  const [ticker, setTicker] = useState("");
  const [action, setAction] = useState<"BUY" | "SELL" | "CUT_LOSS">("SELL");
  const [price, setPrice] = useState("");
  const [lot, setLot] = useState("");
  const [realizedPnl, setRealizedPnl] = useState("");
  const [notes, setNotes] = useState("");
  const [flag, setFlag] = useState<"DISCIPLINED" | "FOMO_BUY" | "PANIC_SELL">("DISCIPLINED");

  const loadJournal = async () => {
    try {
      const [tradesData, pmData] = await Promise.all([
        api.getTrades(),
        api.getPostMortem()
      ]);
      setTradeLogs(tradesData || []);
      if (pmData) setPostMortem(pmData);
    } catch (e) {
      console.warn("Journal API fallback:", e);
    }
  };

  useEffect(() => {
    loadJournal();
  }, []);

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !price || !lot) return;

    const priceNum = parseFloat(price);
    const lotNum = parseInt(lot);
    const pnlNum = realizedPnl ? parseFloat(realizedPnl) : 0;

    try {
      await api.createTrade({
        ticker,
        action,
        price: priceNum,
        lot: lotNum,
        realized_pnl: pnlNum,
        notes,
        psychology_flag: flag
      });
      await loadJournal();
    } catch (err) {
      const newItem: TradeLogItem = {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        ticker: ticker.toUpperCase(),
        action,
        price: priceNum,
        lot: lotNum,
        totalValue: priceNum * lotNum * 100,
        realizedPnl: pnlNum,
        realizedPnlPct: pnlNum !== 0 ? (pnlNum / (priceNum * lotNum * 100)) * 100 : 0,
        notes,
        psychologyFlag: flag,
      };
      setTradeLogs([newItem, ...tradeLogs]);
    }

    setIsModalOpen(false);
    setTicker("");
    setPrice("");
    setLot("");
    setRealizedPnl("");
    setNotes("");
  };

  const getFlagBadge = (flag?: string) => {
    switch (flag) {
      case "DISCIPLINED":
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Disiplin Plan
          </span>
        );
      case "FOMO_BUY":
        return (
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
            <Flame className="w-3 h-3" /> FOMO Buy
          </span>
        );
      case "PANIC_SELL":
        return (
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Panic Sell
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-16">
      <Topbar
        title="AI Trading Journal & Post-Mortem"
        subtitle="Evaluasi transaksi selesai (Realized PnL) untuk mendeteksi kebiasaan psikologis & emosi"
        onRefresh={loadJournal}
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Total Realized PnL
            </span>
            <div className="mt-2 text-xl font-bold font-mono text-emerald-700">
              {formatRupiah(postMortem.totalRealizedPnl)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Akumulasi laba/rugi terealisasi</p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Win Rate
            </span>
            <div className="mt-2 text-xl font-bold font-mono text-slate-900">
              {postMortem.winRatePct}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Dihitung dari {tradeLogs.length} transaksi</p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Profit Factor
            </span>
            <div className="mt-2 text-xl font-bold font-mono text-slate-900">
              {postMortem.profitFactor}x
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rasio gross profit vs gross loss</p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Evaluasi Dominan
            </span>
            <div className="mt-2 text-xs font-bold text-amber-700 truncate">
              {postMortem.dominantPattern}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Terdeteksi oleh AI post-mortem</p>
          </div>
        </div>

        {/* AI Post-Mortem Analysis Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Post-Mortem AI Diagnosis
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Evaluasi Psikologis
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                AI mengidentifikasi bias emosi trading Anda berdasarkan data historis eksekusi
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            {postMortem.aiFeedback}
          </div>

          {/* Prescriptive recommendations */}
          <div className="mt-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Saran Perbaikan Kebiasaan Trading:
            </span>
            {postMortem.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Log Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Transaksi Realized</h3>
              <p className="text-xs text-slate-500">Daftar posisi yang telah ditutup beserta catatan psikologis</p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Transaksi</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Ticker</th>
                  <th className="py-3 px-3">Aksi</th>
                  <th className="py-3 px-3">Harga</th>
                  <th className="py-3 px-3">Lot</th>
                  <th className="py-3 px-3">Total Nilai</th>
                  <th className="py-3 px-3">Realized PnL</th>
                  <th className="py-3 px-3">Evaluasi Emosi</th>
                  <th className="py-3 px-3">Catatan Trader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {tradeLogs.length > 0 ? (
                  tradeLogs.map((log) => {
                    const isProfit = (log.realizedPnl || 0) >= 0;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">
                          {log.date}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                          {log.ticker}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono border ${
                            log.action === "SELL"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : log.action === "BUY"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-800">
                          Rp {formatNumber(log.price)}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-700">
                          {log.lot} Lot
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-800">
                          {formatRupiah(log.totalValue)}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold">
                          {log.realizedPnl !== undefined && log.realizedPnl !== null && log.action !== "BUY" ? (
                            <div className={isProfit ? "text-emerald-700" : "text-rose-600"}>
                              {isProfit ? "+" : ""}{formatRupiah(log.realizedPnl)} ({isProfit ? "+" : ""}{formatPercent(log.realizedPnlPct || 0)})
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          {getFlagBadge(log.psychologyFlag)}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                          {log.notes || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-xs">Belum Ada Riwayat Transaksi</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Catat hasil penjualan atau cut loss Anda dengan mengklik tombol &quot;Catat Transaksi&quot;.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Add Trade */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Catat Transaksi Realized</h3>
            <p className="text-xs text-slate-500 mb-4">Input hasil transaksi untuk dievaluasi AI</p>

            <form onSubmit={handleAddTrade} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Ticker Saham</label>
                <input
                  type="text"
                  placeholder="Contoh: BBRI.JK"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono uppercase focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Aksi</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="SELL">SELL (Take Profit)</option>
                    <option value="CUT_LOSS">CUT LOSS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Evaluasi Psikologi</label>
                  <select
                    value={flag}
                    onChange={(e) => setFlag(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="DISCIPLINED">Disiplin Trading Plan</option>
                    <option value="FOMO_BUY">FOMO (Ikut-ikutan)</option>
                    <option value="PANIC_SELL">Panic Sell (Emosi)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Harga Transaksi (Rp)</label>
                  <input
                    type="number"
                    placeholder="5100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Jumlah Lot</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={lot}
                    onChange={(e) => setLot(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Realized PnL Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 1500000 (jika profit) atau -500000 (jika rugi)"
                  value={realizedPnl}
                  onChange={(e) => setRealizedPnl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Catatan Evaluasi / Pembelajaran</label>
                <textarea
                  rows={2}
                  placeholder="Apa yang dipelajari dari transaksi ini..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
