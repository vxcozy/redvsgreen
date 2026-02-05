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
} as const;

export const TIME_RANGE_DAYS: Record<string, number> = {
  '1Y': 365,
  '2Y': 730,
  ALL: 9999,
};
