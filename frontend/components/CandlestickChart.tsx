'use client';

import { useEffect, useRef, useState } from 'react';

import { CandlestickSeries, ColorType, IChartApi, LineSeries, LineStyle, createChart } from 'lightweight-charts';
import { AlertTriangle, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { Holding, PriceCandle } from '@/types';

interface Props {
  candles: PriceCandle[];
  holding?: Holding;
  ticker: string;
  onClose?: () => void;
}

export function CandlestickChart({ candles: initialCandles, holding, ticker, onClose }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [candles, setCandles] = useState<PriceCandle[]>(initialCandles);
  const [error, setError] = useState<string | null>(null);

  // Fetch real candles from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadChartData() {
      setError(null);
      try {
        const res = await api.getStockChart(ticker);
        if (isMounted) {
          if (res.candles && res.candles.length > 0) {
            setCandles(res.candles);
          } else {
            setError(`Data candlestick historis untuk ${ticker} belum tersedia dari server.`);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : 'Koneksi ke backend bermasalah';
          setError(`Gagal memuat data chart riil untuk ${ticker}: ${errMsg}`);
        }
      }
    }
    loadChartData();
    return () => {
      isMounted = false;
    };
  }, [ticker]);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 420,
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // Candlestick Series (Stockbit Green & Red)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#059669',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#059669',
      wickDownColor: '#dc2626',
    });

    candleSeries.setData(
      candles.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    // Overlay MA20 (Amber/Orange)
    const ma20Data = candles
      .filter(c => c.ma20 !== undefined && c.ma20 !== null)
      .map(c => ({ time: c.time, value: c.ma20 as number }));

    if (ma20Data.length > 0) {
      const ma20Series = chart.addSeries(LineSeries, {
        color: '#d97706',
        lineWidth: 2,
        title: 'MA20',
      });
      ma20Series.setData(ma20Data);
    }

    // Overlay MA50 (Blue)
    const ma50Data = candles
      .filter(c => c.ma50 !== undefined && c.ma50 !== null)
      .map(c => ({ time: c.time, value: c.ma50 as number }));

    if (ma50Data.length > 0) {
      const ma50Series = chart.addSeries(LineSeries, {
        color: '#0284c7',
        lineWidth: 2,
        title: 'MA50',
      });
      ma50Series.setData(ma50Data);
    }

    // Horizontal Price Lines (Avg Price, TP, SL)
    if (holding) {
      candleSeries.createPriceLine({
        price: holding.avgPrice,
        color: '#64748b',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `Avg: Rp ${formatNumber(holding.avgPrice)}`,
      });

      const isExitRebound =
        holding.targetPrice &&
        holding.avgPrice &&
        holding.targetPrice < holding.avgPrice &&
        holding.jenis !== 'investasi';

      candleSeries.createPriceLine({
        price: holding.targetPrice,
        color: isExitRebound ? '#d97706' : '#059669',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: isExitRebound
          ? `Exit Rebound: Rp ${formatNumber(holding.targetPrice)}`
          : `Target: Rp ${formatNumber(holding.targetPrice)}`,
      });

      if (holding.stopLoss != null) {
        candleSeries.createPriceLine({
          price: holding.stopLoss,
          color: '#dc2626',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `SL: Rp ${formatNumber(holding.stopLoss)}`,
        });
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles, holding]);

  const isExitRebound =
    holding &&
    holding.targetPrice &&
    holding.avgPrice &&
    holding.targetPrice < holding.avgPrice &&
    holding.jenis !== 'investasi';

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold text-slate-900">{ticker}</span>
          <span className="text-xs text-slate-500">TradingView Daily Chart (EOD)</span>

          {/* Indicators Legend */}
          <div className="ml-4 hidden items-center gap-3 font-mono text-[11px] sm:flex">
            <span className="flex items-center gap-1 font-bold text-amber-700">
              <span className="h-0.5 w-2.5 bg-amber-600" /> MA20
            </span>
            <span className="flex items-center gap-1 font-bold text-sky-700">
              <span className="h-0.5 w-2.5 bg-sky-600" /> MA50
            </span>
            {holding && (
              <>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="h-0.5 w-2.5 border-t border-dashed bg-slate-500" /> Avg ({holding.avgPrice})
                </span>
                {isExitRebound ? (
                  <span className="flex items-center gap-1 font-bold text-amber-700">
                    <span className="h-0.5 w-2.5 bg-amber-600" /> Exit ({holding.targetPrice})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <span className="h-0.5 w-2.5 bg-emerald-600" /> TP ({holding.targetPrice})
                  </span>
                )}
                <span className="flex items-center gap-1 font-bold text-rose-700">
                  <span className="h-0.5 w-2.5 bg-rose-600" /> SL ({holding.stopLoss})
                </span>
              </>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Data Chart</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="mt-4 w-full" />
    </div>
  );
}
