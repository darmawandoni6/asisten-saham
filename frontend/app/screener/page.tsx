/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BarChart2,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Filter,
  HelpCircle,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

import { CandlestickChart } from '@/components/CandlestickChart';
import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/utils';
import { ScreenerChatMessage, ScreenerDiscussionResponse, ScreenerItem } from '@/types';

type SortField =
  | 'convictionScore'
  | 'score'
  | 'ticker'
  | 'price'
  | 'changePct'
  | 'rsi'
  | 'targetPrice'
  | 'stopLoss'
  | 'riskRewardRatio'
  | 'strategy';
type SortDirection = 'asc' | 'desc';

export default function ScreenerPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERSOLD' | 'BREAKOUT' | 'VALUE'>('ALL');
  const [items, setItems] = useState<ScreenerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isKamusOpen, setIsKamusOpen] = useState(false);

  // Sorting state (purely frontend)
  const [sortField, setSortField] = useState<SortField>('convictionScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // View mode: "cards" (Rich Intelligence Cards) vs "table" (Expandable Pro Table)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
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

  // Discussion State per Ticker
  const [discussions, setDiscussions] = useState<
    Record<
      string,
      {
        isLoading: boolean;
        isSending: boolean;
        data: ScreenerDiscussionResponse | null;
        messages: ScreenerChatMessage[];
        inputQuestion: string;
        error: string | null;
      }
    >
  >({});
  const [activeCardDiscussionTicker, setActiveCardDiscussionTicker] = useState<string | null>(null);

  const mapScreenerItem = (r: any): ScreenerItem => {
    const scoreVal = r.score ?? 85;
    const rrrVal = r.risk_reward_ratio || r.riskRewardRatio || '1 : 2.0';
    let defaultConvScore = 8;
    let defaultConvLabel = 'Prioritas Masuk Radar Beli';

    if (
      scoreVal >= 90 ||
      (scoreVal >= 87 && (rrrVal.includes('2.') || rrrVal.includes('3.') || rrrVal.includes('4.')))
    ) {
      defaultConvScore = 10;
      defaultConvLabel = 'Wajib Dibeli Besok Pagi';
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

    return {
      ticker: r.ticker,
      name: r.name,
      sector: r.sector,
      price: r.price,
      changePct: r.change_pct ?? r.changePct ?? 0,
      volume: r.volume,
      rsi: r.rsi,
      maStatus: r.ma_status ?? r.maStatus ?? 'Normal',
      strategy: r.strategy,
      score: scoreVal,
      convictionScore: r.conviction_score ?? r.convictionScore ?? defaultConvScore,
      convictionLabel: r.conviction_label ?? r.convictionLabel ?? defaultConvLabel,
      catalyst: r.catalyst || r.why_buy,
      actionStance:
        r.action_stance ||
        (r.strategy === 'OVERSOLD'
          ? 'BUY ON WEAKNESS (Area Support)'
          : r.strategy === 'BREAKOUT'
            ? 'BUY ON BREAKOUT (Momentum MA20)'
            : 'ACCUMULATE / DCA (Support MA50)'),
      whyBuy: r.why_buy || r.catalyst,
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
        r.potential_risk_pct ||
        (r.price > 0 ? Math.round(((r.price - (r.stop_loss || r.support)) / r.price) * 100) : 0),
      support: r.support,
      resistance: r.resistance,
    };
  };

  const initDiscussion = async (ticker: string, force = false) => {
    if (!ticker) return;
    const current = discussions[ticker];
    if (current?.data && !force && current.messages.length > 0) return;

    setDiscussions(prev => ({
      ...prev,
      [ticker]: {
        isLoading: true,
        isSending: false,
        data: prev[ticker]?.data || null,
        messages: prev[ticker]?.messages || [],
        inputQuestion: prev[ticker]?.inputQuestion || '',
        error: null,
      },
    }));

    try {
      const [history, discRes] = await Promise.all([
        api.getScreenerChatHistory(ticker).catch(() => []),
        api.discussScreener(ticker, {}).catch(() => null),
      ]);

      setDiscussions(prev => ({
        ...prev,
        [ticker]: {
          isLoading: false,
          isSending: false,
          data: discRes,
          messages: history && history.length > 0 ? history : [],
          inputQuestion: prev[ticker]?.inputQuestion || '',
          error: null,
        },
      }));
    } catch (err: any) {
      console.warn('Error initializing screener discussion:', err);
      setDiscussions(prev => ({
        ...prev,
        [ticker]: {
          isLoading: false,
          isSending: false,
          data: prev[ticker]?.data || null,
          messages: prev[ticker]?.messages || [],
          inputQuestion: prev[ticker]?.inputQuestion || '',
          error: err.message || 'Gagal memuat analisis AI',
        },
      }));
    }
  };

  const handleSendDiscussionQuestion = async (ticker: string, questionText?: string) => {
    const q = (questionText || discussions[ticker]?.inputQuestion || '').trim();
    if (!q) return;

    // Optimistically update user message
    const tempUserMsg: ScreenerChatMessage = {
      ticker,
      role: 'user',
      message: q,
      createdAt: new Date().toISOString(),
    };

    setDiscussions(prev => ({
      ...prev,
      [ticker]: {
        ...(prev[ticker] || {
          isLoading: false,
          data: null,
          error: null,
        }),
        isSending: true,
        inputQuestion: '',
        messages: [...(prev[ticker]?.messages || []), tempUserMsg],
      },
    }));

    try {
      const res = await api.discussScreener(ticker, { question: q });
      if (res) {
        setDiscussions(prev => ({
          ...prev,
          [ticker]: {
            isLoading: false,
            isSending: false,
            data: res,
            messages: res.history || [
              ...(prev[ticker]?.messages || []),
              {
                ticker,
                role: 'assistant',
                message: res.answer,
                source: res.source,
                convictionScore: res.conviction_score,
                createdAt: new Date().toISOString(),
              },
            ],
            inputQuestion: '',
            error: null,
          },
        }));
      }
    } catch (err: any) {
      console.error('Error sending screener question:', err);
      setDiscussions(prev => ({
        ...prev,
        [ticker]: {
          ...(prev[ticker] || {
            isLoading: false,
            data: null,
            messages: [],
            inputQuestion: '',
          }),
          isSending: false,
          error: err.message || 'Gagal mengirim pertanyaan ke AI',
        },
      }));
    }
  };

  const handleClearChatHistory = async (ticker: string) => {
    try {
      await api.clearScreenerChatHistory(ticker);
      setDiscussions(prev => ({
        ...prev,
        [ticker]: {
          ...(prev[ticker] || {
            isLoading: false,
            isSending: false,
            data: null,
            inputQuestion: '',
            error: null,
          }),
          messages: [],
        },
      }));
      initDiscussion(ticker, true);
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs text-slate-700 font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-xs mt-2 pt-1 border-b border-slate-100 pb-0.5">
                {headerText}
              </h4>
            );
          }

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="text-emerald-600 font-bold">•</span>
                <span className="flex-1">{parseInlineBold(bulletText)}</span>
              </div>
            );
          }

          const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="text-emerald-700 font-bold font-mono text-[11px]">{numMatch[1]}.</span>
                <span className="flex-1">{parseInlineBold(numMatch[2])}</span>
              </div>
            );
          }

          return <p key={idx}>{parseInlineBold(trimmed)}</p>;
        })}
      </div>
    );
  };

  const loadScreener = async () => {
    try {
      const res = await api.getScreener(activeTab);
      if (res) {
        setItems(res.map(mapScreenerItem));
      }
    } catch (err) {
      console.warn('Screener API fallback:', err);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setCustomFeedback(null);
    setDiscussions({});
    try {
      const res = await api.scanScreener();
      if (res) {
        setItems(res.map(mapScreenerItem));
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
          message: `Saham ${res.ticker} (${res.name}) berhasil dianalisis! Strategi: ${res.strategy} | AI Score: ${res.score}/100.`,
        });
      } else {
        setCustomFeedback({
          type: 'error',
          message: `Gagal memuat data saham ${rawTicker}. Pastikan kode ticker terdaftar di Bursa Efek Indonesia (IDX).`,
        });
      }
    } catch (err: any) {
      console.error('Custom ticker analysis error:', err);
      setCustomFeedback({
        type: 'error',
        message: err.message || `Gagal menganalisis saham ${rawTicker}. Pastikan ticker terdaftar di BEI.`,
      });
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  useEffect(() => {
    loadScreener();
  }, [activeTab]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'ticker' || field === 'strategy' ? 'asc' : 'desc');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === 'ALL' || item.strategy === activeTab;
    const matchesSearch =
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = maxPriceFilter === null || item.price <= maxPriceFilter;
    return matchesTab && matchesSearch && matchesPrice;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'ticker' || sortField === 'strategy') {
      valA = (valA || '').toLowerCase();
      valB = (valB || '').toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }

    if (sortField === 'riskRewardRatio') {
      valA = parseFloat((valA || '0').replace(/[^0-9.]/g, '')) || 0;
      valB = parseFloat((valB || '0').replace(/[^0-9.]/g, '')) || 0;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    if (sortField === 'convictionScore' || sortField === 'score') {
      valA = a.convictionScore ?? Math.round((a.score || 85) / 10);
      valB = b.convictionScore ?? Math.round((b.score || 85) / 10);
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    // Numeric sort
    valA = Number(valA) || 0;
    valB = Number(valB) || 0;
    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  const renderSortTh = (label: string, field: SortField, align: 'left' | 'right' = 'left', tooltip?: string) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={e => {
          e.stopPropagation();
          handleSort(field);
        }}
        className={`py-3.5 px-3 select-none cursor-pointer hover:bg-slate-100/80 transition-colors ${
          isActive ? 'text-emerald-800 font-black bg-emerald-50/50' : 'text-slate-600 font-bold'
        } ${align === 'right' ? 'text-right' : 'text-left'}`}
        title={tooltip ? `${label}: ${tooltip} (Klik untuk mengurutkan)` : `Urutkan berdasarkan ${label}`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          {tooltip && (
            <span
              onClick={e => {
                e.stopPropagation();
                setIsKamusOpen(true);
              }}
              title={tooltip}
              className="text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <HelpCircle className="w-3 h-3 inline" />
            </span>
          )}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-60 hover:opacity-100 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  const renderAIDiscussionBlock = (item: ScreenerItem) => {
    const disc = discussions[item.ticker] || {
      isLoading: false,
      isSending: false,
      data: null,
      messages: [],
      inputQuestion: '',
      error: null,
    };

    const convScore = disc.data?.conviction_score ?? item.convictionScore ?? 8;
    const isConv10 = convScore >= 10;
    const convLabel =
      disc.data?.conviction_label ??
      item.convictionLabel ??
      (isConv10
        ? 'Wajib Dibeli Besok Pagi'
        : convScore >= 9
          ? 'Sangat Direkomendasikan Beli Besok Pagi'
          : convScore >= 8
            ? 'Prioritas Masuk Radar Beli'
            : 'Layak Pantau / Akumulasi Bertahap');

    const defaultQuestions =
      disc.data?.suggested_questions && disc.data.suggested_questions.length > 0
        ? disc.data.suggested_questions
        : [
            `Apakah aman pasang antrean buy di area ${item.buyArea} saat pembukaan 09:00 WIB?`,
            `Berapa alokasi lot yang ideal dari saldo kas untuk ${item.ticker}?`,
            `Apa batas invalidasi risiko jika market bergerak koreksi besok?`,
          ];

    return (
      <div className="space-y-4">
        {/* 1. Conviction Score Bar & Technical Assessment Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Box 1: Alasan Rekomendasi (Why Buy) */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <span className="text-emerald-600">💡</span>
              <span>Alasan Rekomendasi:</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-sans">{item.whyBuy || item.catalyst}</p>
            <div className="text-[11px] text-slate-500 pt-1 font-mono">
              Status MA: <strong className="text-slate-800">{item.maStatus}</strong>
            </div>
          </div>

          {/* Box 2: Hal Wajib Dipantau Besok */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5 shadow-2xs">
            <div className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span>Wajib Dipantau Besok (09:00 WIB):</span>
            </div>
            <p className="text-slate-800 leading-relaxed font-sans">{item.watchTrigger}</p>
            <div className="text-[11px] text-amber-900 font-medium pt-1">
              👉 <em>Disiplin entry hanya saat trigger terkonfirmasi.</em>
            </div>
          </div>

          {/* Box 3: Skor Perhatian & Conviction Level (1-10) */}
          <div
            className={`p-3.5 rounded-xl border shadow-2xs space-y-2 transition-all ${
              isConv10
                ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-200 text-emerald-950'
                : convScore >= 8
                  ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                  : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Target className={`w-3.5 h-3.5 ${isConv10 ? 'text-emerald-700' : 'text-blue-600'}`} />
                <span>Skor Perhatian Besok:</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black border ${
                  isConv10
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : convScore >= 8
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {convScore}/10
              </span>
            </div>

            {/* Visual 10-Segmented Score Bar */}
            <div className="space-y-1">
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }).map((_, i) => {
                  const isFilled = i < convScore;
                  return (
                    <div
                      key={i}
                      className={`h-2 rounded-sm transition-all ${
                        isFilled
                          ? isConv10
                            ? 'bg-emerald-600'
                            : convScore >= 8
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          : 'bg-slate-200/80'
                      }`}
                      title={`Skor Level ${i + 1}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400 font-semibold px-0.5">
                <span>1 (Wait)</span>
                <span>5 (Normal)</span>
                <span className={isConv10 ? 'text-emerald-700 font-bold' : ''}>10 (Wajib Beli)</span>
              </div>
            </div>

            <div className="text-xs">
              <span className="font-bold block text-[11px]">
                {isConv10 ? (
                  <span className="text-emerald-900 flex items-center gap-1">
                    <span>🔥</span> {convLabel} (Skor 10/10)
                  </span>
                ) : convScore >= 8 ? (
                  <span className="text-blue-900 flex items-center gap-1">
                    <span>⚡</span> {convLabel} (Skor {convScore}/10)
                  </span>
                ) : (
                  <span className="text-slate-800 flex items-center gap-1">
                    <span>👀</span> {convLabel} (Skor {convScore}/10)
                  </span>
                )}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                {isConv10
                  ? 'Setup teknikal prima & RRR menguntungkan. Direkomendasikan pasang antrean saat market open 09:00 WIB.'
                  : disc.data?.conviction_reason || 'Pantau konfirmasi antrean bid penahan sebelum melakukan entry.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Interactive AI Discussion & Q&A Chat Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Bot className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Diskusi AI: Mengapa {item.ticker} Direkomendasikan?</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tanya jawab interaktif seputar setup teknikal, batas risiko, dan SOP beli besok pagi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Provider Badge */}
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  disc.data?.source && disc.data.source !== 'rule_based'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>
                  {disc.data?.source === '9router'
                    ? '9Router AI'
                    : disc.data?.source && disc.data.source !== 'rule_based'
                      ? 'AI Copilot'
                      : 'Rule-Based Expert Engine'}
                </span>
              </span>

              {/* Clear History Button */}
              {disc.messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearChatHistory(item.ticker)}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded cursor-pointer"
                  title="Hapus riwayat chat emiten ini"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading initial discussion state */}
          {disc.isLoading && disc.messages.length === 0 ? (
            <div className="p-6 text-center text-slate-500 space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs font-semibold">Membedah Rekomendasi &amp; Menghitung Skor Keyakinan AI...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* If no chat messages yet, show default AI breakdown */}
              {disc.messages.length === 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rasional Rekomendasi &amp; Analisis AI:</span>
                  </div>
                  {renderFormattedText(
                    disc.data?.answer ||
                      `Saham **${item.ticker}** (${item.name}) masuk rekomendasi strategi **${item.strategy}** dengan AI Score **${item.score}/100** dan Rasio Risk:Reward **${item.riskRewardRatio}**.\n\n` +
                        `* **Area Beli Ideal**: ${item.buyArea}\n` +
                        `* **Target Profit (TP)**: Rp ${formatNumber(item.targetPrice || item.resistance)} (+${item.potentialGainPct}%)\n` +
                        `* **Stop Loss (SL)**: Rp ${formatNumber(item.stopLoss || item.support)} (-${item.potentialRiskPct}%)\n\n` +
                        `**Checklist Jam 09:00 WIB**: ${item.watchTrigger}`,
                  )}
                </div>
              )}

              {/* Multi-Turn Message History */}
              {disc.messages.map((msg, mIdx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={mIdx} className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-emerald-600 text-white font-medium rounded-tr-xs shadow-2xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {isUser ? <p>{msg.message}</p> : renderFormattedText(msg.message)}
                    </div>

                    {isUser && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sending indicator */}
              {disc.isSending && (
                <div className="flex items-start gap-2.5 justify-start">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 rounded-tl-xs flex items-center gap-2 shadow-2xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>AI sedang menganalisis pertanyaan Anda...</span>
                  </div>
                </div>
              )}

              {/* Error feedback if any */}
              {disc.error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{disc.error}</span>
                </div>
              )}

              {/* Suggested Questions Chips */}
              <div className="pt-1.5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  💡 Pertanyaan Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {defaultQuestions.map((sq, sqIdx) => (
                    <button
                      key={sqIdx}
                      type="button"
                      disabled={disc.isSending}
                      onClick={() => handleSendDiscussionQuestion(item.ticker, sq)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer text-left disabled:opacity-50"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendDiscussionQuestion(item.ticker);
                }}
                className="flex items-center gap-2 pt-2"
              >
                <input
                  type="text"
                  placeholder={`Tanyakan strategi entry, alokasi kas, atau risiko ${item.ticker}...`}
                  value={disc.inputQuestion}
                  onChange={e =>
                    setDiscussions(prev => ({
                      ...prev,
                      [item.ticker]: {
                        ...(prev[item.ticker] || {
                          isLoading: false,
                          isSending: false,
                          data: null,
                          messages: [],
                          error: null,
                        }),
                        inputQuestion: e.target.value,
                      },
                    }))
                  }
                  disabled={disc.isSending}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={disc.isSending || !disc.inputQuestion.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  {disc.isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Kirim</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-16">
      <Topbar
        title="Pusat Rekomendasi Saham & Watchlist Terkurasi (EOD)"
        subtitle="Daftar saham pilihan berbasis evaluasi teknikal objektif pasca penutupan bursa (17:30 WIB)"
        onRefresh={loadScreener}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Custom On-Demand Stock Analyzer Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Compass className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Analisis Saham Pilihan Sendiri (On-Demand)</h3>
              </div>
              <p className="text-xs text-slate-500">
                Ketik kode emiten BEI di luar Top 10 (contoh:{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-semibold">BREN</code>,{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-semibold">AMMN</code>,{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-semibold">PGAS</code>,{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-semibold">MEDC</code>)
                untuk langsung dianalisis &amp; dimasukkan ke daftar rekomendasi.
              </p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleAnalyzeCustomTicker();
              }}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Ketik Kode Ticker (cth: BREN)..."
                  value={customTickerInput}
                  onChange={e => setCustomTickerInput(e.target.value.toUpperCase())}
                  disabled={isAnalyzingCustom}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono font-bold uppercase placeholder:font-normal placeholder:normal-case focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzingCustom || !customTickerInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                {isAnalyzingCustom ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Analisis Saham</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Feedback Alerts */}
          {customFeedback && (
            <div
              className={`mt-3.5 p-3 rounded-xl text-xs flex items-center justify-between border animate-in fade-in duration-150 ${
                customFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold">{customFeedback.type === 'success' ? '✅ Sukses:' : '⚠️ Gagal:'}</span>
                <span>{customFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setCustomFeedback(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-4 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="space-y-3.5">
          {/* Top Row: Category Tabs & Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Strategy Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Semua Rekomendasi ({items.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('OVERSOLD')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'OVERSOLD'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Oversold Rebound</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('BREAKOUT')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'BREAKOUT'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Breakout MA20</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('VALUE')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'VALUE'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Value Stocks</span>
              </button>
            </div>

            {/* Action Buttons: Kamus & Scan EOD */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsKamusOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Kamus Badge</span>
              </button>

              <button
                type="button"
                onClick={handleRunScan}
                disabled={isScanning}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Scan EOD (Top 10)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Budget / Price Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Batas Harga:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setMaxPriceFilter(2000)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    maxPriceFilter === 2000
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  ≤ Rp 2.000 (≤ 200rb/lot)
                </button>
                <button
                  type="button"
                  onClick={() => setMaxPriceFilter(1000)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    maxPriceFilter === 1000
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  ≤ Rp 1.000 (≤ 100rb/lot)
                </button>
                <button
                  type="button"
                  onClick={() => setMaxPriceFilter(500)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    maxPriceFilter === 500
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  ≤ Rp 500 (≤ 50rb/lot)
                </button>
                <button
                  type="button"
                  onClick={() => setMaxPriceFilter(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    maxPriceFilter === null
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  Semua Harga
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {maxPriceFilter !== null ? (
                <span>
                  Menampilkan saham terjangkau{' '}
                  <strong className="text-emerald-700 font-mono">≤ Rp {formatNumber(maxPriceFilter)}</strong> (≤ Rp{' '}
                  {formatNumber(maxPriceFilter * 100)}/lot)
                </span>
              ) : (
                <span>Menampilkan seluruh rentang harga saham</span>
              )}
            </div>
          </div>

          {/* Bottom Row: Search Box, Quick Sort Dropdown, and View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            {/* Search & Sort Group */}
            <div className="flex items-center gap-2.5 flex-1 flex-wrap sm:flex-nowrap">
              {/* Search Box */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari ticker atau nama emiten..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              {/* Quick Sort Dropdown */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Urutkan:</span>
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={e => {
                    const [f, d] = e.target.value.split('-') as [SortField, SortDirection];
                    setSortField(f);
                    setSortDirection(d);
                  }}
                  className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                  title="Pilih Urutan Saham"
                >
                  <option value="convictionScore-desc">Skor (10/10 Teratas)</option>
                  <option value="convictionScore-asc">Skor (Terendah)</option>
                  <option value="changePct-desc">Perubahan (+ Tertinggi)</option>
                  <option value="changePct-asc">Perubahan (- Terendah)</option>
                  <option value="price-desc">Harga (Tertinggi)</option>
                  <option value="price-asc">Harga (Terendah)</option>
                  <option value="rsi-asc">RSI (Paling Oversold)</option>
                  <option value="rsi-desc">RSI (Paling Overbought)</option>
                  <option value="ticker-asc">Ticker (A – Z)</option>
                  <option value="ticker-desc">Ticker (Z – A)</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle & Count */}
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">
                Menampilkan <strong className="text-slate-700">{sortedItems.length}</strong> saham
              </span>

              <div className="flex items-center bg-slate-100/80 border border-slate-200 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Kartu Analisis Terbuka"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Mode Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Ringkas"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Mode Tabel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section: Mode Cards vs Mode Table */}
        {sortedItems.length > 0 ? (
          viewMode === 'cards' ? (
            /* ========================================================================= */
            /* 🅰️ VIEW MODE: RICH INTELLIGENCE CARDS                                    */
            /* ========================================================================= */
            <div className="space-y-4">
              {sortedItems.map((item, idx) => (
                <div
                  key={item.ticker}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all space-y-4"
                >
                  {/* Card Header: Ticker, Name, Strategy, AI Score & Chart Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-slate-900 text-base">{item.ticker}</span>
                          <span className="text-xs text-slate-500 font-medium">{item.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {item.sector}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            Rp {formatNumber(item.price)}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Rp {formatNumber(item.price * 100)}/lot
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              item.changePct >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {formatPercent(item.changePct)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500 font-mono">
                            RSI:{' '}
                            <strong
                              className={
                                item.rsi < 35 ? 'text-purple-700' : item.rsi > 70 ? 'text-rose-600' : 'text-slate-800'
                              }
                            >
                              {item.rsi}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      {/* Strategy Badge */}
                      <span
                        className={`text-xs px-3 py-1 rounded-lg font-bold font-mono border ${
                          item.strategy === 'OVERSOLD'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : item.strategy === 'BREAKOUT'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {item.actionStance || item.strategy}
                      </span>

                      {/* Unified Conviction Score Pill (1-10) */}
                      <button
                        type="button"
                        onClick={() => setIsKamusOpen(true)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors border ${
                          (item.convictionScore || 8) >= 10
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                            : (item.convictionScore || 8) >= 8
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                        title="Skor Perhatian (1-10): 10 = Wajib Dibeli Besok Pagi. Klik untuk buka kamus."
                      >
                        <span>{(item.convictionScore || 8) >= 10 ? '🔥' : '⭐'} Skor:</span>
                        <span className="text-sm font-black">{item.convictionScore || 8}/10</span>
                        <HelpCircle className="w-3 h-3 opacity-70" />
                      </button>

                      {/* Interactive Chart Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedChartTicker(item.ticker)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chart</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Pillars Analysis Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    {/* Pilar 1: Alasan Rekomendasi (Why Buy) */}
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                        <span className="text-emerald-600">💡</span>
                        <span>Alasan Rekomendasi</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-sans">{item.whyBuy || item.catalyst}</p>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Status MA: <strong className="text-slate-800">{item.maStatus}</strong>
                      </div>
                    </div>

                    {/* Pilar 2: Hal Wajib Dipantau Besok (Watch Trigger) */}
                    <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-950 font-bold uppercase tracking-wider text-[11px]">
                        <Eye className="w-3.5 h-3.5 text-amber-700" />
                        <span>Wajib Dipantau Besok (09:00 WIB)</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-sans">{item.watchTrigger}</p>
                      <div className="text-[11px] text-amber-900/80 font-medium pt-1">
                        👉 <em>Disiplin entry hanya saat trigger terkonfirmasi.</em>
                      </div>
                    </div>

                    {/* Pilar 3: Panduan Level Eksekusi & Risk/Reward Ratio */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                          <Target className="w-3.5 h-3.5 text-blue-600" />
                          <span>Panduan Level &amp; Rasio</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsKamusOpen(true)}
                          className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer"
                          title="Risk to Reward Ratio (RRR). Klik untuk buka penjelasan matematis."
                        >
                          <span>RRR {item.riskRewardRatio}</span>
                          <HelpCircle className="w-2.5 h-2.5 text-emerald-700 opacity-80" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 block text-[10px]">Area Beli Ideal</span>
                          <strong className="text-slate-900 font-bold">{item.buyArea}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                          <span className="text-emerald-700 block text-[10px]">Target Profit (TP)</span>
                          <strong className="text-emerald-900 font-bold">
                            Rp {formatNumber(item.targetPrice || item.resistance)} (+{item.potentialGainPct}%)
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-200/60">
                          <span className="text-rose-700 block text-[10px]">Stop Loss (SL)</span>
                          <strong className="text-rose-900 font-bold">
                            Rp {formatNumber(item.stopLoss || item.support)} (-
                            {item.potentialRiskPct}%)
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 block text-[10px]">Support / Resist</span>
                          <strong className="text-slate-800 font-bold">
                            {formatNumber(item.support)} / {formatNumber(item.resistance)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card AI Discussion Trigger Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono border flex items-center gap-1.5 ${
                          (item.convictionScore || 8) >= 10
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : (item.convictionScore || 8) >= 8
                              ? 'bg-blue-50 text-blue-900 border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>
                          {(item.convictionScore || 8) >= 10 ? '🔥' : (item.convictionScore || 8) >= 8 ? '⚡' : '🎯'}
                        </span>
                        <span>
                          Skor {item.convictionScore || 8}/10: {item.convictionLabel}
                        </span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextTicker = activeCardDiscussionTicker === item.ticker ? null : item.ticker;
                        setActiveCardDiscussionTicker(nextTicker);
                        if (nextTicker) {
                          initDiscussion(nextTicker);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        activeCardDiscussionTicker === item.ticker
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {activeCardDiscussionTicker === item.ticker ? 'Tutup Diskusi AI' : 'Diskusi dengan AI'}
                      </span>
                      {activeCardDiscussionTicker === item.ticker ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Card AI Discussion Block */}
                  {activeCardDiscussionTicker === item.ticker && (
                    <div className="pt-3 border-t border-slate-200 mt-2 animate-in fade-in duration-150">
                      {renderAIDiscussionBlock(item)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* ========================================================================= */
            /* 🅱️ VIEW MODE: PRO TABLE + EXPANDABLE DETAILS                             */
            /* ========================================================================= */
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      {renderSortTh('# Ticker', 'ticker')}
                      {renderSortTh('Sikap Aksi / Rekomendasi', 'strategy')}
                      {renderSortTh('Harga Close', 'price')}
                      {renderSortTh('Perubahan', 'changePct')}
                      {renderSortTh(
                        'RSI',
                        'rsi',
                        'left',
                        'Relative Strength Index (0-100). Indikator momentum jenuh jual (<35) atau jenuh beli (>70).',
                      )}
                      <th className="py-3.5 px-3 font-bold text-slate-600">Area Beli Disarankan</th>
                      {renderSortTh('Target TP', 'targetPrice')}
                      {renderSortTh('Stop Loss', 'stopLoss')}
                      {renderSortTh(
                        'Risk:Reward',
                        'riskRewardRatio',
                        'left',
                        'Risk:Reward Ratio (RRR). Perbandingan batas risiko Stop Loss vs potensi keuntungan Take Profit. Standar ideal: minimal 1 : 1.5 s/d 1 : 2.0 ke atas.',
                      )}
                      {renderSortTh(
                        'Skor (1-10)',
                        'convictionScore',
                        'left',
                        'Skor Perhatian (1-10): Tingkat keyakinan beli besok pagi. Skor 10/10 berarti WAJIB DIBELI BESOK PAGI karena setup teknikal prima & RRR prima.',
                      )}
                      <th className="py-3.5 px-3 text-right font-bold text-slate-600">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {sortedItems.map((item, idx) => {
                      const isExpanded = expandedTicker === item.ticker;
                      return (
                        <React.Fragment key={item.ticker}>
                          <tr
                            onClick={() => {
                              const nextExpanded = isExpanded ? null : item.ticker;
                              setExpandedTicker(nextExpanded);
                              if (nextExpanded) {
                                initDiscussion(nextExpanded);
                              }
                            }}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400 font-bold">#{idx + 1}</span>
                                <div>
                                  <div className="font-mono font-bold text-slate-900 text-xs">{item.ticker}</div>
                                  <div className="text-[11px] text-slate-500">{item.name}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono border ${
                                  item.strategy === 'OVERSOLD'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : item.strategy === 'BREAKOUT'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {item.strategy}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono">
                              <div className="font-bold text-slate-900 text-xs">Rp {formatNumber(item.price)}</div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                Rp {formatNumber(item.price * 100)}/lot
                              </div>
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold">
                              <span className={item.changePct >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                {formatPercent(item.changePct)}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold">
                              <span
                                className={
                                  item.rsi < 35 ? 'text-purple-700' : item.rsi > 70 ? 'text-rose-600' : 'text-slate-700'
                                }
                              >
                                {item.rsi}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono text-slate-700 text-[11px]">{item.buyArea}</td>

                            <td className="py-3.5 px-3 font-mono font-bold text-emerald-800 text-[11px]">
                              Rp {formatNumber(item.targetPrice || item.resistance)}
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold text-rose-800 text-[11px]">
                              Rp {formatNumber(item.stopLoss || item.support)}
                            </td>

                            <td className="py-3.5 px-3 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold">
                                {item.riskRewardRatio}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                                    (item.convictionScore || 8) >= 10
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-black shadow-2xs'
                                      : (item.convictionScore || 8) >= 8
                                        ? 'bg-blue-50 text-blue-900 border-blue-200'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {(item.convictionScore || 8) >= 10 ? '🔥 ' : ''}
                                  {item.convictionScore || 8}/10
                                </span>
                                <div className="w-8 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${
                                      (item.convictionScore || 8) >= 10
                                        ? 'bg-emerald-600'
                                        : (item.convictionScore || 8) >= 8
                                          ? 'bg-blue-600'
                                          : 'bg-amber-500'
                                    }`}
                                    style={{
                                      width: `${((item.convictionScore || 8) / 10) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedChartTicker(item.ticker);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                  title="Lihat Chart"
                                >
                                  <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row: 3 Pillars + Conviction Score (1-10) + AI Discussion */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70">
                              <td colSpan={11} className="p-4 border-y border-slate-200">
                                {renderAIDiscussionBlock(item)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-2xs">
            <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-800 text-sm">Belum Ada Hasil Rekomendasi</p>
            <p className="text-xs text-slate-500 mt-1 mb-5 max-w-md mx-auto">
              Klik tombol &quot;Scan EOD (Top 10)&quot; untuk memindai 35+ saham teraktif BEI dan menghasilkan 10
              rekomendasi terbaik pasca penutupan pasar.
            </p>
            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memindai Saham BEI...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Jalankan Scan EOD Sekarang</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Screener Philosophy Info Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filosofi &amp; Disiplin Eksekusi Rekomendasi</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Daftar ini adalah <strong>watchlist intelijen terkurasi</strong> pasca penutupan pasar pukul 17:30 WIB.
            Setiap saham dilengkapi alasan teknikal objektif (*Why Buy*), hal wajib dipantau besok pagi (*Watch
            Trigger*), serta kalkulasi rasio *Risk/Reward* (RRR). Jangan langsung melakukan pembelian sebelum syarat
            pantauan jam 09:00 WIB terkonfirmasi di bursa.
          </p>
        </div>
      </div>

      {/* Modal Interactive Candlestick Chart */}
      {selectedChartTicker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-4xl w-full">
            <CandlestickChart ticker={selectedChartTicker} candles={[]} onClose={() => setSelectedChartTicker(null)} />
          </div>
        </div>
      )}

      {/* Modal Bantuan Cepat: Kamus Badge Screener */}
      {isKamusOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Kamus Strategi, AI Score &amp; Risk:Reward</h3>
                  <p className="text-xs text-slate-500">
                    Panduan formula teknikal, arti AI Score, dan matematika probabilitas Risk:Reward
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKamusOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* 1. Risk to Reward Ratio (RRR) Section */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold font-mono border border-emerald-300">
                    🎯 RISK : REWARD RATIO (RRR)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">Matematika Ketahanan Modal</span>
                </div>
                <strong className="block text-slate-900 text-sm">
                  Kunci Profit Konsisten: Mengapa RRR &ge; 1 : 2.0 Sangat Krusial?
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  RRR membandingkan <strong>berapa rupiah risiko yang Anda korbankan (Stop Loss)</strong> terhadap{' '}
                  <strong>berapa rupiah potensi keuntungan yang Anda incar (Target TP)</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-[11px] space-y-1">
                    <span className="font-bold text-slate-900 block">📐 Rumus Sederhana:</span>
                    <p className="text-slate-600 font-mono">1 : (Target TP - Entry) / (Entry - Stop Loss)</p>
                    <span className="text-emerald-800 font-medium block text-[10px]">
                      Contoh: Beli 1.000, SL 950 (-5%), TP 1.100 (+10%) &rarr; <strong>RRR = 1 : 2.0</strong>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-[11px] space-y-1">
                    <span className="font-bold text-slate-900 block">🏆 Simulasi Win-Rate 40%:</span>
                    <p className="text-slate-600">
                      Dari 10 trade: <strong>6x Rugi (-Rp 300)</strong> vs <strong>4x Cuan (+Rp 400)</strong>.
                    </p>
                    <span className="text-emerald-800 font-bold block text-[10px]">
                      Hasil Akhir: Portofolio Tetap Untung Bersih +Rp 100!
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-950 font-bold">
                    &ge; 1 : 2.0 (Sangat Layak)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-medium">
                    1 : 1.5 (Cukup Layak)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">
                    &lt; 1 : 1.0 (Hindari / Tidak Sepadan)
                  </span>
                </div>
              </div>

              {/* 2. Skor Perhatian & Keyakinan Beli (1-10) Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    ⭐ SKOR PERHATIAN &amp; KEYAKINAN BELI (1 – 10)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Skala Keputusan Beli 09:00 WIB</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Skor Perhatian mengukur <strong>tingkat keyakinan dan kesiapan aksi beli</strong> pada pembukaan
                  market esok pagi (09:00 WIB), memadukan kematangan teknikal MA/RSI dengan rasio Risk:Reward (RRR).
                </p>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950 leading-snug">
                  ⚠️ <strong>ATURAN DISIPLIN:</strong> Skor 10/10 menandakan setup paling prima untuk langsung dipasang
                  antrean beli. Namun tetap patuhi SOP pembukaan 09:00 WIB dan pasang Stop Loss otomatis di sekuritas.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300">
                    <strong className="block text-emerald-900 font-black">🔥 Skor 10/10 (Wajib Beli Besok)</strong>
                    <span className="text-emerald-950 text-[11px] leading-snug block mt-0.5">
                      Setup Sempurna (Breakout/Rebound Valid, RRR &ge; 1:2.0, Volume Akumulasi).
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                    <strong className="block text-blue-900 font-bold">⚡ Skor 8 – 9/10 (Siaga 1 Beli)</strong>
                    <span className="text-blue-950 text-[11px] leading-snug block mt-0.5">
                      Sangat Direkomendasikan (Tunggu konfirmasi candle 15 menit pertama 09:00–09:15 WIB).
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <strong className="block text-slate-800 font-bold">👀 Skor 6 – 7/10 (Layak Pantau)</strong>
                    <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                      Cocok untuk cicil akumulasi bertahap (DCA) di area Support Major.
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Strategy Badges */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  🏷️ 3 Tipe Strategi Screener
                </span>

                {/* Oversold */}
                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold font-mono border border-purple-200">
                      OVERSOLD (Ungu)
                    </span>
                    <span className="text-xs font-semibold text-purple-700">RSI &lt; 35 • Support Mayor</span>
                  </div>
                  <strong className="block text-slate-900 text-sm">Jenuh Jual Ekstrem (Buy on Weakness)</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Harga sudah turun sangat dalam dan menyentuh lantai support kuat. Tekanan jual habis, ruang
                    penurunan terbatas.
                  </p>
                  <p className="text-purple-900 font-medium pt-1">
                    👉 <strong>Rekomendasi Aksi:</strong> Beli bertahap saat candle hijau/pantulan reversal muncul.
                    Pasang SL ketat di bawah support.
                  </p>
                </div>

                {/* Breakout */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono border border-blue-200">
                      BREAKOUT (Biru)
                    </span>
                    <span className="text-xs font-semibold text-blue-700">Close &ge; MA20 • RSI &ge; 55</span>
                  </div>
                  <strong className="block text-slate-900 text-sm">
                    Momentum Tren Kenaikan Baru (Trend Following)
                  </strong>
                  <p className="text-slate-600 leading-relaxed">
                    Harga menembus dan bertahan di atas MA20 dengan volume aktif. Fase sideways selesai dan tren
                    akselerasi dimulai.
                  </p>
                  <p className="text-blue-900 font-medium pt-1">
                    👉 <strong>Rekomendasi Aksi:</strong> <em>Buy on Momentum</em> untuk menunggangi tren akselerasi
                    jangka pendek.
                  </p>
                </div>

                {/* Value */}
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold font-mono border border-amber-200">
                      VALUE (Kuning Emas)
                    </span>
                    <span className="text-xs font-semibold text-amber-800">Support MA50 • Blue Chip</span>
                  </div>
                  <strong className="block text-slate-900 text-sm">Akumulasi Sehat &amp; Valuasi Wajar</strong>
                  <p className="text-slate-600 leading-relaxed">
                    Saham berfundamental kuat (Blue Chip/LQ45) yang berkonsolidasi stabil di atas garis penopang MA50.
                  </p>
                  <p className="text-amber-900 font-medium pt-1">
                    👉 <strong>Rekomendasi Aksi:</strong> Cicil beli santai (*DCA*) untuk portofolio investasi jangka
                    menengah-panjang.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <Link
                href="/guide"
                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                <span>Buka Panduan &amp; SOP Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsKamusOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
