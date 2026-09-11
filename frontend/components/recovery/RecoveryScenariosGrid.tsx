'use client';

import { AlertTriangle, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatNumber, formatRupiah } from '@/lib/utils';
import { RecoveryDiagnosis } from '@/types';

interface RecoveryScenariosGridProps {
  scenarios: RecoveryDiagnosis['scenarios'];
  onOpenDiscussion: (scenarioId: string) => void;
}

export function RecoveryScenariosGrid({ scenarios, onOpenDiscussion }: RecoveryScenariosGridProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold tracking-wider text-slate-900 uppercase">
          <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
          <span>3 Skenario Penyelamatan AI (Pilih Sesuai Tipe &amp; Kas Anda)</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Option A: Cut Loss / Trim */}
        <Card
          className={`flex flex-col justify-between rounded-2xl bg-white p-5 transition-all ${
            scenarios.cutLoss.actionRecommended
              ? 'border-rose-300 shadow-sm ring-2 ring-rose-100'
              : 'border-slate-200 shadow-2xs'
          }`}
        >
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide text-rose-700 uppercase">Skenario A</span>
              {scenarios.cutLoss.actionRecommended && (
                <Badge variant="destructive" className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                  Disarankan AI
                </Badge>
              )}
            </div>

            {/* Kesesuaian Tipe Badge */}
            {scenarios.cutLoss.suitabilityTitle && (
              <div
                className={`mb-3 rounded-xl border p-3 ${
                  scenarios.cutLoss.suitabilityColor || 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                <span className="block text-xs font-bold tracking-wide">{scenarios.cutLoss.suitabilityTitle}</span>
                <span className="mt-1 block text-xs leading-snug opacity-90">
                  {scenarios.cutLoss.suitabilityReason}
                </span>
              </div>
            )}

            <h4 className="mb-2 text-base font-bold text-slate-900">{scenarios.cutLoss.title}</h4>
            <p className="mb-3.5 text-sm leading-relaxed text-slate-600">{scenarios.cutLoss.description}</p>

            {/* Checklist Panduan Memilih */}
            {scenarios.cutLoss.checklist && scenarios.cutLoss.checklist.length > 0 && (
              <div className="mb-3.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                <span className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Pilih Opsi Ini Jika:
                </span>
                <ul className="space-y-1.5">
                  {scenarios.cutLoss.checklist.map((item, idx) => (
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
              Potensi modal terselamatkan: {formatRupiah(scenarios.cutLoss.lossSavedIfSupportBroken)}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenDiscussion('cutLoss')}
              className="w-full gap-2 rounded-xl border-slate-200 bg-slate-50 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800"
            >
              <MessageSquare className="h-4 w-4 text-rose-600" />
              <span>Bedah Logika &amp; Diskusi AI</span>
            </Button>
          </div>
        </Card>

        {/* Option B: Precision Average Down */}
        <Card
          className={`flex flex-col justify-between rounded-2xl bg-white p-5 transition-all ${
            scenarios.averageDown.actionRecommended
              ? 'border-purple-300 shadow-sm ring-2 ring-purple-100'
              : 'border-slate-200 shadow-2xs'
          }`}
        >
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide text-purple-700 uppercase">Skenario B</span>
              {scenarios.averageDown.actionRecommended && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  Disarankan AI
                </Badge>
              )}
            </div>

            {/* Kesesuaian Tipe Badge */}
            {scenarios.averageDown.suitabilityTitle && (
              <div
                className={`mb-3 rounded-xl border p-3 ${
                  scenarios.averageDown.suitabilityColor || 'border-purple-200 bg-purple-50 text-purple-800'
                }`}
              >
                <span className="block text-xs font-bold tracking-wide">{scenarios.averageDown.suitabilityTitle}</span>
                <span className="mt-1 block text-xs leading-snug opacity-90">
                  {scenarios.averageDown.suitabilityReason}
                </span>
              </div>
            )}

            <h4 className="mb-2 text-base font-bold text-slate-900">{scenarios.averageDown.title}</h4>
            <p className="mb-3.5 text-sm leading-relaxed text-slate-600">{scenarios.averageDown.description}</p>

            {/* Cash Feasibility Check Alert */}
            {scenarios.averageDown.cashStatusNote && (
              <div
                className={`mb-3.5 rounded-xl border p-3.5 text-xs ${
                  scenarios.averageDown.cashSufficient
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <div className="mb-1 flex items-center gap-1.5 text-sm font-bold">
                  {scenarios.averageDown.cashSufficient ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  <span>
                    {scenarios.averageDown.cashSufficient ? 'Kondisi Kas: Mencukupi' : 'Kondisi Kas: Belum Mencukupi'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{scenarios.averageDown.cashStatusNote}</p>
              </div>
            )}

            {/* Checklist Panduan Memilih */}
            {scenarios.averageDown.checklist && scenarios.averageDown.checklist.length > 0 && (
              <div className="mb-3.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                <span className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Pilih Opsi Ini Jika:
                </span>
                <ul className="space-y-1.5">
                  {scenarios.averageDown.checklist.map((item, idx) => (
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
              Kebutuhan: Beli {scenarios.averageDown.minRequiredLot} Lot @ Rp{' '}
              {formatNumber(Math.round(scenarios.averageDown.suggestedEntryPrice))} (
              {formatRupiah(Math.round(scenarios.averageDown.capitalRequired))})
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenDiscussion('averageDown')}
              className="w-full gap-2 rounded-xl border-slate-200 bg-slate-50 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-800"
            >
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <span>Bedah Logika &amp; Diskusi AI</span>
            </Button>
          </div>
        </Card>

        {/* Option C: Hold for BEP Rebound */}
        <Card
          className={`flex flex-col justify-between rounded-2xl bg-white p-5 transition-all ${
            scenarios.holdForBep.actionRecommended
              ? 'border-amber-300 shadow-sm ring-2 ring-amber-100'
              : 'border-slate-200 shadow-2xs'
          }`}
        >
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide text-amber-800 uppercase">Skenario C</span>
              {scenarios.holdForBep.actionRecommended && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Disarankan AI
                </Badge>
              )}
            </div>

            {/* Kesesuaian Tipe Badge */}
            {scenarios.holdForBep.suitabilityTitle && (
              <div
                className={`mb-3 rounded-xl border p-3 ${
                  scenarios.holdForBep.suitabilityColor || 'border-blue-200 bg-blue-50 text-blue-800'
                }`}
              >
                <span className="block text-xs font-bold tracking-wide">{scenarios.holdForBep.suitabilityTitle}</span>
                <span className="mt-1 block text-xs leading-snug opacity-90">
                  {scenarios.holdForBep.suitabilityReason}
                </span>
              </div>
            )}

            <h4 className="mb-2 text-base font-bold text-slate-900">{scenarios.holdForBep.title}</h4>
            <p className="mb-3.5 text-sm leading-relaxed text-slate-600">{scenarios.holdForBep.description}</p>

            {/* Checklist Panduan Memilih */}
            {scenarios.holdForBep.checklist && scenarios.holdForBep.checklist.length > 0 && (
              <div className="mb-3.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                <span className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Pilih Opsi Ini Jika:
                </span>
                <ul className="space-y-1.5">
                  {scenarios.holdForBep.checklist.map((item, idx) => (
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
              Target Exit Rebound: Rp {formatNumber(Math.round(scenarios.holdForBep.realisticExitPrice))} (
              {scenarios.holdForBep.expectedDays})
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenDiscussion('holdForBep')}
              className="w-full gap-2 rounded-xl border-slate-200 bg-slate-50 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800"
            >
              <MessageSquare className="h-4 w-4 text-amber-600" />
              <span>Bedah Logika &amp; Diskusi AI</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
