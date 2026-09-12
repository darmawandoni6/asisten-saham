'use client';

import { useCallback, useState } from 'react';

import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { ScreenerItem, ScreenerRawItem } from '@/types';

export type ScreenerSortField =
  | 'convictionScore'
  | 'score'
  | 'ticker'
  | 'sector'
  | 'price'
  | 'changePct'
  | 'changeNominal'
  | 'rsi'
  | 'marketCap'
  | 'freeFloatPct'
  | 'roePct'
  | 'der'
  | 'targetPrice'
  | 'stopLoss'
  | 'riskRewardRatio'
  | 'strategy';

export type ScreenerSortDirection = 'asc' | 'desc';
export type ScreenerStrategyTab = 'ALL' | 'OVERSOLD' | 'BREAKOUT' | 'VALUE';

export const mapScreenerItem = (r: ScreenerRawItem): ScreenerItem => {
  const scoreVal = r.score ?? 85;
  const rrrVal = r.risk_reward_ratio || r.riskRewardRatio || '1 : 2.0';
  let defaultConvScore = 8;
  let defaultConvLabel = 'Prioritas Masuk Radar Beli';

  if (scoreVal >= 90 || (scoreVal >= 87 && (rrrVal.includes('2.') || rrrVal.includes('3.') || rrrVal.includes('4.')))) {
    defaultConvScore = 10;
    defaultConvLabel = 'Wajib Dibeli Besok Pagi (Setup Prima)';
  } else if (scoreVal >= 85) {
    defaultConvScore = 9;
    defaultConvLabel = 'Sangat Direkomendasikan Beli Besok Pagi';
  } else if (scoreVal >= 80) {
    defaultConvScore = 8;
    defaultConvLabel = 'Prioritas Masuk Radar Beli';
  } else if (scoreVal >= 75) {
    defaultConvScore = 7;
    defaultConvLabel = 'Layak Pantau / Akumulasi Bertahap';
  } else {
    defaultConvScore = 6;
    defaultConvLabel = 'Tunggu Konfirmasi Pantulan';
  }

  const changePctVal = r.change_pct ?? r.changePct ?? 0;
  const changeNomVal =
    r.change_nominal ??
    r.changeNominal ??
    (changePctVal !== 0 && r.price > 0 ? Math.round(r.price * (changePctVal / 100)) : 0);

  return {
    ticker: r.ticker,
    name: r.name,
    sector: r.sector,
    profileSuitability: r.profile_suitability ?? r.profileSuitability ?? 'TRADING',
    profileSuitabilityLabel: r.profile_suitability_label ?? r.profileSuitabilityLabel ?? 'Cocok Trading',
    price: r.price,
    changePct: changePctVal,
    changeNominal: changeNomVal,
    volume: r.volume,
    rsi: r.rsi,
    maStatus: r.ma_status ?? r.maStatus ?? 'Normal',
    strategy: r.strategy,
    score: scoreVal,
    convictionScore: r.conviction_score ?? r.convictionScore ?? defaultConvScore,
    convictionLabel: r.conviction_label ?? r.convictionLabel ?? defaultConvLabel,
    convictionReason: r.conviction_reason ?? r.convictionReason,
    aiAnalysis: r.ai_analysis ?? r.aiAnalysis,
    aiSource: r.ai_source ?? r.aiSource,
    marketCap: r.market_cap ?? r.marketCap ?? null,
    marketCapFormatted: r.market_cap_formatted ?? r.marketCapFormatted ?? '-',
    freeFloatPct: r.free_float_pct ?? r.freeFloatPct ?? null,
    roePct: r.roe_pct ?? r.roePct ?? null,
    der: r.der ?? null,
    catalyst: r.catalyst || r.why_buy || '',
    actionStance:
      r.action_stance ||
      (r.strategy === 'OVERSOLD'
        ? 'BUY ON WEAKNESS (Area Support)'
        : r.strategy === 'BREAKOUT'
          ? 'BUY ON BREAKOUT (Momentum MA20)'
          : 'ACCUMULATE / DCA (Support MA50)'),
    whyBuy: r.why_buy || r.catalyst || '',
    watchTrigger:
      r.watch_trigger ||
      `Pantau konfirmasi pantulan harga di area support Rp ${formatNumber(r.support)} pada pembukaan jam bursa (09:00 WIB).`,
    buyArea: r.buy_area || `Rp ${formatNumber(r.support)} – Rp ${formatNumber(r.price)}`,
    targetPrice: r.target_price || r.resistance,
    stopLoss: r.stop_loss || Math.round(r.support * 0.97),
    riskRewardRatio: rrrVal,
    potentialGainPct:
      r.potential_gain_pct || (r.price > 0 ? Math.round(((r.resistance - r.price) / r.price) * 100) : 0),
    potentialRiskPct:
      r.potential_risk_pct || (r.price > 0 ? Math.round(((r.price - (r.stop_loss || r.support)) / r.price) * 100) : 0),
    support: r.support,
    resistance: r.resistance,
  };
};

