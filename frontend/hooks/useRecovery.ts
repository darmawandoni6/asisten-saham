'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { Holding, LotAveragingMode, LotAveragingResult, RecoveryAIRecommendation, RecoveryDiagnosis } from '@/types';

export interface UseRecoveryReturn {
  holdings: Holding[];
  selectedTicker: string;
  data: RecoveryDiagnosis | null;
  isLoading: boolean;
  isRegenerating: boolean;

  // 3-Mode Lot Averaging Calculator State
  calcMode: LotAveragingMode;
  setCalcMode: React.Dispatch<React.SetStateAction<LotAveragingMode>>;
  calcBuyPrice: number;
  setCalcBuyPrice: React.Dispatch<React.SetStateAction<number>>;
  calcAddLot: number;
  setCalcAddLot: React.Dispatch<React.SetStateAction<number>>;
  calcTargetAvg: number;
  setCalcTargetAvg: React.Dispatch<React.SetStateAction<number>>;
  calcBudget: number;
  setCalcBudget: React.Dispatch<React.SetStateAction<number>>;

  calcResult: LotAveragingResult;
  loadData: () => Promise<void>;
  selectStock: (stock: Holding) => Promise<void>;
  regenerateRecommendation: () => Promise<void>;
}

export function useRecovery(): UseRecoveryReturn {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [data, setData] = useState<RecoveryDiagnosis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 3-Mode Calculator Inputs
  const [calcMode, setCalcMode] = useState<LotAveragingMode>('by_lot');
  const [calcBuyPrice, setCalcBuyPrice] = useState<number>(0);
  const [calcAddLot, setCalcAddLot] = useState<number>(5);
  const [calcTargetAvg, setCalcTargetAvg] = useState<number>(0);
  const [calcBudget, setCalcBudget] = useState<number>(500000);

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
            const defaultBuy = Math.round(rec.supportMajor || rec.currentPrice * 0.95);
            setCalcBuyPrice(defaultBuy);
            setCalcTargetAvg(Math.round((rec.avgPrice + defaultBuy) / 2));
            setCalcAddLot(Math.max(1, Math.round(rec.lot * 0.5)));
            setCalcBudget(rec.cashBalance && rec.cashBalance > 0 ? rec.cashBalance : defaultBuy * 10 * 100);
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
              const defaultBuy = Math.round(rec.supportMajor || rec.currentPrice * 0.95);
              setCalcBuyPrice(defaultBuy);
              setCalcTargetAvg(Math.round((rec.avgPrice + defaultBuy) / 2));
              setCalcAddLot(Math.max(1, Math.round(rec.lot * 0.5)));
              setCalcBudget(rec.cashBalance && rec.cashBalance > 0 ? rec.cashBalance : defaultBuy * 10 * 100);
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
        const defaultBuy = Math.round(rec.supportMajor || rec.currentPrice * 0.95);
        setCalcBuyPrice(defaultBuy);
        setCalcTargetAvg(Math.round((rec.avgPrice + defaultBuy) / 2));
        setCalcAddLot(Math.max(1, Math.round(rec.lot * 0.5)));
        setCalcBudget(rec.cashBalance && rec.cashBalance > 0 ? rec.cashBalance : defaultBuy * 10 * 100);
      }
    } catch (e) {
      console.warn('Select recovery stock err:', e);
    }
  }, []);

  const regenerateRecommendation = useCallback(async () => {
    if (!selectedTicker || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const result: RecoveryAIRecommendation = await api.regenerateRecoveryRecommendation(selectedTicker);
      if (result) {
        setData(prev => {
          if (!prev) return prev;
          return { ...prev, aiRecommendation: { ...result, available: true } };
        });
      }
    } catch (err) {
      console.warn('Regenerate recovery recommendation error:', err);
    } finally {
      setIsRegenerating(false);
    }
  }, [selectedTicker, isRegenerating]);

  // Reactive Multi-Mode Lot Averaging Calculation
  const calcResult = useMemo<LotAveragingResult>(() => {
    if (!data || !calcBuyPrice || calcBuyPrice <= 0) {
      return {
        mode: calcMode,
        addLot: 0,
        buyPrice: calcBuyPrice || 0,
        capitalRequired: 0,
        newAvg: data?.avgPrice || 0,
        totalLot: data?.lot || 0,
        avgDiff: 0,
        error: 'Masukkan harga beli yang valid (lebih dari 0)',
      };
    }

    const currentLot = data.lot;
    const currentAvg = data.avgPrice;
    const pricePerLot = calcBuyPrice * 100;

    // Mode 1: Berdasarkan Jumlah Lot Tambahan
    if (calcMode === 'by_lot') {
      const addLot = Math.max(0, Math.floor(calcAddLot || 0));
      if (addLot <= 0) {
        return {
          mode: 'by_lot',
          addLot: 0,
          buyPrice: calcBuyPrice,
          capitalRequired: 0,
          newAvg: currentAvg,
          totalLot: currentLot,
          avgDiff: 0,
          error: 'Jumlah lot tambahan harus bilangan bulat minimal 1 lot',
        };
      }
      const capitalRequired = addLot * pricePerLot;
      const totalLot = currentLot + addLot;
      const newAvg = Math.round((currentLot * currentAvg + addLot * calcBuyPrice) / totalLot);
      const avgDiff = Math.round(currentAvg - newAvg);

      return {
        mode: 'by_lot',
        addLot,
        buyPrice: calcBuyPrice,
        capitalRequired,
        newAvg,
        totalLot,
        avgDiff,
      };
    }

    // Mode 2: Berdasarkan Target Average Price
    if (calcMode === 'by_target_avg') {
      if (calcBuyPrice === currentAvg) {
        return {
          mode: 'by_target_avg',
          addLot: 0,
          buyPrice: calcBuyPrice,
          capitalRequired: 0,
          newAvg: currentAvg,
          totalLot: currentLot,
          avgDiff: 0,
          error: 'Harga beli sama dengan Avg saat ini, rata-rata modal tidak akan berubah',
        };
      }

      const isAvgDown = calcBuyPrice < currentAvg;
      if (isAvgDown && (calcTargetAvg <= calcBuyPrice || calcTargetAvg >= currentAvg)) {
        return {
          mode: 'by_target_avg',
          addLot: 0,
          buyPrice: calcBuyPrice,
          capitalRequired: 0,
          newAvg: currentAvg,
          totalLot: currentLot,
          avgDiff: 0,
          error: `Target Avg harus di antara Rp ${calcBuyPrice.toLocaleString('id-ID')} (harga beli) dan Rp ${Math.round(currentAvg).toLocaleString('id-ID')} (avg modal saat ini)`,
        };
      }

      if (!isAvgDown && (calcTargetAvg <= currentAvg || calcTargetAvg >= calcBuyPrice)) {
        return {
          mode: 'by_target_avg',
          addLot: 0,
          buyPrice: calcBuyPrice,
          capitalRequired: 0,
          newAvg: currentAvg,
          totalLot: currentLot,
          avgDiff: 0,
          error: `Target Avg harus di antara Rp ${Math.round(currentAvg).toLocaleString('id-ID')} (avg saat ini) dan Rp ${calcBuyPrice.toLocaleString('id-ID')} (harga beli)`,
        };
      }

      const rawAddLot = (currentLot * (currentAvg - calcTargetAvg)) / (calcTargetAvg - calcBuyPrice);
      const addLot = Math.max(1, Math.ceil(rawAddLot));
      const capitalRequired = addLot * pricePerLot;
      const totalLot = currentLot + addLot;
      const newAvg = Math.round((currentLot * currentAvg + addLot * calcBuyPrice) / totalLot);
      const avgDiff = Math.round(currentAvg - newAvg);

      return {
        mode: 'by_target_avg',
        addLot,
        buyPrice: calcBuyPrice,
        capitalRequired,
        newAvg,
        totalLot,
        avgDiff,
      };
    }

    // Mode 3: Berdasarkan Alokasi Budget Modal (Rp)
    if (calcMode === 'by_budget') {
      const budget = Math.max(0, calcBudget || 0);
      if (budget < pricePerLot) {
        return {
          mode: 'by_budget',
          addLot: 0,
          buyPrice: calcBuyPrice,
          capitalRequired: 0,
          budgetRemaining: budget,
          hasBudgetFraction: false,
          newAvg: currentAvg,
          totalLot: currentLot,
          avgDiff: 0,
          error: `Budget minimal Rp ${pricePerLot.toLocaleString('id-ID')} untuk dapat membeli 1 lot @ Rp ${calcBuyPrice.toLocaleString('id-ID')}`,
        };
      }

      const rawLots = budget / pricePerLot;
      const addLot = Math.floor(rawLots);
      const capitalRequired = addLot * pricePerLot;
      const budgetRemaining = budget - capitalRequired;
      const hasBudgetFraction = budgetRemaining > 0;
      const exactBudgetForLot = capitalRequired;
      const nextLotBudget = (addLot + 1) * pricePerLot;

      const totalLot = currentLot + addLot;
      const newAvg = Math.round((currentLot * currentAvg + addLot * calcBuyPrice) / totalLot);
      const avgDiff = Math.round(currentAvg - newAvg);

      return {
        mode: 'by_budget',
        addLot,
        buyPrice: calcBuyPrice,
        capitalRequired,
        budgetRemaining,
        hasBudgetFraction,
        exactBudgetForLot,
        nextLotBudget,
        newAvg,
        totalLot,
        avgDiff,
      };
    }

    return {
      mode: 'by_lot',
      addLot: 0,
      buyPrice: calcBuyPrice,
      capitalRequired: 0,
      newAvg: currentAvg,
      totalLot: currentLot,
      avgDiff: 0,
    };
  }, [data, calcMode, calcBuyPrice, calcAddLot, calcTargetAvg, calcBudget]);

  return {
    holdings,
    selectedTicker,
    data,
    isLoading,
    isRegenerating,
    calcMode,
    setCalcMode,
    calcBuyPrice,
    setCalcBuyPrice,
    calcAddLot,
    setCalcAddLot,
    calcTargetAvg,
    setCalcTargetAvg,
    calcBudget,
    setCalcBudget,
    calcResult,
    loadData,
    selectStock,
    regenerateRecommendation,
  };
}
