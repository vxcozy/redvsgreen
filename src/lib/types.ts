export type BinanceKlineRaw = [
  number, // Open time (ms)
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time (ms)
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string, // Ignore
];

export interface OHLCV {
  time: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  trades: number;
}

export interface Streak {
  type: 'green' | 'red';
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  length: number;
  totalPercentChange: number;
  avgDailyVolume: number;
  candles: OHLCV[];
}

export interface CurrentStreakStatus {
  type: 'green' | 'red';
  length: number;
  startDate: string;
  percentChangeSoFar: number;
  isOngoing: boolean;
}

export interface StreakStats {
  longestGreen: Streak;
  longestRed: Streak;
  avgGreenLength: number;
  avgRedLength: number;
  totalGreenDays: number;
  totalRedDays: number;
  greenStreakDistribution: Record<number, number>;
  redStreakDistribution: Record<number, number>;
  currentStreak: CurrentStreakStatus;
  allStreaks: Streak[];
  topGreenStreaks: Streak[];
  topRedStreaks: Streak[];
}

export interface IndicatorPoint {
  time: string;
  value: number;
}

export interface BollingerPoint {
  time: string;
  upper: number;
  middle: number;
  lower: number;
}

export interface FearGreedEntry {
  value: number;
  classification: string;
  timestamp: number;
  date: string;
}

export interface CyclePoint {
  type: 'peak' | 'trough';
  date: string;
  price: number;
  index: number;
  source: 'known' | 'detected';
}

export interface Cycle {
  from: CyclePoint;
  to: CyclePoint;
  durationDays: number;
  priceChange: number;
  percentChange: number;
  direction: 'bull' | 'bear';
}

export interface CycleProjection {
  projectedDate: string;       // ISO date string
  daysUntil: number;           // negative if already passed
  confidence: 'high' | 'medium' | 'low';
  basedOnCycles: number;       // how many historical cycles averaged
}

export interface CycleAnalysis {
  cycles: Cycle[];
  allPoints: CyclePoint[];
  currentPeak: CyclePoint | null;
  currentTrough: CyclePoint | null;
  daysSincePeak: number;
  daysSinceTrough: number;
  avgBullDuration: number;
  avgBearDuration: number;
  avgBullReturn: number;
  avgBearDrawdown: number;
  currentPhase: 'bull' | 'bear';
  phaseProgress: number;
  // Projections
  projectedTop: CycleProjection | null;
  projectedBottom: CycleProjection | null;
}

export type OverlayKey =
  | 'sma50'
  | 'sma200'
  | 'rsi'
  | 'bollingerBands'
  | 'volume'
  | 'fearGreed'
  | 'streakHistogram'
  | 'btcEthComparison'
  | 'heatmap'
  | 'atr'
  | 'cycleTimeline';

export type Asset = 'BTC' | 'ETH';
export type TimeRange = '3M' | '6M' | '1Y' | '2Y' | 'ALL';

export interface DashboardState {
  asset: Asset;
  comparisonAsset: Asset | null;
  timeRange: TimeRange;
  overlays: Record<OverlayKey, boolean>;
}

export type DashboardAction =
  | { type: 'SET_ASSET'; payload: Asset }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'TOGGLE_OVERLAY'; payload: OverlayKey }
  | { type: 'TOGGLE_COMPARISON' };
