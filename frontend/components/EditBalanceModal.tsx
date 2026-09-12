'use client';

import { useState } from 'react';

import { AlertCircle, Check, Wallet, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

interface EditBalanceModalProps {
  isOpen: boolean;
  currentBalance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export function EditBalanceModal({ isOpen, currentBalance, onClose, onSuccess }: EditBalanceModalProps) {
  const [balanceInput, setBalanceInput] = useState<string>(Math.round(currentBalance || 0).toString());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setBalanceInput(Math.round(currentBalance || 0).toString());
      setIsSaving(false);
      setError(null);
    }
  }

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
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-md">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">Update Saldo Kas RDN</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Saldo kas aktif untuk trading &amp; averaging down
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
            <span className="sr-only">Tutup</span>
          </DialogClose>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4 p-6">
          {error && (
            <Alert variant="destructive" className="p-3 text-xs">
              <AlertDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="balance-input" className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Nominal Saldo Kas (Rp)
            </Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-slate-400">
                Rp
              </span>
              <Input
                id="balance-input"
                type="text"
                inputMode="numeric"
                value={numericValue > 0 ? numericValue.toLocaleString('id-ID') : balanceInput}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setBalanceInput(val);
                }}
                placeholder="0"
                className="py-2.5 pr-4 pl-11 font-mono text-lg font-medium text-slate-900 focus-visible:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <p className="mb-2 text-[11px] font-medium text-slate-400">Tambah Cepat:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addAmount(1000000)}
                className="rounded-lg text-xs font-medium"
              >
                +1 Juta
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addAmount(5000000)}
                className="rounded-lg text-xs font-medium"
              >
                +5 Juta
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addAmount(10000000)}
                className="rounded-lg text-xs font-medium"
              >
                +10 Juta
              </Button>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="-mx-6 -mb-6 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              Batal
            </Button>
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={isSaving}
              className="gap-1.5 rounded-xl shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              {isSaving ? 'Menyimpan...' : 'Simpan Saldo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
