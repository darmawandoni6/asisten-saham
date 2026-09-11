'use client';

import { useState } from 'react';

import { AlertCircle, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, X } from 'lucide-react';

import { api } from '@/lib/api';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { Holding } from '@/types';

interface SellHoldingModalProps {
  isOpen: boolean;
  holding: Holding | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SellHoldingModal({ isOpen, holding, onClose, onSuccess }: SellHoldingModalProps) {
  if (!isOpen || !holding) return null;

  return <SellHoldingModalContent key={holding.id} holding={holding} onClose={onClose} onSuccess={onSuccess} />;
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
  const [sellPrice, setSellPrice] = useState<string>(Math.round(holding.currentPrice || holding.avgPrice).toString());
  const [sellLot, setSellLot] = useState<number>(holding.lot);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNum = parseInt(sellPrice.replace(/\D/g, ''), 10) || 0;
  const lotNum = Math.min(Math.max(0, sellLot), holding.lot);
  const totalSaleValue = priceNum * lotNum * 100;
  const costValue = holding.avgPrice * lotNum * 100;
  const realizedPnl = totalSaleValue - costValue;
  const realizedPnlPct = costValue > 0 ? (realizedPnl / costValue) * 100 : 0;
  const isGain = realizedPnl >= 0;
  const remainingLot = holding.lot - lotNum;

  const handlePresetLot = (percentage: number) => {
    const calculated = Math.max(1, Math.round((holding.lot * percentage) / 100));
    setSellLot(Math.min(calculated, holding.lot));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (priceNum <= 0) {
      setError('Harga jual harus lebih besar dari 0.');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengeksekusi penjualan saham.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="animate-in fade-in zoom-in-95 my-6 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                isGain ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isGain ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{holding.ticker}</h3>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    holding.jenis === 'investasi'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {holding.jenis === 'investasi' ? 'Investasi' : 'Trading'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Avg Beli:{' '}
                <span className="font-mono font-semibold text-slate-700">Rp {formatNumber(holding.avgPrice)}</span> •
                Total Posisi: <span className="font-mono font-semibold text-slate-700">{holding.lot} Lot</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Price & Lot Inputs */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Harga Jual Riil (Rp)</label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceNum > 0 ? priceNum.toLocaleString('id-ID') : sellPrice}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setSellPrice(val);
                  }}
                  required
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 font-mono text-sm font-bold text-slate-900 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Jumlah Lot Dijual</label>
                <span className="font-mono text-[10px] text-slate-400">Tersedia: {holding.lot} Lot</span>
              </div>
              <input
                type="number"
                min="1"
                max={holding.lot}
                value={sellLot || ''}
                onChange={e => setSellLot(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Lot Scale-Out Presets */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Pilihan Cepat (Scale-Out):</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetLot(25)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all ${
                  lotNum === Math.max(1, Math.round(holding.lot * 0.25)) && lotNum !== holding.lot
                    ? 'border-slate-800 bg-slate-800 text-white shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                25% Posisi
              </button>
              <button
                type="button"
                onClick={() => handlePresetLot(50)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all ${
                  lotNum === Math.max(1, Math.round(holding.lot * 0.5)) && lotNum !== holding.lot
                    ? 'border-slate-800 bg-slate-800 text-white shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                50% (TP1 Scale-Out)
              </button>
              <button
                type="button"
                onClick={() => handlePresetLot(100)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all ${
                  lotNum === holding.lot
                    ? 'border-slate-800 bg-slate-800 text-white shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                100% (Semua Lot)
              </button>
            </div>
          </div>

          {/* Live Outcome Calculation Box */}
          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Kalkulasi Hasil Transaksi
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] text-slate-500">Total Nilai Penjualan</span>
                <span className="font-mono text-sm font-bold text-slate-900">{formatRupiah(totalSaleValue)}</span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500">Realized Profit / Loss</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`font-mono text-sm font-bold ${isGain ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {isGain ? '+' : ''}
                    {formatRupiah(realizedPnl)}
                  </span>
                  <span
                    className={`py-0.2 rounded px-1.5 font-mono text-[10px] font-bold ${
                      isGain ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isGain ? '+' : ''}
                    {formatPercent(realizedPnlPct)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
              <span className="text-[11px] text-slate-500">Sisa di Portofolio:</span>
              <span className="font-mono text-[11px] font-semibold text-slate-700">
                {remainingLot > 0 ? `${remainingLot} Lot tersisa` : 'Posisi ditutup total (100%)'}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || lotNum <= 0}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 ${
                isGain
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
              }`}
            >
              {isSubmitting ? (
                'Memproses...'
              ) : isGain ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Konfirmasi Take Profit (+{formatRupiah(realizedPnl)})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
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
