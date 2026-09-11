'use client';

import { Coins, Info, ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { RecoveryDiagnosis } from '@/types';

interface RecoveryDiagnosisCardProps {
  data: RecoveryDiagnosis;
}

export function RecoveryDiagnosisCard({ data }: RecoveryDiagnosisCardProps) {
  return (
    <Card className="rounded-2xl border-purple-200 bg-white p-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-mono text-lg font-bold text-slate-900">{data.ticker}</h3>
              <span className="font-sans text-sm text-slate-500">({data.name})</span>
              {data.jenis && (
                <Badge
                  variant={data.jenis === 'investasi' ? 'secondary' : 'default'}
                  className={
                    data.jenis === 'investasi'
                      ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                      : 'border-blue-200 bg-blue-100 text-blue-800'
                  }
                >
                  {data.jenis}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{data.trendStatus}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:text-right">
          <div>
            <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Bobot di Portofolio
            </span>
            <span className="font-mono text-base font-bold text-slate-800">
              {formatPercent(data.portfolioWeightPct)}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Dampak ke Total Portofolio
            </span>
            <span className="font-mono text-base font-bold text-rose-600">
              {formatPercent(data.portfolioImpactPct)}
            </span>
          </div>
        </div>
      </div>

      {/* Assessment Metrics Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Harga EOD</span>
          <span className="font-mono text-base font-bold text-slate-900">
            Rp {formatNumber(Math.round(data.currentPrice))}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Avg Price Beli</span>
          <span className="font-mono text-base font-bold text-slate-800">
            Rp {formatNumber(Math.round(data.avgPrice))}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Floating Loss</span>
          <div className="font-mono text-base font-bold text-rose-600">{formatPercent(data.floatingLossPct)}</div>
          <span className="font-mono text-xs font-medium text-rose-500">
            ({formatRupiah(Math.round(data.floatingLossNominal))})
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Major Support</span>
          <span className="font-mono text-base font-bold text-emerald-700">
            Rp {formatNumber(Math.round(data.supportMajor))}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-xs font-semibold text-slate-500 uppercase">RSI Harian</span>
          <div className="flex items-center gap-1.5 font-mono text-base font-bold text-purple-700">
            {data.rsi}
            <span className="font-sans text-xs font-medium text-purple-800">
              {data.rsi <= 35 ? '(Oversold)' : '(Netral)'}
            </span>
          </div>
        </div>
      </div>

      {/* Fundamental & Dividen Snapshot */}
      {data.fundamentals && (data.fundamentals.dividendYield !== null || data.fundamentals.peRatio !== null) && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4.5">
          <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Coins className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
              <span className="text-sm font-bold tracking-wide text-slate-800 uppercase">
                Kondisi Fundamental &amp; Dividen {data.jenis === 'investasi' ? '(Acuan Utama Saham Investasi)' : ''}
              </span>
            </div>
            {data.fundamentals.dividendYieldText && (
              <span className="self-start rounded-full border border-emerald-200 bg-emerald-100 px-3 py-0.5 font-mono text-sm font-bold text-emerald-800 sm:self-auto">
                Dividend Yield: {data.fundamentals.dividendYieldText}
              </span>
            )}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="block text-xs font-medium text-slate-500 uppercase">P/E Ratio (Valuasi)</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {data.fundamentals.peRatio ? `${data.fundamentals.peRatio.toFixed(1)}x` : 'N/A'}
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="block text-xs font-medium text-slate-500 uppercase">PBV (Price to Book)</span>
              <span className="font-mono text-base font-bold text-slate-800">
                {data.fundamentals.pbv ? `${data.fundamentals.pbv.toFixed(1)}x` : 'N/A'}
              </span>
            </div>

            <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-3 sm:col-span-1">
              <span className="block text-xs font-medium text-slate-500 uppercase">Peran Dividen</span>
              <span className="text-sm font-semibold text-emerald-700">
                {data.fundamentals.dividendYield && data.fundamentals.dividendYield > 0.05
                  ? 'Penyerap Floating Loss Pasif'
                  : 'Non-Dividen / Yield Rendah'}
              </span>
            </div>
          </div>

          {data.fundamentals.verdict && (
            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-700">
              <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-purple-600" />
              <div>
                <strong className="text-slate-900">Analisis Nilai: </strong>
                <span>{data.fundamentals.verdict}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
