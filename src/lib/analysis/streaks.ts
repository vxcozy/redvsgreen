import { OHLCV, Streak, StreakStats, CurrentStreakStatus } from '../types';

export function detectStreaks(candles: OHLCV[]): Streak[] {
  const streaks: Streak[] = [];
  if (candles.length === 0) return streaks;

  let currentType: 'green' | 'red' =
    candles[0].close >= candles[0].open ? 'green' : 'red';
  let streakStart = 0;

  for (let i = 1; i <= candles.length; i++) {
    const isEnd = i === candles.length;
    const candleType = isEnd
      ? currentType
      : candles[i].close >= candles[i].open
        ? 'green'
        : 'red';

    if (isEnd || candleType !== currentType) {
      const endIndex = i - 1;
      const streakCandles = candles.slice(streakStart, endIndex + 1);
      const startPrice = streakCandles[0].open;
      const endPrice = streakCandles[streakCandles.length - 1].close;

      streaks.push({
        type: currentType,
        startIndex: streakStart,
        endIndex,
        startDate: candles[streakStart].date,
        endDate: candles[endIndex].date,
        length: endIndex - streakStart + 1,
        totalPercentChange: ((endPrice - startPrice) / startPrice) * 100,
        avgDailyVolume:
          streakCandles.reduce((sum, c) => sum + c.volume, 0) /
          streakCandles.length,
        candles: streakCandles,
      });

      if (!isEnd) {
        currentType = candleType;
        streakStart = i;
      }
    }
  }

  return streaks;
}

export function computeStreakStats(streaks: Streak[]): StreakStats | null {
  if (streaks.length === 0) return null;

  const greenStreaks = streaks.filter((s) => s.type === 'green');
  const redStreaks = streaks.filter((s) => s.type === 'red');

  if (greenStreaks.length === 0 || redStreaks.length === 0) return null;

  const longestGreen = greenStreaks.reduce((max, s) =>
    s.length > max.length ? s : max
  );
  const longestRed = redStreaks.reduce((max, s) =>
    s.length > max.length ? s : max
  );

  const greenDist: Record<number, number> = {};
  const redDist: Record<number, number> = {};
  greenStreaks.forEach((s) => {
    greenDist[s.length] = (greenDist[s.length] || 0) + 1;
  });
  redStreaks.forEach((s) => {
    redDist[s.length] = (redDist[s.length] || 0) + 1;
  });

  const lastStreak = streaks[streaks.length - 1];
  const currentStreak: CurrentStreakStatus = {
    type: lastStreak.type,
    length: lastStreak.length,
    startDate: lastStreak.startDate,
    percentChangeSoFar: lastStreak.totalPercentChange,
    isOngoing: true,
  };

  const topGreenStreaks = [...greenStreaks]
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);
  const topRedStreaks = [...redStreaks]
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);

  return {
    longestGreen,
    longestRed,
    avgGreenLength:
      greenStreaks.reduce((s, x) => s + x.length, 0) / greenStreaks.length,
    avgRedLength:
      redStreaks.reduce((s, x) => s + x.length, 0) / redStreaks.length,
    totalGreenDays: greenStreaks.reduce((s, x) => s + x.length, 0),
    totalRedDays: redStreaks.reduce((s, x) => s + x.length, 0),
    greenStreakDistribution: greenDist,
    redStreakDistribution: redDist,
    currentStreak,
    allStreaks: streaks,
    topGreenStreaks,
    topRedStreaks,
  };
}
