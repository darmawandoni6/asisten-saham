export type ActionType =
  | 'SELL_CUT_LOSS'
  | 'SL_PROXIMITY_WARNING'
  | 'TAKE_PROFIT'
  | 'TP_PROXIMITY_WARNING'
  | 'EXIT_REBOUND'
  | 'ER_PROXIMITY_WARNING'
  | 'HOLD_MONITOR'
  | 'TRAILING_STOP_WARNING'
  | 'RECOVERY_MODE'
  | 'AVERAGING_REVIEW';

export interface Holding {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  jenis: 'trading' | 'investasi'; // Tipe kepemilikan
  avgPrice: number;
  lot: number;
  shares: number; // lot * 100
  currentPrice: number;
  previousClose: number;
  targetPrice: number;
  stopLoss: number | null; // null untuk saham investasi
  highWatermark: number; // Highest price since buy
  trailingStopPrice: number | null; // null untuk saham investasi
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

export interface RecoveryScenarioAdvice {
  recommended: boolean;
  confidence: number; // 1-10
  lotSuggestion: string;
  lotPct: number; // 0-100
  reason: string;
}

export interface RecoveryAIRecommendation {
  available: boolean;
  source?: string;
  generatedAt?: string;
  recommendations?: {
    cutLoss: RecoveryScenarioAdvice;
    averageDown: RecoveryScenarioAdvice;
    hold: RecoveryScenarioAdvice;
  };
  aiSummary?: string;
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
  aiRecommendation?: RecoveryAIRecommendation;
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
  source: 'gemini' | 'opencode_zen' | 'openrouter' | '9router' | 'rule_based';
  fromDb?: boolean;
  createdAt?: string;
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

export interface CopilotChatMessage {
  id?: number;
  ticker: string;
  role: 'user' | 'assistant';
  message: string;
  source?: string;
  sessionDate?: string;
  createdAt?: string;
}

export interface ScreenerChatMessage {
  id?: number;
  ticker: string;
  role: 'user' | 'assistant';
  message: string;
  source?: string;
  convictionScore?: number;
  sessionDate?: string;
  createdAt?: string;
}

export interface ScreenerDiscussionResponse {
  status: string;
  source: string;
  ticker: string;
  conviction_score: number;
  conviction_label: string;
  conviction_reason?: string;
  answer: string;
  suggested_questions: string[];
  history?: ScreenerChatMessage[];
}

export interface ScreenerRawItem {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change_pct?: number;
  changePct?: number;
  change_nominal?: number;
  changeNominal?: number;
  volume: number;
  rsi: number;
  ma_status?: string;
  maStatus?: string;
  strategy: 'OVERSOLD' | 'BREAKOUT' | 'VALUE' | 'CUSTOM';
  score?: number;
  conviction_score?: number;
  convictionScore?: number;
  conviction_label?: string;
  convictionLabel?: string;
  conviction_reason?: string;
  convictionReason?: string;
  ai_analysis?: string;
  aiAnalysis?: string;
  ai_source?: string;
  aiSource?: string;
  profile_suitability?: 'TRADING' | 'INVESTASI' | 'BOTH';
  profileSuitability?: 'TRADING' | 'INVESTASI' | 'BOTH';
  profile_suitability_label?: string;
  profileSuitabilityLabel?: string;
  market_cap?: number | null;
  marketCap?: number | null;
  market_cap_formatted?: string;
  marketCapFormatted?: string;
  free_float_pct?: number | null;
  freeFloatPct?: number | null;
  roe_pct?: number | null;
  roePct?: number | null;
  der?: number | null;
  catalyst?: string;
  support: number;
  resistance: number;
  action_stance?: string;
  actionStance?: string;
  why_buy?: string;
  whyBuy?: string;
  watch_trigger?: string;
  watchTrigger?: string;
  buy_area?: string;
  buyArea?: string;
  target_price?: number;
  targetPrice?: number;
  stop_loss?: number;
  stopLoss?: number;
  risk_reward_ratio?: string;
  riskRewardRatio?: string;
  potential_gain_pct?: number;
  potentialGainPct?: number;
  potential_risk_pct?: number;
  potentialRiskPct?: number;
}

export interface ScreenerItem {
  ticker: string;
  name: string;
  sector: string;
  profileSuitability?: 'TRADING' | 'INVESTASI' | 'BOTH';
  profileSuitabilityLabel?: string;
  price: number;
  changePct: number;
  changeNominal?: number;
  volume: number;
  rsi: number;
  maStatus: string;
  strategy: 'OVERSOLD' | 'BREAKOUT' | 'VALUE' | 'CUSTOM';
  score: number; // 0 - 100
  convictionScore?: number; // 1 - 10 (10 = Wajib Dibeli Besok Pagi)
  convictionLabel?: string;
  convictionReason?: string;
  aiAnalysis?: string;
  aiSource?: string;
  marketCap?: number | null;
  marketCapFormatted?: string;
  freeFloatPct?: number | null;
  roePct?: number | null;
  der?: number | null;
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
  id: 'gemini' | 'opencode_zen' | 'openrouter' | '9router';
  name: string;
  model: string;
  base_url?: string;
  is_configured: boolean;
  badge_label: string;
}

export interface AIProvidersResponse {
  active_provider: 'gemini' | 'opencode_zen' | 'openrouter' | '9router';
  providers: AIProviderInfo[];
}

export interface MarketStatus {
  isOpen: boolean;
  status: string;
  badgeText: string;
  description: string;
  nextSessionTime?: string;
  serverTime?: string;
}

export interface DashboardResponse {
  summary: PortfolioSummary;
  holdings: Holding[];
}

export interface StockChartResponse {
  ticker: string;
  candles: PriceCandle[];
}

export interface RecommendTpSlResponse {
  ticker: string;
  jenis?: string;
  currentPrice?: number;
  current_price?: number;
  tp?: number;
  sl?: number | null;
  sector?: string;
  target_price?: number;
  stop_loss?: number | null;
  risk_reward_ratio?: string;
  targetType?: string;
  targetLabel?: string;
  isExitRebound?: boolean;
  profitTargetAlt?: number | null;
  support?: number;
  resistance?: number;
  ma20?: number;
  ma50?: number;
  ma200?: number;
  rsi?: number;
  above_ma20?: boolean;
  above_ma50?: boolean;
  tpRationale?: string;
  slRationale?: string;
  avgDownTarget?: number | null;
  avgDownRationale?: string | null;
  dataSource?: string;
}

export type LotAveragingMode = 'by_lot' | 'by_target_avg' | 'by_budget';

export interface LotAveragingResult {
  mode: LotAveragingMode;
  addLot: number;
  buyPrice: number;
  capitalRequired: number;
  budgetRemaining?: number;
  hasBudgetFraction?: boolean;
  exactBudgetForLot?: number;
  nextLotBudget?: number;
  newAvg: number;
  totalLot: number;
  avgDiff: number; // positif = penurunan avg (avg down), negatif = kenaikan avg
  error?: string;
}

export interface AvgDownCalculationResult {
  additional_lots: number;
  additional_capital: number;
  new_avg_price: number;
  target_avg_price: number;
  target_buy_price: number;
  current_lot: number;
  current_avg: number;
}

export interface CopilotChatResponse {
  answer: string;
  source: string;
  suggested_questions?: string[];
}

export interface PostMortemSummary {
  winRatePct: number;
  totalRealizedPnl: number;
  profitFactor: number;
  totalTrades: number;
  dominantPattern: string;
  aiFeedback: string;
  recommendations: string[];
  disciplinedTradesPct?: number;
  fomoTradesCount?: number;
  panicSellCount?: number;
  insights?: string[];
}

export interface CreateTradeRequest {
  ticker: string;
  action: string;
  price: number;
  lot: number;
  realized_pnl?: number;
  notes?: string;
  psychology_flag?: string;
}

export interface ApiStatusResponse {
  status: string;
  message?: string;
  detail?: string;
}

export interface BatchImportResponse {
  status: string;
  imported_count: number;
  holdings?: Holding[];
}
