"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/Topbar";
import { Holding } from "@/types";
import { formatRupiah, formatNumber, formatPercent } from "@/lib/utils";
import { CandlestickChart } from "@/components/CandlestickChart";
import { 
  Plus, 
  Trash2, 
  LineChart, 
  PieChart, 
  Calculator, 
  X,
  Layers,
  Inbox,
  Sparkles,
  RefreshCw,
  Wallet,
  Tag
} from "lucide-react";
import { EditBalanceModal } from "@/components/EditBalanceModal";
import { SellHoldingModal } from "@/components/SellHoldingModal";
import { api } from "@/lib/api";

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(168755);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [sellingHolding, setSellingHolding] = useState<Holding | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [chartStock, setChartStock] = useState<Holding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Holding Form State
  const [ticker, setTicker] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [lot, setLot] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [sector, setSector] = useState("");
  const [buyReason, setBuyReason] = useState("");
  const [jenis, setJenis] = useState<"trading" | "investasi">("trading");

  const [isFetchingAi, setIsFetchingAi] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const handleFetchAiRecommendation = async () => {
    if (!ticker) return;
    setIsFetchingAi(true);
    setAiNote(null);
    try {
      const priceNum = avgPrice ? parseFloat(avgPrice) : undefined;
      const res = await api.getAiTpSl(ticker, jenis, priceNum);
      if (res) {
        if (res.tp) setTargetPrice(res.tp.toString());
        if (jenis === "trading" && res.sl) setStopLoss(res.sl.toString());
        if (res.sector) setSector(res.sector);
        if (jenis === "investasi") {
          setAiNote(`💡 Rekomendasi Investasi: TP Rp ${res.tp?.toLocaleString()} (Target Puncak 200 Hari) • No Hard Stop Loss`);
        } else {
          setAiNote(`💡 Rekomendasi Trading: TP Rp ${res.tp?.toLocaleString()} (Resistance) • SL Rp ${res.sl?.toLocaleString()} (Support -3%)`);
        }
      }
    } catch (err) {
      console.warn("Gagal menarik rekomendasi AI TP/SL:", err);
    } finally {
      setIsFetchingAi(false);
    }
  };


  const loadPortfolio = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboard();
      if (data && data.holdings) {
        setHoldings(data.holdings);
      }
      if (data && data.summary && data.summary.cashBalance !== undefined) {
        setCashBalance(data.summary.cashBalance);
      } else {
        const balRes = await api.getCashBalance();
        if (balRes && balRes.cash_balance !== undefined) {
          setCashBalance(balRes.cash_balance);
        }
      }
    } catch (e) {
      console.warn("Portfolio API offline:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !avgPrice || !lot) return;

    const priceNum = parseFloat(avgPrice);
    const lotNum = parseInt(lot);
    // TP/SL default berbeda untuk investasi vs trading
    const tpNum = targetPrice ? parseFloat(targetPrice) : (jenis === "investasi" ? priceNum * 1.30 : priceNum * 1.15);
    const slNum = jenis === "investasi" ? undefined : (stopLoss ? parseFloat(stopLoss) : priceNum * 0.93);

    try {
      await api.createHolding({
        ticker,
        avg_price: priceNum,
        lot: lotNum,
        target_price: tpNum,
        stop_loss: slNum,
        sector: sector || undefined,
        buy_reason: buyReason,
        jenis
      });
      await loadPortfolio();
    } catch (err) {
      const newHolding: Holding = {
        id: Date.now(),
        ticker: ticker.toUpperCase().includes(".JK") ? ticker.toUpperCase() : `${ticker.toUpperCase()}.JK`,
        name: `${ticker.toUpperCase()} Tbk`,
        sector: sector || "—",
        jenis: jenis,
        avgPrice: priceNum,
        lot: lotNum,
        shares: lotNum * 100,
        currentPrice: priceNum,
        previousClose: priceNum,
        targetPrice: tpNum,
        stopLoss: slNum ?? null,
        highWatermark: priceNum,
        trailingStopPrice: jenis === "investasi" ? null : Math.round(priceNum * 0.93),
        floatingPnl: 0,
        floatingPnlPct: 0,
        actionStatus: "HOLD_MONITOR",
        actionReason: "Posisi baru ditambahkan ke trading plan.",
        buyReason: buyReason || "Trading plan entry baru",
        buyDate: new Date().toISOString().split("T")[0],
        rsi: 50.0,
        aboveMa20: true,
        aboveMa50: true,
      };
      setHoldings([newHolding, ...holdings]);
    }

    setIsModalOpen(false);
    setTicker("");
    setAvgPrice("");
    setLot("");
    setTargetPrice("");
    setStopLoss("");
    setBuyReason("");
    setJenis("trading");
  };

  const handleDelete = async (id: number) => {
    if (confirm("Hapus saham ini dari pencatatan portofolio?")) {
      try {
        await api.deleteHolding(id);
        await loadPortfolio();
      } catch (err) {
        setHoldings(holdings.filter((h) => h.id !== id));
      }
    }
  };

  // Calculate sector distribution
  const totalCost = holdings.reduce((acc, h) => acc + h.avgPrice * h.shares, 0);
  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    const cost = h.avgPrice * h.shares;
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + cost;
  });

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-16">
      <Topbar
        title="Portofolio & Trading Plan Management"
        subtitle="Kelola kepemilikan, target profit, stop loss dinamis, dan alokasi risiko"
        onRefresh={loadPortfolio}
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Trading Plan Aktif</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap posisi diproteksi dengan batas risiko terukur dan trailing stop otomatis
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block leading-tight">Saldo Kas RDN</span>
                <span className="text-xs font-mono font-bold text-slate-800 leading-tight">{formatRupiah(cashBalance)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBalanceModalOpen(true)}
                className="ml-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
              >
                ✏️ Edit
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Saham Baru</span>
            </button>
          </div>
        </div>

        {/* Portfolio Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Ticker</th>
                  <th className="py-3 px-3">Jenis</th>
                  <th className="py-3 px-3">Sektor</th>
                  <th className="py-3 px-3">Avg Beli</th>
                  <th className="py-3 px-3">Jumlah Lot</th>
                  <th className="py-3 px-3">Modal Beli</th>
                  <th className="py-3 px-3">Close EOD</th>
                  <th className="py-3 px-3">Floating PnL</th>
                  <th className="py-3 px-3">Target (TP)</th>
                  <th className="py-3 px-3">Stop Loss</th>
                  <th className="py-3 px-3 text-center">Chart</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {holdings.length > 0 ? (
                  holdings.map((h) => {
                    const cost = h.avgPrice * h.shares;
                    const isProfit = h.floatingPnl >= 0;

                      return (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                          {h.ticker}
                        </td>
                        <td className="py-3.5 px-3">
                          {h.jenis === "investasi" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                              📈 Investasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              ⚡ Trading
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                          {h.sector || "—"}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-800">
                          Rp {formatNumber(h.avgPrice)}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-700">
                          {formatNumber(h.lot)} Lot
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-800">
                          {formatRupiah(cost)}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                          Rp {formatNumber(h.currentPrice)}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold">
                          <div className={isProfit ? "text-emerald-700" : "text-rose-600"}>
                            {formatPercent(h.floatingPnlPct)}
                          </div>
                          <div className={`text-[10px] ${isProfit ? "text-emerald-600" : "text-rose-500"}`}>
                            {formatRupiah(h.floatingPnl)}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-emerald-700 font-bold">
                          Rp {formatNumber(h.targetPrice)}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold">
                          {h.stopLoss ? (
                            <span className="text-rose-600">Rp {formatNumber(h.stopLoss)}</span>
                          ) : (
                            <span className="text-indigo-500 text-[10px] font-medium">No Hard SL<br/><span className="text-slate-400">Avg Down</span></span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setChartStock(h)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Buka Chart"
                          >
                            <LineChart className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSellingHolding(h);
                                setIsSellModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                              title="Jual saham / Take Profit / Cut Loss"
                            >
                              <Tag className="w-3 h-3" />
                              <span>Jual</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(h.id)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                              title="Hapus manual dari pencatatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-xs">Belum Ada Saham di Portofolio</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Klik tombol &quot;Tambah Saham Baru&quot; di atas untuk mencatat trading plan pertama Anda.
                      </p>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* Money Management & Pyramiding Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sektor Alokasi */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 text-xs font-bold uppercase tracking-wider mb-4">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>Money Management: Alokasi Sektor</span>
            </div>
            {holdings.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(sectorMap).map(([sec, val]) => {
                  const pct = totalCost > 0 ? (val / totalCost) * 100 : 0;
                  return (
                    <div key={sec}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-700">{sec}</span>
                        <span className="text-emerald-700 font-mono font-bold">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada saham untuk dihitung alokasi sektornya.
              </p>
            )}
          </div>

          {/* Pyramiding & Scale-Out Matrix */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 text-xs font-bold uppercase tracking-wider mb-4">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Selling Engine: Scale-Out Matrix</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-emerald-700 font-bold block">TP1 (Target Profit 1)</span>
                  <span className="text-[11px] text-slate-500">Jual 50% Posisi</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono font-bold border border-emerald-200 text-[11px]">
                  Kunci Profit 50%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-800 font-bold block">TP2 (Target Profit 2)</span>
                  <span className="text-[11px] text-slate-500">Jual 25% Posisi</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-mono font-bold text-[11px]">
                  Amankan 25%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-orange-700 font-bold block">Sisa 25% Posisi (Trailing Stop)</span>
                  <span className="text-[11px] text-slate-500">Batas Proteksi: 7% dari High Watermark</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-800 font-mono font-bold border border-orange-200 text-[11px]">
                  Ride The Trend
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add Holding Form */}
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

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Input Trading Plan Baru</h3>
                <p className="text-xs text-slate-500">Perekaman data kepemilikan saham IDX</p>
              </div>
            </div>

            <form onSubmit={handleAddHolding} className="space-y-4 text-xs">
              {/* Jenis Saham Toggle */}
              <div>
                <label className="block text-slate-700 font-medium mb-2">Jenis Saham</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setJenis("trading")}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      jenis === "trading"
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : "bg-white border-slate-300 text-slate-600 hover:border-amber-400"
                    }`}
                  >
                    ⚡ Trading
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenis("investasi")}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      jenis === "investasi"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white border-slate-300 text-slate-600 hover:border-indigo-400"
                    }`}
                  >
                    📈 Investasi
                  </button>
                </div>
                {jenis === "investasi" && (
                  <p className="mt-1.5 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5">
                    Mode Investasi: Tidak ada Hard Stop Loss. Strategi fokus pada averaging down dan hold jangka panjang.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Ticker Saham (IDX)</label>
                <input
                  type="text"
                  placeholder="Contoh: BBRI atau BBRI.JK"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono uppercase focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Avg Price (Rp)</label>
                  <input
                    type="number"
                    placeholder="4850"
                    value={avgPrice}
                    onChange={(e) => setAvgPrice(e.target.value)}
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

              {/* AI Auto-Calculate Trigger */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-slate-700">
                  Target Profit &amp; Stop Loss
                </span>
                <button
                  type="button"
                  onClick={handleFetchAiRecommendation}
                  disabled={!ticker || isFetchingAi}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Gunakan algoritma teknikal AI untuk menghitung TP & SL otomatis dari data 200 hari bursa"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isFetchingAi ? "animate-spin text-emerald-600" : ""}`} />
                  <span>{isFetchingAi ? "Menghitung..." : "⚡ Hitung Rekomendasi AI"}</span>
                </button>
              </div>

              {aiNote && (
                <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-800 font-medium leading-relaxed">
                  {aiNote}
                </div>
              )}

              <div className={jenis === "investasi" ? "" : "grid grid-cols-2 gap-3"}>
                <div>
                  <label className="block text-emerald-700 font-medium mb-1">
                    Target Price (TP){jenis === "investasi" ? " — Kosongkan = Auto AI" : " — Kosongkan = Auto AI"}
                  </label>
                  <input
                    type="number"
                    placeholder={jenis === "investasi" ? "Auto-calculate AI (Target 200 Hari)" : "Auto-calculate AI (Resistance)"}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {jenis === "trading" && (
                  <div>
                    <label className="block text-rose-600 font-medium mb-1">
                      Stop Loss (SL) <span className="text-slate-400 font-normal">— Kosongkan = Auto AI</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Auto-calculate AI (Support -3%)"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Sektor Saham <span className="text-slate-400 font-normal">(Opsional — Auto-detect jika dikosongkan)</span>
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">⚡ Auto-detect dari Yahoo Finance (Rekomendasi)</option>
                  <option value="Energy">Energy</option>
                  <option value="Consumer Defensive">Consumer Defensive / Farmasi & Herbal</option>
                  <option value="Consumer Cyclical">Consumer Cyclical</option>
                  <option value="Financials">Financials / Perbankan</option>
                  <option value="Healthcare">Healthcare / Alat Kesehatan</option>
                  <option value="Industrials">Industrials / Jasa & Logistik</option>
                  <option value="Basic Materials">Basic Materials / Tambang</option>
                  <option value="Technology">Technology</option>
                  <option value="Communication Services">Communication Services / Telco</option>
                  <option value="Infrastructures">Infrastructures</option>
                </select>
              </div>


              <div>
                <label className="block text-slate-700 font-medium mb-1">Alasan Beli (Catatan Plan)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Rebound MA50 dengan volume akumulasi..."
                  value={buyReason}
                  onChange={(e) => setBuyReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-2xs"
                >
                  Simpan ke Portofolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chart */}
      {chartStock && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <CandlestickChart
              ticker={chartStock.ticker}
              candles={[]}
              holding={chartStock}
              onClose={() => setChartStock(null)}
            />
          </div>
        </div>
      )}

      {/* Modal Edit Cash Balance */}
      <EditBalanceModal
        isOpen={isBalanceModalOpen}
        currentBalance={cashBalance}
        onClose={() => setIsBalanceModalOpen(false)}
        onSuccess={(newBalance) => {
          setCashBalance(newBalance);
          loadPortfolio();
        }}
      />

      {/* Modal Sell Holding */}
      <SellHoldingModal
        isOpen={isSellModalOpen}
        holding={sellingHolding}
        onClose={() => {
          setIsSellModalOpen(false);
          setSellingHolding(null);
        }}
        onSuccess={() => {
          loadPortfolio();
        }}
      />
    </main>
  );
}
