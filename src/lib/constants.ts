export const BINANCE_SYMBOLS: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
};

export const BINANCE_LISTING_DATES: Record<string, string> = {
  BTC: '2017-08-17',
  ETH: '2017-08-17',
};

export const API_ROUTES = {
  klines: '/api/binance/klines',
  fng: '/api/fng',
};

export const COLORS = {
  bg: {
    primary: '#06080d',
    secondary: '#0c0f16',
    tertiary: '#12161f',
    card: '#0e1119',
    hover: '#181d29',
  },
  streak: {
    green: '#00ff87',
    greenDim: '#00ff8733',
    greenMuted: '#00ff8718',
    red: '#ff3b5c',
    redDim: '#ff3b5c33',
    redMuted: '#ff3b5c18',
  },
  overlay: {
    sma50: '#00bbff',
    sma200: '#ff9500',
    bollinger: '#6366f1',
    rsi: '#a855f7',
    volume: '#64748b',
    atr: '#f59e0b',
    volatility: '#ec4899',
    volSurface: '#8b5cf6',
  },
  text: {
    primary: '#e8ecf4',
    secondary: '#7a8599',
    muted: '#4a5568',
  },
  border: {
    default: '#1a1f2e',
    hover: '#2a3040',
    glow: '#00ff8722',
  },
  accent: '#00ff87',
};

export const CHART_COLORS = {
  upColor: COLORS.streak.green,
  downColor: COLORS.streak.red,
  borderUpColor: '#00cc6a',
  borderDownColor: '#cc2e4a',
  wickUpColor: COLORS.streak.green,
  wickDownColor: COLORS.streak.red,
};

export const DEFAULT_OVERLAYS = {
  sma50: true,
  sma200: true,
  rsi: true,
  bollingerBands: false,
  volume: true,
  fearGreed: true,
  streakHistogram: false,
  btcEthComparison: false,
  heatmap: false,
  atr: false,
  cycleTimeline: false,
  volatility: false,
  volatilitySurface: false,
  ivTermStructure: false,
  aaveLiquidations: false,
} as const;

export const TIME_RANGE_DAYS: Record<string, number> = {
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '2Y': 730,
  ALL: 9999,
};

/** Ordered list of draggable card IDs. Fixed cards (stat rows) are NOT included. */
export const CARD_IDS = [
  'cyclePosition',
  'overlayPanel',
  'priceChart',
  'rsi',
  'atr',
  'fearGreed',
  'volatility',
  'volume',
  'heatmap',
  'streakHistogram',
  'streakTimeline',
  'volatilitySurface',
  'ivTermStructure',
  'aaveLiquidations',
  'cycleTimeline',
  'btcEthComparison',
  'streakRecords',
] as const;

export type CardId = (typeof CARD_IDS)[number];

export type CardSize = 'S' | 'M' | 'L';

/** Default card sizes — cards not listed here default to 'M' (full-width). */
export const DEFAULT_SIZES: Partial<Record<CardId, CardSize>> = {
  rsi: 'S',
  atr: 'S',
  fearGreed: 'S',
  volume: 'M',
  heatmap: 'S',
  streakHistogram: 'S',
  volatility: 'S',
  volatilitySurface: 'S',
  ivTermStructure: 'M',
  aaveLiquidations: 'M',
};
