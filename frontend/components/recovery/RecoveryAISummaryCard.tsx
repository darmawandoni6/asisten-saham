'use client';

import { RotateCw, Sparkles, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecoveryAIRecommendation } from '@/types';

interface RecoveryAISummaryCardProps {
  ticker: string;
  aiRecommendation: RecoveryAIRecommendation | undefined;
  isRegenerating: boolean;
  onRegenerate: () => void;
}

export function RecoveryAISummaryCard({
  ticker,
  aiRecommendation,
  isRegenerating,
  onRegenerate,
}: RecoveryAISummaryCardProps) {
  // isAvailable: cukup ada flag available=true dari backend (data sudah pernah di-generate)
  const isAvailable = aiRecommendation?.available === true;
  const source = aiRecommendation?.source;
  const isAI = source && source !== 'rule_based';
  const generatedAt = aiRecommendation?.generatedAt;
  // aiSummary bisa empty string jika AI tidak return field ini — gunakan fallback
  const summaryText =
    aiRecommendation?.aiSummary && aiRecommendation.aiSummary.trim().length > 0
      ? aiRecommendation.aiSummary.trim()
      : aiRecommendation?.recommendations
        ? 'Ringkasan analisis tidak tersedia. Lihat detail keyakinan AI di masing-masing kartu skenario di bawah.'
        : null;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Rekomendasi AI — 3 Skenario Recovery</span>
              {isAvailable &&
                (isAI ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-emerald-200 bg-emerald-100 text-xs text-emerald-800"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>{source === '9router' ? '9Router AI' : 'AI Copilot'}</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="border-slate-200 bg-slate-100 text-xs text-slate-700">
                    ⚡ Rule-Based Engine
                  </Badge>
                ))}
              {isAvailable && generatedAt && <span className="text-xs text-slate-400">— {generatedAt}</span>}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Dihasilkan saat Sinkronisasi EOD. Confidence score dan rekomendasi masing-masing skenario tersaji di kartu
              di bawah.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="h-8 shrink-0 gap-1.5 rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>{isRegenerating ? 'Memproses...' : 'Generate Ulang'}</span>
        </Button>
      </div>

      {/* Tampilkan purple box jika data SUDAH ada (isAvailable=true), amber box jika belum sama sekali */}
      {isAvailable && summaryText !== null ? (
        <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
          <p className="text-sm leading-relaxed text-slate-700">{summaryText}</p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
          <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Rekomendasi AI belum tersedia untuk <strong className="font-mono">{ticker}</strong>. Klik{' '}
            <strong>Sinkronisasi EOD</strong> atau <strong>Generate Ulang</strong> untuk membuat analisis baru.
          </span>
        </div>
      )}
    </Card>
  );
}
