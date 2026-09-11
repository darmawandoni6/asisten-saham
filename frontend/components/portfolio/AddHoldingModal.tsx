'use client';

import { useState } from 'react';

import { Plus, Sparkles, X } from 'lucide-react';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddHoldingPayload } from '@/hooks/usePortfolio';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHolding: (payload: AddHoldingPayload) => Promise<void>;
}

export function AddHoldingModal({ isOpen, onClose, onAddHolding }: AddHoldingModalProps) {
  const [ticker, setTicker] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [lot, setLot] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [sector, setSector] = useState('');
  const [buyReason, setBuyReason] = useState('');
  const [jenis, setJenis] = useState<'trading' | 'investasi'>('trading');

  const [isFetchingAi, setIsFetchingAi] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFetchAiRecommendation = async () => {
    if (!ticker) return;
    setIsFetchingAi(true);
    setAiNote(null);
    try {
      const priceNum = avgPrice ? parseFloat(avgPrice) : undefined;
      const res = await api.getAiTpSl(ticker, jenis, priceNum);
      if (res) {
        if (res.tp) setTargetPrice(res.tp.toString());
        if (jenis === 'trading' && res.sl) setStopLoss(res.sl.toString());
        if (res.sector) setSector(res.sector);
        if (jenis === 'investasi') {
          setAiNote(
            `💡 Rekomendasi Investasi: TP Rp ${res.tp?.toLocaleString()} (Target Puncak 200 Hari) • No Hard Stop Loss`,
          );
        } else {
          setAiNote(
            `💡 Rekomendasi Trading: TP Rp ${res.tp?.toLocaleString()} (Resistance) • SL Rp ${res.sl?.toLocaleString()} (Support -3%)`,
          );
        }
      }
    } catch (err) {
      console.warn('Gagal menarik rekomendasi AI TP/SL:', err);
    } finally {
      setIsFetchingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !avgPrice || !lot) return;

    setIsSubmitting(true);
    try {
      await onAddHolding({
        ticker,
        avgPrice: parseFloat(avgPrice),
        lot: parseInt(lot, 10),
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        sector: sector || undefined,
        buyReason,
        jenis,
      });

      // Reset form
      setTicker('');
      setAvgPrice('');
      setLot('');
      setTargetPrice('');
      setStopLoss('');
      setSector('');
      setBuyReason('');
      setJenis('trading');
      setAiNote(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-md">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">Input Trading Plan Baru</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Perekaman data kepemilikan saham IDX
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
            <span className="sr-only">Tutup</span>
          </DialogClose>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <ScrollArea className="max-h-[62vh] px-6 py-4">
            <div className="space-y-4 text-xs">
              {/* Jenis Saham Toggle */}
              <div>
                <label className="mb-2 block font-medium text-slate-700">Jenis Saham</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setJenis('trading')}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                      jenis === 'trading'
                        ? 'border-amber-500 bg-amber-500 text-white shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-amber-400',
                    )}
                  >
                    ⚡ Trading
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenis('investasi')}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                      jenis === 'investasi'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-indigo-400',
                    )}
                  >
                    📈 Investasi
                  </button>
                </div>
                {jenis === 'investasi' && (
                  <p className="mt-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[10px] text-indigo-600">
                    Mode Investasi: Tidak ada Hard Stop Loss. Strategi fokus pada averaging down dan hold jangka
                    panjang.
                  </p>
                )}
              </div>

              {/* Ticker Input */}
              <div>
                <label className="mb-1 block font-medium text-slate-700">Ticker Saham (IDX)</label>
                <Input
                  type="text"
                  placeholder="Contoh: BBRI atau BBRI.JK"
                  value={ticker}
                  onChange={e => setTicker(e.target.value)}
                  required
                  className="font-mono uppercase"
                />
              </div>

              {/* Price & Lot Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Avg Price (Rp)</label>
                  <Input
                    type="number"
                    placeholder="4850"
                    value={avgPrice}
                    onChange={e => setAvgPrice(e.target.value)}
                    required
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Jumlah Lot</label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={lot}
                    onChange={e => setLot(e.target.value)}
                    required
                    className="font-mono"
                  />
                </div>
              </div>

              {/* AI Auto-Calculate Trigger */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-slate-700">Target Profit &amp; Stop Loss</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchAiRecommendation}
                  disabled={!ticker || isFetchingAi}
                  className="h-7 gap-1.5 rounded-lg border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                  title="Gunakan algoritma teknikal AI untuk menghitung TP & SL otomatis dari data 200 hari bursa"
                >
                  <Sparkles className={cn('h-3.5 w-3.5 text-emerald-600', isFetchingAi && 'animate-spin')} />
                  <span>{isFetchingAi ? 'Menghitung...' : '⚡ Hitung Rekomendasi AI'}</span>
                </Button>
              </div>

              {aiNote && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-[11px] leading-relaxed font-medium text-emerald-800">
                  {aiNote}
                </div>
              )}

              {/* TP & SL Inputs */}
              <div className={jenis === 'investasi' ? '' : 'grid grid-cols-2 gap-3'}>
                <div>
                  <label className="mb-1 block font-medium text-emerald-700">
                    Target Price (TP)
                    <span className="font-normal text-slate-400"> — Kosongkan = Auto AI</span>
                  </label>
                  <Input
                    type="number"
                    placeholder={
                      jenis === 'investasi' ? 'Auto-calculate AI (Target 200 Hari)' : 'Auto-calculate AI (Resistance)'
                    }
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    className="font-mono"
                  />
                </div>

                {jenis === 'trading' && (
                  <div>
                    <label className="mb-1 block font-medium text-rose-600">
                      Stop Loss (SL) <span className="font-normal text-slate-400">— Kosongkan = Auto AI</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Auto-calculate AI (Support -3%)"
                      value={stopLoss}
                      onChange={e => setStopLoss(e.target.value)}
                      className="font-mono focus-visible:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* Sector Selection */}
              <div>
                <label className="mb-1 block font-medium text-slate-700">
                  Sektor Saham{' '}
                  <span className="font-normal text-slate-400">(Opsional — Auto-detect jika dikosongkan)</span>
                </label>
                <Select value={sector || 'AUTO'} onValueChange={val => setSector(val && val !== 'AUTO' ? val : '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih sektor saham..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">⚡ Auto-detect dari Yahoo Finance (Rekomendasi)</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                    <SelectItem value="Consumer Defensive">Consumer Defensive / Farmasi & Herbal</SelectItem>
                    <SelectItem value="Consumer Cyclical">Consumer Cyclical</SelectItem>
                    <SelectItem value="Financials">Financials / Perbankan</SelectItem>
                    <SelectItem value="Healthcare">Healthcare / Alat Kesehatan</SelectItem>
                    <SelectItem value="Industrials">Industrials / Jasa & Logistik</SelectItem>
                    <SelectItem value="Basic Materials">Basic Materials / Tambang</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Communication Services">Communication Services / Telco</SelectItem>
                    <SelectItem value="Infrastructures">Infrastructures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buy Reason / Trading Plan Notes */}
              <div>
                <label className="mb-1 block font-medium text-slate-700">Alasan Beli (Catatan Plan)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Rebound MA50 dengan volume akumulasi..."
                  value={buyReason}
                  onChange={e => setBuyReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-2xs transition-colors focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <DialogFooter className="border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              Batal
            </Button>
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Portofolio'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
