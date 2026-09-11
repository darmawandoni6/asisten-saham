'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Calculator,
  Inbox,
  Layers,
  LineChart,
  PieChart,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';

import { CandlestickChart } from '@/components/CandlestickChart';
import { EditBalanceModal } from '@/components/EditBalanceModal';
import { SellHoldingModal } from '@/components/SellHoldingModal';
import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { Holding } from '@/types';

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

  const loadPortfolio = useCallback(async () => {
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
      console.warn('Portfolio API offline:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    api
      .getDashboard()
      .then(async data => {
        if (!isMounted) return;
        if (data && data.holdings) {
          setHoldings(data.holdings);
        }
        if (data && data.summary && data.summary.cashBalance !== undefined) {
          setCashBalance(data.summary.cashBalance);
        } else {
          const balRes = await api.getCashBalance().catch(() => null);
          if (isMounted && balRes && balRes.cash_balance !== undefined) {
            setCashBalance(balRes.cash_balance);
          }
        }
      })
      .catch(e => {
        console.warn('Portfolio API offline:', e);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !avgPrice || !lot) return;

    const priceNum = parseFloat(avgPrice);
    const lotNum = parseInt(lot);
    // TP/SL default berbeda untuk investasi vs trading
    const tpNum = targetPrice ? parseFloat(targetPrice) : jenis === 'investasi' ? priceNum * 1.3 : priceNum * 1.15;
    const slNum = jenis === 'investasi' ? undefined : stopLoss ? parseFloat(stopLoss) : priceNum * 0.93;

    try {
      await api.createHolding({
        ticker,
        avg_price: priceNum,
        lot: lotNum,
        target_price: tpNum,
        stop_loss: slNum,
        sector: sector || undefined,
        buy_reason: buyReason,
        jenis,
      });
      await loadPortfolio();
    } catch (err) {
      const newHolding: Holding = {
        id: Date.now(),
        ticker: ticker.toUpperCase().includes('.JK') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.JK`,
        name: `${ticker.toUpperCase()} Tbk`,
        sector: sector || '—',
        jenis: jenis,
        avgPrice: priceNum,
        lot: lotNum,
        shares: lotNum * 100,
        currentPrice: priceNum,
        previousClose: priceNum,
        targetPrice: tpNum,
        stopLoss: slNum ?? null,
        highWatermark: priceNum,
        trailingStopPrice: jenis === 'investasi' ? null : Math.round(priceNum * 0.93),
        floatingPnl: 0,
        floatingPnlPct: 0,
        actionStatus: 'HOLD_MONITOR',
        actionReason: 'Posisi baru ditambahkan ke trading plan.',
        buyReason: buyReason || 'Trading plan entry baru',
        buyDate: new Date().toISOString().split('T')[0],
        rsi: 50.0,
        aboveMa20: true,
        aboveMa50: true,
      };
      setHoldings([newHolding, ...holdings]);
    }

    setIsModalOpen(false);
    setTicker('');
    setAvgPrice('');
    setLot('');
    setTargetPrice('');
    setStopLoss('');
    setBuyReason('');
    setJenis('trading');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus saham ini dari pencatatan portofolio?')) {
      try {
        await api.deleteHolding(id);
        await loadPortfolio();
      } catch (err) {
        setHoldings(holdings.filter(h => h.id !== id));
      }
    }
  };

  // Calculate sector distribution
  const totalCost = holdings.reduce((acc, h) => acc + h.avgPrice * h.shares, 0);
  const sectorMap: Record<string, number> = {};
  holdings.forEach(h => {
    const cost = h.avgPrice * h.shares;
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + cost;
  });

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Portofolio & Trading Plan Management"
        subtitle="Kelola kepemilikan, target profit, stop loss dinamis, dan alokasi risiko"
        onRefresh={loadPortfolio}
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
        {/* Header Actions */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Trading Plan Aktif</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Setiap posisi diproteksi dengan batas risiko terukur dan trailing stop otomatis
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="block text-[10px] leading-tight font-semibold text-slate-400">Saldo Kas RDN</span>
                <span className="font-mono text-xs leading-tight font-bold text-slate-800">
                  {formatRupiah(cashBalance)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBalanceModalOpen(true)}
                className="ml-1 cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                ✏️ Edit
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Saham Baru</span>
            </button>
          </div>
        </div>

        {/* Portfolio Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  <th className="px-3 py-3">Ticker</th>
                  <th className="px-3 py-3">Jenis</th>
                  <th className="px-3 py-3">Sektor</th>
                  <th className="px-3 py-3">Avg Beli</th>
                  <th className="px-3 py-3">Jumlah Lot</th>
                  <th className="px-3 py-3">Modal Beli</th>
                  <th className="px-3 py-3">Close EOD</th>
                  <th className="px-3 py-3">Floating PnL</th>
                  <th className="px-3 py-3">Target (TP)</th>
                  <th className="px-3 py-3">Stop Loss</th>
                  <th className="px-3 py-3 text-center">Chart</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {holdings.length > 0 ? (
                  holdings.map(h => {
                    const cost = h.avgPrice * h.shares;
                    const isProfit = h.floatingPnl >= 0;

                    return (
                      <tr key={h.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-3 py-3.5 font-mono font-bold text-slate-900">{h.ticker}</td>
                        <td className="px-3 py-3.5">
                          {h.jenis === 'investasi' ? (
                            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                              📈 Investasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              ⚡ Trading
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-[11px] text-slate-500">{h.sector || '—'}</td>
                        <td className="px-3 py-3.5 font-mono text-slate-800">Rp {formatNumber(h.avgPrice)}</td>
                        <td className="px-3 py-3.5 font-mono text-slate-700">{formatNumber(h.lot)} Lot</td>
                        <td className="px-3 py-3.5 font-mono text-slate-800">{formatRupiah(cost)}</td>
                        <td className="px-3 py-3.5 font-mono font-bold text-slate-900">
                          Rp {formatNumber(h.currentPrice)}
                        </td>
                        <td className="px-3 py-3.5 font-mono font-bold">
                          <div className={isProfit ? 'text-emerald-700' : 'text-rose-600'}>
                            {formatPercent(h.floatingPnlPct)}
                          </div>
                          <div className={`text-[10px] ${isProfit ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {formatRupiah(h.floatingPnl)}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 font-mono font-bold text-emerald-700">
                          Rp {formatNumber(h.targetPrice)}
                        </td>
                        <td className="px-3 py-3.5 font-mono font-bold">
                          {h.stopLoss ? (
                            <span className="text-rose-600">Rp {formatNumber(h.stopLoss)}</span>
                          ) : (
                            <span className="text-[10px] font-medium text-indigo-500">
                              No Hard SL
                              <br />
                              <span className="text-slate-400">Avg Down</span>
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setChartStock(h)}
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-700 transition-colors hover:bg-slate-200"
                            title="Buka Chart"
                          >
                            <LineChart className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSellingHolding(h);
                                setIsSellModalOpen(true);
                              }}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                              title="Jual saham / Take Profit / Cut Loss"
                            >
                              <Tag className="h-3 w-3" />
                              <span>Jual</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(h.id)}
                              className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              title="Hapus manual dari pencatatan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-700">Belum Ada Saham di Portofolio</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Sektor Alokasi */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
              <PieChart className="h-4 w-4 text-emerald-600" />
              <span>Money Management: Alokasi Sektor</span>
            </div>
            {holdings.length > 0 ? (
              <div className="space-y-3">
                {Object.entries(sectorMap).map(([sec, val]) => {
                  const pct = totalCost > 0 ? (val / totalCost) * 100 : 0;
                  return (
                    <div key={sec}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-slate-700">{sec}</span>
                        <span className="font-mono font-bold text-emerald-700">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                Belum ada saham untuk dihitung alokasi sektornya.
              </p>
            )}
          </div>

          {/* Pyramiding & Scale-Out Matrix */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
              <Calculator className="h-4 w-4 text-emerald-600" />
              <span>Selling Engine: Scale-Out Matrix</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <span className="block font-bold text-emerald-700">TP1 (Target Profit 1)</span>
                  <span className="text-[11px] text-slate-500">Jual 50% Posisi</span>
                </div>
                <span className="rounded border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-800">
                  Kunci Profit 50%
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <span className="block font-bold text-slate-800">TP2 (Target Profit 2)</span>
                  <span className="text-[11px] text-slate-500">Jual 25% Posisi</span>
                </div>
                <span className="rounded bg-slate-200 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">
                  Amankan 25%
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <span className="block font-bold text-orange-700">Sisa 25% Posisi (Trailing Stop)</span>
                  <span className="text-[11px] text-slate-500">Batas Proteksi: 7% dari High Watermark</span>
                </div>
                <span className="rounded border border-orange-200 bg-orange-100 px-2.5 py-1 font-mono text-[11px] font-bold text-orange-800">
                  Ride The Trend
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add Holding Form */}
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

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Input Trading Plan Baru</h3>
                <p className="text-xs text-slate-500">Perekaman data kepemilikan saham IDX</p>
              </div>
            </div>

            <form onSubmit={handleAddHolding} className="space-y-4 text-xs">
              {/* Jenis Saham Toggle */}
              <div>
                <label className="mb-2 block font-medium text-slate-700">Jenis Saham</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setJenis('trading')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      jenis === 'trading'
                        ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-amber-400'
                    }`}
                  >
                    ⚡ Trading
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenis('investasi')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      jenis === 'investasi'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-indigo-400'
                    }`}
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

              <div>
                <label className="mb-1 block font-medium text-slate-700">Ticker Saham (IDX)</label>
                <input
                  type="text"
                  placeholder="Contoh: BBRI atau BBRI.JK"
                  value={ticker}
                  onChange={e => setTicker(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 uppercase focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Avg Price (Rp)</label>
                  <input
                    type="number"
                    placeholder="4850"
                    value={avgPrice}
                    onChange={e => setAvgPrice(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* AI Auto-Calculate Trigger */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-slate-700">Target Profit &amp; Stop Loss</span>
                <button
                  type="button"
                  onClick={handleFetchAiRecommendation}
                  disabled={!ticker || isFetchingAi}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                  title="Gunakan algoritma teknikal AI untuk menghitung TP & SL otomatis dari data 200 hari bursa"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isFetchingAi ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{isFetchingAi ? 'Menghitung...' : '⚡ Hitung Rekomendasi AI'}</span>
                </button>
              </div>

              {aiNote && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-[11px] leading-relaxed font-medium text-emerald-800">
                  {aiNote}
                </div>
              )}

              <div className={jenis === 'investasi' ? '' : 'grid grid-cols-2 gap-3'}>
                <div>
                  <label className="mb-1 block font-medium text-emerald-700">
                    Target Price (TP){jenis === 'investasi' ? ' — Kosongkan = Auto AI' : ' — Kosongkan = Auto AI'}
                  </label>
                  <input
                    type="number"
                    placeholder={
                      jenis === 'investasi' ? 'Auto-calculate AI (Target 200 Hari)' : 'Auto-calculate AI (Resistance)'
                    }
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                {jenis === 'trading' && (
                  <div>
                    <label className="mb-1 block font-medium text-rose-600">
                      Stop Loss (SL) <span className="font-normal text-slate-400">— Kosongkan = Auto AI</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Auto-calculate AI (Support -3%)"
                      value={stopLoss}
                      onChange={e => setStopLoss(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-700">
                  Sektor Saham{' '}
                  <span className="font-normal text-slate-400">(Opsional — Auto-detect jika dikosongkan)</span>
                </label>
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
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
                <label className="mb-1 block font-medium text-slate-700">Alasan Beli (Catatan Plan)</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Rebound MA50 dengan volume akumulasi..."
                  value={buyReason}
                  onChange={e => setBuyReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl">
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
        onSuccess={newBalance => {
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
