'use client';

import { useState } from 'react';

import { Sparkles } from 'lucide-react';

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
import { UpdateHoldingPayload } from '@/hooks/usePortfolio';
import { api } from '@/lib/api';
import { Holding } from '@/types';

interface EditHoldingModalProps {
  isOpen: boolean;
  holding: Holding | null;
  onClose: () => void;
  onUpdateHolding: (id: number, payload: UpdateHoldingPayload) => Promise<void>;
}

export function EditHoldingModal({ isOpen, holding, onClose, onUpdateHolding }: EditHoldingModalProps) {
  const [avgPrice, setAvgPrice] = useState(holding?.avgPrice?.toString() || '');
  const [lot, setLot] = useState(holding?.lot?.toString() || '');
  const [targetPrice, setTargetPrice] = useState(holding?.targetPrice ? holding.targetPrice.toString() : '');
  const [stopLoss, setStopLoss] = useState(holding?.stopLoss ? holding.stopLoss.toString() : '');
  const [sector, setSector] = useState(holding?.sector || '');
  const [buyReason, setBuyReason] = useState(holding?.buyReason || '');
  const [jenis, setJenis] = useState<'trading' | 'investasi'>(holding?.jenis || 'trading');

  const [isFetchingAi, setIsFetchingAi] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiRec, setAiRec] = useState<{
    tp?: number;
    sl?: number | null;
    isExitRebound?: boolean;
    profitTargetAlt?: number | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevHoldingId, setPrevHoldingId] = useState<number | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen || (holding && holding.id !== prevHoldingId)) {
    setPrevIsOpen(isOpen);
    setPrevHoldingId(holding?.id ?? null);
    if (isOpen && holding) {
      setAvgPrice(holding.avgPrice.toString());
      setLot(holding.lot.toString());
      setTargetPrice(holding.targetPrice ? holding.targetPrice.toString() : '');
      setStopLoss(holding.stopLoss ? holding.stopLoss.toString() : '');
      setSector(holding.sector || '');
      setBuyReason(holding.buyReason || '');
      setJenis(holding.jenis || 'trading');
      setIsFetchingAi(false);
      setAiNote(null);
      setAiRec(null);
      setIsSubmitting(false);
    }
  }

  const handleFetchAiRecommendation = async () => {
    if (!holding) return;
    setIsFetchingAi(true);
    setAiNote(null);
    setAiRec(null);
    try {
      const priceNum = avgPrice ? parseFloat(avgPrice) : holding.avgPrice;
      const res = await api.getAiTpSl(holding.ticker, jenis, priceNum);
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
            `⚠️ Mode Exit Rebound: Resisten 20-hari terdekat (Rp ${res.tp?.toLocaleString()}) berada di bawah modal beli (Rp ${priceNum.toLocaleString()}). Digunakan untuk meminimalkan kerugian saat harga memantul.`,
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
    if (!holding || !avgPrice || !lot) return;

    setIsSubmitting(true);
    try {
      await onUpdateHolding(holding.id, {
        avgPrice: parseFloat(avgPrice),
        lot: parseInt(lot, 10),
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        stopLoss: jenis === 'investasi' ? undefined : stopLoss ? parseFloat(stopLoss) : undefined,
        sector: sector || undefined,
        buyReason,
        jenis,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen && !!holding} onOpenChange={open => !open && onClose()}>
      {holding && (
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-slate-900">Edit Trading Plan</DialogTitle>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 font-mono text-xs font-bold text-emerald-800"
                >
                  {holding.ticker}
                </Badge>
              </div>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui modal beli, target profit, batas stop loss, atau tujuan kepemilikan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ScrollArea className="max-h-[65vh] px-6 py-4">
              <div className="space-y-4">
                {/* Ticker & Jenis */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Kode Saham</Label>
                    <Input
                      value={holding.ticker}
                      disabled
                      className="mt-1 cursor-not-allowed bg-slate-100 font-mono font-bold text-slate-600"
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

                {/* Avg Price & Lot */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Avg Price (Modal Beli)</Label>
                    <Input
                      type="number"
                      placeholder="Contoh: 4500"
                      value={avgPrice}
                      onChange={e => setAvgPrice(e.target.value)}
                      required
                      className="mt-1 h-9 rounded-lg border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Jumlah Lot</Label>
                    <Input
                      type="number"
                      placeholder="Contoh: 10"
                      value={lot}
                      onChange={e => setLot(e.target.value)}
                      required
                      className="mt-1 h-9 rounded-lg border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                {/* AI Calculation Helper */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Bantuan AI TP/SL</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFetchAiRecommendation}
                      disabled={isFetchingAi}
                      className="h-7 gap-1.5 rounded-lg border-emerald-200 bg-white px-2.5 text-[11px] font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-50"
                    >
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      <span>{isFetchingAi ? 'Menghitung...' : 'Hitung Ulang AI'}</span>
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
                        targetPrice &&
                        avgPrice &&
                        parseFloat(targetPrice) < parseFloat(avgPrice) &&
                        jenis !== 'investasi'
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
                    placeholder="Contoh: Buy on breakout MA20, akumulasi dividen"
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
