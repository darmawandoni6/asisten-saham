'use client';

import { useEffect, useState } from 'react';

import { AlertCircle, Check, Wallet, X } from 'lucide-react';

import { api } from '@/lib/api';

interface EditBalanceModalProps {
  isOpen: boolean;
  currentBalance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export function EditBalanceModal({ isOpen, currentBalance, onClose, onSuccess }: EditBalanceModalProps) {
  const [balanceInput, setBalanceInput] = useState<string>(currentBalance.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBalanceInput(Math.round(currentBalance || 0).toString());
      setError(null);
    }
  }, [isOpen, currentBalance]);

  if (!isOpen) return null;

  const numericValue = parseInt(balanceInput.replace(/\D/g, ''), 10) || 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericValue < 0) {
      setError('Saldo kas tidak boleh negatif.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await api.updateCashBalance(numericValue);
      onSuccess(numericValue);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui saldo kas.');
    } finally {
      setIsSaving(false);
    }
  };

  const addAmount = (amount: number) => {
    setBalanceInput((numericValue + amount).toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Update Saldo Kas RDN</h3>
              <p className="text-xs text-slate-500">Saldo kas aktif untuk trading & averaging down</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Nominal Saldo Kas (Rp)
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={numericValue > 0 ? numericValue.toLocaleString('id-ID') : balanceInput}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setBalanceInput(val);
                }}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-11 font-mono text-lg font-medium text-slate-900 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <p className="mb-2 text-[11px] font-medium text-slate-400">Tambah Cepat:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => addAmount(1000000)}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-center text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                +1 Juta
              </button>
              <button
                type="button"
                onClick={() => addAmount(5000000)}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-center text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                +5 Juta
              </button>
              <button
                type="button"
                onClick={() => addAmount(10000000)}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-center text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                +10 Juta
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isSaving ? 'Menyimpan...' : 'Simpan Saldo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
