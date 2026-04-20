// ══════════════════════════════════════════════════════════════
// Technical Analysis Utilities
// RSI, MACD, Bollinger Bands, Moving Averages, ADX, etc.
// ══════════════════════════════════════════════════════════════

export interface DataPoint {
  time: number;
  value: number;
}

// Simple Moving Average (SMA)
export function calculateSMA(prices: number[], period: number): DataPoint[] {
  if (!prices || prices.length < period) return [];
  const result: DataPoint[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push({ time: i, value: sum / period });
  }
  return result;
}

// Exponential Moving Average (EMA)
export function calculateEMA(prices: number[], period: number): DataPoint[] {
  if (!prices || prices.length < period) return [];
  const k = 2 / (period + 1);
  const result: DataPoint[] = [];

  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  let ema = sum / period;

  for (let i = period - 1; i < prices.length; i++) {
    if (i === period - 1) {
      result.push({ time: i, value: ema });
    } else {
      ema = prices[i] * k + ema * (1 - k);
      result.push({ time: i, value: ema });
    }
  }
  return result;
}

// Relative Strength Index (RSI)
export function calculateRSI(prices: number[], period = 14): DataPoint[] {
  if (!prices || prices.length < period + 1) return [];

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i - 1]);

  const gains = changes.map(c => (c > 0 ? c : 0));
  const losses = changes.map(c => (c < 0 ? Math.abs(c) : 0));

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const result: DataPoint[] = [];
  for (let i = period; i < changes.length; i++) {
    if (i === period) {
      avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    } else {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: i + 1, value: 100 - 100 / (1 + rs) });
  }
  return result;
}

// MACD
export function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
) {
  if (!prices || prices.length < slowPeriod) return { macd: [] as DataPoint[], signal: [] as DataPoint[], histogram: [] as DataPoint[] };

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const startIdx = slowPeriod - 1;
  const macdLine: DataPoint[] = [];

  for (let i = startIdx; i < prices.length; i++) {
    const fastIdx = i - startIdx + (fastEMA.length - slowEMA.length);
    if (fastEMA[fastIdx] && slowEMA[i - startIdx]) {
      macdLine.push({ time: i, value: fastEMA[fastIdx].value - slowEMA[i - startIdx].value });
    }
  }

  const macdValues = macdLine.map(m => m.value);
  const signalEMA = calculateEMA(macdValues, signalPeriod);
  const signal = signalEMA.map((s, i) => ({
    time: macdLine[i + (macdLine.length - signalEMA.length)].time,
    value: s.value,
  }));

  const histogram: DataPoint[] = [];
  const signalStartIdx = macdLine.length - signalEMA.length;
  for (let i = 0; i < signalEMA.length; i++) {
    histogram.push({
      time: macdLine[signalStartIdx + i].time,
      value: macdLine[signalStartIdx + i].value - signalEMA[i].value,
    });
  }

  return { macd: macdLine, signal, histogram };
}

// Bollinger Bands
export function calculateBollingerBands(prices: number[], period = 20, stdDev = 2) {
  if (!prices || prices.length < period) return { upper: [] as DataPoint[], middle: [] as DataPoint[], lower: [] as DataPoint[] };

  const sma = calculateSMA(prices, period);
  const upper: DataPoint[] = [];
  const lower: DataPoint[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1].value;
    const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    upper.push({ time: i, value: mean + stdDev * std });
    lower.push({ time: i, value: mean - stdDev * std });
  }

  return { upper, middle: sma, lower };
}

// Average True Range (ATR)
export function calculateATR(high: number[], low: number[], close: number[], period = 14): DataPoint[] {
  if (!high || !low || !close || high.length < period + 1) return [];

  const tr: number[] = [];
  for (let i = 1; i < high.length; i++) {
    tr.push(Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1])));
  }

  const result: DataPoint[] = [];
  let avg = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < tr.length; i++) {
    avg = (avg * (period - 1) + tr[i]) / period;
    result.push({ time: i + 1, value: avg });
  }
  return result;
}

// ADX
export function calculateADX(high: number[], low: number[], close: number[], period = 14) {
  if (!high || !low || !close || close.length < period * 2) return { adx: [] as DataPoint[], plusDI: [] as DataPoint[], minusDI: [] as DataPoint[] };

  const plusDM: number[] = [], minusDM: number[] = [], tr: number[] = [];
  for (let i = 1; i < high.length; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1])));
  }

  const smoothTR: number[] = [], smoothPlusDM: number[] = [], smoothMinusDM: number[] = [];
  let sumTR = 0, sumPlusDM = 0, sumMinusDM = 0;
  for (let i = 0; i < period; i++) { sumTR += tr[i]; sumPlusDM += plusDM[i]; sumMinusDM += minusDM[i]; }
  smoothTR.push(sumTR); smoothPlusDM.push(sumPlusDM); smoothMinusDM.push(sumMinusDM);

  for (let i = period; i < tr.length; i++) {
    smoothTR.push(smoothTR[i - period] - smoothTR[i - period] / period + tr[i]);
    smoothPlusDM.push(smoothPlusDM[i - period] - smoothPlusDM[i - period] / period + plusDM[i]);
    smoothMinusDM.push(smoothMinusDM[i - period] - smoothMinusDM[i - period] / period + minusDM[i]);
  }

  const plusDI: DataPoint[] = [], minusDI: DataPoint[] = [], adx: DataPoint[] = [];
  for (let i = 0; i < smoothTR.length; i++) {
    if (smoothTR[i] === 0) { plusDI.push({ time: i + period, value: 0 }); minusDI.push({ time: i + period, value: 0 }); continue; }
    const pDI = (smoothPlusDM[i] / smoothTR[i]) * 100;
    const mDI = (smoothMinusDM[i] / smoothTR[i]) * 100;
    plusDI.push({ time: i + period, value: pDI });
    minusDI.push({ time: i + period, value: mDI });
    const dx = (Math.abs(pDI - mDI) / (pDI + mDI)) * 100;
    if (i >= period - 1) {
      const adxVal = adx.length > 0 ? (adx[adx.length - 1].value * (period - 1) + dx) / period : dx;
      adx.push({ time: i + period, value: adxVal });
    }
  }
  return { adx, plusDI, minusDI };
}

