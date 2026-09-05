/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { api } from "@/lib/api";
import { formatNumber, formatPercent, formatRupiah } from "@/lib/utils";
import { Holding } from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";

interface SellHoldingModalProps {
  isOpen: boolean;
  holding: Holding | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SellHoldingModal({
  isOpen,
  holding,
  onClose,
  onSuccess,
}: SellHoldingModalProps) {
  if (!isOpen || !holding) return null;

  return (
    <SellHoldingModalContent
      key={holding.id}
      holding={holding}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function SellHoldingModalContent({
  holding,
  onClose,
  onSuccess,
}: {
  holding: Holding;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [sellPrice, setSellPrice] = useState<string>(
    Math.round(holding.currentPrice || holding.avgPrice).toString(),
  );
  const [sellLot, setSellLot] = useState<number>(holding.lot);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = parseInt(sellPrice.replace(/\D/g, ""), 10) || 0;
  const lotNum = Math.min(Math.max(0, sellLot), holding.lot);
  const totalSaleValue = priceNum * lotNum * 100;
  const costValue = holding.avgPrice * lotNum * 100;
  const realizedPnl = totalSaleValue - costValue;
  const realizedPnlPct = costValue > 0 ? (realizedPnl / costValue) * 100 : 0;
  const isGain = realizedPnl >= 0;
  const remainingLot = holding.lot - lotNum;

  const handlePresetLot = (percentage: number) => {
    const calculated = Math.max(
      1,
      Math.round((holding.lot * percentage) / 100),
    );
    setSellLot(Math.min(calculated, holding.lot));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (priceNum <= 0) {
      setError("Harga jual harus lebih besar dari 0.");
      return;
    }
    if (lotNum <= 0 || lotNum > holding.lot) {
      setError(`Jumlah lot harus antara 1 sampai ${holding.lot} lot.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.sellHolding({
        holding_id: holding.id,
        sell_price: priceNum,
        sell_lot: lotNum,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Gagal mengeksekusi penjualan saham.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                isGain
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {isGain ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {holding.ticker}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    holding.jenis === "investasi"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {holding.jenis === "investasi" ? "Investasi" : "Trading"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Avg Beli:{" "}
                <span className="font-mono font-semibold text-slate-700">
                  Rp {formatNumber(holding.avgPrice)}
                </span>{" "}
                • Total Posisi:{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {holding.lot} Lot
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Price & Lot Inputs */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual Riil (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    priceNum > 0 ? priceNum.toLocaleString("id-ID") : sellPrice
                  }
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setSellPrice(val);
                  }}
                  required
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Jumlah Lot Dijual
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Tersedia: {holding.lot} Lot
                </span>
              </div>
              <input
                type="number"
                min="1"
                max={holding.lot}
                value={sellLot || ""}
                onChange={(e) => setSellLot(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Quick Lot Scale-Out Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                Pilihan Cepat (Scale-Out):
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetLot(25)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  lotNum === Math.max(1, Math.round(holding.lot * 0.25)) &&
                  lotNum !== holding.lot
                    ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                25% Posisi
              </button>
              <button
                type="button"
                onClick={() => handlePresetLot(50)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  lotNum === Math.max(1, Math.round(holding.lot * 0.5)) &&
                  lotNum !== holding.lot
                    ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                50% (TP1 Scale-Out)
              </button>
              <button
                type="button"
                onClick={() => handlePresetLot(100)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  lotNum === holding.lot
                    ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                100% (Semua Lot)
              </button>
            </div>
          </div>

          {/* Live Outcome Calculation Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Kalkulasi Hasil Transaksi
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block">
                  Total Nilai Penjualan
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {formatRupiah(totalSaleValue)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">
                  Realized Profit / Loss
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-mono font-bold text-sm ${isGain ? "text-emerald-700" : "text-rose-600"}`}
                  >
                    {isGain ? "+" : ""}
                    {formatRupiah(realizedPnl)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      isGain
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isGain ? "+" : ""}
                    {formatPercent(realizedPnlPct)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                Sisa di Portofolio:
              </span>
              <span className="font-mono font-semibold text-slate-700 text-[11px]">
                {remainingLot > 0
                  ? `${remainingLot} Lot tersisa`
                  : "Posisi ditutup total (100%)"}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || lotNum <= 0}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                isGain
                  ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                  : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
              }`}
            >
              {isSubmitting ? (
                "Memproses..."
              ) : isGain ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Konfirmasi Take Profit (+{formatRupiah(realizedPnl)})
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Konfirmasi Cut Loss ({formatRupiah(realizedPnl)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
