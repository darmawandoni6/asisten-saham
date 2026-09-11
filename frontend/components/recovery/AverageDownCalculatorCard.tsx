'use client';

import { AlertTriangle, Calculator } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AverageDownResult } from '@/hooks/useRecovery';
import { formatNumber, formatRupiah } from '@/lib/utils';
import { RecoveryDiagnosis } from '@/types';

interface AverageDownCalculatorCardProps {
  data: RecoveryDiagnosis;
  targetBuyPrice: number;
  targetAvgPrice: number;
  setTargetBuyPrice: (price: number) => void;
  setTargetAvgPrice: (price: number) => void;
  calcResult: AverageDownResult;
}

export function AverageDownCalculatorCard({
  data,
  targetBuyPrice,
  targetAvgPrice,
  setTargetBuyPrice,
  setTargetAvgPrice,
  calcResult,
}: AverageDownCalculatorCardProps) {
  const handleApply = () => {
    alert(`Simulasi average down ${calcResult.addLot} lot pada ${data.ticker} siap diaplikasikan ke trading plan!`);
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-2xs">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Kalkulator Average Down Presisi</h3>
          <p className="text-sm text-slate-500">
            Hitung jumlah lot dan modal tambahan yang dibutuhkan untuk mencapai target Avg Price aman
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Inputs */}
        <div className="space-y-4 text-sm md:col-span-1">
          <div className="space-y-1.5">
            <Label htmlFor="target-buy-price" className="font-medium text-slate-700">
              Harga Rencana Cicil Bawah (Rp)
            </Label>
            <Input
              id="target-buy-price"
              type="number"
              value={targetBuyPrice || ''}
              onChange={e => setTargetBuyPrice(parseFloat(e.target.value) || 0)}
              className="font-mono text-sm focus-visible:ring-purple-600"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Disarankan di Major Support: Rp {formatNumber(Math.round(data.supportMajor))}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target-avg-price" className="font-medium text-slate-700">
              Target Avg Price Baru Yang Diinginkan (Rp)
            </Label>
            <Input
              id="target-avg-price"
              type="number"
              value={targetAvgPrice || ''}
              onChange={e => setTargetAvgPrice(parseFloat(e.target.value) || 0)}
              className="font-mono text-sm focus-visible:ring-purple-600"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Avg saat ini: Rp {formatNumber(Math.round(data.avgPrice))}
            </span>
          </div>

          {/* SOP Panduan Eksekusi Alert */}
          <Alert variant="default" className="border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <AlertTitle className="text-xs font-bold text-slate-800">📌 Kapan Tombol Ditekan?</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed opacity-100">
              Tekan tombol &quot;Terapkan ke Trading Plan&quot; <strong>hanya jika</strong> harga sudah menyentuh level
              support dan terkonfirmasi rebound (candle hijau/hammer), serta kas tersedia telah mencukupi.
            </AlertDescription>
          </Alert>
        </div>

        {/* Calculation Outputs */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
          <div>
            <span className="mb-3 block text-xs font-bold tracking-wider text-slate-500 uppercase">
              Hasil Simulasi Kalkulasi
            </span>

            {calcResult.error ? (
              <Alert variant="destructive" className="p-3.5 text-xs">
                <AlertDescription className="text-xs font-medium opacity-100">{calcResult.error}</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Lot Tambahan</span>
                  <span className="font-mono text-2xl font-bold text-purple-700">
                    +{formatNumber(calcResult.addLot)} Lot
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Total lot jadi: {data.lot + calcResult.addLot} Lot
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Modal Tambahan</span>
                  <span className="font-mono text-xl font-bold text-slate-900">{formatRupiah(calcResult.capital)}</span>
                  <span className="mt-1 block text-xs text-slate-500">Di harga Rp {formatNumber(targetBuyPrice)}</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Avg Price Baru</span>
                  <span className="font-mono text-2xl font-bold text-emerald-700">
                    Rp {formatNumber(calcResult.newAvg)}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-emerald-600">
                    Turun {data.avgPrice - calcResult.newAvg} Poin!
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-200 pt-3.5 text-sm sm:flex-row sm:items-center">
            <div>
              <span className="text-slate-600">
                Break-even Price (BEP):{' '}
                <strong className="font-mono text-slate-900">Rp {formatNumber(calcResult.newAvg)}</strong>
              </span>
              {data.cashBalance !== undefined && calcResult.capital > data.cashBalance && (
                <Alert variant="warning" className="mt-2 border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                  <AlertDescription className="flex items-center gap-1.5 text-xs font-semibold opacity-100">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      Modal butuh {formatRupiah(calcResult.capital)}, kas tersedia {formatRupiah(data.cashBalance)}{' '}
                      (Kurang {formatRupiah(calcResult.capital - data.cashBalance)})
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <Button
              type="button"
              variant="emerald"
              onClick={handleApply}
              className="shrink-0 rounded-xl px-4 py-2.5 font-semibold shadow-2xs"
            >
              Terapkan ke Trading Plan
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
