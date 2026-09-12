'use client';

import { AlertTriangle, Calculator, Coins, DollarSign, Layers, Target, TrendingDown, TrendingUp } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber, formatRupiah } from '@/lib/utils';
import { LotAveragingMode, LotAveragingResult, RecoveryDiagnosis } from '@/types';

interface AverageDownCalculatorCardProps {
  data: RecoveryDiagnosis;
  calcMode: LotAveragingMode;
  setCalcMode: (mode: LotAveragingMode) => void;
  calcBuyPrice: number;
  setCalcBuyPrice: (price: number) => void;
  calcAddLot: number;
  setCalcAddLot: (lot: number) => void;
  calcTargetAvg: number;
  setCalcTargetAvg: (price: number) => void;
  calcBudget: number;
  setCalcBudget: (budget: number) => void;
  calcResult: LotAveragingResult;
}

export function AverageDownCalculatorCard({
  data,
  calcMode,
  setCalcMode,
  calcBuyPrice,
  setCalcBuyPrice,
  calcAddLot,
  setCalcAddLot,
  calcTargetAvg,
  setCalcTargetAvg,
  calcBudget,
  setCalcBudget,
  calcResult,
}: AverageDownCalculatorCardProps) {
  const currentAvg = Math.round(data.avgPrice);
  const supportMajor = Math.round(data.supportMajor || data.currentPrice * 0.95);
  const currentPrice = Math.round(data.currentPrice);
  const cashBalance = data.cashBalance ?? 0;

  // Active theme configurations per calculation mode
  const modeConfig = {
    by_lot: {
      iconBg: 'bg-purple-100 text-purple-700',
      badge: 'border-purple-200 bg-purple-50 text-purple-700',
      tabActive:
        'data-[active]:bg-purple-600 data-[active]:text-white data-[active]:shadow-xs data-[selected]:bg-purple-600 data-[selected]:text-white data-[selected]:shadow-xs',
      activeTabDirect:
        calcMode === 'by_lot' ? 'bg-purple-600 text-white shadow-xs hover:bg-purple-700 hover:text-white' : '',
      accentBorder: 'focus-visible:ring-purple-600',
      metricText: 'text-purple-700',
      modeTitle: 'Mode 1: Jumlah Lot Tambahan',
    },
    by_target_avg: {
      iconBg: 'bg-blue-100 text-blue-700',
      badge: 'border-blue-200 bg-blue-50 text-blue-700',
      tabActive:
        'data-[active]:bg-blue-600 data-[active]:text-white data-[active]:shadow-xs data-[selected]:bg-blue-600 data-[selected]:text-white data-[selected]:shadow-xs',
      activeTabDirect:
        calcMode === 'by_target_avg' ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700 hover:text-white' : '',
      accentBorder: 'focus-visible:ring-blue-600',
      metricText: 'text-blue-700',
      modeTitle: 'Mode 2: Target Avg Price',
    },
    by_budget: {
      iconBg: 'bg-emerald-100 text-emerald-700',
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      tabActive:
        'data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-xs data-[selected]:bg-emerald-600 data-[selected]:text-white data-[selected]:shadow-xs',
      activeTabDirect:
        calcMode === 'by_budget' ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 hover:text-white' : '',
      accentBorder: 'focus-visible:ring-emerald-600',
      metricText: 'text-emerald-700',
      modeTitle: 'Mode 3: Alokasi Anggaran Modal',
    },
  }[calcMode];

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs">
      {/* Card Header & Distinctive Colored Mode Navigation Tabs */}
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${modeConfig.iconBg}`}>
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900 normal-case">
                  Kalkulator Penambahan Lot &amp; Averaging
                </CardTitle>
                <Badge variant="secondary" className={`text-[10px] font-bold ${modeConfig.badge}`}>
                  {modeConfig.modeTitle}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Pilih mode input di samping untuk menghitung simulasi penambahan modal secara presisi
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-6">
        <Tabs
          value={calcMode}
          onValueChange={val => {
            if (val) {
              setCalcMode(val as LotAveragingMode);
            }
          }}
        >
          <TabsList className="h-10 rounded-xl border border-slate-200 bg-slate-100 p-1">
            {/* Mode 1 Trigger - Purple Active Theme */}
            <TabsTrigger
              value="by_lot"
              className={`h-8 gap-1.5 px-3 text-xs font-bold transition-all ${
                calcMode === 'by_lot'
                  ? 'bg-purple-600 text-white shadow-xs hover:bg-purple-600 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Mode 1: Jumlah Lot</span>
            </TabsTrigger>

            {/* Mode 2 Trigger - Blue Active Theme */}
            <TabsTrigger
              value="by_target_avg"
              className={`h-8 gap-1.5 px-3 text-xs font-bold transition-all ${
                calcMode === 'by_target_avg'
                  ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-600 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Mode 2: Target Avg</span>
            </TabsTrigger>

            {/* Mode 3 Trigger - Emerald Active Theme */}
            <TabsTrigger
              value="by_budget"
              className={`h-8 gap-1.5 px-3 text-xs font-bold transition-all ${
                calcMode === 'by_budget'
                  ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-600 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Mode 3: Anggaran</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Form Inputs */}
          <div className="space-y-4 lg:col-span-5">
            {/* Common Input: Buy Price */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="calc-buy-price" className="text-xs font-bold text-slate-700">
                  Harga Rencana Beli (Rp)
                </Label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCalcBuyPrice(supportMajor)}
                    className={`h-6 rounded-md px-2 text-[10px] font-semibold ${
                      calcBuyPrice === supportMajor
                        ? 'border-purple-300 bg-purple-100 font-bold text-purple-800'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    Support (Rp {formatNumber(supportMajor)})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCalcBuyPrice(currentPrice)}
                    className={`h-6 rounded-md px-2 text-[10px] font-semibold ${
                      calcBuyPrice === currentPrice
                        ? 'border-slate-300 bg-slate-200 font-bold text-slate-900'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Close (Rp {formatNumber(currentPrice)})
                  </Button>
                </div>
              </div>
              <Input
                id="calc-buy-price"
                type="number"
                min={1}
                value={calcBuyPrice || ''}
                onChange={e => setCalcBuyPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`font-mono text-sm ${modeConfig.accentBorder}`}
                placeholder="Contoh: 418"
              />
              <span className="block text-[11px] text-slate-500">
                Estimasi modal per lot:{' '}
                <strong className="font-mono text-slate-700">{formatRupiah(calcBuyPrice * 100)}</strong>
              </span>
            </div>

            {/* Mode 1: Lot Count Input (Purple Active) */}
            {calcMode === 'by_lot' && (
              <div className="space-y-1.5 rounded-xl border border-purple-200/80 bg-purple-50/30 p-3.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="calc-add-lot" className="text-xs font-bold text-purple-950">
                    Jumlah Lot Tambahan yang Ingin Dibeli
                  </Label>
                  <Badge
                    variant="secondary"
                    className="border-purple-200 bg-purple-100 text-[10px] font-bold text-purple-800"
                  >
                    Posisi: {data.lot} Lot
                  </Badge>
                </div>
                <Input
                  id="calc-add-lot"
                  type="number"
                  min={1}
                  step={1}
                  value={calcAddLot || ''}
                  onChange={e => setCalcAddLot(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="bg-white font-mono text-sm focus-visible:ring-purple-600"
                  placeholder="Contoh: 5"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 5, 10, 20].map(lot => (
                    <Button
                      key={lot}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCalcAddLot(lot)}
                      className={`h-7 rounded-lg px-2.5 text-xs font-semibold ${
                        calcAddLot === lot
                          ? 'border-purple-400 bg-purple-600 font-bold text-white shadow-2xs hover:bg-purple-700 hover:text-white'
                          : 'border-purple-200 bg-white text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      +{lot} Lot
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 2: Target Average Price Input (Blue Active) */}
            {calcMode === 'by_target_avg' && (
              <div className="space-y-1.5 rounded-xl border border-blue-200/80 bg-blue-50/30 p-3.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="calc-target-avg" className="text-xs font-bold text-blue-950">
                    Target Avg Price Baru yang Diinginkan (Rp)
                  </Label>
                  <Badge
                    variant="secondary"
                    className="border-blue-200 bg-blue-100 text-[10px] font-bold text-blue-800"
                  >
                    Avg Saat Ini: Rp {formatNumber(currentAvg)}
                  </Badge>
                </div>
                <Input
                  id="calc-target-avg"
                  type="number"
                  min={1}
                  value={calcTargetAvg || ''}
                  onChange={e => setCalcTargetAvg(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-white font-mono text-sm focus-visible:ring-blue-600"
                  placeholder={`Contoh: ${Math.round((currentAvg + calcBuyPrice) / 2)}`}
                />
                <span className="block text-[11px] text-blue-700">
                  Sistem otomatis menghitung lot bulat minimum (dibulatkan ke atas) agar target tercapai.
                </span>
              </div>
            )}

            {/* Mode 3: Capital Budget Input (Emerald Active) */}
            {calcMode === 'by_budget' && (
              <div className="space-y-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-3.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="calc-budget" className="text-xs font-bold text-emerald-950">
                    Alokasi Anggaran Modal yang Disiapkan (Rp)
                  </Label>
                  {cashBalance > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCalcBudget(cashBalance)}
                      className={`h-6 rounded-md px-2 text-[10px] font-semibold ${
                        calcBudget === cashBalance
                          ? 'border-emerald-400 bg-emerald-600 font-bold text-white hover:bg-emerald-700 hover:text-white'
                          : 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      Pakai Kas RDN ({formatRupiah(cashBalance)})
                    </Button>
                  )}
                </div>
                <Input
                  id="calc-budget"
                  type="number"
                  min={100}
                  step={10000}
                  value={calcBudget || ''}
                  onChange={e => setCalcBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-white font-mono text-sm focus-visible:ring-emerald-600"
                  placeholder="Contoh: 500000"
                />
                <span className="block text-[11px] text-emerald-700">
                  Nominal anggaran aktif: <strong className="font-mono">{formatRupiah(calcBudget)}</strong>
                </span>
              </div>
            )}

            {/* Mode 3 Fraction Alert & Quick Input Update using shadcn Alert and Button */}
            {calcMode === 'by_budget' && calcResult.hasBudgetFraction && calcResult.exactBudgetForLot && (
              <Alert className="border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900">
                <AlertTitle className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <Coins className="h-3.5 w-3.5 text-amber-600" />
                  <span>Anggaran Menghasilkan Sisa Kas (Pecahan Lot)</span>
                </AlertTitle>
                <AlertDescription className="mt-1 space-y-2.5 text-xs leading-relaxed opacity-100">
                  <p>
                    Dengan modal <strong>{formatRupiah(calcBudget)}</strong> @ Rp {formatNumber(calcBuyPrice)}, Anda
                    dapat membeli <strong>{calcResult.addLot} Lot</strong> seharga{' '}
                    <strong>{formatRupiah(calcResult.exactBudgetForLot)}</strong> dengan sisa kas{' '}
                    <strong className="text-amber-700">{formatRupiah(calcResult.budgetRemaining || 0)}</strong>.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCalcBudget(calcResult.exactBudgetForLot!)}
                      className="h-7 border-amber-300 bg-white px-2.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    >
                      <span>⚡ Sesuaikan Input ke {formatRupiah(calcResult.exactBudgetForLot)}</span>
                    </Button>

                    {calcResult.nextLotBudget && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setCalcBudget(calcResult.nextLotBudget!)}
                        className="h-7 border-emerald-300 bg-white px-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        <span>
                          ➕ Tambah ke {calcResult.addLot + 1} Lot ({formatRupiah(calcResult.nextLotBudget)})
                        </span>
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* SOP Note */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-[11px] text-slate-600">
              <span className="font-bold text-slate-700">💡 Disiplin Entry: </span>
              Lakukan eksekusi penambahan lot hanya saat harga berada di area Support dan terkonfirmasi pemantulan
              teknikal (rebound).
            </div>
          </div>

          {/* Right Column: Simulation Output Cards */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 lg:col-span-7">
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Hasil Simulasi Penambahan Lot
                </span>
                <Badge
                  variant="secondary"
                  className="border-slate-200 bg-white font-mono text-xs text-slate-700 shadow-2xs"
                >
                  {data.ticker}
                </Badge>
              </div>

              {calcResult.error ? (
                <Alert variant="destructive" className="p-4 text-xs">
                  <AlertDescription className="text-xs font-medium opacity-100">{calcResult.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {/* 3 Metrics Cards */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Card 1: Lot Tambahan */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">
                        Lot Tambahan
                      </span>
                      <span className={`font-mono text-2xl font-bold ${modeConfig.metricText}`}>
                        +{formatNumber(calcResult.addLot)} Lot
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        Total akhir: <strong className="text-slate-700">{calcResult.totalLot} Lot</strong>
                      </span>
                    </div>

                    {/* Card 2: Modal Tambahan / Terpakai */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">
                        {calcMode === 'by_budget' ? 'Modal Terpakai' : 'Modal Tambahan'}
                      </span>
                      <span className="font-mono text-xl font-bold text-slate-900">
                        {formatRupiah(calcResult.capitalRequired)}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        @ Rp {formatNumber(calcResult.buyPrice)} / saham
                      </span>
                    </div>

                    {/* Card 3: Avg Baru */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase">
                        Avg Price Baru
                      </span>
                      <span className="font-mono text-2xl font-bold text-emerald-700">
                        Rp {formatNumber(calcResult.newAvg)}
                      </span>
                      <div className="mt-1 flex items-center gap-1 text-[11px]">
                        {calcResult.avgDiff > 0 ? (
                          <span className="flex items-center gap-0.5 font-bold text-emerald-600">
                            <TrendingDown className="h-3 w-3" />
                            <span>Turun {calcResult.avgDiff} poin</span>
                          </span>
                        ) : calcResult.avgDiff < 0 ? (
                          <span className="flex items-center gap-0.5 font-bold text-rose-600">
                            <TrendingUp className="h-3 w-3" />
                            <span>Naik {Math.abs(calcResult.avgDiff)} poin</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">Tidak berubah</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detail Summary Bar */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700 shadow-2xs">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">Modal Lama</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatRupiah(data.avgPrice * data.lot * 100)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">Total Modal Baru</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatRupiah(calcResult.newAvg * calcResult.totalLot * 100)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">BEP Baru</span>
                        <span className="font-mono font-bold text-purple-700">
                          Rp {formatNumber(calcResult.newAvg)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">Sisa Kas RDN</span>
                        <span
                          className={`font-mono font-bold ${
                            cashBalance >= calcResult.capitalRequired ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {formatRupiah(Math.max(0, cashBalance - calcResult.capitalRequired))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Alert if modal exceeds cash */}
            {cashBalance > 0 && calcResult.capitalRequired > cashBalance && (
              <div className="mt-4 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Modal dibutuhkan ({formatRupiah(calcResult.capitalRequired)}) melebihi saldo kas RDN (
                  {formatRupiah(cashBalance)}). Kurang {formatRupiah(calcResult.capitalRequired - cashBalance)}.
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
