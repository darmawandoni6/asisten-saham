const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
  getDashboard: () => fetchApi<{ summary: any; holdings: any[] }>("/api/v1/dashboard"),
  getPortfolio: () => fetchApi<any[]>("/api/v1/portfolio"),
  createHolding: (data: {
    ticker: string;
    avg_price: number;
    lot: number;
    target_price?: number;
    stop_loss?: number;
    sector?: string;
    buy_reason?: string;
    jenis?: "trading" | "investasi";
  }) => fetchApi<any>("/api/v1/portfolio", { method: "POST", body: JSON.stringify(data) }),
  deleteHolding: (id: number) => fetchApi<any>(`/api/v1/portfolio/${id}`, { method: "DELETE" }),
  importBatch: (stocks: Array<{
    ticker: string;
    avg_price: number;
    lot: number;
    jenis?: "trading" | "investasi";
    buy_reason?: string;
    sector?: string;
  }>) => fetchApi<any>("/api/v1/portfolio/import-batch", { method: "POST", body: JSON.stringify(stocks) }),
  getAiTpSl: (ticker: string, jenis: string = "trading", avg_price?: number) => {
    const params = new URLSearchParams({ jenis });
    if (avg_price) params.set("avg_price", avg_price.toString());
    return fetchApi<any>(`/api/v1/portfolio/recommend-tpsl/${ticker}?${params}`);
  },

  
  // Stock data & charts
  getStockChart: (ticker: string) => fetchApi<{ ticker: string; candles: any[] }>(`/api/v1/stocks/${ticker}/chart`),
  fetchAllEOD: () => fetchApi<any>("/api/v1/stocks/fetch-all", { method: "POST" }),
  fetchStockEOD: (ticker: string) => fetchApi<any>(`/api/v1/stocks/fetch/${ticker}`, { method: "POST" }),

  // AI Copilot
  analyzeStock: (ticker: string) => fetchApi<any>(`/api/v1/analysis/${ticker}`, { method: "POST" }),

  // Recovery Engine
  getRecovery: (ticker: string) => fetchApi<any>(`/api/v1/recovery/${ticker}`),
  calculateAvgDown: (data: {
    current_lot: number;
    current_avg: number;
    target_buy_price: number;
    target_avg_price: number;
  }) => fetchApi<any>("/api/v1/recovery/calculate-avgdown", { method: "POST", body: JSON.stringify(data) }),
  discussRecovery: (ticker: string, data: { scenario_id: string; user_question?: string }) =>
    fetchApi<any>(`/api/v1/recovery/${ticker}/discuss`, { method: "POST", body: JSON.stringify(data) }),

  // Screener
  getScreener: (strategy: string = "ALL") => fetchApi<any[]>(`/api/v1/screener?strategy=${strategy}`),
  scanScreener: () => fetchApi<any[]>("/api/v1/screener/scan", { method: "POST" }),

  // Journal
  getTrades: () => fetchApi<any[]>("/api/v1/journal/trades"),
  createTrade: (data: any) => fetchApi<any>("/api/v1/journal/trade", { method: "POST", body: JSON.stringify(data) }),
  getPostMortem: () => fetchApi<any>("/api/v1/journal/post-mortem"),
};
