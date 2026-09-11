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
      <DialogContent className="max-w-3xl max-h-[88vh] sm:max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* 1. Fixed Header (shadcn/ui DialogHeader pattern) */}
        <DialogHeader className="flex flex-row items-center justify-between px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 z-10 space-y-0">
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-mono font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  {holding.ticker}
                </DialogTitle>
                <span className="text-xs text-slate-500 hidden sm:inline">({holding.name})</span>
                <Badge variant="emerald" className="gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  9Router AI
                </Badge>
              </div>
              <DialogDescription className="text-[11px] text-slate-500 mt-0.5 text-left">
                Evaluasi EOD • Tipe:{' '}
                <span className="font-semibold uppercase font-mono text-slate-700">{holding.jenis}</span>
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
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Menganalisis...' : 'Analisis Ulang'}</span>
            </Button>

            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} title="Tutup Panel">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 2. Scrollable Body Content (shadcn/ui ScrollArea pattern) */}
        {/* <ScrollArea className="flex-1 px-5 py-5 sm:px-6 sm:py-6"> */}
        <div className="flex-1 px-5 py-5 sm:px-6 sm:py-6 overflow-auto">
          <div className="space-y-5">
            {/* State 1: Loading */}
            {isLoading && (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800">Menghubungkan ke 9Router AI...</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Mengolah data teknikal EOD dan trading plan {holding.ticker}
                </p>
              </div>
            )}

            {/* State 2: Alert AI Belum Tersedia (No API Key) */}
            {!isLoading && data?.status === 'unavailable' && (
              <Card className="border-amber-200 bg-amber-50/70 p-5 space-y-3 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-amber-900">API Key 9Router Belum Terpasang</h4>
                        <Badge variant="amber">API Key Diperlukan</Badge>
                      </div>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        {data.message ||
                          'Fitur AI Copilot saat ini belum tersedia karena API Key 9Router belum dikonfigurasi.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white/90 border border-amber-200 text-xs text-slate-700 space-y-2">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Langkah Mudah Konfigurasi 9Router:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                        <li>
                          Pastikan gateway 9Router lokal Anda berjalan di{' '}
                          <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[10px]">
                            http://localhost:20128/v1
                          </code>
                          .
                        </li>
                        <li>Salin API Key dari dashboard 9Router Anda.</li>
                        <li>
                          Simpan di file{' '}
                          <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[10px]">
                            backend/.env
                          </code>
                          :
                          <div className="mt-1 p-2 bg-slate-900 text-emerald-400 rounded font-mono text-[11px]">
                            NINEROUTER_API_KEY=sk-your-9router-key
                            <br />
                            NINEROUTER_BASE_URL=http://localhost:20128/v1
                            <br />
                            NINEROUTER_MODEL=9router
                          </div>
                        </li>
                      </ol>
                    </div>

                    <div className="pt-1 flex items-center gap-3">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleRefresh}
                        className="bg-amber-600 hover:bg-amber-500 text-white"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
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
                  <div className="w-9 h-9 rounded-lg bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-rose-900">Limit / Kuota AI Habis</h4>
                        <Badge variant="destructive">Rate Limit Exceeded</Badge>
                      </div>
                      <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                        {data.message ||
                          'AI belum dapat menjawab saat ini karena limit token atau kuota harian telah habis.'}
                      </p>
                      <p className="text-[11px] text-rose-600 mt-1">
                        {data.detail || 'Mohon tunggu beberapa saat sebelum mencoba analisis ulang.'}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button variant="destructive" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="w-3.5 h-3.5" />
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
                  <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-sm font-bold text-slate-900">Kendala Memuat AI Copilot</h4>
                    <p className="text-xs text-slate-600">{data.message}</p>
                    <div className="pt-2">
                      <Button variant="default" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="w-3.5 h-3.5" />
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
                <Card className="bg-slate-50/70 border-slate-200/80">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        AI Decision Copilot Verdict
                      </span>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge
                          variant={getRecommendationVariant(data.recommendation)}
                          className="text-xs sm:text-sm font-mono font-bold px-3 py-1.5 gap-1.5 shadow-2xs"
                        >
                          <Target className="w-4 h-4" />
                          REKOMENDASI: {data.recommendation || 'HOLD'}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Confidence:{' '}
                          <span className="font-bold text-slate-900 font-mono">{data.confidence || 90}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Current Condition Summary Badges */}
                    <div className="flex items-center gap-4 text-xs font-mono bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-2xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">Close EOD</span>
                        <span className="font-bold text-slate-900">
                          Rp {formatNumber(Math.round(data.currentPrice || 0))}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">Avg Beli</span>
                        <span className="font-bold text-slate-700">
                          Rp {formatNumber(Math.round(data.avgPrice || 0))}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div>
                        <span className="text-slate-400 text-[10px] block font-sans">Floating PnL</span>
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
                    <div className="p-3.5 rounded-lg bg-slate-50/60 border border-slate-100">
                      <MarkdownText content={data.rationale || ''} className="text-xs leading-relaxed text-slate-800" />
                    </div>
                  </CardContent>
                </Card>

                {/* 2.3 Technical Indicators Snapshot Grid */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Snapshot Indikator Teknikal EOD
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Card className="bg-slate-50 border-slate-200/80 shadow-none">
                      <CardContent className="p-3">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Moving Average</span>
                        <div className="mt-1 text-xs font-mono font-bold text-slate-800">
                          MA20: Rp {formatNumber(Math.round(data.indicators?.ma20 || 0))}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          MA50: Rp {formatNumber(Math.round(data.indicators?.ma50 || 0))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-slate-200/80 shadow-none">
                      <CardContent className="p-3">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">RSI (14 Hari)</span>
                        <div className="mt-1 text-sm font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          {data.indicators?.rsi || 50}
                          <Badge
                            variant={
                              (data.indicators?.rsi || 50) > 70
                                ? 'destructive'
                                : (data.indicators?.rsi || 50) < 30
                                  ? 'purple'
                                  : 'secondary'
                            }
                            className="text-[10px] py-0 px-1.5"
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

                    <Card className="bg-slate-50 border-slate-200/80 shadow-none">
                      <CardContent className="p-3">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Support / Resistance
                        </span>
                        <div className="mt-1 text-xs font-mono text-emerald-700 font-bold">
                          Supp: Rp {formatNumber(Math.round(data.indicators?.support || 0))}
                        </div>
                        <div className="text-xs font-mono text-rose-600 font-bold">
                          Res: Rp {formatNumber(Math.round(data.indicators?.resistance || 0))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-slate-200/80 shadow-none">
                      <CardContent className="p-3">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Tren & Volume</span>
                        <div className="mt-1 text-xs font-bold text-blue-700">
                          {data.indicators?.trend || 'SIDEWAYS'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Volume: {data.indicators?.volume_status === 'ABOVE_AVG' ? 'Di Atas Rata-rata' : 'Normal'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 2.4 Action Plan Guidance */}
                {data.actionItems && data.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Panduan Langkah Konkrit (Action Items)
                    </h4>
                    <div className="space-y-2">
                      {data.actionItems.map((item: string, idx: number) => (
                        <Card key={idx} className="bg-slate-50 border-slate-200/80 shadow-none">
                          <CardContent className="p-3 flex items-start gap-2.5 text-xs text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                              {idx + 1}
                            </div>
                            <MarkdownText content={item} className="text-xs leading-relaxed flex-1 text-slate-800" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2.5 Interactive Chat Discussion Section */}
                <div className="pt-2 space-y-3">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Diskusi & Tanya Jawab Rekomendasi AI</span>
                    </div>
                    {chatHistory.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearChatHistory}
                        className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-7 text-[11px]"
                        title="Bersihkan riwayat percakapan sesi ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Bersihkan Riwayat</span>
                      </Button>
                    )}
                  </div>

                  {/* Retention Info Banner */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Riwayat diskusi tersimpan khusus sesi ini dan otomatis dibersihkan saat penutupan bursa EOD (17:30
                      WIB).
                    </span>
                  </div>

                  {/* Quick Suggestion Chips */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
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
                          className="bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 h-auto py-1 px-2.5 text-xs text-left"
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
                      className="space-y-3 max-h-64 sm:max-h-72 overflow-y-auto pr-1 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                    >
                      {chatHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-emerald-100/70 text-emerald-950 ml-6 border border-emerald-200 shadow-2xs'
                              : 'bg-white text-slate-800 mr-4 border border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200/60">
                            <strong className="block text-[11px] uppercase font-mono font-bold opacity-80">
                              {msg.role === 'user' ? 'Pertanyaan Anda' : 'Jawaban AI Copilot'}
                            </strong>
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant={msg.source && msg.source !== 'rule_based' ? 'emerald' : 'secondary'}
                                  className="text-[10px] py-0 px-1.5 gap-1"
                                >
                                  {msg.source && msg.source !== 'rule_based' ? (
                                    <>
                                      <Sparkles className="w-3 h-3 text-emerald-600" />
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
                                    className="h-6 px-2 text-[10px] gap-1 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border-emerald-200"
                                    title="Kirim ulang pertanyaan ke model AI"
                                  >
                                    {retryingChatIdx === idx ? (
                                      <>
                                        <div className="w-2.5 h-2.5 border-1.5 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                        <span>Mencoba AI...</span>
                                      </>
                                    ) : (
                                      <>
                                        <RotateCw className="w-2.5 h-2.5 text-emerald-600" />
                                        <span>Coba Lagi AI</span>
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {msg.role === 'user' ? (
                            <div className="whitespace-pre-line font-medium text-xs">{msg.text}</div>
                          ) : (
                            <MarkdownText content={msg.text} className="text-xs leading-relaxed text-slate-800" />
                          )}
                        </div>
                      ))}

                      {isSendingChat && (
                        <div className="p-3 rounded-xl bg-white border border-slate-200 mr-6 shadow-2xs flex items-center gap-2.5 text-xs text-slate-600">
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
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
          <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 bg-slate-50/80 backdrop-blur-xs shrink-0 z-10 flex items-center gap-2">
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
              className="h-9 px-4 shrink-0"
            >
              {isSendingChat ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Kirim</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
