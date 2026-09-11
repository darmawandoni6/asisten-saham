'use client';

import { Compass, Loader2, Plus, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ScreenerCustomAnalyzerProps {
  customTickerInput: string;
  setCustomTickerInput: (val: string) => void;
  isAnalyzingCustom: boolean;
  customFeedback: {
    type: 'success' | 'error';
    message: string;
  } | null;
  setCustomFeedback: (val: { type: 'success' | 'error'; message: string } | null) => void;
  handleAnalyzeCustomTicker: () => void;
}

export function ScreenerCustomAnalyzer({
  customTickerInput,
  setCustomTickerInput,
  isAnalyzingCustom,
  customFeedback,
  setCustomFeedback,
  handleAnalyzeCustomTicker,
}: ScreenerCustomAnalyzerProps) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-2xs">
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
            <Input
              type="text"
              placeholder="Ketik Kode Ticker (cth: BREN)..."
              value={customTickerInput}
              onChange={e => setCustomTickerInput(e.target.value.toUpperCase())}
              disabled={isAnalyzingCustom}
              className="font-mono text-xs text-slate-900 uppercase placeholder:font-normal"
            />
          </div>

          <Button
            type="submit"
            variant="emerald"
            size="sm"
            disabled={isAnalyzingCustom || !customTickerInput.trim()}
            className="shrink-0 gap-1.5 rounded-xl font-bold shadow-2xs"
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
          </Button>
        </form>
      </div>

      {/* Feedback Alerts */}
      {customFeedback && (
        <Alert
          variant={customFeedback.type === 'success' ? 'default' : 'destructive'}
          className={`animate-in fade-in mt-3.5 flex items-center justify-between rounded-xl border p-3 text-xs duration-150 ${
            customFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <AlertDescription className="flex items-center gap-2">
            <span className="font-bold">{customFeedback.type === 'success' ? '✅ Sukses:' : '⚠️ Gagal:'}</span>
            <span>{customFeedback.message}</span>
          </AlertDescription>
          <button
            type="button"
            onClick={() => setCustomFeedback(null)}
            className="ml-4 cursor-pointer text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Alert>
      )}
    </Card>
  );
}
