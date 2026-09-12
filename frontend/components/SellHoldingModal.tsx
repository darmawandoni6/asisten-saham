'use client';

import { useState } from 'react';

import { AlertCircle, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [sellPrice, setSellPrice] = useState<string>(
    holding ? Math.round(holding.currentPrice || holding.avgPrice).toString() : '0',
  );
  const [sellLot, setSellLot] = useState<number>(holding ? holding.lot : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevHoldingId, setPrevHoldingId] = useState<number | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen || (holding && holding.id !== prevHoldingId)) {
    setPrevIsOpen(isOpen);
    setPrevHoldingId(holding?.id ?? null);
    if (isOpen && holding) {
      setSellPrice(Math.round(holding.currentPrice || holding.avgPrice).toString());
      setSellLot(holding.lot);
      setIsSubmitting(false);
      setError(null);
    }
  }

  const priceNum = parseInt(sellPrice.replace(/\D/g, ''), 10) || 0;
  const currentLot = holding?.lot || 0;
  const avgPrice = holding?.avgPrice || 0;
  const lotNum = Math.min(Math.max(0, sellLot), currentLot);
  const totalSaleValue = priceNum * lotNum * 100;
  const costValue = avgPrice * lotNum * 100;
  const realizedPnl = totalSaleValue - costValue;
  const realizedPnlPct = costValue > 0 ? (realizedPnl / costValue) * 100 : 0;
  const isGain = realizedPnl >= 0;
  const remainingLot = currentLot - lotNum;

  const handlePresetLot = (percentage: number) => {
    if (!holding) return;
    const calculated = Math.max(1, Math.round((holding.lot * percentage) / 100));
    setSellLot(Math.min(calculated, holding.lot));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holding) return;
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
    <Dialog open={isOpen && !!holding} onOpenChange={open => !open && onClose()}>
      {holding && (
        <DialogContent className="max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-lg">
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
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
                  <DialogTitle className="text-base font-bold text-slate-900">{holding.ticker}</DialogTitle>
                  <Badge
                    variant="secondary"
                    className={
                      holding.jenis === 'investasi'
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }
                  >
                    {holding.jenis === 'investasi' ? 'Investasi' : 'Trading'}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Avg Beli:{' '}
                  <span className="font-mono font-semibold text-slate-700">Rp {formatNumber(holding.avgPrice)}</span> •
                  Total Posisi: <span className="font-mono font-semibold text-slate-700">{holding.lot} Lot</span>
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <X className="h-4 w-4" />
              <span className="sr-only">Tutup</span>
            </DialogClose>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <Alert variant="destructive" className="p-3 text-xs">
                <AlertDescription className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Price & Lot Inputs */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="sell-price-input" className="text-xs font-semibold text-slate-700">
                  Harga Jual Riil (Rp)
                </Label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Rp
                  </span>
                  <Input
                    id="sell-price-input"
                    type="text"
                    inputMode="numeric"
                    value={priceNum > 0 ? priceNum.toLocaleString('id-ID') : sellPrice}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setSellPrice(val);
                    }}
                    required
                    placeholder="0"
                    className="py-2 pr-3 pl-9 font-mono text-sm font-bold text-slate-900 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sell-lot-input" className="text-xs font-semibold text-slate-700">
                    Jumlah Lot Dijual
                  </Label>
                  <span className="font-mono text-[10px] text-slate-400">Tersedia: {holding.lot} Lot</span>
                </div>
                <Input
                  id="sell-lot-input"
                  type="number"
                  min="1"
                  max={holding.lot}
                  value={sellLot || ''}
                  onChange={e => setSellLot(parseInt(e.target.value, 10) || 0)}
                  required
                  className="font-mono text-sm font-bold text-slate-900 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Lot Scale-Out Presets */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">Pilihan Cepat (Scale-Out):</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={
                    lotNum === Math.max(1, Math.round(holding.lot * 0.25)) && lotNum !== holding.lot
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => handlePresetLot(25)}
                  className="text-xs font-semibold"
                >
                  25% Posisi
                </Button>
                <Button
                  type="button"
                  variant={
                    lotNum === Math.max(1, Math.round(holding.lot * 0.5)) && lotNum !== holding.lot
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => handlePresetLot(50)}
                  className="text-xs font-semibold"
                >
                  50% (TP1 Scale-Out)
                </Button>
                <Button
                  type="button"
                  variant={lotNum === holding.lot ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetLot(100)}
                  className="text-xs font-semibold"
                >
                  100% (Semua Lot)
                </Button>
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
                    <Badge
                      variant={isGain ? 'secondary' : 'destructive'}
                      className={`font-mono text-[10px] font-bold ${
                        isGain ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isGain ? '+' : ''}
                      {formatPercent(realizedPnlPct)}
                    </Badge>
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
            <DialogFooter className="-mx-6 -mb-6 flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                Batal
              </Button>
              <Button
                type="submit"
                variant={isGain ? 'emerald' : 'destructive'}
                size="sm"
                disabled={isSubmitting || lotNum <= 0}
                className="gap-1.5 rounded-xl shadow-xs"
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
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
