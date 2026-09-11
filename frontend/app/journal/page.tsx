'use client';

import React, { useEffect, useState } from 'react';

import { AlertCircle, Brain, CheckCircle2, Flame, Inbox, Plus, X } from 'lucide-react';

import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { TradeLogItem } from '@/types';

const INITIAL_POST_MORTEM = {
  winRatePct: 0.0,
  totalRealizedPnl: 0,
  profitFactor: 0.0,
  totalTrades: 0,
  dominantPattern: 'Belum ada transaksi tercatat',
  aiFeedback:
    "Belum ada riwayat transaksi yang ditutup. Catat hasil penjualan atau cut loss Anda pada tombol 'Catat Transaksi' untuk mulai menganalisis performa dan mendeteksi bias emosi trading.",
  recommendations: [
    'Catat setiap hasil transaksi secara jujur dan disiplin.',
    'Selalu tentukan Target Profit dan Stop Loss sebelum mengeksekusi order beli.',
  ],
};

export default function JournalPage() {
  const [tradeLogs, setTradeLogs] = useState<TradeLogItem[]>([]);
  const [postMortem, setPostMortem] = useState(INITIAL_POST_MORTEM);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Trade Form
  const [ticker, setTicker] = useState('');
  const [action, setAction] = useState<'BUY' | 'SELL' | 'CUT_LOSS'>('SELL');
  const [price, setPrice] = useState('');
  const [lot, setLot] = useState('');
  const [realizedPnl, setRealizedPnl] = useState('');
  const [notes, setNotes] = useState('');
  const [flag, setFlag] = useState<'DISCIPLINED' | 'FOMO_BUY' | 'PANIC_SELL'>('DISCIPLINED');

  const loadJournal = async () => {
    try {
      const [tradesData, pmData] = await Promise.all([api.getTrades(), api.getPostMortem()]);
      setTradeLogs(tradesData || []);
      if (pmData) setPostMortem(pmData);
    } catch (e) {
      console.warn('Journal API fallback:', e);
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
        psychology_flag: flag,
      });
      await loadJournal();
    } catch (err) {
      const newItem: TradeLogItem = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
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
    setTicker('');
    setPrice('');
    setLot('');
    setRealizedPnl('');
    setNotes('');
  };

  const getFlagBadge = (flag?: string) => {
    switch (flag) {
      case 'DISCIPLINED':
        return (
          <span className="flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Disiplin Plan
          </span>
        );
      case 'FOMO_BUY':
        return (
          <span className="flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
            <Flame className="h-3 w-3" /> FOMO Buy
          </span>
        );
      case 'PANIC_SELL':
        return (
          <span className="flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            <AlertCircle className="h-3 w-3" /> Panic Sell
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="AI Trading Journal & Post-Mortem"
        subtitle="Evaluasi transaksi selesai (Realized PnL) untuk mendeteksi kebiasaan psikologis & emosi"
        onRefresh={loadJournal}
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-xs text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Total Realized PnL
            </span>
            <div className="mt-2 font-mono text-xl font-bold text-emerald-700">
              {formatRupiah(postMortem.totalRealizedPnl)}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Akumulasi laba/rugi terealisasi</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-xs text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Win Rate</span>
            <div className="mt-2 font-mono text-xl font-bold text-slate-900">{postMortem.winRatePct}%</div>
            <p className="mt-1 text-[11px] text-slate-500">Dihitung dari {tradeLogs.length} transaksi</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-xs text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Profit Factor
            </span>
            <div className="mt-2 font-mono text-xl font-bold text-slate-900">{postMortem.profitFactor}x</div>
            <p className="mt-1 text-[11px] text-slate-500">Rasio gross profit vs gross loss</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-xs text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Evaluasi Dominan
            </span>
            <div className="mt-2 truncate text-xs font-bold text-amber-700">{postMortem.dominantPattern}</div>
            <p className="mt-1 text-[11px] text-slate-500">Terdeteksi oleh AI post-mortem</p>
          </div>
        </div>

        {/* AI Post-Mortem Analysis Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                Post-Mortem AI Diagnosis
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Evaluasi Psikologis
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                AI mengidentifikasi bias emosi trading Anda berdasarkan data historis eksekusi
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
            {postMortem.aiFeedback}
          </div>

          {/* Prescriptive recommendations */}
          <div className="mt-4 space-y-2">
            <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Saran Perbaikan Kebiasaan Trading:
            </span>
            {postMortem.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Log Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Transaksi Realized</h3>
              <p className="text-xs text-slate-500">Daftar posisi yang telah ditutup beserta catatan psikologis</p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Catat Transaksi</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  <th className="px-3 py-3">Tanggal</th>
                  <th className="px-3 py-3">Ticker</th>
                  <th className="px-3 py-3">Aksi</th>
                  <th className="px-3 py-3">Harga</th>
                  <th className="px-3 py-3">Lot</th>
                  <th className="px-3 py-3">Total Nilai</th>
                  <th className="px-3 py-3">Realized PnL</th>
                  <th className="px-3 py-3">Evaluasi Emosi</th>
                  <th className="px-3 py-3">Catatan Trader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {tradeLogs.length > 0 ? (
                  tradeLogs.map(log => {
                    const isProfit = (log.realizedPnl || 0) >= 0;
                    return (
                      <tr key={log.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-3 py-3.5 font-mono text-[11px] text-slate-500">{log.date}</td>
                        <td className="px-3 py-3.5 font-mono font-bold text-slate-900">{log.ticker}</td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                              log.action === 'SELL'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : log.action === 'BUY'
                                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                                  : 'border-rose-200 bg-rose-50 text-rose-700'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-slate-800">Rp {formatNumber(log.price)}</td>
                        <td className="px-3 py-3.5 font-mono text-slate-700">{log.lot} Lot</td>
                        <td className="px-3 py-3.5 font-mono text-slate-800">{formatRupiah(log.totalValue)}</td>
                        <td className="px-3 py-3.5 font-mono font-bold">
                          {log.realizedPnl !== undefined && log.realizedPnl !== null && log.action !== 'BUY' ? (
                            <div className={isProfit ? 'text-emerald-700' : 'text-rose-600'}>
                              {isProfit ? '+' : ''}
                              {formatRupiah(log.realizedPnl)} ({isProfit ? '+' : ''}
                              {formatPercent(log.realizedPnlPct || 0)})
                            </div>
                          ) : (
                            <span className="text-xs font-normal text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5">{getFlagBadge(log.psychologyFlag)}</td>
                        <td className="max-w-xs px-3 py-3.5 text-[11px] leading-relaxed text-slate-600">
                          {log.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-700">Belum Ada Riwayat Transaksi</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="mb-1 text-base font-bold text-slate-900">Catat Transaksi Realized</h3>
            <p className="mb-4 text-xs text-slate-500">Input hasil transaksi untuk dievaluasi AI</p>

            <form onSubmit={handleAddTrade} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-700">Ticker Saham</label>
                <input
                  type="text"
                  placeholder="Contoh: BBRI.JK"
                  value={ticker}
                  onChange={e => setTicker(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 uppercase focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Aksi</label>
                  <select
                    value={action}
                    onChange={e => setAction(e.target.value as 'SELL' | 'CUT_LOSS')}
                    className="w-full rounded-lg border bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="SELL">SELL (Take Profit)</option>
                    <option value="CUT_LOSS">CUT LOSS</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Evaluasi Psikologi</label>
                  <select
                    value={flag}
                    onChange={e => setFlag(e.target.value as 'DISCIPLINED' | 'FOMO_BUY' | 'PANIC_SELL')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none"
                  >
                    <option value="DISCIPLINED">Disiplin Trading Plan</option>
                    <option value="FOMO_BUY">FOMO (Ikut-ikutan)</option>
                    <option value="PANIC_SELL">Panic Sell (Emosi)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Harga Transaksi (Rp)</label>
                  <input
                    type="number"
                    placeholder="5100"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Jumlah Lot</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={lot}
                    onChange={e => setLot(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700">Realized PnL Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 1500000 (jika profit) atau -500000 (jika rugi)"
                  value={realizedPnl}
                  onChange={e => setRealizedPnl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700">Catatan Evaluasi / Pembelajaran</label>
                <textarea
                  rows={2}
                  placeholder="Apa yang dipelajari dari transaksi ini..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
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
