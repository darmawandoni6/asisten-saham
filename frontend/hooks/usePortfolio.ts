'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { Holding } from '@/types';

export interface AddHoldingPayload {
  ticker: string;
  avgPrice: number;
  lot: number;
  targetPrice?: number;
  stopLoss?: number;
  sector?: string;
  buyReason?: string;
  jenis: 'trading' | 'investasi';
}

export interface UsePortfolioReturn {
  holdings: Holding[];
  cashBalance: number;
  isLoading: boolean;
  loadPortfolio: () => Promise<void>;
  addHolding: (payload: AddHoldingPayload) => Promise<void>;
  deleteHolding: (id: number) => Promise<void>;
  setHoldings: React.Dispatch<React.SetStateAction<Holding[]>>;
  setCashBalance: React.Dispatch<React.SetStateAction<number>>;
  totalCost: number;
  sectorMap: Record<string, number>;
}

export function usePortfolio(): UsePortfolioReturn {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(168755);
  const [isLoading, setIsLoading] = useState(true);

  const loadPortfolio = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboard();
      if (data && data.holdings) {
        setHoldings(data.holdings);
      }
      if (data && data.summary && data.summary.cashBalance !== undefined) {
        setCashBalance(data.summary.cashBalance);
      } else {
        const balRes = await api.getCashBalance();
        if (balRes && balRes.cash_balance !== undefined) {
          setCashBalance(balRes.cash_balance);
        }
      }
    } catch (e) {
      console.warn('Portfolio API offline:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    api
      .getDashboard()
      .then(async data => {
        if (!isMounted) return;
        if (data && data.holdings) {
          setHoldings(data.holdings);
        }
        if (data && data.summary && data.summary.cashBalance !== undefined) {
          setCashBalance(data.summary.cashBalance);
        } else {
          const balRes = await api.getCashBalance().catch(() => null);
          if (isMounted && balRes && balRes.cash_balance !== undefined) {
            setCashBalance(balRes.cash_balance);
          }
        }
      })
      .catch(e => {
        if (!isMounted) return;
        console.warn('Portfolio API offline:', e);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const addHolding = useCallback(
    async (payload: AddHoldingPayload) => {
      const priceNum = payload.avgPrice;
      const lotNum = payload.lot;
      const tpNum = payload.targetPrice
        ? payload.targetPrice
        : payload.jenis === 'investasi'
          ? priceNum * 1.3
          : priceNum * 1.15;
      const slNum = payload.jenis === 'investasi' ? undefined : payload.stopLoss ? payload.stopLoss : priceNum * 0.93;

      try {
        await api.createHolding({
          ticker: payload.ticker,
          avg_price: priceNum,
          lot: lotNum,
          target_price: tpNum,
          stop_loss: slNum,
          sector: payload.sector || undefined,
          buy_reason: payload.buyReason,
          jenis: payload.jenis,
        });
        await loadPortfolio();
      } catch (err) {
        console.warn('Fallback local holding creation:', err);
        const newHolding: Holding = {
          id: Date.now(),
          ticker: payload.ticker.toUpperCase().includes('.JK')
            ? payload.ticker.toUpperCase()
            : `${payload.ticker.toUpperCase()}.JK`,
          name: `${payload.ticker.toUpperCase()} Tbk`,
          sector: payload.sector || '—',
          jenis: payload.jenis,
          avgPrice: priceNum,
          lot: lotNum,
          shares: lotNum * 100,
          currentPrice: priceNum,
          previousClose: priceNum,
          targetPrice: tpNum,
          stopLoss: slNum ?? null,
          highWatermark: priceNum,
          trailingStopPrice: payload.jenis === 'investasi' ? null : Math.round(priceNum * 0.93),
          floatingPnl: 0,
          floatingPnlPct: 0,
          actionStatus: 'HOLD_MONITOR',
          actionReason: 'Posisi baru ditambahkan ke trading plan.',
          buyReason: payload.buyReason || 'Trading plan entry baru',
          buyDate: new Date().toISOString().split('T')[0],
          rsi: 50.0,
          aboveMa20: true,
          aboveMa50: true,
        };
        setHoldings(prev => [newHolding, ...prev]);
      }
    },
    [loadPortfolio],
  );

  const deleteHolding = useCallback(
    async (id: number) => {
      if (confirm('Hapus saham ini dari pencatatan portofolio?')) {
        try {
          await api.deleteHolding(id);
          await loadPortfolio();
        } catch (err) {
          console.warn('Fallback local holding deletion:', err);
          setHoldings(prev => prev.filter(h => h.id !== id));
        }
      }
    },
    [loadPortfolio],
  );

  const totalCost = useMemo(() => {
    return holdings.reduce((acc, h) => acc + h.avgPrice * h.shares, 0);
  }, [holdings]);

  const sectorMap = useMemo(() => {
    const map: Record<string, number> = {};
    holdings.forEach(h => {
      const cost = h.avgPrice * h.shares;
      map[h.sector] = (map[h.sector] || 0) + cost;
    });
    return map;
  }, [holdings]);

  return {
    holdings,
    cashBalance,
    isLoading,
    loadPortfolio,
    addHolding,
    deleteHolding,
    setHoldings,
    setCashBalance,
    totalCost,
    sectorMap,
  };
}
