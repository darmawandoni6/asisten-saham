'use client';

import { AlertTriangle, CheckCircle2, MessageSquare, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatNumber, formatRupiah } from '@/lib/utils';
import { RecoveryAIRecommendation, RecoveryDiagnosis, RecoveryScenarioAdvice } from '@/types';

interface RecoveryScenariosGridProps {
  scenarios: RecoveryDiagnosis['scenarios'];
  aiRecommendation?: RecoveryAIRecommendation;
  onOpenDiscussion: (scenarioId: string) => void;
}

interface ConfidenceBarProps {
  score: number;
}

function ConfidenceBar({ score }: ConfidenceBarProps) {
  const pct = (score / 10) * 100;
  const colorClass = score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-400' : 'bg-rose-400';
  const textColorClass = score >= 7 ? 'text-emerald-700' : score >= 5 ? 'text-amber-700' : 'text-rose-600';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">Keyakinan AI</span>
        <span className={`font-mono font-bold ${textColorClass}`}>{score}/10</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ScenarioCard({
  label,
  colorLabel,
  title,
  description,
  accentColor,
  ringColor,
  badgeClass,
  aiAdvice,
  footer,
  scenarioId,
  onOpenDiscussion,
  checklistColor,
  checklist,
  suitabilityTitle,
  suitabilityColor,
  suitabilityReason,
}: {
  label: string;
  colorLabel: string;
  title: string;
  description: string;
  accentColor: string;
  ringColor: string;
  badgeClass: string;
  aiAdvice?: RecoveryScenarioAdvice;
  footer: React.ReactNode;
  scenarioId: string;
  onOpenDiscussion: (id: string) => void;
  checklistColor: string;
  checklist?: string[];
  suitabilityTitle?: string;
  suitabilityColor?: string;
  suitabilityReason?: string;
}) {
  const isRecommended = aiAdvice?.recommended ?? false;

  return (
    <Card
      className={`flex flex-col justify-between rounded-2xl bg-white p-5 transition-all ${
        isRecommended ? `${accentColor} shadow-sm ${ringColor}` : 'border-slate-200 shadow-2xs'
      }`}
    >
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className={`text-xs font-bold tracking-wide uppercase ${colorLabel}`}>{label}</span>
          {isRecommended && (
            <Badge className={`gap-1 text-xs ${badgeClass}`}>
              <Sparkles className="h-3 w-3" />
              Direkomendasikan
            </Badge>
          )}
        </div>

        {/* Suitability Badge (tipe saham) */}
        {suitabilityTitle && (
          <div
            className={`mb-3 rounded-xl border p-3 ${suitabilityColor || 'border-amber-200 bg-amber-50 text-amber-800'}`}
          >
            <span className="block text-xs font-bold tracking-wide">{suitabilityTitle}</span>
            <span className="mt-1 block text-xs leading-snug opacity-90">{suitabilityReason}</span>
          </div>
        )}

        <h4 className="mb-2 text-base font-bold text-slate-900">{title}</h4>
        <p className="mb-3.5 text-sm leading-relaxed text-slate-600">{description}</p>

        {/* AI Confidence + Lot Suggestion */}
        {aiAdvice && (
          <div className="mb-3.5 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <ConfidenceBar score={aiAdvice.confidence} />
            {aiAdvice.lotSuggestion && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Saran Lot: </span>
                {aiAdvice.lotSuggestion}
              </div>
            )}
            {aiAdvice.reason && <p className="text-xs leading-relaxed text-slate-600">{aiAdvice.reason}</p>}
          </div>
        )}

        {/* Checklist */}
        {checklist && checklist.length > 0 && (
          <div className="mb-3.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
            <span className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
              Pilih Opsi Ini Jika:
            </span>
            <ul className="space-y-1.5">
              {checklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                  <span className={`mt-0.5 font-bold ${checklistColor}`}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-2.5 border-t border-slate-100 pt-3.5">
        {footer}
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenDiscussion(scenarioId)}
          className="w-full gap-2 rounded-xl border-slate-200 bg-slate-50 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-800"
        >
          <MessageSquare className="h-4 w-4 text-purple-600" />
          <span>Bedah Logika &amp; Diskusi AI</span>
        </Button>
      </div>
    </Card>
  );
}

export function RecoveryScenariosGrid({ scenarios, aiRecommendation, onOpenDiscussion }: RecoveryScenariosGridProps) {
  const recs = aiRecommendation?.recommendations;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold tracking-wider text-slate-900 uppercase">
          <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
          <span>3 Skenario Penyelamatan (Pilih Sesuai Tipe &amp; Kas Anda)</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Skenario A: Cut Loss */}
        <ScenarioCard
          label="Cut Loss"
          colorLabel="text-rose-700"
          title={scenarios.cutLoss.title}
          description={scenarios.cutLoss.description}
          accentColor="border-rose-300"
          ringColor="ring-2 ring-rose-100"
          badgeClass="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100"
          aiAdvice={recs?.cutLoss}
          scenarioId="cutLoss"
          onOpenDiscussion={onOpenDiscussion}
          checklistColor="text-rose-500"
          checklist={scenarios.cutLoss.checklist}
          suitabilityTitle={scenarios.cutLoss.suitabilityTitle}
          suitabilityColor={scenarios.cutLoss.suitabilityColor}
          suitabilityReason={scenarios.cutLoss.suitabilityReason}
          footer={
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-rose-600">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Potensi modal terselamatkan: {formatRupiah(scenarios.cutLoss.lossSavedIfSupportBroken)}</span>
            </div>
          }
        />

        {/* Skenario B: Average Down */}
        <ScenarioCard
          label="Average Down"
          colorLabel="text-purple-700"
          title={scenarios.averageDown.title}
          description={scenarios.averageDown.description}
          accentColor="border-purple-300"
          ringColor="ring-2 ring-purple-100"
          badgeClass="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100"
          aiAdvice={recs?.averageDown}
          scenarioId="averageDown"
          onOpenDiscussion={onOpenDiscussion}
          checklistColor="text-purple-600"
          checklist={scenarios.averageDown.checklist}
          suitabilityTitle={scenarios.averageDown.suitabilityTitle}
          suitabilityColor={scenarios.averageDown.suitabilityColor}
          suitabilityReason={scenarios.averageDown.suitabilityReason}
          footer={
            <div className="space-y-1.5">
              {scenarios.averageDown.cashStatusNote && (
                <div
                  className={`flex items-center gap-1.5 rounded-lg border p-2.5 text-xs ${
                    scenarios.averageDown.cashSufficient
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  {scenarios.averageDown.cashSufficient ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  )}
                  <span className="leading-relaxed">{scenarios.averageDown.cashStatusNote}</span>
                </div>
              )}
              <div className="font-mono text-xs font-bold text-purple-800">
                Kebutuhan: Beli {scenarios.averageDown.minRequiredLot} Lot @ Rp{' '}
                {formatNumber(Math.round(scenarios.averageDown.suggestedEntryPrice))} (
                {formatRupiah(Math.round(scenarios.averageDown.capitalRequired))})
              </div>
            </div>
          }
        />

        {/* Skenario C: Hold */}
        <ScenarioCard
          label="Hold"
          colorLabel="text-amber-800"
          title={scenarios.holdForBep.title}
          description={scenarios.holdForBep.description}
          accentColor="border-amber-300"
          ringColor="ring-2 ring-amber-100"
          badgeClass="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"
          aiAdvice={recs?.hold}
          scenarioId="holdForBep"
          onOpenDiscussion={onOpenDiscussion}
          checklistColor="text-amber-600"
          checklist={scenarios.holdForBep.checklist}
          suitabilityTitle={scenarios.holdForBep.suitabilityTitle}
          suitabilityColor={scenarios.holdForBep.suitabilityColor}
          suitabilityReason={scenarios.holdForBep.suitabilityReason}
          footer={
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-800">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>
                Target Exit Rebound: Rp {formatNumber(Math.round(scenarios.holdForBep.realisticExitPrice))} (
                {scenarios.holdForBep.expectedDays})
              </span>
            </div>
          }
        />
      </div>
    </div>
  );
}
