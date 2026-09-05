"use client";

import { useState, useEffect } from "react";
import { X, Wallet, Check, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface EditBalanceModalProps {
  isOpen: boolean;
  currentBalance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export function EditBalanceModal({
  isOpen,
  currentBalance,
  onClose,
  onSuccess,
}: EditBalanceModalProps) {
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

  const numericValue = parseInt(balanceInput.replace(/\D/g, ""), 10) || 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericValue < 0) {
      setError("Saldo kas tidak boleh negatif.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await api.updateCashBalance(numericValue);
      onSuccess(numericValue);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Gagal memperbarui saldo kas.");
    } finally {
      setIsSaving(false);
    }
  };

  const addAmount = (amount: number) => {
    setBalanceInput((numericValue + amount).toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Update Saldo Kas RDN</h3>
              <p className="text-xs text-slate-500">Saldo kas aktif untuk trading & averaging down</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Nominal Saldo Kas (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-sm">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={numericValue > 0 ? numericValue.toLocaleString("id-ID") : balanceInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setBalanceInput(val);
                }}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-medium text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <p className="text-[11px] font-medium text-slate-400 mb-2">Tambah Cepat:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => addAmount(1000000)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-center"
              >
                +1 Juta
              </button>
              <button
                type="button"
                onClick={() => addAmount(5000000)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-center"
              >
                +5 Juta
              </button>
              <button
                type="button"
                onClick={() => addAmount(10000000)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-center"
              >
                +10 Juta
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {isSaving ? "Menyimpan..." : "Simpan Saldo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
