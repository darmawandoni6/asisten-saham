'use client';

import { useCallback, useState } from 'react';

import { api } from '@/lib/api';
import { Holding, PortfolioSummary } from '@/types';

export const INITIAL_PORTFOLIO_SUMMARY: PortfolioSummary = {
  totalEquity: 0,
  totalCost: 0,
  floatingPnl: 0,
  floatingPnlPct: 0.0,
  cashBalance: 0,
  totalLots: 0,
  actionCounts: {
    sellCutLoss: 0,
    takeProfit: 0,
    holdMonitor: 0,
    trailingStopWarning: 0,
    recoveryMode: 0,
  },
};

export interface UseDashboardReturn {
  holdings: Holding[];
  summary: PortfolioSummary;
  isLoading: boolean;
  error: string | null;
  loadDashboard: () => Promise<void>;
  setHoldings: React.Dispatch<React.SetStateAction<Holding[]>>;
  setSummary: React.Dispatch<React.SetStateAction<PortfolioSummary>>;
}

export function useDashboard(): UseDashboardReturn {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>(INITIAL_PORTFOLIO_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard();
      if (data) {
        setHoldings(data.holdings || []);
        setSummary(data.summary || INITIAL_PORTFOLIO_SUMMARY);
      }
    } catch (err) {
      console.warn('Backend API offline:', err);
      setError(err instanceof Error ? err.message : 'Backend API offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    holdings,
    summary,
    isLoading,
    error,
    loadDashboard,
    setHoldings,
    setSummary,
  };
}
