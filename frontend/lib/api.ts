import {
  AICopilotAnalysisResult,
  AIProvidersResponse,
  ApiStatusResponse,
  AvgDownCalculationResult,
  BatchImportResponse,
  CopilotChatMessage,
  CopilotChatResponse,
  DashboardResponse,
  Holding,
  MarketStatus,
  RecommendTpSlResponse,
  RecoveryAIRecommendation,
  RecoveryChatMessage,
  RecoveryDiagnosis,
  RecoveryDiscussion,
  ScreenerChatMessage,
  ScreenerDiscussionResponse,
  ScreenerItem,
  StockChartResponse,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined' && (window.location.port === '8000' || window.location.port === '')
    ? ''
    : 'http://localhost:8000');

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[API Client] Gagal fetch ke ${endpoint}:`, error);
    throw error;
  }
}

// Portfolio & Dashboard API
export const api = {
  getDashboard: () => fetchApi<DashboardResponse>('/api/v1/dashboard'),
  getCashBalance: () => fetchApi<{ cash_balance: number }>('/api/v1/portfolio/balance'),
  updateCashBalance: (cash_balance: number) =>
    fetchApi<{ status: string; cash_balance: number }>('/api/v1/portfolio/balance', {
      method: 'POST',
      body: JSON.stringify({ cash_balance }),
    }),
  getPortfolio: () => fetchApi<Holding[]>('/api/v1/portfolio'),
  createHolding: (data: {
    ticker: string;
    avg_price: number;
    lot: number;
    target_price?: number;
    stop_loss?: number;
    sector?: string;
    buy_reason?: string;
    jenis?: 'trading' | 'investasi';
  }) =>
    fetchApi<Holding>('/api/v1/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateHolding: (
    id: number,
    data: {
      avg_price?: number;
      lot?: number;
      target_price?: number;
      stop_loss?: number;
      sector?: string;
      buy_reason?: string;
      jenis?: 'trading' | 'investasi';
    },
  ) =>
    fetchApi<Holding>(`/api/v1/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteHolding: (id: number) => fetchApi<ApiStatusResponse>(`/api/v1/portfolio/${id}`, { method: 'DELETE' }),
  sellHolding: (data: {
    holding_id: number;
    sell_price: number;
    sell_lot: number;
    notes?: string;
    psychology_flag?: string;
  }) =>
    fetchApi<ApiStatusResponse>(`/api/v1/portfolio/${data.holding_id}/sell`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  importBatch: (
    stocks: Array<{
      ticker: string;
      avg_price: number;
      lot: number;
      jenis?: 'trading' | 'investasi';
      buy_reason?: string;
      sector?: string;
    }>,
  ) =>
    fetchApi<BatchImportResponse>('/api/v1/portfolio/import-batch', {
      method: 'POST',
      body: JSON.stringify(stocks),
    }),
  getAiTpSl: (ticker: string, jenis: string = 'trading', avg_price?: number) => {
    const params = new URLSearchParams({ jenis });
    if (avg_price) params.set('avg_price', avg_price.toString());
    return fetchApi<RecommendTpSlResponse>(`/api/v1/portfolio/recommend-tpsl/${ticker}?${params}`);
  },

  // Stock data & charts
  getStockChart: (ticker: string) => fetchApi<StockChartResponse>(`/api/v1/stocks/${ticker}/chart`),
  fetchAllEOD: () => fetchApi<ApiStatusResponse>('/api/v1/stocks/fetch-all', { method: 'POST' }),
  fetchStockEOD: (ticker: string) => fetchApi<ApiStatusResponse>(`/api/v1/stocks/fetch/${ticker}`, { method: 'POST' }),

  // AI Copilot & Provider Management
  getAiProviders: () => fetchApi<AIProvidersResponse>('/api/v1/analysis/providers'),
  setAiProvider: (provider: string) =>
    fetchApi<{ status: string; active_provider: string }>('/api/v1/analysis/provider', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }),
  analyzeStock: (ticker: string, provider?: string, forceRefresh?: boolean) => {
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (forceRefresh) params.append('force_refresh', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<AICopilotAnalysisResult>(`/api/v1/analysis/${ticker}${query}`, {
      method: 'POST',
    });
  },
  getCopilotChatHistory: (ticker: string) => fetchApi<CopilotChatMessage[]>(`/api/v1/analysis/${ticker}/chat-history`),
  sendCopilotChat: (ticker: string, data: { question: string; force_refresh?: boolean }) =>
    fetchApi<CopilotChatResponse>(`/api/v1/analysis/${ticker}/chat`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  clearCopilotChatHistory: (ticker: string) =>
    fetchApi<ApiStatusResponse>(`/api/v1/analysis/${ticker}/chat-history`, {
      method: 'DELETE',
    }),

  // Recovery Engine
  getRecovery: (ticker: string) => fetchApi<RecoveryDiagnosis>(`/api/v1/recovery/${ticker}`),
  calculateAvgDown: (data: {
    current_lot: number;
    current_avg: number;
    target_buy_price: number;
    target_avg_price: number;
  }) =>
    fetchApi<AvgDownCalculationResult>('/api/v1/recovery/calculate-avgdown', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  discussRecovery: (
    ticker: string,
    data: { scenario_id: string; user_question?: string; provider?: string; force_refresh?: boolean },
  ) =>
    fetchApi<RecoveryDiscussion>(`/api/v1/recovery/${ticker}/discuss`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  regenerateRecoveryRecommendation: (ticker: string) =>
    fetchApi<RecoveryAIRecommendation>(`/api/v1/recovery/${ticker}/regenerate-recommendation`, {
      method: 'POST',
    }),
  getRecoveryChatHistory: (ticker: string, scenario_id?: string) => {
    const params = scenario_id ? `?scenario_id=${scenario_id}` : '';
    return fetchApi<RecoveryChatMessage[]>(`/api/v1/recovery/${ticker}/chat-history${params}`);
  },
  clearRecoveryChatHistory: (ticker: string, scenario_id?: string) => {
    const params = scenario_id ? `?scenario_id=${scenario_id}` : '';
    return fetchApi<ApiStatusResponse>(`/api/v1/recovery/${ticker}/chat-history${params}`, {
      method: 'DELETE',
    });
  },

  // Screener
  getScreener: (strategy: string = 'ALL') => fetchApi<ScreenerItem[]>(`/api/v1/screener?strategy=${strategy}`),
  scanScreener: () => fetchApi<ScreenerItem[]>('/api/v1/screener/scan', { method: 'POST' }),
  analyzeScreenerTicker: (ticker: string) =>
    fetchApi<ScreenerItem>('/api/v1/screener/analyze', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    }),
  discussScreener: (ticker: string, data: { question?: string; provider?: string }) =>
    fetchApi<ScreenerDiscussionResponse>(`/api/v1/screener/${encodeURIComponent(ticker)}/discuss`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getScreenerChatHistory: (ticker: string) =>
    fetchApi<ScreenerChatMessage[]>(`/api/v1/screener/${encodeURIComponent(ticker)}/chat-history`),
  clearScreenerChatHistory: (ticker: string) =>
    fetchApi<ApiStatusResponse>(`/api/v1/screener/${encodeURIComponent(ticker)}/chat-history`, {
      method: 'DELETE',
    }),

  // System & Market Calendar
  getMarketStatus: () => fetchApi<MarketStatus>('/api/v1/system/market-status'),
  sendHeartbeat: () => fetchApi<{ status: string; timestamp: number }>('/api/v1/system/heartbeat', { method: 'POST' }),
};
