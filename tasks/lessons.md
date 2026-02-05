# Lessons Learned

## 2026-02-05 - lightweight-charts v5 API
**Mistake**: Used v4 API `chart.addCandlestickSeries()` and `chart.addLineSeries()`
**Pattern**: Library major versions break APIs; always check typings
**Rule**: For lightweight-charts v5+, use `chart.addSeries(CandlestickSeries, opts)` pattern
**Applied**: CandlestickChart.tsx, RSIChart.tsx

## 2026-02-05 - lightweight-charts LineWidth type
**Mistake**: Used `lineWidth: 1.5` which is not a valid `LineWidth`
**Pattern**: Numeric literal types are strict in TypeScript
**Rule**: LineWidth in lightweight-charts v5 is `1 | 2 | 3 | 4` only
**Applied**: chart-theme.ts, RSIChart.tsx

## 2026-02-05 - Binance API geo-restriction
**Mistake**: Assumed api.binance.com works globally
**Pattern**: Binance.com returns 451 in restricted regions
**Rule**: Always try api.binance.us first, fallback to api.binance.com
**Applied**: /api/binance/klines/route.ts

## 2026-02-05 - Recharts v3 formatter types
**Mistake**: Typed formatter as `(val: number) => ...`
**Pattern**: Recharts v3 Tooltip formatter value can be undefined
**Rule**: Use `(val) =>` with `Number(val)` conversion for Recharts formatters
**Applied**: VolumeChart.tsx, CycleTimelineChart.tsx

## 2026-02-05 - CSS @import ordering
**Mistake**: Put `@import "tailwindcss"` before `@import url(...)`
**Pattern**: CSS spec requires @import rules to precede all other rules
**Rule**: Font @import must come before @import "tailwindcss"
**Applied**: globals.css