// Williams %R
export function calculateWilliamsR(high: number[], low: number[], close: number[], period = 14): DataPoint[] {
  if (!high || !low || close.length < period) return [];
  const result: DataPoint[] = [];
  for (let i = period - 1; i < close.length; i++) {
    const highest = Math.max(...high.slice(i - period + 1, i + 1));
    const lowest = Math.min(...low.slice(i - period + 1, i + 1));
    result.push({ time: i, value: ((highest - close[i]) / (highest - lowest)) * -100 });
  }
  return result;
}

// CCI
export function calculateCCI(high: number[], low: number[], close: number[], period = 20): DataPoint[] {
  if (!high || !low || close.length < period) return [];
  const typicalPrice = high.map((h, i) => (h + low[i] + close[i]) / 3);
  const sma = calculateSMA(typicalPrice, period);
  const result: DataPoint[] = [];
  for (let i = period - 1; i < typicalPrice.length; i++) {
    const mean = sma[i - period + 1].value;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += Math.abs(typicalPrice[j] - mean);
    const mad = sum / period;
    result.push({ time: i, value: mad !== 0 ? (typicalPrice[i] - mean) / (0.015 * mad) : 0 });
  }
  return result;
}

// Stochastic Oscillator
export function calculateStochastic(high: number[], low: number[], close: number[], period = 14) {
  if (!high || !low || close.length < period) return { k: [] as DataPoint[], d: [] as DataPoint[] };
  const k: DataPoint[] = [];
  for (let i = period - 1; i < close.length; i++) {
    const sliceHigh = Math.max(...high.slice(i - period + 1, i + 1));
    const sliceLow = Math.min(...low.slice(i - period + 1, i + 1));
    k.push({ time: i, value: ((close[i] - sliceLow) / (sliceHigh - sliceLow)) * 100 });
  }
  const kValues = k.map(kv => kv.value);
  const smoothedK = calculateSMA(kValues, 3).map((s, i) => ({ time: k[i + 2].time, value: s.value }));
  const dValues = smoothedK.map(sk => sk.value);
  const d = calculateSMA(dValues, 3).map((s, i) => ({ time: smoothedK[i + 2].time, value: s.value }));
  return { k: smoothedK, d };
}

// OBV
export function calculateOBV(close: number[], volume: number[]): DataPoint[] {
  if (!close || !volume || close.length < 2) return [];
  const result: DataPoint[] = [{ time: 0, value: volume[0] }];
  for (let i = 1; i < close.length; i++) {
    let obv = result[i - 1].value;
    if (close[i] > close[i - 1]) obv += volume[i];
    else if (close[i] < close[i - 1]) obv -= volume[i];
    result.push({ time: i, value: obv });
  }
  return result;
}

// Signal helpers
export function getRSISignal(rsi: DataPoint[]): string {
  if (!rsi || rsi.length === 0) return 'neutral';
  const last = rsi[rsi.length - 1].value;
  if (last >= 70) return 'overbought';
  if (last <= 30) return 'oversold';
  if (last >= 50) return 'bullish';
  return 'bearish';
}

export function getMACDSignal(macdData: { macd: DataPoint[]; signal: DataPoint[] }): string {
  if (!macdData?.macd?.length || macdData.macd.length < 2 || macdData.signal.length < 2) return 'neutral';
  const prevMacd = macdData.macd[macdData.macd.length - 2].value;
  const currMacd = macdData.macd[macdData.macd.length - 1].value;
  const prevSignal = macdData.signal[macdData.signal.length - 2].value;
  const currSignal = macdData.signal[macdData.signal.length - 1].value;
  if (prevMacd < prevSignal && currMacd > currSignal) return 'bullish';
  if (prevMacd > prevSignal && currMacd < currSignal) return 'bearish';
  if (currMacd > currSignal) return 'bullish';
  if (currMacd < currSignal) return 'bearish';
  return 'neutral';
}

export function getBollingerSignal(prices: number[], bollinger: { upper: DataPoint[]; lower: DataPoint[]; middle: DataPoint[] }): string {
  if (!prices || !bollinger?.upper?.length) return 'neutral';
  const currentPrice = prices[prices.length - 1];
  const lastUpper = bollinger.upper[bollinger.upper.length - 1].value;
  const lastLower = bollinger.lower[bollinger.lower.length - 1].value;
  const lastMiddle = bollinger.middle[bollinger.middle.length - 1].value;
  if (currentPrice > lastUpper) return 'overbought';
  if (currentPrice < lastLower) return 'oversold';
  if (currentPrice > lastMiddle) return 'bullish';
  return 'bearish';
}
