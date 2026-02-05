# Task: Red vs Green Crypto Streak Dashboard

## Plan
- [x] Phase 1: Scaffold Next.js project, install dependencies
- [x] Phase 1: Create types, constants, API routes, transforms, hooks
- [x] Phase 2: Streak detection algorithm & technical indicators
- [x] Phase 3: Context, layout shell, stat cards, Dashboard orchestrator
- [x] Phase 4: Candlestick chart, streak timeline, RSI chart
- [x] Phase 5: Volume, Fear & Greed, histogram, heatmap, comparison, toggles
- [x] Phase 6: Build, fix errors, verify

## Progress Notes
- Binance.com API is geo-restricted (451 error). Added fallback to Binance US (api.binance.us) which works.
- lightweight-charts v5 uses `chart.addSeries(CandlestickSeries, opts)` not `chart.addCandlestickSeries(opts)`
- LineWidth type in lightweight-charts v5 is `1 | 2 | 3 | 4` (integers only, no 1.5)
- Recharts v3 Tooltip formatter expects `(val) =>` not `(val: number) =>` (val can be undefined)
- CSS @import url() must come before @import "tailwindcss" per CSS spec

## Review
Build passes cleanly. API routes return data correctly. 365 daily candles for BTC confirmed.
All 8 chart components, 3 card components, 1 control panel, and the Dashboard orchestrator are wired together.
