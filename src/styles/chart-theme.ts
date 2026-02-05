import { ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import { COLORS, CHART_COLORS } from '@/lib/constants';

export const darkChartOptions = {
  layout: {
    background: { type: ColorType.Solid, color: COLORS.bg.card },
    textColor: COLORS.text.secondary,
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
  },
  grid: {
    vertLines: { color: '#141820', style: LineStyle.Dotted },
    horzLines: { color: '#141820', style: LineStyle.Dotted },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: COLORS.text.muted,
      width: 1 as const,
      style: LineStyle.Dashed,
      labelBackgroundColor: COLORS.bg.tertiary,
    },
    horzLine: {
      color: COLORS.text.muted,
      width: 1 as const,
      style: LineStyle.Dashed,
      labelBackgroundColor: COLORS.bg.tertiary,
    },
  },
  rightPriceScale: {
    borderColor: COLORS.border.default,
    scaleMargins: { top: 0.1, bottom: 0.1 },
  },
  timeScale: {
    borderColor: COLORS.border.default,
    timeVisible: false,
    rightOffset: 5,
    barSpacing: 6,
  },
};

export const candlestickSeriesOptions = {
  upColor: CHART_COLORS.upColor,
  downColor: CHART_COLORS.downColor,
  borderUpColor: CHART_COLORS.borderUpColor,
  borderDownColor: CHART_COLORS.borderDownColor,
  wickUpColor: CHART_COLORS.wickUpColor,
  wickDownColor: CHART_COLORS.wickDownColor,
};

export const volumeSeriesOptions = {
  priceFormat: { type: 'volume' as const },
  priceScaleId: 'volume',
};

export const overlayLineStyles = {
  sma50: { color: COLORS.overlay.sma50, lineWidth: 2 as const },
  sma200: { color: COLORS.overlay.sma200, lineWidth: 2 as const },
  bollingerUpper: {
    color: COLORS.overlay.bollinger,
    lineWidth: 1 as const,
    lineStyle: LineStyle.Dashed,
  },
  bollingerMiddle: {
    color: COLORS.overlay.bollinger,
    lineWidth: 1 as const,
  },
  bollingerLower: {
    color: COLORS.overlay.bollinger,
    lineWidth: 1 as const,
    lineStyle: LineStyle.Dashed,
  },
};
