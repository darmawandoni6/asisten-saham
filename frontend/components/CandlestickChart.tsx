"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  CandlestickSeries, 
  LineSeries,
  LineStyle
} from "lightweight-charts";
import { PriceCandle, Holding } from "@/types";
import { formatNumber } from "@/lib/utils";
import { X, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real candles from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadChartData() {
      try {
        const res = await api.getStockChart(ticker);
        if (isMounted && res.candles && res.candles.length > 0) {
          setCandles(res.candles);
        }
      } catch (err) {
        // Keep initial candles on fallback
      }
    }
    loadChartData();
    return () => { isMounted = false; };
  }, [ticker]);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    chartContainerRef.current.innerHTML = "";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#64748b",
      },
      grid: {
        vertLines: { color: "#f1f5f9" },
        horzLines: { color: "#f1f5f9" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 420,
      timeScale: {
        borderColor: "#e2e8f0",
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // Candlestick Series (Stockbit Green & Red)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#059669",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#059669",
      wickDownColor: "#dc2626",
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // Overlay MA20 (Amber/Orange)
    const ma20Data = candles
      .filter((c) => c.ma20 !== undefined && c.ma20 !== null)
      .map((c) => ({ time: c.time, value: c.ma20 as number }));

    if (ma20Data.length > 0) {
      const ma20Series = chart.addSeries(LineSeries, {
        color: "#d97706",
        lineWidth: 2,
        title: "MA20",
      });
      ma20Series.setData(ma20Data);
    }

    // Overlay MA50 (Blue)
    const ma50Data = candles
      .filter((c) => c.ma50 !== undefined && c.ma50 !== null)
      .map((c) => ({ time: c.time, value: c.ma50 as number }));

    if (ma50Data.length > 0) {
      const ma50Series = chart.addSeries(LineSeries, {
        color: "#0284c7",
        lineWidth: 2,
        title: "MA50",
      });
      ma50Series.setData(ma50Data);
    }

    // Horizontal Price Lines (Avg Price, TP, SL)
    if (holding) {
      candleSeries.createPriceLine({
        price: holding.avgPrice,
        color: "#64748b",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `Avg: Rp ${formatNumber(holding.avgPrice)}`,
      });

      candleSeries.createPriceLine({
        price: holding.targetPrice,
        color: "#059669",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `Target: Rp ${formatNumber(holding.targetPrice)}`,
      });

      if (holding.stopLoss != null) {
        candleSeries.createPriceLine({
          price: holding.stopLoss,
          color: "#dc2626",
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

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles, holding]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-base text-slate-900">{ticker}</span>
          <span className="text-xs text-slate-500">TradingView Daily Chart (EOD)</span>

          {/* Indicators Legend */}
          <div className="hidden sm:flex items-center gap-3 ml-4 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-amber-700 font-bold">
              <span className="w-2.5 h-0.5 bg-amber-600" /> MA20
            </span>
            <span className="flex items-center gap-1 text-sky-700 font-bold">
              <span className="w-2.5 h-0.5 bg-sky-600" /> MA50
            </span>
            {holding && (
              <>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-0.5 bg-slate-500 border-t border-dashed" /> Avg ({holding.avgPrice})
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-2.5 h-0.5 bg-emerald-600" /> TP ({holding.targetPrice})
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <span className="w-2.5 h-0.5 bg-rose-600" /> SL ({holding.stopLoss})
                </span>
              </>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chart Canvas */}
      <div ref={chartContainerRef} className="w-full mt-4" />
    </div>
  );
}
