'use client';

import { useState } from 'react';

import { Plus, Sparkles, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddHoldingPayload } from '@/hooks/usePortfolio';
import { api } from '@/lib/api';
import { formatNumber, formatRupiah } from '@/lib/utils';
import { Holding } from '@/types';

interface AddHoldingModalProps {
  isOpen: boolean;
  holdings?: Holding[];
  initialTicker?: string;
  onClose: () => void;
  onAddHolding: (payload: AddHoldingPayload) => Promise<void>;
}

export function AddHoldingModal({
  isOpen,
  holdings = [],
  initialTicker = '',
  onClose,
  onAddHolding,
}: AddHoldingModalProps) {
  const [ticker, setTicker] = useState(initialTicker);
  const [avgPrice, setAvgPrice] = useState('');
  const [lot, setLot] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [sector, setSector] = useState('');
  const [buyReason, setBuyReason] = useState('');
  const [jenis, setJenis] = useState<'trading' | 'investasi'>('trading');

  const [isFetchingAi, setIsFetchingAi] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiRec, setAiRec] = useState<{
    tp?: number;
    sl?: number | null;
    isExitRebound?: boolean;
    profitTargetAlt?: number | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevTicker, setPrevTicker] = useState(initialTicker);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen || initialTicker !== prevTicker) {
    setPrevIsOpen(isOpen);
    setPrevTicker(initialTicker);
    if (isOpen) {
      const cleanInit = initialTicker.toUpperCase().replace(/\.JK$/i, '').trim();
      const existingInit = cleanInit
        ? holdings.find(h => h.ticker.toUpperCase().replace(/\.JK$/i, '').trim() === cleanInit)
        : null;

      setTicker(initialTicker);
      setAvgPrice('');
      setLot('');
      setTargetPrice(existingInit?.targetPrice ? existingInit.targetPrice.toString() : '');
      setStopLoss(existingInit?.stopLoss ? existingInit.stopLoss.toString() : '');
      setSector(existingInit?.sector || '');
      setBuyReason('');
      setJenis(existingInit?.jenis || 'trading');
      setIsFetchingAi(false);
      setAiNote(null);
      setAiRec(null);
      setIsSubmitting(false);
    }
  }

  // Check if entered ticker already exists in portfolio
  const cleanInputTicker = ticker.toUpperCase().replace(/\.JK$/i, '').trim();
  const existingHolding = cleanInputTicker
    ? holdings.find(h => h.ticker.toUpperCase().replace(/\.JK$/i, '').trim() === cleanInputTicker)
    : null;

  // Real-time calculation for adding lot / averaging
  const priceNum = parseFloat(avgPrice) || 0;
  const lotNum = parseInt(lot, 10) || 0;
  const isAveraging = !!existingHolding && priceNum > 0 && lotNum > 0;

  const newTotalLot = existingHolding ? existingHolding.lot + lotNum : lotNum;
  const additionalCost = priceNum * lotNum * 100;
  const existingCost = existingHolding ? existingHolding.avgPrice * existingHolding.lot * 100 : 0;
  const newAvgPrice =
    existingHolding && newTotalLot > 0 ? Math.round((existingCost + additionalCost) / (newTotalLot * 100)) : priceNum;

  const handleFetchAiRecommendation = async () => {
    if (!ticker) return;
    setIsFetchingAi(true);
    setAiNote(null);
    setAiRec(null);
    try {
      const priceVal = avgPrice ? parseFloat(avgPrice) : undefined;
      const res = await api.getAiTpSl(ticker, jenis, priceVal);
      if (res) {
        if (res.tp) setTargetPrice(res.tp.toString());
        if (jenis === 'trading' && res.sl) setStopLoss(res.sl.toString());
        if (res.sector) setSector(res.sector);
        setAiRec({
          tp: res.tp,
          sl: res.sl,
          isExitRebound: res.isExitRebound,
          profitTargetAlt: res.profitTargetAlt,
        });

        if (jenis === 'investasi') {
          setAiNote(
            `💡 Rekomendasi Investasi: Target Puncak 200 Hari Rp ${res.tp?.toLocaleString()} • Tanpa Hard Stop Loss.`,
          );
        } else if (res.isExitRebound) {
          setAiNote(
            `⚠️ Mode Exit Rebound: Resisten 20-hari terdekat (Rp ${res.tp?.toLocaleString()}) berada di bawah modal beli (Rp ${(priceVal || 0).toLocaleString()}). Digunakan untuk meminimalkan kerugian saat harga memantul.`,
          );
        } else {
          setAiNote(
            `💡 Rekomendasi Trading: TP Rp ${res.tp?.toLocaleString()} (Resisten 20-Hari) • SL Rp ${res.sl?.toLocaleString()} (Support -3%).`,
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
        stopLoss: jenis === 'investasi' ? undefined : stopLoss ? parseFloat(stopLoss) : undefined,
        sector: sector || undefined,
        buyReason:
          buyReason ||
          (existingHolding ? `Beli tambahan ${lot} lot @ Rp ${formatNumber(parseFloat(avgPrice))}` : undefined),
        jenis,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-md">
        <DialogHeader className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-bold text-slate-900">
              {existingHolding ? 'Tambah Lot Saham (Beli Lagi)' : 'Tambah Saham Baru'}
            </DialogTitle>
            {existingHolding && (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-mono text-xs font-bold text-emerald-800"
              >
                Posisi Aktif
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-slate-500">
            {existingHolding
              ? `Saham ${existingHolding.ticker} sudah ada. Input ini akan otomatis menggabungkan lot & menghitung harga rata-rata baru.`
              : 'Masukkan trading plan baru dengan batas risiko terukur dan trailing stop otomatis.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ScrollArea className="max-h-[65vh] px-6 py-4">
            <div className="space-y-4">
              {/* Existing Holding Detected Banner */}
              {existingHolding && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900">Posisi Saat Ini di Portofolio:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {existingHolding.lot} Lot @ Rp {formatNumber(existingHolding.avgPrice)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700">
                    Sektor: {existingHolding.sector || '—'} • Tujuan:{' '}
                    {existingHolding.jenis === 'investasi' ? 'Investasi' : 'Trading'}
                  </p>
                </div>
              )}

              {/* Ticker & Jenis */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Kode Saham (Ticker)</Label>
                  <Input
                    placeholder="Contoh: SIDO, BBRI"
                    value={ticker}
                    onChange={e => {
                      const val = e.target.value;
                      setTicker(val);
                      const clean = val.toUpperCase().replace(/\.JK$/i, '').trim();
                      const match = holdings.find(h => h.ticker.toUpperCase().replace(/\.JK$/i, '').trim() === clean);
                      if (match) {
                        setJenis(match.jenis || 'trading');
                        if (match.targetPrice) setTargetPrice(match.targetPrice.toString());
                        if (match.stopLoss) setStopLoss(match.stopLoss.toString());
                        if (match.sector) setSector(match.sector);
                      }
                    }}
                    required
                    className="mt-1 h-9 rounded-lg border-slate-200 bg-white font-mono text-xs font-bold text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Tujuan Kepemilikan</Label>
                  <Select
                    value={jenis}
                    onValueChange={val => {
                      const newJenis = val as 'trading' | 'investasi';
                      setJenis(newJenis);
                      if (newJenis === 'investasi') {
                        setStopLoss('');
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1 h-9 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-900">
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white shadow-lg">
                      <SelectItem
                        value="trading"
                        className="text-xs font-medium focus:bg-amber-50 focus:text-amber-900"
                      >
                        ⚡ Trading (Disiplin SL)
                      </SelectItem>
                      <SelectItem
                        value="investasi"
                        className="text-xs font-medium focus:bg-indigo-50 focus:text-indigo-900"
                      >
                        📈 Investasi (Tanpa Hard SL)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Buy Price & Lot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    {existingHolding ? 'Harga Beli Hari Ini' : 'Avg Price (Modal Beli)'}
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 488"
                    value={avgPrice}
                    onChange={e => setAvgPrice(e.target.value)}
                    required
                    className="mt-1 h-9 rounded-lg border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    {existingHolding ? 'Jumlah Lot Tambahan' : 'Jumlah Lot'}
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 1"
                    value={lot}
                    onChange={e => setLot(e.target.value)}
                    required
                    className="mt-1 h-9 rounded-lg border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Live Averaging Simulation Box */}
              {isAveraging && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-900">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span>Hasil Simulasi Rata-Rata Modal Baru:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border border-slate-100 bg-white p-2">
                      <span className="block text-[10px] text-slate-400">Total Lot Baru</span>
                      <span className="font-mono font-bold text-slate-800">
                        {existingHolding.lot} + {lotNum} = {newTotalLot} Lot
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-white p-2">
                      <span className="block text-[10px] text-slate-400">Harga Rata-Rata Baru</span>
                      <span className="font-mono font-bold text-emerald-700">Rp {formatNumber(newAvgPrice)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    Modal Pembelian Tambahan:{' '}
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(additionalCost)}</span>
                  </p>
                </div>
              )}

              {/* AI Recommendation Helper */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Bantuan AI TP/SL</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFetchAiRecommendation}
                    disabled={isFetchingAi || !ticker}
                    className="h-7 gap-1.5 rounded-lg border-emerald-200 bg-white px-2.5 text-[11px] font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-50"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>{isFetchingAi ? 'Menghitung...' : 'Rekomendasikan AI'}</span>
                  </Button>
                </div>
                {aiNote && <p className="mt-2 text-[11px] leading-relaxed text-slate-700">{aiNote}</p>}

                {/* Quick Choice for Exit Rebound vs Pure Profit */}
                {aiRec?.isExitRebound && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-emerald-100/80 pt-2">
                    <button
                      type="button"
                      onClick={() => aiRec.tp && setTargetPrice(aiRec.tp.toString())}
                      className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
                    >
                      <span>⚡ Gunakan Exit Rebound (Rp {aiRec.tp?.toLocaleString()})</span>
                    </button>
                    {aiRec.profitTargetAlt && (
                      <button
                        type="button"
                        onClick={() => setTargetPrice(aiRec.profitTargetAlt!.toString())}
                        className="flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-100/80 px-2 py-1 text-[10px] font-bold text-emerald-900 hover:bg-emerald-200"
                      >
                        <span>🎯 Gunakan Target Profit +10% (Rp {aiRec.profitTargetAlt.toLocaleString()})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* TP & SL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">
                      {targetPrice &&
                      avgPrice &&
                      parseFloat(targetPrice) < parseFloat(avgPrice) &&
                      jenis !== 'investasi'
                        ? '⚡ Target Exit Rebound'
                        : jenis === 'investasi'
                          ? 'Target Investasi'
                          : 'Target Price (TP)'}
                    </Label>
                  </div>
                  <Input
                    type="number"
                    placeholder="Target profit / exit"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    className={`mt-1 h-9 rounded-lg border-slate-200 bg-white font-mono text-xs font-semibold ${
                      targetPrice && avgPrice && parseFloat(targetPrice) < parseFloat(avgPrice) && jenis !== 'investasi'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">
                    Stop Loss{' '}
                    {jenis === 'investasi' && (
                      <span className="text-[10px] font-normal text-slate-400">(Nonaktif)</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    placeholder={jenis === 'investasi' ? 'No Hard SL (Investasi)' : 'Batas cut loss'}
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    disabled={jenis === 'investasi'}
                    className={`mt-1 h-9 rounded-lg border-slate-200 font-mono text-xs font-semibold ${
                      jenis === 'investasi'
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : 'bg-white text-rose-600'
                    }`}
                  />
                </div>
              </div>

              {/* Sektor */}
              <div>
                <Label className="text-xs font-bold text-slate-700">Sektor Industri</Label>
                <Input
                  placeholder="Contoh: Financial Services, Basic Materials"
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="mt-1 h-9 rounded-lg border-slate-200 bg-white text-xs text-slate-800"
                />
              </div>

              {/* Alasan Beli */}
              <div>
                <Label className="text-xs font-bold text-slate-700">Alasan Beli / Catatan Rencana</Label>
                <Input
                  placeholder={
                    existingHolding
                      ? 'Contoh: Averaging down di support, cicil bertahap'
                      : 'Contoh: Buy on breakout MA20'
                  }
                  value={buyReason}
                  onChange={e => setBuyReason(e.target.value)}
                  className="mt-1 h-9 rounded-lg border-slate-200 bg-white text-xs text-slate-800"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 rounded-lg text-xs font-semibold shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : existingHolding
                    ? `Tambah ${lotNum || 0} Lot ke ${existingHolding.ticker}`
                    : 'Tambah Saham ke Portofolio'}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
