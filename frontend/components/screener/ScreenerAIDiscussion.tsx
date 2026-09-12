'use client';

import {
  AlertTriangle,
  Bot,
  Eye,
  HelpCircle,
  Loader2,
  RotateCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  User,
} from 'lucide-react';

import { MarkdownText } from '@/components/MarkdownText';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScreenerDiscussionState } from '@/hooks/useScreenerDiscussion';
import { formatNumber } from '@/lib/utils';
import { ScreenerItem } from '@/types';

interface ScreenerAIDiscussionProps {
  item: ScreenerItem;
  discussion: ScreenerDiscussionState;
  onSendQuestion: (ticker: string, questionText?: string) => void;
  onClearHistory: (ticker: string) => void;
  onInputChange: (ticker: string, text: string) => void;
  onOpenKamus: () => void;
}

export function ScreenerAIDiscussion({
  item,
  discussion,
  onSendQuestion,
  onClearHistory,
  onInputChange,
  onOpenKamus,
}: ScreenerAIDiscussionProps) {
  const disc = discussion || {
    isLoading: false,
    isSending: false,
    data: null,
    messages: [],
    inputQuestion: '',
    error: null,
  };

  const lastAssistantMsg = [...disc.messages].reverse().find(m => m.role === 'assistant');
  const activeSource = lastAssistantMsg?.source || disc.data?.source || item.aiSource;
  const isRuleBased = activeSource === 'rule_based';

  const handleRetryAI = () => {
    const lastUserMsg = [...disc.messages].reverse().find(m => m.role === 'user');
    const questionToRetry =
      lastUserMsg?.message || `Kenapa saham ${item.ticker} ini masuk rekomendasi dan bagaimana prospeknya?`;
    onSendQuestion(item.ticker, questionToRetry);
  };

  const convScore = item.convictionScore ?? disc.data?.conviction_score ?? 8;
  const isConv10 = convScore >= 10;
  const convLabel =
    item.convictionLabel ??
    disc.data?.conviction_label ??
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
          `Kenapa saham ${item.ticker} ini masuk rekomendasi dan bagaimana prospeknya?`,
          `Bisakah saham ${item.ticker} ini saya beli besok pagi pada jam 09:00 WIB?`,
          `Bagaimana kesehatan fundamental (ROE ${item.roePct ?? 'N/A'}% & DER ${item.der ?? 'N/A'}x) emiten ini?`,
          `Berapa batas risiko Stop Loss dan area antre beli idealnya?`,
        ];

  return (
    <div className="space-y-4">
      {/* 1. Conviction Score Bar & Technical Assessment Row */}
      <div className="grid grid-cols-1 gap-3.5 text-xs md:grid-cols-3">
        {/* Box 1: Alasan Rekomendasi (Why Buy) + Snapshot Fundamental */}
        <Card className="space-y-1.5 rounded-xl border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-900 uppercase">
            <span className="text-emerald-600">💡</span>
            <span>Alasan Rekomendasi:</span>
          </div>
          <p className="font-sans leading-relaxed text-slate-700">{item.whyBuy || item.catalyst}</p>
          <div className="space-y-1 pt-1.5 font-mono text-[10px] text-slate-500">
            <div>
              Status MA: <strong className="text-slate-800">{item.maStatus}</strong>
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                MC: <strong>{item.marketCapFormatted || '-'}</strong>
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                Float:{' '}
                <strong>
                  {item.freeFloatPct !== null && item.freeFloatPct !== undefined ? `${item.freeFloatPct}%` : 'N/A'}
                </strong>
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">
                ROE: <strong>{item.roePct !== null && item.roePct !== undefined ? `${item.roePct}%` : 'N/A'}</strong>
              </span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-800">
                DER: <strong>{item.der !== null && item.der !== undefined ? `${item.der}x` : 'N/A'}</strong>
              </span>
            </div>
          </div>
        </Card>

        {/* Box 2: Hal Wajib Dipantau Besok */}
        <Card className="space-y-1.5 rounded-xl border-amber-200/80 bg-amber-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-950 uppercase">
            <Eye className="h-3.5 w-3.5 text-amber-700" />
            <span>Wajib Dipantau Besok (09:00 WIB):</span>
          </div>
          <p className="font-sans leading-relaxed text-slate-800">{item.watchTrigger}</p>
          <div className="pt-1 text-xs font-medium text-amber-900">
            👉 <em>Disiplin entry hanya saat trigger terkonfirmasi.</em>
          </div>
        </Card>

        {/* Box 3: Skor Perhatian & Conviction Level (1-10) */}
        <Card
          className={`space-y-2 rounded-xl p-3.5 shadow-2xs transition-all ${
            isConv10
              ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 ring-1 ring-emerald-200'
              : convScore >= 8
                ? 'border-blue-200 bg-blue-50/70 text-blue-950'
                : 'border-slate-200 bg-white text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
              <Target className={`h-3.5 w-3.5 ${isConv10 ? 'text-emerald-700' : 'text-blue-600'}`} />
              <span>Skor Perhatian Besok:</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenKamus}
              className={`h-auto gap-1 rounded-lg px-2 py-0.5 font-mono text-xs font-black transition-colors ${
                isConv10
                  ? 'border-emerald-700 bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 hover:text-white'
                  : convScore >= 8
                    ? 'border-blue-700 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                    : 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
              title="Buka Kamus Panduan Skor (1-10)"
            >
              <span>{convScore}/10</span>
              <HelpCircle className="h-3 w-3 opacity-70" />
            </Button>
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenKamus}
              className="h-auto p-0 text-left hover:bg-transparent"
              title="Klik untuk melihat penjelasan di Kamus Badge"
            >
              <span className="block text-xs font-bold">
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
            </Button>
            <p className="mt-0.5 text-xs leading-snug opacity-80">
              {isConv10
                ? 'Setup teknikal prima & RRR menguntungkan. Direkomendasikan pasang antrean saat market open 09:00 WIB.'
                : disc.data?.conviction_reason || 'Pantau konfirmasi antrean bid penahan sebelum melakukan entry.'}
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Interactive AI Discussion & Q&A Chat Box */}
      <Card className="space-y-3.5 rounded-2xl border-slate-200 bg-white p-4 shadow-2xs">
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
              <p className="text-xs text-slate-500">
                Tanya jawab interaktif seputar setup teknikal, batas risiko, dan SOP beli besok pagi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Provider Badge */}
            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold ${
                !isRuleBased
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <Sparkles className={`h-3 w-3 ${!isRuleBased ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>
                {activeSource === '9router'
                  ? '9Router AI'
                  : !isRuleBased && activeSource
                    ? 'AI Copilot'
                    : isRuleBased
                      ? 'Rule-Based Expert Engine'
                      : '9Router AI Ready'}
              </span>
            </Badge>

            {/* Retry Button if Rule-Based */}
            {isRuleBased && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetryAI}
                disabled={disc.isSending}
                className="h-6 gap-1 border-amber-300 bg-amber-50 px-2 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
                title="Coba hubungkan kembali ke AI LLM"
              >
                <RotateCw className={`h-2.5 w-2.5 ${disc.isSending ? 'animate-spin' : ''}`} />
                <span>Coba Ulang AI</span>
              </Button>
            )}

            {/* Clear History Button */}
            {disc.messages.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onClearHistory(item.ticker)}
                className="h-6 gap-1 px-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                title="Hapus seluruh riwayat chat saham ini"
              >
                <Trash2 className="h-3 w-3" />
                <span>Hapus Chat</span>
              </Button>
            )}
          </div>
        </div>

        {/* Rule-Based Fallback Alert Banner & Retry CTA */}
        {isRuleBased && (
          <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Mode Offline/Rule-Based:</strong> Respon dihasilkan oleh Expert Engine berbasis indikator.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disc.isSending}
              onClick={handleRetryAI}
              className="h-6.5 shrink-0 gap-1 rounded-lg border-amber-300 bg-white px-2.5 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100"
            >
              <RotateCw className={`h-3 w-3 ${disc.isSending ? 'animate-spin' : ''}`} />
              <span>Hubungkan AI Lagi</span>
            </Button>
          </div>
        )}

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
                <MarkdownText
                  content={
                    disc.data?.answer ||
                    `Saham **${item.ticker}** (${item.name}) masuk rekomendasi strategi **${item.strategy}** dengan Skor Keyakinan **${item.convictionScore ?? 8}/10** dan Rasio Risk:Reward **${item.riskRewardRatio}**.\n\n` +
                      `* **Area Beli Ideal**: ${item.buyArea}\n` +
                      `* **Target Profit (TP)**: Rp ${formatNumber(item.targetPrice || item.resistance)} (+${item.potentialGainPct}%)\n` +
                      `* **Stop Loss (SL)**: Rp ${formatNumber(item.stopLoss || item.support)} (-${item.potentialRiskPct}%)\n\n` +
                      `**Checklist Jam 09:00 WIB**: ${item.watchTrigger}\n\n` +
                      `*👉 Klik tombol **Pertanyaan Cepat** di bawah atau ketik pertanyaan Anda untuk memulai diskusi interaktif bersama 9Router AI.*`
                  }
                  className="text-sm leading-relaxed"
                />
              </div>
            )}

            {/* Multi-Turn Message History */}
            {disc.messages.map((msg, mIdx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={mIdx} className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-800">
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
                    {isUser ? (
                      <p className="text-base">{msg.message}</p>
                    ) : (
                      <MarkdownText content={msg.message} className="text-base" />
                    )}
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
              <Alert variant="destructive" className="flex items-center gap-2 rounded-xl p-2.5 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <AlertDescription>{disc.error}</AlertDescription>
              </Alert>
            )}

            {/* Suggested Questions Chips */}
            <div className="space-y-1.5 pt-1.5">
              <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                💡 Pertanyaan Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {defaultQuestions.map((sq, sqIdx) => (
                  <Button
                    key={sqIdx}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disc.isSending}
                    onClick={() => onSendQuestion(item.ticker, sq)}
                    className="h-auto px-2.5 py-1 text-left text-xs font-medium text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    {sq}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                onSendQuestion(item.ticker);
              }}
              className="flex items-center gap-2 pt-2"
            >
              <Input
                type="text"
                placeholder={`Tanyakan strategi entry, alokasi kas, atau risiko ${item.ticker}...`}
                value={disc.inputQuestion}
                onChange={e => onInputChange(item.ticker, e.target.value)}
                disabled={disc.isSending}
                className="flex-1 text-xs"
              />
              <Button
                type="submit"
                variant="emerald"
                size="sm"
                disabled={disc.isSending || !disc.inputQuestion.trim()}
                className="shrink-0 gap-1.5 rounded-xl font-bold shadow-2xs"
              >
                {disc.isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Kirim</span>
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
