'use client';

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Coins,
  Database,
  RotateCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

import { MarkdownText } from '@/components/MarkdownText';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RecoveryChatItem } from '@/hooks/useRecoveryDiscussion';
import { cn } from '@/lib/utils';
import { RecoveryDiscussion } from '@/types';

interface ScenarioDiscussionModalProps {
  isOpen: boolean;
  selectedTicker: string;
  discussionData: RecoveryDiscussion | null;
  isLoading: boolean;
  chatHistory: RecoveryChatItem[];
  customQuestion: string;
  isSubmittingQuestion: boolean;
  retryingIndex: number | null;
  onClose: () => void;
  onAskQuestion: (question: string) => void;
  onRetryDeepDive: () => void;
  onRetryQuestion: (idx: number) => void;
  onClearChatHistory: () => void;
  onChangeCustomQuestion: (val: string) => void;
}

export function ScenarioDiscussionModal({
  isOpen,
  selectedTicker,
  discussionData,
  isLoading,
  chatHistory,
  customQuestion,
  isSubmittingQuestion,
  retryingIndex,
  onClose,
  onAskQuestion,
  onRetryDeepDive,
  onRetryQuestion,
  onClearChatHistory,
  onChangeCustomQuestion,
}: ScenarioDiscussionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-2xl">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="font-mono text-base font-bold text-slate-900">
                  {selectedTicker} — {discussionData?.scenarioTitle || 'Bedah Skenario'}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                {discussionData?.source && discussionData.source !== 'rule_based' ? (
                  <Badge variant="secondary" className="gap-1 border-emerald-200 bg-emerald-100 text-emerald-800">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>{discussionData.source === '9router' ? '9Router AI' : 'AI Copilot'}</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 border-slate-200 bg-slate-100 text-slate-700">
                    ⚡ Rule-Based Expert Engine
                  </Badge>
                )}

                {discussionData?.fromDb ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-purple-200 bg-purple-100 text-[10px] text-purple-800"
                    title="Data hasil analisis diambil dari cache database lokal (0 Token AI terpakai)"
                  >
                    <Database className="h-3 w-3 text-purple-600" />
                    <span>Tersimpan di Database (0 Token)</span>
                  </Badge>
                ) : discussionData?.source && discussionData.source !== 'rule_based' ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>Live AI Analysis</span>
                  </Badge>
                ) : null}

                <span className="text-slate-500">• Analisis Mendalam &amp; Tanya Jawab</span>
              </DialogDescription>
            </div>
          </div>

          <DialogClose className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
            <span className="sr-only">Tutup</span>
          </DialogClose>
        </DialogHeader>

        {/* Modal Body */}
        <ScrollArea className="max-h-[68vh] p-5 text-sm">
          <div className="space-y-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onRetryDeepDive}
                      disabled={isLoading}
                      className="h-7 shrink-0 gap-1.5 bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
                    >
                      <RotateCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                      <span>Coba Ulang dengan AI</span>
                    </Button>
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
                    {chatHistory.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClearChatHistory}
                        className="h-7 gap-1 px-2 text-[11px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        title="Bersihkan riwayat chat sesi hari ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Bersihkan Riwayat</span>
                      </Button>
                    )}
                  </div>

                  {/* Expiry Banner */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>
                      Riwayat chat tersimpan khusus sesi hari ini (otomatis dihapus saat market close 17:30 WIB).
                    </span>
                  </div>

                  {/* Chat History Messages */}
                  {chatHistory.length > 0 && (
                    <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                      {chatHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'rounded-xl p-3.5 text-xs leading-relaxed',
                            item.role === 'user'
                              ? 'ml-8 border border-purple-200 bg-purple-100/70 text-purple-900 shadow-2xs'
                              : 'mr-4 border border-slate-200 bg-slate-100/90 text-slate-800 shadow-2xs',
                          )}
                        >
                          <div className="mb-1.5 flex items-center justify-between border-b border-slate-200/50 pb-1">
                            <strong className="block font-mono text-xs font-bold uppercase opacity-80">
                              {item.role === 'user' ? 'Pertanyaan Anda' : 'Jawaban AI Copilot'}
                            </strong>
                            {item.role === 'assistant' && (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'flex items-center gap-1 rounded-md border px-2 py-0.5 font-sans text-[10px] font-bold shadow-2xs',
                                    item.source && item.source !== 'rule_based'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                      : 'border-slate-300 bg-slate-200/80 text-slate-700',
                                  )}
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
                                    <span>⚡ Dibalas oleh Rule-Based</span>
                                  )}
                                </span>

                                {item.source === 'rule_based' && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onRetryQuestion(idx)}
                                    disabled={retryingIndex !== null || isSubmittingQuestion}
                                    className="h-6 gap-1 border-purple-200 bg-white px-2 text-[10px] font-bold text-purple-700 hover:bg-purple-50"
                                    title="Kirim ulang pertanyaan ke model AI"
                                  >
                                    {retryingIndex === idx ? (
                                      <>
                                        <div className="border-1.5 h-2.5 w-2.5 animate-spin rounded-full border-purple-600 border-t-transparent" />
                                        <span>Mencoba AI...</span>
                                      </>
                                    ) : (
                                      <>
                                        <RotateCw className="h-2.5 w-2.5 text-purple-600" />
                                        <span>Coba Lagi dengan AI</span>
                                      </>
                                    )}
                                  </Button>
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
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
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
                            onClick={() => onAskQuestion(q)}
                            disabled={isSubmittingQuestion}
                            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50"
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
                      if (customQuestion.trim()) onAskQuestion(customQuestion);
                    }}
                    className="mt-2 flex items-center gap-2"
                  >
                    <Input
                      type="text"
                      value={customQuestion}
                      onChange={e => onChangeCustomQuestion(e.target.value)}
                      placeholder="Ketik pertanyaan lanjutan untuk skenario ini..."
                      disabled={isSubmittingQuestion}
                      className="flex-1 bg-slate-50 focus-visible:bg-white focus-visible:ring-purple-600"
                    />
                    <Button
                      type="submit"
                      disabled={!customQuestion.trim() || isSubmittingQuestion}
                      className="gap-1.5 rounded-xl shadow-xs"
                    >
                      <Send className="h-4 w-4" />
                      <span>Kirim</span>
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">
                Tidak ada data analisis skenario yang tersedia.
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Modal Footer */}
        <DialogFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 sm:justify-between">
          <span>Gunakan panduan ini secara objektif sebelum jam bursa buka.</span>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
