export type ActionType = 
  | 'SELL_CUT_LOSS' 
  | 'SL_PROXIMITY_WARNING'
  | 'TAKE_PROFIT' 
  | 'TP_PROXIMITY_WARNING'
  | 'HOLD_MONITOR' 
  | 'TRAILING_STOP_WARNING' 
  | 'RECOVERY_MODE'
  | 'AVERAGING_REVIEW';


export interface Holding {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  jenis: 'trading' | 'investasi';  // Tipe kepemilikan
  avgPrice: number;
  lot: number;
  shares: number; // lot * 100
  currentPrice: number;
  previousClose: number;
  targetPrice: number;
  stopLoss: number | null;  // null untuk saham investasi
  highWatermark: number; // Highest price since buy
  trailingStopPrice: number | null;  // null untuk saham investasi
  floatingPnl: number;
  floatingPnlPct: number;
  actionStatus: ActionType;
  actionReason: string;
  buyReason?: string;
  buyDate: string;
  rsi: number;
  aboveMa20: boolean;
  aboveMa50: boolean;
}


export interface PriceCandle {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number;
  ma50?: number;
  ma200?: number;
  rsi?: number;
}

export interface AIAnalysis {
  ticker: string;
  name: string;
  date: string;
  currentPrice: number;
  avgPrice: number;
  pnlPct: number;
  recommendation: 'HOLD' | 'SELL ALL' | 'TRIM 50%' | 'CUT LOSS' | 'AVERAGE DOWN' | 'BUY MORE';
  recommendationType: ActionType;
  confidence: number;
  rationale: string;
  indicators: {
    ma20: number;
    ma50: number;
    ma200: number;
    rsi: number;
    support: number;
    resistance: number;
    trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    volumeStatus: 'ABOVE_AVG' | 'NORMAL' | 'LOW';
  };
  tradingPlanComparison: {
    targetPrice: number;
    distanceToTargetPct: number;
    stopLoss: number;
    distanceToStopLossPct: number;
    status: string;
  };
  actionItems: string[];
}

export interface RecoveryDiagnosis {
  ticker: string;
  name: string;
  currentPrice: number;
  avgPrice: number;
  lot: number;
  floatingLossNominal: number;
  floatingLossPct: number;
  portfolioWeightPct: number;
  portfolioImpactPct: number;
  supportMajor: number;
  supportMinor: number;
  rsi: number;
  trendStatus: string;
  jenis?: 'trading' | 'investasi';
  cashBalance?: number;
  fundamentals?: {
    dividendYield?: number | null;
    dividendYieldText?: string;
    peRatio?: number | null;
    pbv?: number | null;
    verdict?: string;
  };
  scenarios: {
    cutLoss: {
      title: string;
      description: string;
      lossSavedIfSupportBroken: number;
      actionRecommended: boolean;
      suitabilityTitle?: string;
      suitabilityColor?: string;
      suitabilityReason?: string;
      checklist?: string[];
    };
    averageDown: {
      title: string;
      description: string;
      suggestedEntryPrice: number;
      minRequiredLot: number;
      capitalRequired: number;
      newAvgPrice: number;
      actionRecommended: boolean;
      cashSufficient?: boolean;
      cashShortage?: number;
      cashStatusNote?: string;
      suitabilityTitle?: string;
      suitabilityColor?: string;
      suitabilityReason?: string;
      checklist?: string[];
    };
    holdForBep: {
      title: string;
      description: string;
      realisticExitPrice: number;
      expectedDays: string;
      actionRecommended: boolean;
      suitabilityTitle?: string;
      suitabilityColor?: string;
      suitabilityReason?: string;
      checklist?: string[];
    };
  };
}

export interface RecoveryDiscussion {
  status: string;
  source: 'gemini' | 'opencode_zen' | 'rule_based';
  hasApiKey?: boolean;
  scenarioId: string;
  scenarioTitle: string;
  deepDive?: {
    coreLogic: string;
    invalidationRisk: string;
    cashflowAndTimeline: string;
    tomorrowActionPlan: string[];
  };
  suggestedQuestions?: string[];
  question?: string;
  answer?: string;
}

export interface RecoveryChatMessage {
  id?: number;
  ticker: string;
  scenarioId: string;
  role: 'user' | 'assistant';
  message: string;
  source?: string;
  sessionDate?: string;
  createdAt?: string;
}


export interface ScreenerItem {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  volume: number;
  rsi: number;
  maStatus: string;
  strategy: 'OVERSOLD' | 'BREAKOUT' | 'VALUE' | 'CUSTOM';
  score: number; // 0 - 100
  catalyst: string;
  support: number;
  resistance: number;
  actionStance?: string;
  whyBuy?: string;
  watchTrigger?: string;
  buyArea?: string;
  targetPrice?: number;
  stopLoss?: number;
  riskRewardRatio?: string;
  potentialGainPct?: number;
  potentialRiskPct?: number;
}


export interface TradeLogItem {
  id: number;
  date: string;
  ticker: string;
  action: 'BUY' | 'SELL' | 'TRIM' | 'CUT_LOSS' | 'AVG_DOWN';
  price: number;
  lot: number;
  totalValue: number;
  realizedPnl?: number;
  realizedPnlPct?: number;
  notes: string;
  psychologyFlag?: 'DISCIPLINED' | 'FOMO_BUY' | 'PANIC_SELL' | 'REVENGE_TRADE' | 'GREED_HOLD';
}

export interface PortfolioSummary {
  totalEquity: number;
  totalCost: number;
  floatingPnl: number;
  floatingPnlPct: number;
  cashBalance: number;
  totalLots: number;
  actionCounts: {
    sellCutLoss: number;
    takeProfit: number;
    holdMonitor: number;
    trailingStopWarning: number;
    recoveryMode: number;
  };
}

export interface AICopilotAnalysisResult {
  status: 'success' | 'unavailable' | 'error';
  error_type?: 'NO_API_KEY' | 'QUOTA_EXCEEDED' | 'AI_ERROR';
  message?: string;
  detail?: string;
  ticker?: string;
  name?: string;
  date?: string;
  currentPrice?: number;
  avgPrice?: number;
  pnlPct?: number;
  recommendation?: string;
  confidence?: number;
  rationale?: string;
  indicators?: {
    ma20?: number;
    ma50?: number;
    ma200?: number;
    rsi?: number;
    support?: number;
    resistance?: number;
    trend?: string;
    volume_status?: string;
  };
  actionItems?: string[];
  provider?: string;
}

export interface AIProviderInfo {
  id: 'gemini' | 'opencode_zen';
  name: string;
  model: string;
  base_url?: string;
  is_configured: boolean;
  badge_label: string;
}

export interface AIProvidersResponse {
  active_provider: 'gemini' | 'opencode_zen';
  providers: AIProviderInfo[];
}