export function useScreener() {
  const [activeTab, setActiveTab] = useState<ScreenerStrategyTab>('ALL');
  const [items, setItems] = useState<ScreenerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isKamusOpen, setIsKamusOpen] = useState(false);

  // Sorting state (purely frontend)
  const [sortField, setSortField] = useState<ScreenerSortField>('convictionScore');
  const [sortDirection, setSortDirection] = useState<ScreenerSortDirection>('desc');

  // View mode: "cards" (Rich Intelligence Cards) vs "table" (Expandable Pro Table)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedChartTicker, setSelectedChartTicker] = useState<string | null>(null);

  // Budget / Price filter state (default: 2000)
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(2000);

  // Custom ticker analyzer state
  const [customTickerInput, setCustomTickerInput] = useState('');
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [customFeedback, setCustomFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadScreener = useCallback(async () => {
    try {
      const res = await api.getScreener(activeTab);
      if (res) {
        setItems(res.map(mapScreenerItem));
      }
    } catch (err) {
      console.warn('Screener API fallback:', err);
    }
  }, [activeTab]);

  const handleRunScan = async (onScanComplete?: () => void) => {
    setIsScanning(true);
    setCustomFeedback(null);
    try {
      const res = await api.scanScreener();
      if (res) {
        setItems(res.map(mapScreenerItem));
      }
      if (onScanComplete) {
        onScanComplete();
      }
    } catch (err) {
      console.warn('Scan screener error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyzeCustomTicker = async () => {
    const rawTicker = customTickerInput.trim().toUpperCase();
    if (!rawTicker) return;

    setIsAnalyzingCustom(true);
    setCustomFeedback(null);

    try {
      const res = await api.analyzeScreenerTicker(rawTicker);
      if (res && res.ticker) {
        const newItem = mapScreenerItem(res);
        setItems(prev => [newItem, ...prev.filter(p => p.ticker !== res.ticker)]);
        setActiveTab('ALL');
        setCustomTickerInput('');
        setCustomFeedback({
          type: 'success',
          message: `Saham ${res.ticker} (${res.name}) berhasil dianalisis! Sektor: ${res.sector} | Skor AI: ${newItem.convictionScore}/10.`,
        });
      } else {
        setCustomFeedback({
          type: 'error',
          message: `Gagal memuat data saham ${rawTicker}. Pastikan kode ticker terdaftar di Bursa Efek Indonesia (IDX).`,
        });
      }
    } catch (err: unknown) {
      console.error('Custom ticker analysis error:', err);
      setCustomFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : `Gagal menganalisis saham ${rawTicker}. Pastikan ticker terdaftar di BEI.`,
      });
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  const handleSort = (field: ScreenerSortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'ticker' || field === 'strategy' || field === 'sector' ? 'asc' : 'desc');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === 'ALL' || item.strategy === activeTab;
    const matchesSearch =
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sector && item.sector.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrice = maxPriceFilter === null || item.price <= maxPriceFilter;
    return matchesTab && matchesSearch && matchesPrice;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const rawA = a[sortField];
    const rawB = b[sortField];

    if (sortField === 'ticker' || sortField === 'strategy' || sortField === 'sector') {
      const strA = String(rawA ?? '').toLowerCase();
      const strB = String(rawB ?? '').toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }

    if (sortField === 'riskRewardRatio') {
      const numA = parseFloat(String(rawA ?? '0').replace(/[^0-9.]/g, '')) || 0;
      const numB = parseFloat(String(rawB ?? '0').replace(/[^0-9.]/g, '')) || 0;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    }

    if (sortField === 'convictionScore' || sortField === 'score') {
      const scoreA = a.convictionScore ?? Math.round((a.score || 85) / 10);
      const scoreB = b.convictionScore ?? Math.round((b.score || 85) / 10);
      return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    }

    // Numeric sort
    const numA = typeof rawA === 'number' ? rawA : Number(rawA) || 0;
    const numB = typeof rawB === 'number' ? rawB : Number(rawB) || 0;
    return sortDirection === 'asc' ? numA - numB : numB - numA;
  });

  return {
    activeTab,
    setActiveTab,
    items,
    setItems,
    searchQuery,
    setSearchQuery,
    isScanning,
    isKamusOpen,
    setIsKamusOpen,
    sortField,
    sortDirection,
    handleSort,
    setSortField,
    setSortDirection,
    viewMode,
    setViewMode,
    selectedChartTicker,
    setSelectedChartTicker,
    maxPriceFilter,
    setMaxPriceFilter,
    customTickerInput,
    setCustomTickerInput,
    isAnalyzingCustom,
    customFeedback,
    setCustomFeedback,
    loadScreener,
    handleRunScan,
    handleAnalyzeCustomTicker,
    filteredItems,
    sortedItems,
  };
}
