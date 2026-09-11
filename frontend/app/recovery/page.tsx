'use client';

import React, { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calculator,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  Database,
  Info,
  LifeBuoy,
  MessageSquare,
  RotateCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';

import { MarkdownText } from '@/components/MarkdownText';
import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { Holding, RecoveryChatMessage, RecoveryDiagnosis, RecoveryDiscussion } from '@/types';

export default function RecoveryPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [data, setData] = useState<RecoveryDiagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive Calculator State
  const [targetBuyPrice, setTargetBuyPrice] = useState<number>(0);
  const [targetAvgPrice, setTargetAvgPrice] = useState<number>(0);

  // Discussion / Deep-Dive State
  const [activeScenarioModal, setActiveScenarioModal] = useState<string | null>(null);
  const [discussionData, setDiscussionData] = useState<RecoveryDiscussion | null>(null);
  const [isDiscussionLoading, setIsDiscussionLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; source?: string }>>(
    [],
  );
  const [customQuestion, setCustomQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [retryingIndex, setRetryingIndex] = useState<number | null>(null);

  // Debounce & Request Tracking Refs
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  const handleRetryDeepDive = async () => {
    if (!activeScenarioModal || isDiscussionLoading || !selectedTicker) return;
    setIsDiscussionLoading(true);
    try {
      const res = await api.discussRecovery(selectedTicker, {
        scenario_id: activeScenarioModal,
        provider: '9router',
        force_refresh: true,
      });
      if (res) {
        setDiscussionData(res);
      }
    } catch (err) {
      console.warn('Error retrying deep dive:', err);
    } finally {
      setIsDiscussionLoading(false);
    }
  };

  const handleRetryQuestion = async (assistantIdx: number) => {
    if (retryingIndex !== null || isSubmittingQuestion || !activeScenarioModal || !selectedTicker) return;
    let questionText = '';
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (chatHistory[i].role === 'user') {
        questionText = chatHistory[i].text;
        break;
      }
    }
    if (!questionText) return;

    setRetryingIndex(assistantIdx);
    try {
      const res = await api.discussRecovery(selectedTicker, {
        scenario_id: activeScenarioModal,
        user_question: questionText,
        provider: '9router',
        force_refresh: true,
      });
      if (res && res.answer) {
        setChatHistory(prev => {
          const next = [...prev];
          next[assistantIdx] = {
            role: 'assistant',
            text: res.answer,
            source: res.source,
          };
          return next;
        });
      }
    } catch (err) {
      console.warn('Retry question error:', err);
    } finally {
      setRetryingIndex(null);
    }
  };

  const handleOpenDiscussion = async (scenarioId: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const requestId = ++latestRequestIdRef.current;
    setActiveScenarioModal(scenarioId);
    setIsDiscussionLoading(true);
    setChatHistory([]);
    setCustomQuestion('');
    try {
      const [res, history] = await Promise.all([
        api.discussRecovery(selectedTicker, { scenario_id: scenarioId, provider: '9router' }),
        api.getRecoveryChatHistory(selectedTicker, scenarioId).catch(() => []),
      ]);
      if (requestId === latestRequestIdRef.current) {
        if (res) {
          setDiscussionData(res);
        }
        if (history && history.length > 0) {
          setChatHistory(
            history.map((item: RecoveryChatMessage) => ({
              role: item.role,
              text: item.message,
              source: item.source,
            })),
          );
        }
      }
    } catch (err) {
      console.warn('Error loading scenario discussion:', err);
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsDiscussionLoading(false);
      }
    }
  };

  const handleClearChatHistory = async () => {
    if (!activeScenarioModal || !selectedTicker) return;
    try {
      await api.clearRecoveryChatHistory(selectedTicker, activeScenarioModal);
      setChatHistory([]);
    } catch (err) {
      console.warn('Error clearing chat history:', err);
    }
  };

  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim() || isSubmittingQuestion || !activeScenarioModal) return;
    const q = questionText.trim();
    setCustomQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setIsSubmittingQuestion(true);
    try {
      const res = await api.discussRecovery(selectedTicker, {
        scenario_id: activeScenarioModal,
        user_question: q,
        provider: '9router',
      });
      if (res && res.answer) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: res.answer, source: res.source }]);
      }
    } catch {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', text: 'Maaf, terjadi kendala saat memproses pertanyaan Anda. Silakan coba lagi.' },
      ]);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleCloseDiscussion = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    latestRequestIdRef.current++;
    setActiveScenarioModal(null);
    setDiscussionData(null);
    setChatHistory([]);
    setCustomQuestion('');
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dash = await api.getDashboard();
      if (dash && dash.holdings) {
        const candidates = dash.holdings.filter(
          (h: Holding) =>
            h.floatingPnlPct < 0 || h.actionStatus === 'RECOVERY_MODE' || h.actionStatus === 'AVERAGING_REVIEW',
        );
        setHoldings(candidates);

        if (candidates.length > 0) {
          const initialTicker = candidates[0].ticker;
          setSelectedTicker(initialTicker);
          const rec = await api.getRecovery(initialTicker);
          if (rec) {
            setData(rec);
            setTargetBuyPrice(Math.round(rec.currentPrice * 0.95));
            setTargetAvgPrice(Math.round((rec.avgPrice + rec.currentPrice) / 2));
          }
        } else {
          setData(null);
        }
      }
    } catch (err) {
      console.warn('Error loading recovery data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const dash = await api.getDashboard();
        if (dash && dash.holdings) {
          const candidates = dash.holdings.filter(
            (h: Holding) =>
              h.floatingPnlPct < 0 || h.actionStatus === 'RECOVERY_MODE' || h.actionStatus === 'AVERAGING_REVIEW',
          );
          setHoldings(candidates);

          if (candidates.length > 0) {
            const initialTicker = candidates[0].ticker;
            setSelectedTicker(initialTicker);
            const rec = await api.getRecovery(initialTicker);
            if (rec) {
              setData(rec);
              setTargetBuyPrice(Math.round(rec.currentPrice * 0.95));
              setTargetAvgPrice(Math.round((rec.avgPrice + rec.currentPrice) / 2));
            }
          } else {
            setData(null);
          }
        }
      } catch (err) {
        console.warn('Error loading recovery data:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSelectStock = async (stock: Holding) => {
    setSelectedTicker(stock.ticker);
    try {
      const rec = await api.getRecovery(stock.ticker);
      if (rec) {
        setData(rec);
        setTargetBuyPrice(Math.round(rec.currentPrice * 0.95));
        setTargetAvgPrice(Math.round((rec.avgPrice + rec.currentPrice) / 2));
      }
    } catch (e) {
      console.warn('Select recovery stock err:', e);
    }
  };

  const calculateAverageDown = () => {
    if (!data) return { addLot: 0, capital: 0, newAvg: 0 };
    const currentLot = data.lot;
    const currentAvg = data.avgPrice;

    if (targetAvgPrice <= targetBuyPrice || targetAvgPrice >= currentAvg) {
      return {
        addLot: 0,
        capital: 0,
        newAvg: currentAvg,
        error: 'Target Avg harus di antara harga beli bawah dan Avg saat ini',
      };
    }

    const rawAddLot = (currentLot * (currentAvg - targetAvgPrice)) / (targetAvgPrice - targetBuyPrice);
    const addLot = Math.ceil(rawAddLot);
    const capital = addLot * targetBuyPrice * 100;
    const finalAvg = Math.round((currentLot * currentAvg + addLot * targetBuyPrice) / (currentLot + addLot));

    return { addLot, capital, newAvg: finalAvg };
  };

  const calcResult = calculateAverageDown();

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-50 pb-16">
      <Topbar
        title="Recovery Engine (Floating Loss Assessment)"
        subtitle="Analisis penyelamatan saham floating loss & kalkulator average down presisi"
        onRefresh={loadData}
      />

      <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
        {/* Ticker Selector & Kas Summary */}
        {holdings.length > 0 ? (
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-semibold text-slate-600">Pilih Saham Floating Loss:</span>
              {holdings.map(h => (
                <button
                  key={h.ticker}
                  type="button"
                  onClick={() => handleSelectStock(h)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 font-mono text-sm font-bold transition-all ${
                    selectedTicker === h.ticker
                      ? 'border-purple-300 bg-purple-50 text-purple-800 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <LifeBuoy className="h-4 w-4 text-purple-600" />
                  <span>{h.ticker}</span>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                    {formatPercent(h.floatingPnlPct)}
                  </span>
                </button>
              ))}
            </div>

            {data?.cashBalance !== undefined && (
              <div className="flex items-center gap-2.5 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm sm:self-auto">
                <Wallet className="h-4.5 w-4.5 text-slate-500" />
                <span className="font-medium text-slate-600">Sisa Kas Tersedia:</span>
                <span className="font-mono text-base font-bold text-slate-900">{formatRupiah(data.cashBalance)}</span>
              </div>
            )}
          </div>
        ) : (
          !isLoading && (
            <div className="mx-auto mt-6 flex max-w-lg flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="mb-1.5 text-base font-bold text-slate-900">Semua Posisi Portofolio Terpantau Aman</h3>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
                Tidak ada saham yang mengalami floating loss dalam atau memerlukan Recovery Mode (&gt;10% floating
                loss). Fitur kalkulator average down presisi dan diagnosa penyelamatan modal akan otomatis aktif saat
                ada saham yang membutuhkan evaluasi recovery.
              </p>
              <Link
                href="/portfolio"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-2xs transition-colors hover:bg-slate-800"
              >
                <span>Buka Portofolio &amp; Trading Plan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )
        )}

        {data && (
          <>
            {/* 1. Diagnosis Kerugian Card */}
            <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-2xs">
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
                        <span
                          className={`rounded px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${
                            data.jenis === 'investasi'
                              ? 'border border-emerald-200 bg-emerald-100 text-emerald-800'
                              : 'border border-blue-200 bg-blue-100 text-blue-800'
                          }`}
                        >
                          {data.jenis}
                        </span>
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
                  <div className="font-mono text-base font-bold text-rose-600">
                    {formatPercent(data.floatingLossPct)}
                  </div>
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

              {/* 1.B Snapshot Fundamental & Dividen */}
              {data.fundamentals &&
                (data.fundamentals.dividendYield !== null || data.fundamentals.peRatio !== null) && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4.5">
                    <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                        <span className="text-sm font-bold tracking-wide text-slate-800 uppercase">
                          Kondisi Fundamental &amp; Dividen{' '}
                          {data.jenis === 'investasi' ? '(Acuan Utama Saham Investasi)' : ''}
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
            </div>

            {/* 2. Skenario Penyelamatan AI */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold tracking-wider text-slate-900 uppercase">
                  <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
                  <span>3 Skenario Penyelamatan AI (Pilih Sesuai Tipe &amp; Kas Anda)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {/* Option A: Cut Loss / Trim */}
                <div
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 transition-all ${
                    data.scenarios.cutLoss.actionRecommended
                      ? 'border-rose-300 shadow-sm ring-2 ring-rose-100'
                      : 'border-slate-200 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-xs font-bold tracking-wide text-rose-700 uppercase">Skenario A</span>
                      {data.scenarios.cutLoss.actionRecommended && (
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                          Disarankan AI
                        </span>
                      )}
                    </div>

                    {/* Kesesuaian Tipe Badge */}
                    {data.scenarios.cutLoss.suitabilityTitle && (
                      <div
                        className={`mb-3 rounded-xl border p-3 ${
                          data.scenarios.cutLoss.suitabilityColor || 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                      >
                        <span className="block text-xs font-bold tracking-wide">
                          {data.scenarios.cutLoss.suitabilityTitle}
                        </span>
                        <span className="mt-1 block text-xs leading-snug opacity-90">
                          {data.scenarios.cutLoss.suitabilityReason}
                        </span>
                      </div>
                    )}

                    <h4 className="mb-2 text-base font-bold text-slate-900">{data.scenarios.cutLoss.title}</h4>
                    <p className="mb-3.5 text-sm leading-relaxed text-slate-600">
                      {data.scenarios.cutLoss.description}
                    </p>

                    {/* Checklist Panduan Memilih */}
                    {data.scenarios.cutLoss.checklist && data.scenarios.cutLoss.checklist.length > 0 && (
                      <div className="mb-3.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                        <span className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                          Pilih Opsi Ini Jika:
                        </span>
                        <ul className="space-y-1.5">
                          {data.scenarios.cutLoss.checklist.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                              <span className="mt-0.5 font-bold text-rose-500">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-2.5 border-t border-slate-100 pt-3.5">
                    <div className="font-mono text-xs font-bold text-rose-600">
                      Potensi modal terselamatkan: {formatRupiah(data.scenarios.cutLoss.lossSavedIfSupportBroken)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDiscussion('cutLoss')}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800"
                    >
                      <MessageSquare className="h-4 w-4 text-rose-600" />
                      <span>Bedah Logika &amp; Diskusi AI</span>
                    </button>
                  </div>
                </div>

                {/* Option B: Precision Average Down */}
                <div
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 transition-all ${
                    data.scenarios.averageDown.actionRecommended
                      ? 'border-purple-300 shadow-sm ring-2 ring-purple-100'
                      : 'border-slate-200 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-xs font-bold tracking-wide text-purple-700 uppercase">Skenario B</span>
                      {data.scenarios.averageDown.actionRecommended && (
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                          Disarankan AI
                        </span>
                      )}
                    </div>

                    {/* Kesesuaian Tipe Badge */}
                    {data.scenarios.averageDown.suitabilityTitle && (
                      <div
                        className={`mb-3 rounded-xl border p-3 ${
                          data.scenarios.averageDown.suitabilityColor ||
                          'border-purple-200 bg-purple-50 text-purple-800'
                        }`}
                      >
                        <span className="block text-xs font-bold tracking-wide">
                          {data.scenarios.averageDown.suitabilityTitle}
                        </span>
                        <span className="mt-1 block text-xs leading-snug opacity-90">
                          {data.scenarios.averageDown.suitabilityReason}
                        </span>
                      </div>
                    )}

                    <h4 className="mb-2 text-base font-bold text-slate-900">{data.scenarios.averageDown.title}</h4>
                    <p className="mb-3.5 text-sm leading-relaxed text-slate-600">
                      {data.scenarios.averageDown.description}
                    </p>

                    {/* Cash Feasibility Check Alert */}
                    {data.scenarios.averageDown.cashStatusNote && (
                      <div
                        className={`mb-3.5 rounded-xl border p-3.5 text-xs ${
                          data.scenarios.averageDown.cashSufficient
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-sm font-bold">
                          {data.scenarios.averageDown.cashSufficient ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          )}
                          <span>
                            {data.scenarios.averageDown.cashSufficient
                              ? 'Kondisi Kas: Mencukupi'
                              : 'Kondisi Kas: Belum Mencukupi'}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{data.scenarios.averageDown.cashStatusNote}</p>
                      </div>
                    )}

                    {/* Checklist Panduan Memilih */}
                    {data.scenarios.averageDown.checklist && data.scenarios.averageDown.checklist.length > 0 && (
                      <div className="mb-3.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                        <span className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                          Pilih Opsi Ini Jika:
                        </span>
                        <ul className="space-y-1.5">
                          {data.scenarios.averageDown.checklist.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                              <span className="mt-0.5 font-bold text-purple-600">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-2.5 border-t border-slate-100 pt-3.5">
                    <div className="font-mono text-xs font-bold text-purple-800">
                      Kebutuhan: Beli {data.scenarios.averageDown.minRequiredLot} Lot @ Rp{' '}
                      {formatNumber(Math.round(data.scenarios.averageDown.suggestedEntryPrice))} (
                      {formatRupiah(Math.round(data.scenarios.averageDown.capitalRequired))})
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDiscussion('averageDown')}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-purple-800"
                    >
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <span>Bedah Logika &amp; Diskusi AI</span>
                    </button>
                  </div>
                </div>

                {/* Option C: Hold for BEP Rebound */}
                <div
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 transition-all ${
                    data.scenarios.holdForBep.actionRecommended
                      ? 'border-amber-300 shadow-sm ring-2 ring-amber-100'
                      : 'border-slate-200 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-xs font-bold tracking-wide text-amber-800 uppercase">Skenario C</span>
                      {data.scenarios.holdForBep.actionRecommended && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          Disarankan AI
                        </span>
                      )}
                    </div>

                    {/* Kesesuaian Tipe Badge */}
                    {data.scenarios.holdForBep.suitabilityTitle && (
                      <div
                        className={`mb-3 rounded-xl border p-3 ${
                          data.scenarios.holdForBep.suitabilityColor || 'border-blue-200 bg-blue-50 text-blue-800'
                        }`}
                      >
                        <span className="block text-xs font-bold tracking-wide">
                          {data.scenarios.holdForBep.suitabilityTitle}
                        </span>
                        <span className="mt-1 block text-xs leading-snug opacity-90">
                          {data.scenarios.holdForBep.suitabilityReason}
                        </span>
                      </div>
                    )}

                    <h4 className="mb-2 text-base font-bold text-slate-900">{data.scenarios.holdForBep.title}</h4>
                    <p className="mb-3.5 text-sm leading-relaxed text-slate-600">
                      {data.scenarios.holdForBep.description}
                    </p>

                    {/* Checklist Panduan Memilih */}
                    {data.scenarios.holdForBep.checklist && data.scenarios.holdForBep.checklist.length > 0 && (
                      <div className="mb-3.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                        <span className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                          Pilih Opsi Ini Jika:
                        </span>
                        <ul className="space-y-1.5">
                          {data.scenarios.holdForBep.checklist.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                              <span className="mt-0.5 font-bold text-amber-600">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-2.5 border-t border-slate-100 pt-3.5">
                    <div className="font-mono text-xs font-bold text-amber-800">
                      Target Exit Rebound: Rp {formatNumber(Math.round(data.scenarios.holdForBep.realisticExitPrice))} (
                      {data.scenarios.holdForBep.expectedDays})
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDiscussion('holdForBep')}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800"
                    >
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                      <span>Bedah Logika &amp; Diskusi AI</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Kalkulator Average Down Presisi */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
                  <div>
                    <label className="mb-1 block font-medium text-slate-700">Harga Rencana Cicil Bawah (Rp)</label>
                    <input
                      type="number"
                      value={targetBuyPrice}
                      onChange={e => setTargetBuyPrice(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-purple-600 focus:outline-none"
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Disarankan di Major Support: Rp {formatNumber(Math.round(data.supportMajor))}
                    </span>
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-700">
                      Target Avg Price Baru Yang Diinginkan (Rp)
                    </label>
                    <input
                      type="number"
                      value={targetAvgPrice}
                      onChange={e => setTargetAvgPrice(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-purple-600 focus:outline-none"
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      Avg saat ini: Rp {formatNumber(Math.round(data.avgPrice))}
                    </span>
                  </div>

                  {/* SOP Panduan Eksekusi */}
                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                    <span className="block text-xs font-bold text-slate-800">📌 Kapan Tombol Ditekan?</span>
                    <p className="leading-relaxed">
                      Tekan tombol &quot;Terapkan ke Trading Plan&quot; <strong>hanya jika</strong> harga sudah
                      menyentuh level support dan terkonfirmasi rebound (candle hijau/hammer), serta kas tersedia telah
                      mencukupi.
                    </p>
                  </div>
                </div>

                {/* Calculation Outputs */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
                  <div>
                    <span className="mb-3 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Hasil Simulasi Kalkulasi
                    </span>

                    {calcResult.error ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                        {calcResult.error}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Lot Tambahan
                          </span>
                          <span className="font-mono text-2xl font-bold text-purple-700">
                            +{formatNumber(calcResult.addLot)} Lot
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            Total lot jadi: {data.lot + calcResult.addLot} Lot
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Modal Tambahan
                          </span>
                          <span className="font-mono text-xl font-bold text-slate-900">
                            {formatRupiah(calcResult.capital)}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            Di harga Rp {formatNumber(targetBuyPrice)}
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <span className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Avg Price Baru
                          </span>
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
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>
                            Modal butuh {formatRupiah(calcResult.capital)}, kas tersedia{' '}
                            {formatRupiah(data.cashBalance)} (Kurang{' '}
                            {formatRupiah(calcResult.capital - data.cashBalance)})
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          `Simulasi average down ${calcResult.addLot} lot pada ${data.ticker} siap diaplikasikan ke trading plan!`,
                        )
                      }
                      className="shrink-0 cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-500"
                    >
                      Terapkan ke Trading Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Diskusi / Bedah Logika Skenario AI */}
      {activeScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-150">
            {/* Modal Header */}
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-base font-bold text-slate-900">
                      {selectedTicker} — {discussionData?.scenarioTitle || 'Bedah Skenario'}
                    </h3>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    {discussionData?.source && discussionData.source !== 'rule_based' ? (
                      <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 shadow-2xs">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />{' '}
                        {discussionData.source === '9router' ? '9Router AI' : 'AI Copilot'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-2xs">
                        ⚡ Rule-Based Expert Engine
                      </span>
                    )}

                    {discussionData?.fromDb ? (
                      <span
                        className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800 shadow-2xs"
                        title="Data hasil analisis diambil dari cache database lokal (0 Token AI terpakai)"
                      >
                        <Database className="h-3 w-3 text-purple-600" /> Tersimpan di Database (0 Token)
                      </span>
                    ) : discussionData?.source && discussionData.source !== 'rule_based' ? (
                      <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 shadow-2xs">
                        <Sparkles className="h-3 w-3 text-emerald-600" /> Live AI Analysis
                      </span>
                    ) : null}

                    <span className="text-xs text-slate-500">• Analisis Mendalam &amp; Tanya Jawab</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleCloseDiscussion}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
              {isDiscussionLoading ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center text-slate-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-600 border-t-transparent"></div>
                  <p className="text-sm font-medium text-slate-600">
                    Sedang membedah logika finansial &amp; risiko skenario...
                  </p>
                </div>
              ) : discussionData?.deepDive ? (
                <>
                  {/* Alert Banner if result is Rule-Based with Retry button */}
                  {discussionData?.source === 'rule_based' && (
                    <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-2xs sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                          Analisis saat ini menggunakan <strong>Expert Rule-Based Engine</strong>. Anda dapat mencoba
                          analisis ulang dengan AI.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRetryDeepDive}
                        disabled={isDiscussionLoading}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-amber-500 disabled:opacity-50 sm:self-auto"
                      >
                        <RotateCw className={`h-3.5 w-3.5 ${isDiscussionLoading ? 'animate-spin' : ''}`} />
                        <span>Coba Ulang dengan AI</span>
                      </button>
                    </div>
                  )}

                  {/* 4 Deep Dive Cards */}
                  <div className="space-y-3">
                    {/* Core Logic */}
                    <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                      <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-purple-900">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-600" />
                        <span>Logika Utama: Mengapa Opsi Ini Terpilih?</span>
                      </div>
                      <MarkdownText
                        content={discussionData.deepDive.coreLogic}
                        className="text-sm leading-relaxed text-slate-700"
                      />
                    </div>

                    {/* Invalidation Risk */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-amber-900">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>Kondisi Risiko &amp; Batas Invalidasi (Plan B):</span>
                      </div>
                      <MarkdownText
                        content={discussionData.deepDive.invalidationRisk}
                        className="text-sm leading-relaxed text-slate-700"
                      />
                    </div>

                    {/* Cashflow & Timeline */}
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-emerald-900">
                        <Coins className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>Kalkulasi Arus Kas &amp; Estimasi Waktu:</span>
                      </div>
                      <MarkdownText
                        content={discussionData.deepDive.cashflowAndTimeline}
                        className="text-sm leading-relaxed text-slate-700"
                      />
                    </div>

                    {/* Tomorrow Action Plan */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Clock className="h-4 w-4 shrink-0 text-slate-700" />
                        <span>Rencana Aksi Konkret Sebelum Jam 09:00 WIB Besok:</span>
                      </div>
                      <div className="space-y-1.5">
                        {discussionData.deepDive.tomorrowActionPlan?.map((plan, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                              {idx + 1}
                            </span>
                            <span className="flex-1">
                              <MarkdownText content={plan} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Interactive Q&A */}
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Bot className="h-4 w-4 shrink-0 text-purple-600" />
                        <span>Tanya Jawab Lanjutan dengan AI Copilot</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {chatHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearChatHistory}
                            className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Bersihkan riwayat chat sesi hari ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Bersihkan Riwayat</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expiry / Session Info Banner */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        Riwayat chat tersimpan khusus sesi hari ini (otomatis dihapus saat market close 17:30 WIB).
                      </span>
                    </div>

                    {/* Chat history */}
                    {chatHistory.length > 0 && (
                      <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                        {chatHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                              item.role === 'user'
                                ? 'ml-8 border border-purple-200 bg-purple-100/70 text-purple-900 shadow-2xs'
                                : 'mr-4 border border-slate-200 bg-slate-100/90 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="mb-1.5 flex items-center justify-between border-b border-slate-200/50 pb-1">
                              <strong className="block font-mono text-xs font-bold uppercase opacity-80">
                                {item.role === 'user' ? 'Pertanyaan Anda' : 'Jawaban AI Copilot'}
                              </strong>
                              {item.role === 'assistant' && (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`flex items-center gap-1 rounded-md border px-2 py-0.5 font-sans text-[10px] font-bold shadow-2xs ${
                                      item.source && item.source !== 'rule_based'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-300 bg-slate-200/80 text-slate-700'
                                    }`}
                                  >
                                    {item.source && item.source !== 'rule_based' ? (
                                      <>
                                        <Sparkles className="h-3 w-3 text-emerald-600" />
                                        <span>
                                          {item.source === '9router'
                                            ? 'Dibalas oleh 9Router AI'
                                            : 'Dibalas oleh AI Copilot'}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span>⚡ Dibalas oleh Rule-Based</span>
                                      </>
                                    )}
                                  </span>

                                  {item.source === 'rule_based' && (
                                    <button
                                      type="button"
                                      onClick={() => handleRetryQuestion(idx)}
                                      disabled={retryingIndex !== null || isSubmittingQuestion}
                                      className="flex cursor-pointer items-center gap-1 rounded-md border border-purple-200 bg-white px-2 py-0.5 font-sans text-[10px] font-bold text-purple-700 shadow-2xs transition-colors hover:bg-purple-50 hover:text-purple-900 disabled:opacity-50"
                                      title="Kirim ulang pertanyaan ke model AI"
                                    >
                                      {retryingIndex === idx ? (
                                        <>
                                          <div className="border-1.5 h-2.5 w-2.5 animate-spin rounded-full border-purple-600 border-t-transparent"></div>
                                          <span>Mencoba AI...</span>
                                        </>
                                      ) : (
                                        <>
                                          <RotateCw className="h-2.5 w-2.5 text-purple-600" />
                                          <span>Coba Lagi dengan AI</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {item.role === 'user' ? (
                              <div className="font-medium whitespace-pre-line">{item.text}</div>
                            ) : (
                              <MarkdownText content={item.text} className="text-xs leading-relaxed text-slate-800" />
                            )}
                          </div>
                        ))}
                        {isSubmittingQuestion && (
                          <div className="mr-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-3.5 text-xs text-slate-500">
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                            <span>Menyusun jawaban objektif...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Question Chips */}
                    {discussionData.suggestedQuestions && discussionData.suggestedQuestions.length > 0 && (
                      <div>
                        <span className="mb-1.5 block text-xs font-medium text-slate-500">
                          Pertanyaan Cepat Rekomendasi:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {discussionData.suggestedQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAskQuestion(q)}
                              disabled={isSubmittingQuestion}
                              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                            >
                              💬 {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Input */}
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        if (customQuestion.trim()) handleAskQuestion(customQuestion);
                      }}
                      className="mt-2 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={customQuestion}
                        onChange={e => setCustomQuestion(e.target.value)}
                        placeholder="Ketik pertanyaan lanjutan untuk skenario ini..."
                        disabled={isSubmittingQuestion}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-purple-600 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!customQuestion.trim() || isSubmittingQuestion}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                        <span>Kirim</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400">
                  Tidak ada data analisis skenario yang tersedia.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-3.5 px-5 text-xs text-slate-500">
              <span>Gunakan panduan ini secara objektif sebelum jam bursa buka.</span>
              <button
                type="button"
                onClick={handleCloseDiscussion}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
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
