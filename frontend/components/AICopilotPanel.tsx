'use client';

import { useEffect, useRef, useState } from 'react';

import {
  AlertTriangle,
  Bot,
  Clock,
  KeyRound,
  MessageSquare,
  RefreshCw,
  RotateCw,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/utils';
import { AICopilotAnalysisResult, Holding } from '@/types';

import { MarkdownText } from './MarkdownText';

interface AICopilotPanelProps {
  holding: Holding;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AICopilotPanel({ holding, isOpen = true, onClose }: AICopilotPanelProps) {
  const [data, setData] = useState<AICopilotAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTicker, setCurrentTicker] = useState(holding.ticker);

  // Chat state
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; source?: string }>>(
    [],
  );
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [retryingChatIdx, setRetryingChatIdx] = useState<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync state if prop changes during lifecycle without violating effect rules
  if (holding.ticker !== currentTicker) {
    setCurrentTicker(holding.ticker);
    setData(null);
    setChatHistory([]);
    setIsLoading(true);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [analysisRes, historyRes] = await Promise.all([
          api.analyzeStock(holding.ticker, '9router'),
          api.getCopilotChatHistory(holding.ticker).catch(() => []),
        ]);

        if (isMounted) {
          setData(analysisRes as AICopilotAnalysisResult);
          if (Array.isArray(historyRes) && historyRes.length > 0) {
            setChatHistory(
              historyRes.map(h => ({
                role: h.role,
                text: h.message,
                source: h.source,
              })),
            );
          } else {
            setChatHistory([]);
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Pastikan server backend berjalan di port 8000.';
          setData({
            status: 'error',
            error_type: 'AI_ERROR',
            message: 'Gagal terhubung ke server backend AI.',
            detail: errorMessage,
          });
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [holding.ticker]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isSendingChat]);

  // Handle re-analysis (force refresh): wipes chat history & regenerates analysis
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setChatHistory([]); // Clear chat state immediately
    try {
      const res = await api.analyzeStock(holding.ticker, '9router', true);
      setData(res as AICopilotAnalysisResult);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Pastikan server backend berjalan di port 8000.';
      setData({
        status: 'error',
        error_type: 'AI_ERROR',
        message: 'Gagal terhubung ke server backend AI.',
        detail: errorMessage,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear chat history manually
  const handleClearChatHistory = async () => {
    try {
      await api.clearCopilotChatHistory(holding.ticker);
      setChatHistory([]);
    } catch (err) {
      console.warn('Failed to clear chat history:', err);
    }
  };

  // Send a question to AI
  const handleSendChat = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isSendingChat) return;

    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setIsSendingChat(true);

    try {
      const res = await api.sendCopilotChat(holding.ticker, { question: q });
      if (res && res.answer) {
        setChatHistory(prev => [...prev, { role: 'assistant', text: res.answer, source: res.source }]);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kendala saat menghubungi AI.';
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Maaf, kendala memproses pertanyaan: ${errMsg}. Silakan coba lagi.`,
          source: 'rule_based',
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Retry a question with AI if answered by rule-based fallback
  const handleRetryChat = async (assistantIdx: number) => {
    if (retryingChatIdx !== null || isSendingChat) return;
    let qText = '';
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (chatHistory[i].role === 'user') {
        qText = chatHistory[i].text;
        break;
      }
    }
    if (!qText) return;

    setRetryingChatIdx(assistantIdx);
    try {
      const res = await api.sendCopilotChat(holding.ticker, {
        question: qText,
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
      console.warn('Retry chat error:', err);
    } finally {
      setRetryingChatIdx(null);
    }
  };

  const getRecommendationVariant = (rec?: string): 'destructive' | 'emerald' | 'purple' | 'amber' => {
    switch (rec) {
      case 'CUT LOSS':
      case 'SELL ALL':
        return 'destructive';
      case 'TRIM 50%':
      case 'BUY MORE':
        return 'emerald';
      case 'AVERAGE DOWN':
        return 'purple';
      default:
        return 'amber';
    }
  };

  const getQuickQuestions = (rec?: string) => {
    switch (rec) {
      case 'CUT LOSS':
      case 'SELL ALL':
        return [
          'Kenapa harus cut loss sekarang?',
          'Apakah ada potensi pantulan dari support?',
          'Bisa ditunggu sampai sesi 2 besok?',
        ];
      case 'TRIM 50%':
        return [
          'Kenapa perlu kunci profit separuh sekarang?',
          'Di level berapa pasang trailing stop untuk sisa lot?',
          'Kapan waktu terbaik jual seluruh sisa lot?',
        ];
      case 'AVERAGE DOWN':
      case 'BUY MORE':
        return [
          'Di harga berapa idealnya cicil beli?',
          'Berapa batas lot yang aman dibeli?',
          'Apa sinyal konfirmasi pembalikan arah?',
        ];
      default: // HOLD
        return [
          'Kenapa disarankan HOLD?',
          'Berapa target take profit ideal saya?',
          'Di mana batas risiko atau stop loss saya?',
        ];
    }
  };

  if (!holding) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent className="flex max-h-[88vh] max-w-3xl flex-col overflow-hidden p-0 sm:max-h-[90vh]">
        {/* 1. Fixed Header (shadcn/ui DialogHeader pattern) */}
        <DialogHeader className="z-10 flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xs sm:px-6 sm:py-4.5">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-mono text-base leading-tight font-bold text-slate-900 sm:text-lg">
                  {holding.ticker}
                </DialogTitle>
                <span className="hidden text-xs text-slate-500 sm:inline">({holding.name})</span>
                <Badge variant="emerald" className="gap-1 shadow-2xs">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  9Router AI
                </Badge>
              </div>
              <DialogDescription className="mt-0.5 text-left text-xs text-slate-500">
                Evaluasi EOD • Tipe:{' '}
                <span className="font-mono font-semibold text-slate-700 uppercase">{holding.jenis}</span>
              </DialogDescription>
            </div>
          </div>

          {/* Action Controls & Close */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              title="Analisis ulang dan hapus riwayat chat sesi ini"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Menganalisis...' : 'Analisis Ulang'}</span>
            </Button>

            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} title="Tutup Panel">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 2. Scrollable Body Content (shadcn/ui ScrollArea pattern) */}
        {/* <ScrollArea className="flex-1 px-5 py-5 sm:px-6 sm:py-6"> */}
        <div className="flex-1 overflow-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-5">
            {/* State 1: Loading */}
            {isLoading && (
              <div className="space-y-3 py-20 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
                <h4 className="text-sm font-semibold text-slate-800">Menghubungkan ke 9Router AI...</h4>
                <p className="mx-auto max-w-sm text-xs text-slate-500">
                  Mengolah data teknikal EOD dan trading plan {holding.ticker}
                </p>
              </div>
            )}

            {/* State 2: Alert AI Belum Tersedia (No API Key) */}
            {!isLoading && data?.status === 'unavailable' && (
              <Card className="space-y-3 border-amber-200 bg-amber-50/70 p-5 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-amber-900">API Key 9Router Belum Terpasang</h4>
                        <Badge variant="amber">API Key Diperlukan</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800">
                        {data.message ||
                          'Fitur AI Copilot saat ini belum tersedia karena API Key 9Router belum dikonfigurasi.'}
                      </p>
                    </div>

                    <div className="space-y-2 rounded-lg border border-amber-200 bg-white/90 p-3.5 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <KeyRound className="h-4 w-4 text-amber-600" />
                        <span>Langkah Mudah Konfigurasi 9Router:</span>
                      </div>
                      <ol className="list-inside list-decimal space-y-1 text-xs leading-relaxed text-slate-600">
                        <li>
                          Pastikan gateway 9Router lokal Anda berjalan di{' '}
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-800">
                            http://localhost:20128/v1
                          </code>
                          .
                        </li>
                        <li>Salin API Key dari dashboard 9Router Anda.</li>
                        <li>
                          Simpan di file{' '}
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-800">
                            backend/.env
                          </code>
                          :
                          <div className="mt-1 rounded bg-slate-900 p-2 font-mono text-xs text-emerald-400">
                            NINEROUTER_API_KEY=sk-your-9router-key
                            <br />
                            NINEROUTER_BASE_URL=http://localhost:20128/v1
                            <br />
                            NINEROUTER_MODEL=9router
                          </div>
                        </li>
                      </ol>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleRefresh}
                        className="bg-amber-600 text-white hover:bg-amber-500"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Coba Analisis Lagi</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* State 3: Alert Limit / Token Habis (Quota Exceeded) */}
            {!isLoading && data?.status === 'error' && data?.error_type === 'QUOTA_EXCEEDED' && (
              <Card className="border-rose-200 bg-rose-50/70 p-5 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-300 bg-rose-100 text-rose-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-rose-900">Limit / Kuota AI Habis</h4>
                        <Badge variant="destructive">Rate Limit Exceeded</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-rose-800">
                        {data.message ||
                          'AI belum dapat menjawab saat ini karena limit token atau kuota harian telah habis.'}
                      </p>
                      <p className="mt-1 text-xs text-rose-600">
                        {data.detail || 'Mohon tunggu beberapa saat sebelum mencoba analisis ulang.'}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button variant="destructive" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Coba Lagi Nanti</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* State 4: Generic Error */}
            {!isLoading && data?.status === 'error' && data?.error_type !== 'QUOTA_EXCEEDED' && (
              <Card className="border-slate-200 bg-slate-50 p-5 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">Kendala Memuat AI Copilot</h4>
                    <p className="text-xs text-slate-600">{data.message}</p>
                    <div className="pt-2">
                      <Button variant="default" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Coba Lagi</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* State 5: Success — Full AI Analysis Output */}
            {!isLoading && data?.status === 'success' && (
              <>
                {/* 2.1 Structured Recommendation Banner (shadcn/ui Card style) */}
                <Card className="border-slate-200/80 bg-slate-50/70">
                  <CardContent className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
                    <div>
                      <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        AI Decision Copilot Verdict
                      </span>
                      <div className="mt-1.5 flex items-center gap-3">
                        <Badge
                          variant={getRecommendationVariant(data.recommendation)}
                          className="gap-1.5 px-3 py-1.5 font-mono text-xs font-bold shadow-2xs sm:text-sm"
                        >
                          <Target className="h-4 w-4" />
                          REKOMENDASI: {data.recommendation || 'HOLD'}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Confidence:{' '}
                          <span className="font-mono font-bold text-slate-900">{data.confidence || 90}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Current Condition Summary Badges */}
                    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs shadow-2xs">
                      <div>
                        <span className="block font-sans text-[10px] text-slate-400">Close EOD</span>
                        <span className="font-bold text-slate-900">
                          Rp {formatNumber(Math.round(data.currentPrice || 0))}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div>
                        <span className="block font-sans text-[10px] text-slate-400">Avg Beli</span>
                        <span className="font-bold text-slate-700">
                          Rp {formatNumber(Math.round(data.avgPrice || 0))}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div>
                        <span className="block font-sans text-[10px] text-slate-400">Floating PnL</span>
                        <span className={`font-bold ${(data.pnlPct || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatPercent(data.pnlPct || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2.2 AI Narrative Breakdown Card */}
                <Card className="border-slate-200/80 bg-white shadow-2xs">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle>Rasional & Evaluasi Emosi Pasar (9Router AI)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
                      <MarkdownText content={data.rationale || ''} className="text-sm leading-relaxed text-slate-800" />
                    </div>
                  </CardContent>
                </Card>

                {/* 2.3 Technical Indicators Snapshot Grid */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Snapshot Indikator Teknikal EOD
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <Card className="border-slate-200/80 bg-slate-50 shadow-none">
                      <CardContent className="p-3">
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase">Moving Average</span>
                        <div className="mt-1 font-mono text-xs font-bold text-slate-800">
                          MA20: Rp {formatNumber(Math.round(data.indicators?.ma20 || 0))}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          MA50: Rp {formatNumber(Math.round(data.indicators?.ma50 || 0))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 bg-slate-50 shadow-none">
                      <CardContent className="p-3">
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase">RSI (14 Hari)</span>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold text-slate-900">
                          {data.indicators?.rsi || 50}
                          <Badge
                            variant={
                              (data.indicators?.rsi || 50) > 70
                                ? 'destructive'
                                : (data.indicators?.rsi || 50) < 30
                                  ? 'purple'
                                  : 'secondary'
                            }
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {(data.indicators?.rsi || 50) > 70
                              ? 'Overbought'
                              : (data.indicators?.rsi || 50) < 30
                                ? 'Oversold'
                                : 'Netral'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 bg-slate-50 shadow-none">
                      <CardContent className="p-3">
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                          Support / Resistance
                        </span>
                        <div className="mt-1 font-mono text-xs font-bold text-emerald-700">
                          Supp: Rp {formatNumber(Math.round(data.indicators?.support || 0))}
                        </div>
                        <div className="font-mono text-xs font-bold text-rose-600">
                          Res: Rp {formatNumber(Math.round(data.indicators?.resistance || 0))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200/80 bg-slate-50 shadow-none">
                      <CardContent className="p-3">
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase">Tren & Volume</span>
                        <div className="mt-1 text-xs font-bold text-blue-700">
                          {data.indicators?.trend || 'SIDEWAYS'}
                        </div>
                        <div className="text-xs text-slate-500">
                          Volume: {data.indicators?.volume_status === 'ABOVE_AVG' ? 'Di Atas Rata-rata' : 'Normal'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 2.4 Action Plan Guidance */}
                {data.actionItems && data.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                      Panduan Langkah Konkrit (Action Items)
                    </h4>
                    <div className="space-y-2">
                      {data.actionItems.map((item: string, idx: number) => (
                        <Card key={idx} className="border-slate-200/80 bg-slate-50 shadow-none">
                          <CardContent className="flex items-start gap-2.5 p-3 text-xs text-slate-700">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-mono text-xs font-bold text-emerald-800">
                              {idx + 1}
                            </div>
                            <MarkdownText content={item} className="flex-1 text-sm leading-relaxed text-slate-800" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2.5 Interactive Chat Discussion Section */}
                <div className="space-y-3 pt-2">
                  {/* Section Header */}
                  <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-1 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <MessageSquare className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>Diskusi & Tanya Jawab Rekomendasi AI</span>
                    </div>
                    {chatHistory.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearChatHistory}
                        className="h-7 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        title="Bersihkan riwayat percakapan sesi ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Bersihkan Riwayat</span>
                      </Button>
                    )}
                  </div>

                  {/* Retention Info Banner */}
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>
                      Riwayat diskusi tersimpan khusus sesi ini dan otomatis dibersihkan saat penutupan bursa EOD (17:30
                      WIB).
                    </span>
                  </div>

                  {/* Quick Suggestion Chips */}
                  <div>
                    <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Pertanyaan Cepat Rekomendasi:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {getQuickQuestions(data.recommendation).map((chip, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendChat(chip)}
                          disabled={isSendingChat}
                          className="h-auto bg-slate-50 px-2.5 py-1 text-left text-xs hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          💬 {chip}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Message Stream */}
                  {chatHistory.length > 0 && (
                    <div
                      ref={chatScrollRef}
                      className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 pr-1 sm:max-h-72"
                    >
                      {chatHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl p-3 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'ml-6 border border-emerald-200 bg-emerald-100/70 text-emerald-950 shadow-2xs'
                              : 'mr-4 border border-slate-200 bg-white text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between border-b border-slate-200/60 pb-1">
                            <strong className="block font-mono text-xs font-bold uppercase opacity-80">
                              {msg.role === 'user' ? 'Pertanyaan Anda' : 'Jawaban AI Copilot'}
                            </strong>
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant={msg.source && msg.source !== 'rule_based' ? 'emerald' : 'secondary'}
                                  className="gap-1 px-1.5 py-0 text-[10px]"
                                >
                                  {msg.source && msg.source !== 'rule_based' ? (
                                    <>
                                      <Sparkles className="h-3 w-3 text-emerald-600" />
                                      <span>{msg.source === '9router' ? '9Router AI' : 'AI Copilot'}</span>
                                    </>
                                  ) : (
                                    <span>⚡ Rule-Based</span>
                                  )}
                                </Badge>

                                {msg.source === 'rule_based' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetryChat(idx)}
                                    disabled={retryingChatIdx !== null || isSendingChat}
                                    className="h-6 gap-1 border-emerald-200 px-2 text-[10px] text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
                                    title="Kirim ulang pertanyaan ke model AI"
                                  >
                                    {retryingChatIdx === idx ? (
                                      <>
                                        <div className="border-1.5 h-2.5 w-2.5 animate-spin rounded-full border-emerald-600 border-t-transparent" />
                                        <span>Mencoba AI...</span>
                                      </>
                                    ) : (
                                      <>
                                        <RotateCw className="h-2.5 w-2.5 text-emerald-600" />
                                        <span>Coba Lagi AI</span>
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {msg.role === 'user' ? (
                            <div className="text-xs font-medium whitespace-pre-line">{msg.text}</div>
                          ) : (
                            <MarkdownText content={msg.text} className="text-xs leading-relaxed text-slate-800" />
                          )}
                        </div>
                      ))}

                      {isSendingChat && (
                        <div className="mr-6 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-2xs">
                          <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                          <span>AI Copilot sedang menganalisis pertanyaan Anda...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Fixed Bottom Chat Input Bar (shadcn/ui Input + Button pattern) */}
        {!isLoading && data?.status === 'success' && (
          <div className="z-10 flex shrink-0 items-center gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 backdrop-blur-xs sm:px-6 sm:py-3.5">
            <Input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat(chatInput);
                }
              }}
              disabled={isSendingChat}
              placeholder={`Tanyakan alasan rekomendasi ${holding.ticker}, strategi exit, atau level entry...`}
            />
            <Button
              variant="emerald"
              size="sm"
              onClick={() => handleSendChat(chatInput)}
              disabled={isSendingChat || !chatInput.trim()}
              className="h-9 shrink-0 px-4"
            >
              {isSendingChat ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Kirim</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
