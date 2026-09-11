'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { Holding, RecoveryDiagnosis } from '@/types';

export interface AverageDownResult {
  addLot: number;
  capital: number;
  newAvg: number;
  error?: string;
}

export interface UseRecoveryReturn {
  holdings: Holding[];
  selectedTicker: string;
  data: RecoveryDiagnosis | null;
  isLoading: boolean;
  targetBuyPrice: number;
  targetAvgPrice: number;
  setTargetBuyPrice: React.Dispatch<React.SetStateAction<number>>;
  setTargetAvgPrice: React.Dispatch<React.SetStateAction<number>>;
  calcResult: AverageDownResult;
  loadData: () => Promise<void>;
  selectStock: (stock: Holding) => Promise<void>;
}

export function useRecovery(): UseRecoveryReturn {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [data, setData] = useState<RecoveryDiagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive Calculator State
  const [targetBuyPrice, setTargetBuyPrice] = useState<number>(0);
  const [targetAvgPrice, setTargetAvgPrice] = useState<number>(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const dash = await api.getDashboard();
      if (dash && dash.holdings) {
        const candidates = dash.holdings.filter(
          (h: Holding) =>
            h.floatingPnlPct < 0 || h.actionStatus === 'RECOVERY_MODE' || h.actionStatus === 'AVERAGING_REVIEW',
        );
        setHoldings(candidates);

        if (candidates.length > 0) {
          const initialTicker =
            selectedTicker && candidates.some(c => c.ticker === selectedTicker) ? selectedTicker : candidates[0].ticker;
          setSelectedTicker(initialTicker);
          const rec = await api.getRecovery(initialTicker);
          if (rec) {
            setData(rec);
            setTargetBuyPrice(Math.round(rec.currentPrice * 0.95));
            setTargetAvgPrice(Math.round((rec.avgPrice + rec.currentPrice) / 2));
          }
        } else {
          setData(null);
        }
      }
    } catch (err) {
      console.warn('Error loading recovery data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicker]);

  useEffect(() => {
    let isMounted = true;

    api
      .getDashboard()
      .then(async dash => {
        if (!isMounted) return;
        if (dash && dash.holdings) {
          const candidates = dash.holdings.filter(
            (h: Holding) =>
              h.floatingPnlPct < 0 || h.actionStatus === 'RECOVERY_MODE' || h.actionStatus === 'AVERAGING_REVIEW',
          );
          setHoldings(candidates);

          if (candidates.length > 0) {
            const initialTicker = candidates[0].ticker;
            setSelectedTicker(initialTicker);
            const rec = await api.getRecovery(initialTicker).catch(() => null);
            if (isMounted && rec) {
              setData(rec);
              setTargetBuyPrice(Math.round(rec.currentPrice * 0.95));
              setTargetAvgPrice(Math.round((rec.avgPrice + rec.currentPrice) / 2));
            }
          } else {
            setData(null);
          }
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('Error loading recovery data:', err);
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

  const selectStock = useCallback(async (stock: Holding) => {
    setSelectedTicker(stock.ticker);
    try {
      const rec = await api.getRecovery(stock.ticker);
      if (rec) {
        setData(rec);
        setTargetBuyPrice(Math.round(rec.currentPrice * 0.95));
        setTargetAvgPrice(Math.round((rec.avgPrice + rec.currentPrice) / 2));
      }
    } catch (e) {
      console.warn('Select recovery stock err:', e);
    }
  }, []);

  const calcResult = useMemo<AverageDownResult>(() => {
    if (!data) return { addLot: 0, capital: 0, newAvg: 0 };
    const currentLot = data.lot;
    const currentAvg = data.avgPrice;

    if (targetAvgPrice <= targetBuyPrice || targetAvgPrice >= currentAvg) {
      return {
        addLot: 0,
        capital: 0,
        newAvg: currentAvg,
        error: 'Target Avg harus di antara harga beli bawah dan Avg saat ini',
      };
    }

    const rawAddLot = (currentLot * (currentAvg - targetAvgPrice)) / (targetAvgPrice - targetBuyPrice);
    const addLot = Math.ceil(rawAddLot);
    const capital = addLot * targetBuyPrice * 100;
    const finalAvg = Math.round((currentLot * currentAvg + addLot * targetBuyPrice) / (currentLot + addLot));

    return { addLot, capital, newAvg: finalAvg };
  }, [data, targetAvgPrice, targetBuyPrice]);

  return {
    holdings,
    selectedTicker,
    data,
    isLoading,
    targetBuyPrice,
    targetAvgPrice,
    setTargetBuyPrice,
    setTargetAvgPrice,
    calcResult,
    loadData,
    selectStock,
  };
}
