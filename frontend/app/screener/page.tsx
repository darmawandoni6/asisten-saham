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
      <div className="space-y-1.5 font-sans text-xs leading-relaxed text-slate-700">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={idx} className="mt-2 border-b border-slate-100 pt-1 pb-0.5 text-xs font-bold text-slate-900">
                {headerText}
              </h4>
            );
          }

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
            return (
              <div key={idx} className="ml-1 flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span className="flex-1">{parseInlineBold(bulletText)}</span>
              </div>
            );
          }

          const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="ml-1 flex items-start gap-2">
                <span className="font-mono text-[11px] font-bold text-emerald-700">{numMatch[1]}.</span>
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
        className={`cursor-pointer px-3 py-3.5 transition-colors select-none hover:bg-slate-100/80 ${
          isActive ? 'bg-emerald-50/50 font-black text-emerald-800' : 'font-bold text-slate-600'
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
              className="text-slate-400 transition-colors hover:text-emerald-600"
            >
              <HelpCircle className="inline h-3 w-3" />
            </span>
          )}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-60 hover:opacity-100" />
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
        <div className="grid grid-cols-1 gap-3.5 text-xs md:grid-cols-3">
          {/* Box 1: Alasan Rekomendasi (Why Buy) */}
          <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-900 uppercase">
              <span className="text-emerald-600">💡</span>
              <span>Alasan Rekomendasi:</span>
            </div>
            <p className="font-sans leading-relaxed text-slate-700">{item.whyBuy || item.catalyst}</p>
            <div className="pt-1 font-mono text-[11px] text-slate-500">
              Status MA: <strong className="text-slate-800">{item.maStatus}</strong>
            </div>
          </div>

          {/* Box 2: Hal Wajib Dipantau Besok */}
          <div className="space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-950 uppercase">
              <Eye className="h-3.5 w-3.5 text-amber-700" />
              <span>Wajib Dipantau Besok (09:00 WIB):</span>
            </div>
            <p className="font-sans leading-relaxed text-slate-800">{item.watchTrigger}</p>
            <div className="pt-1 text-[11px] font-medium text-amber-900">
              👉 <em>Disiplin entry hanya saat trigger terkonfirmasi.</em>
            </div>
          </div>

          {/* Box 3: Skor Perhatian & Conviction Level (1-10) */}
          <div
            className={`space-y-2 rounded-xl border p-3.5 shadow-2xs transition-all ${
              isConv10
                ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 ring-1 ring-emerald-200'
                : convScore >= 8
                  ? 'border-blue-200 bg-blue-50/70 text-blue-950'
                  : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
                <Target className={`h-3.5 w-3.5 ${isConv10 ? 'text-emerald-700' : 'text-blue-600'}`} />
                <span>Skor Perhatian Besok:</span>
              </div>
              <span
                className={`rounded-lg border px-2 py-0.5 font-mono text-xs font-black ${
                  isConv10
                    ? 'border-emerald-700 bg-emerald-600 text-white shadow-2xs'
                    : convScore >= 8
                      ? 'border-blue-700 bg-blue-600 text-white'
                      : 'border-amber-300 bg-amber-100 text-amber-900'
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
              <div className="flex justify-between px-0.5 font-mono text-[9px] font-semibold text-slate-400">
                <span>1 (Wait)</span>
                <span>5 (Normal)</span>
                <span className={isConv10 ? 'font-bold text-emerald-700' : ''}>10 (Wajib Beli)</span>
              </div>
            </div>

            <div className="text-xs">
              <span className="block text-[11px] font-bold">
                {isConv10 ? (
                  <span className="flex items-center gap-1 text-emerald-900">
                    <span>🔥</span> {convLabel} (Skor 10/10)
                  </span>
                ) : convScore >= 8 ? (
                  <span className="flex items-center gap-1 text-blue-900">
                    <span>⚡</span> {convLabel} (Skor {convScore}/10)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-800">
                    <span>👀</span> {convLabel} (Skor {convScore}/10)
                  </span>
                )}
              </span>
              <p className="mt-0.5 text-[11px] leading-snug opacity-80">
                {isConv10
                  ? 'Setup teknikal prima & RRR menguntungkan. Direkomendasikan pasang antrean saat market open 09:00 WIB.'
                  : disc.data?.conviction_reason || 'Pantau konfirmasi antrean bid penahan sebelum melakukan entry.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Interactive AI Discussion & Q&A Chat Box */}
        <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          {/* Header */}
          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-2.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
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
                className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                  disc.data?.source && disc.data.source !== 'rule_based'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                <Sparkles className="h-3 w-3 text-emerald-600" />
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
                  className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 transition-colors hover:text-rose-600"
                  title="Hapus riwayat chat emiten ini"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Hapus Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading initial discussion state */}
          {disc.isLoading && disc.messages.length === 0 ? (
            <div className="space-y-2 p-6 text-center text-slate-500">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Membedah Rekomendasi &amp; Menghitung Skor Keyakinan AI...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* If no chat messages yet, show default AI breakdown */}
              {disc.messages.length === 0 && (
                <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
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
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-800">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isUser
                          ? 'rounded-tr-xs bg-emerald-600 font-medium text-white shadow-2xs'
                          : 'rounded-tl-xs border border-slate-200 bg-slate-50 text-slate-800 shadow-2xs'
                      }`}
                    >
                      {isUser ? <p>{msg.message}</p> : renderFormattedText(msg.message)}
                    </div>

                    {isUser && (
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-700">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sending indicator */}
              {disc.isSending && (
                <div className="flex items-start justify-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-800">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 shadow-2xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    <span>AI sedang menganalisis pertanyaan Anda...</span>
                  </div>
                </div>
              )}

              {/* Error feedback if any */}
              {disc.error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{disc.error}</span>
                </div>
              )}

              {/* Suggested Questions Chips */}
              <div className="space-y-1.5 pt-1.5">
                <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  💡 Pertanyaan Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {defaultQuestions.map((sq, sqIdx) => (
                    <button
                      key={sqIdx}
                      type="button"
                      disabled={disc.isSending}
                      onClick={() => handleSendDiscussionQuestion(item.ticker, sq)}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-left text-[11px] font-medium text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 disabled:opacity-50"
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
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={disc.isSending || !disc.inputQuestion.trim()}
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {disc.isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
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
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Pusat Rekomendasi Saham & Watchlist Terkurasi (EOD)"
        subtitle="Daftar saham pilihan berbasis evaluasi teknikal objektif pasca penutupan bursa (17:30 WIB)"
        onRefresh={loadScreener}
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
        {/* Custom On-Demand Stock Analyzer Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
                  <Compass className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Analisis Saham Pilihan Sendiri (On-Demand)</h3>
              </div>
              <p className="text-xs text-slate-500">
                Ketik kode emiten BEI di luar Top 10 (contoh:{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700">BREN</code>,{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700">AMMN</code>,{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700">PGAS</code>,{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700">MEDC</code>)
                untuk langsung dianalisis &amp; dimasukkan ke daftar rekomendasi.
              </p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleAnalyzeCustomTicker();
              }}
              className="flex w-full items-center gap-2 md:w-auto"
            >
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Ketik Kode Ticker (cth: BREN)..."
                  value={customTickerInput}
                  onChange={e => setCustomTickerInput(e.target.value.toUpperCase())}
                  disabled={isAnalyzingCustom}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-xs font-bold text-slate-900 uppercase transition-all placeholder:font-normal placeholder:normal-case focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzingCustom || !customTickerInput.trim()}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {isAnalyzingCustom ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Analisis Saham</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Feedback Alerts */}
          {customFeedback && (
            <div
              className={`animate-in fade-in mt-3.5 flex items-center justify-between rounded-xl border p-3 text-xs duration-150 ${
                customFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold">{customFeedback.type === 'success' ? '✅ Sukses:' : '⚠️ Gagal:'}</span>
                <span>{customFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setCustomFeedback(null)}
                className="ml-4 cursor-pointer text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="space-y-3.5">
          {/* Top Row: Category Tabs & Primary Action Buttons */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            {/* Strategy Tabs */}
            <div className="flex scrollbar-none items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Semua Rekomendasi ({items.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('OVERSOLD')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'OVERSOLD'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Oversold Rebound</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('BREAKOUT')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'BREAKOUT'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Breakout MA20</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('VALUE')}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'VALUE'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Value Stocks</span>
              </button>
            </div>

            {/* Action Buttons: Kamus & Scan EOD */}
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsKamusOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
              >
                <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
                <span>Kamus Badge</span>
              </button>

              <button
                type="button"
                onClick={handleRunScan}
                disabled={isScanning}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>Scan EOD (Top 10)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Budget / Price Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Batas Harga:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMaxPriceFilter(2000)}
                  className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
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
                  className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
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
                  className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
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
                  className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    maxPriceFilter === null
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  Semua Harga
                </button>
              </div>
            </div>

            <div className="hidden text-[11px] font-medium text-slate-500 sm:block">
              {maxPriceFilter !== null ? (
                <span>
                  Menampilkan saham terjangkau{' '}
                  <strong className="font-mono text-emerald-700">≤ Rp {formatNumber(maxPriceFilter)}</strong> (≤ Rp{' '}
                  {formatNumber(maxPriceFilter * 100)}/lot)
                </span>
              ) : (
                <span>Menampilkan seluruh rentang harga saham</span>
              )}
            </div>
          </div>

          {/* Bottom Row: Search Box, Quick Sort Dropdown, and View Mode Toggle */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs sm:flex-row sm:items-center">
            {/* Search & Sort Group */}
            <div className="flex flex-1 flex-wrap items-center gap-2.5 sm:flex-nowrap">
              {/* Search Box */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ticker atau nama emiten..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Quick Sort Dropdown */}
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="hidden text-[11px] font-medium text-slate-400 md:inline">Urutkan:</span>
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={e => {
                    const [f, d] = e.target.value.split('-') as [SortField, SortDirection];
                    setSortField(f);
                    setSortDirection(d);
                  }}
                  className="cursor-pointer bg-transparent pr-1 text-xs font-bold text-slate-800 focus:outline-none"
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
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 sm:justify-end sm:border-t-0 sm:pt-0">
              <span className="text-[11px] font-medium text-slate-400">
                Menampilkan <strong className="text-slate-700">{sortedItems.length}</strong> saham
              </span>

              <div className="flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Kartu Analisis Terbuka"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Mode Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Ringkas"
                >
                  <List className="h-3.5 w-3.5" />
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
                  className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
                >
                  {/* Card Header: Ticker, Name, Strategy, AI Score & Chart Button */}
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-600">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-black text-slate-900">{item.ticker}</span>
                          <span className="text-xs font-medium text-slate-500">{item.name}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {item.sector}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            Rp {formatNumber(item.price)}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                            Rp {formatNumber(item.price * 100)}/lot
                          </span>
                          <span
                            className={`font-mono text-xs font-bold ${
                              item.changePct >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {formatPercent(item.changePct)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-xs text-slate-500">
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

                    <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
                      {/* Strategy Badge */}
                      <span
                        className={`rounded-lg border px-3 py-1 font-mono text-xs font-bold ${
                          item.strategy === 'OVERSOLD'
                            ? 'border-purple-200 bg-purple-50 text-purple-800'
                            : item.strategy === 'BREAKOUT'
                              ? 'border-blue-200 bg-blue-50 text-blue-800'
                              : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                      >
                        {item.actionStance || item.strategy}
                      </span>

                      {/* Unified Conviction Score Pill (1-10) */}
                      <button
                        type="button"
                        onClick={() => setIsKamusOpen(true)}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition-colors ${
                          (item.convictionScore || 8) >= 10
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-2xs'
                            : (item.convictionScore || 8) >= 8
                              ? 'border-blue-200 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                        title="Skor Perhatian (1-10): 10 = Wajib Dibeli Besok Pagi. Klik untuk buka kamus."
                      >
                        <span>{(item.convictionScore || 8) >= 10 ? '🔥' : '⭐'} Skor:</span>
                        <span className="text-sm font-black">{item.convictionScore || 8}/10</span>
                        <HelpCircle className="h-3 w-3 opacity-70" />
                      </button>

                      {/* Interactive Chart Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedChartTicker(item.ticker)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <BarChart2 className="h-3.5 w-3.5 text-blue-600" />
                        <span>Chart</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Pillars Analysis Grid */}
                  <div className="grid grid-cols-1 gap-4 text-xs lg:grid-cols-3">
                    {/* Pilar 1: Alasan Rekomendasi (Why Buy) */}
                    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-900 uppercase">
                        <span className="text-emerald-600">💡</span>
                        <span>Alasan Rekomendasi</span>
                      </div>
                      <p className="font-sans leading-relaxed text-slate-700">{item.whyBuy || item.catalyst}</p>
                      <div className="pt-1 text-[11px] text-slate-500">
                        Status MA: <strong className="text-slate-800">{item.maStatus}</strong>
                      </div>
                    </div>

                    {/* Pilar 2: Hal Wajib Dipantau Besok (Watch Trigger) */}
                    <div className="space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-950 uppercase">
                        <Eye className="h-3.5 w-3.5 text-amber-700" />
                        <span>Wajib Dipantau Besok (09:00 WIB)</span>
                      </div>
                      <p className="font-sans leading-relaxed text-slate-700">{item.watchTrigger}</p>
                      <div className="pt-1 text-[11px] font-medium text-amber-900/80">
                        👉 <em>Disiplin entry hanya saat trigger terkonfirmasi.</em>
                      </div>
                    </div>

                    {/* Pilar 3: Panduan Level Eksekusi & Risk/Reward Ratio */}
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-900 uppercase">
                          <Target className="h-3.5 w-3.5 text-blue-600" />
                          <span>Panduan Level &amp; Rasio</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsKamusOpen(true)}
                          className="flex cursor-pointer items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-900 transition-colors hover:bg-emerald-200"
                          title="Risk to Reward Ratio (RRR). Klik untuk buka penjelasan matematis."
                        >
                          <span>RRR {item.riskRewardRatio}</span>
                          <HelpCircle className="h-2.5 w-2.5 text-emerald-700 opacity-80" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                          <span className="block text-[10px] text-slate-500">Area Beli Ideal</span>
                          <strong className="font-bold text-slate-900">{item.buyArea}</strong>
                        </div>
                        <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/60 p-2">
                          <span className="block text-[10px] text-emerald-700">Target Profit (TP)</span>
                          <strong className="font-bold text-emerald-900">
                            Rp {formatNumber(item.targetPrice || item.resistance)} (+{item.potentialGainPct}%)
                          </strong>
                        </div>
                        <div className="rounded-lg border border-rose-200/60 bg-rose-50/60 p-2">
                          <span className="block text-[10px] text-rose-700">Stop Loss (SL)</span>
                          <strong className="font-bold text-rose-900">
                            Rp {formatNumber(item.stopLoss || item.support)} (-
                            {item.potentialRiskPct}%)
                          </strong>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                          <span className="block text-[10px] text-slate-500">Support / Resist</span>
                          <strong className="font-bold text-slate-800">
                            {formatNumber(item.support)} / {formatNumber(item.resistance)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card AI Discussion Trigger Bar */}
                  <div className="flex flex-col justify-between gap-2.5 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold ${
                          (item.convictionScore || 8) >= 10
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : (item.convictionScore || 8) >= 8
                              ? 'border-blue-200 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
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
                      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                        activeCardDiscussionTicker === item.ticker
                          ? 'border-emerald-700 bg-emerald-600 text-white shadow-2xs'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {activeCardDiscussionTicker === item.ticker ? 'Tutup Diskusi AI' : 'Diskusi dengan AI'}
                      </span>
                      {activeCardDiscussionTicker === item.ticker ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Card AI Discussion Block */}
                  {activeCardDiscussionTicker === item.ticker && (
                    <div className="animate-in fade-in mt-2 border-t border-slate-200 pt-3 duration-150">
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
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
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
                      <th className="px-3 py-3.5 font-bold text-slate-600">Area Beli Disarankan</th>
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
                      <th className="px-3 py-3.5 text-right font-bold text-slate-600">Detail</th>
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
                            className="cursor-pointer transition-colors hover:bg-slate-50/80"
                          >
                            <td className="px-3.5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                                <div>
                                  <div className="font-mono text-xs font-bold text-slate-900">{item.ticker}</div>
                                  <div className="text-[11px] text-slate-500">{item.name}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-3.5">
                              <span
                                className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                                  item.strategy === 'OVERSOLD'
                                    ? 'border-purple-200 bg-purple-50 text-purple-700'
                                    : item.strategy === 'BREAKOUT'
                                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                                      : 'border-amber-200 bg-amber-50 text-amber-800'
                                }`}
                              >
                                {item.strategy}
                              </span>
                            </td>

                            <td className="px-3 py-3.5 font-mono">
                              <div className="text-xs font-bold text-slate-900">Rp {formatNumber(item.price)}</div>
                              <div className="text-[10px] font-medium text-slate-400">
                                Rp {formatNumber(item.price * 100)}/lot
                              </div>
                            </td>

                            <td className="px-3 py-3.5 font-mono font-bold">
                              <span className={item.changePct >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                {formatPercent(item.changePct)}
                              </span>
                            </td>

                            <td className="px-3 py-3.5 font-mono font-bold">
                              <span
                                className={
                                  item.rsi < 35 ? 'text-purple-700' : item.rsi > 70 ? 'text-rose-600' : 'text-slate-700'
                                }
                              >
                                {item.rsi}
                              </span>
                            </td>

                            <td className="px-3 py-3.5 font-mono text-[11px] text-slate-700">{item.buyArea}</td>

                            <td className="px-3 py-3.5 font-mono text-[11px] font-bold text-emerald-800">
                              Rp {formatNumber(item.targetPrice || item.resistance)}
                            </td>

                            <td className="px-3 py-3.5 font-mono text-[11px] font-bold text-rose-800">
                              Rp {formatNumber(item.stopLoss || item.support)}
                            </td>

                            <td className="px-3 py-3.5 font-mono">
                              <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                                {item.riskRewardRatio}
                              </span>
                            </td>

                            <td className="px-3 py-3.5 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${
                                    (item.convictionScore || 8) >= 10
                                      ? 'border-emerald-300 bg-emerald-50 font-black text-emerald-900 shadow-2xs'
                                      : (item.convictionScore || 8) >= 8
                                        ? 'border-blue-200 bg-blue-50 text-blue-900'
                                        : 'border-slate-200 bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  {(item.convictionScore || 8) >= 10 ? '🔥 ' : ''}
                                  {item.convictionScore || 8}/10
                                </span>
                                <div className="hidden h-1.5 w-8 overflow-hidden rounded-full bg-slate-100 sm:block">
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

                            <td className="px-3 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedChartTicker(item.ticker);
                                  }}
                                  className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
                                  title="Lihat Chart"
                                >
                                  <BarChart2 className="h-3.5 w-3.5 text-blue-600" />
                                </button>
                                <button
                                  type="button"
                                  className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row: 3 Pillars + Conviction Score (1-10) + AI Discussion */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70">
                              <td colSpan={11} className="border-y border-slate-200 p-4">
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
            <Inbox className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-800">Belum Ada Hasil Rekomendasi</p>
            <p className="mx-auto mt-1 mb-5 max-w-md text-xs text-slate-500">
              Klik tombol &quot;Scan EOD (Top 10)&quot; untuk memindai 35+ saham teraktif BEI dan menghasilkan 10
              rekomendasi terbaik pasca penutupan pasar.
            </p>
            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memindai Saham BEI...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Jalankan Scan EOD Sekarang</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Screener Philosophy Info Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-900 uppercase">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>Filosofi &amp; Disiplin Eksekusi Rekomendasi</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Daftar ini adalah <strong>watchlist intelijen terkurasi</strong> pasca penutupan pasar pukul 17:30 WIB.
            Setiap saham dilengkapi alasan teknikal objektif (*Why Buy*), hal wajib dipantau besok pagi (*Watch
            Trigger*), serta kalkulasi rasio *Risk/Reward* (RRR). Jangan langsung melakukan pembelian sebelum syarat
            pantauan jam 09:00 WIB terkonfirmasi di bursa.
          </p>
        </div>
      </div>

      {/* Modal Interactive Candlestick Chart */}
      {selectedChartTicker && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs duration-150">
          <div className="w-full max-w-4xl">
            <CandlestickChart ticker={selectedChartTicker} candles={[]} onClose={() => setSelectedChartTicker(null)} />
          </div>
        </div>
      )}

      {/* Modal Bantuan Cepat: Kamus Badge Screener */}
      {isKamusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <BookOpen className="h-4 w-4" />
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
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="space-y-4 overflow-y-auto p-5 text-xs">
              {/* 1. Risk to Reward Ratio (RRR) Section */}
              <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-900">
                    🎯 RISK : REWARD RATIO (RRR)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">Matematika Ketahanan Modal</span>
                </div>
                <strong className="block text-sm text-slate-900">
                  Kunci Profit Konsisten: Mengapa RRR &ge; 1 : 2.0 Sangat Krusial?
                </strong>
                <p className="leading-relaxed text-slate-700">
                  RRR membandingkan <strong>berapa rupiah risiko yang Anda korbankan (Stop Loss)</strong> terhadap{' '}
                  <strong>berapa rupiah potensi keuntungan yang Anda incar (Target TP)</strong>.
                </p>

                <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
                  <div className="space-y-1 rounded-lg border border-emerald-200 bg-white p-2.5 text-[11px]">
                    <span className="block font-bold text-slate-900">📐 Rumus Sederhana:</span>
                    <p className="font-mono text-slate-600">1 : (Target TP - Entry) / (Entry - Stop Loss)</p>
                    <span className="block text-[10px] font-medium text-emerald-800">
                      Contoh: Beli 1.000, SL 950 (-5%), TP 1.100 (+10%) &rarr; <strong>RRR = 1 : 2.0</strong>
                    </span>
                  </div>

                  <div className="space-y-1 rounded-lg border border-emerald-200 bg-white p-2.5 text-[11px]">
                    <span className="block font-bold text-slate-900">🏆 Simulasi Win-Rate 40%:</span>
                    <p className="text-slate-600">
                      Dari 10 trade: <strong>6x Rugi (-Rp 300)</strong> vs <strong>4x Cuan (+Rp 400)</strong>.
                    </p>
                    <span className="block text-[10px] font-bold text-emerald-800">
                      Hasil Akhir: Portofolio Tetap Untung Bersih +Rp 100!
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="rounded bg-emerald-200/80 px-2 py-0.5 font-bold text-emerald-950">
                    &ge; 1 : 2.0 (Sangat Layak)
                  </span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                    1 : 1.5 (Cukup Layak)
                  </span>
                  <span className="rounded bg-rose-100 px-2 py-0.5 font-medium text-rose-800">
                    &lt; 1 : 1.0 (Hindari / Tidak Sepadan)
                  </span>
                </div>
              </div>

              {/* 2. Skor Perhatian & Keyakinan Beli (1-10) Section */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold tracking-wider text-slate-900 uppercase">
                    ⭐ SKOR PERHATIAN &amp; KEYAKINAN BELI (1 – 10)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Skala Keputusan Beli 09:00 WIB</span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  Skor Perhatian mengukur <strong>tingkat keyakinan dan kesiapan aksi beli</strong> pada pembukaan
                  market esok pagi (09:00 WIB), memadukan kematangan teknikal MA/RSI dengan rasio Risk:Reward (RRR).
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-snug text-amber-950">
                  ⚠️ <strong>ATURAN DISIPLIN:</strong> Skor 10/10 menandakan setup paling prima untuk langsung dipasang
                  antrean beli. Namun tetap patuhi SOP pembukaan 09:00 WIB dan pasang Stop Loss otomatis di sekuritas.
                </div>
                <div className="grid grid-cols-1 gap-2 pt-1 text-xs sm:grid-cols-3">
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5">
                    <strong className="block font-black text-emerald-900">🔥 Skor 10/10 (Wajib Beli Besok)</strong>
                    <span className="mt-0.5 block text-[11px] leading-snug text-emerald-950">
                      Setup Sempurna (Breakout/Rebound Valid, RRR &ge; 1:2.0, Volume Akumulasi).
                    </span>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                    <strong className="block font-bold text-blue-900">⚡ Skor 8 – 9/10 (Siaga 1 Beli)</strong>
                    <span className="mt-0.5 block text-[11px] leading-snug text-blue-950">
                      Sangat Direkomendasikan (Tunggu konfirmasi candle 15 menit pertama 09:00–09:15 WIB).
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <strong className="block font-bold text-slate-800">👀 Skor 6 – 7/10 (Layak Pantau)</strong>
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-600">
                      Cocok untuk cicil akumulasi bertahap (DCA) di area Support Major.
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Strategy Badges */}
              <div className="space-y-3 pt-1">
                <span className="block text-xs font-bold tracking-wider text-slate-900 uppercase">
                  🏷️ 3 Tipe Strategi Screener
                </span>

                {/* Oversold */}
                <div className="space-y-1.5 rounded-xl border border-purple-200 bg-purple-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-purple-200 bg-purple-100 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-800">
                      OVERSOLD (Ungu)
                    </span>
                    <span className="text-xs font-semibold text-purple-700">RSI &lt; 35 • Support Mayor</span>
                  </div>
                  <strong className="block text-sm text-slate-900">Jenuh Jual Ekstrem (Buy on Weakness)</strong>
                  <p className="leading-relaxed text-slate-600">
                    Harga sudah turun sangat dalam dan menyentuh lantai support kuat. Tekanan jual habis, ruang
                    penurunan terbatas.
                  </p>
                  <p className="pt-1 font-medium text-purple-900">
                    👉 <strong>Rekomendasi Aksi:</strong> Beli bertahap saat candle hijau/pantulan reversal muncul.
                    Pasang SL ketat di bawah support.
                  </p>
                </div>

                {/* Breakout */}
                <div className="space-y-1.5 rounded-xl border border-blue-200 bg-blue-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-800">
                      BREAKOUT (Biru)
                    </span>
                    <span className="text-xs font-semibold text-blue-700">Close &ge; MA20 • RSI &ge; 55</span>
                  </div>
                  <strong className="block text-sm text-slate-900">
                    Momentum Tren Kenaikan Baru (Trend Following)
                  </strong>
                  <p className="leading-relaxed text-slate-600">
                    Harga menembus dan bertahan di atas MA20 dengan volume aktif. Fase sideways selesai dan tren
                    akselerasi dimulai.
                  </p>
                  <p className="pt-1 font-medium text-blue-900">
                    👉 <strong>Rekomendasi Aksi:</strong> <em>Buy on Momentum</em> untuk menunggangi tren akselerasi
                    jangka pendek.
                  </p>
                </div>

                {/* Value */}
                <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-800">
                      VALUE (Kuning Emas)
                    </span>
                    <span className="text-xs font-semibold text-amber-800">Support MA50 • Blue Chip</span>
                  </div>
                  <strong className="block text-sm text-slate-900">Akumulasi Sehat &amp; Valuasi Wajar</strong>
                  <p className="leading-relaxed text-slate-600">
                    Saham berfundamental kuat (Blue Chip/LQ45) yang berkonsolidasi stabil di atas garis penopang MA50.
                  </p>
                  <p className="pt-1 font-medium text-amber-900">
                    👉 <strong>Rekomendasi Aksi:</strong> Cicil beli santai (*DCA*) untuk portofolio investasi jangka
                    menengah-panjang.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-3.5 px-5 text-xs text-slate-500">
              <Link
                href="/guide"
                className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <span>Buka Panduan &amp; SOP Lengkap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsKamusOpen(false)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-100"
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
