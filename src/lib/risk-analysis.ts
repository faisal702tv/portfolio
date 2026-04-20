// ══════════════════════════════════════════════════════════════
// Risk Analysis Utilities
// Beta, Sharpe Ratio, Max Drawdown, VaR, Diversification
// ══════════════════════════════════════════════════════════════

export interface PortfolioMetrics {
  totalCost: number;
  totalValue: number;
  returnPct: number;
  returnAmt: number;
}

export interface RiskResult {
  beta: number | null;
  sharpe: number | null;
  sortino: number | null;
  calmar: number | null;
  maxDrawdown: number;
  volatility: number | null;
  var95: number | null;
  riskLevel: string;
  dataPoints: number;
}

export interface Holding {
  symbol: string;
  name: string;
  value: number;
  type: string;
  sector: string;
}

export interface DiversificationResult {
  concentration: number;
  diversification: string;
  herfindahl: number;
  top5Concentration: number;
  weights: (Holding & { weight: number })[];
  count: number;
}

// Calculate portfolio return from stocks/bonds/funds
export function calculatePortfolioReturn(
  stocks: { qty?: number; buyPrice?: number; currentPrice?: number }[],
  bonds: { faceValue?: string | number; currentValue?: string | number }[],
  funds: { units?: number; buyPrice?: number; unitPrice?: number }[]
): PortfolioMetrics {
  let totalCost = 0, totalValue = 0;

  stocks.forEach(s => {
    totalCost += (s.qty || 0) * (s.buyPrice || 0);
    totalValue += (s.qty || 0) * (s.currentPrice || s.buyPrice || 0);
  });
  bonds.forEach(b => {
    totalCost += parseFloat(String(b.faceValue || 0));
    totalValue += parseFloat(String(b.currentValue || b.faceValue || 0));
  });
  funds.forEach(f => {
    totalCost += (f.units || 0) * (f.buyPrice || 0);
    totalValue += (f.units || 0) * (f.unitPrice || f.buyPrice || 0);
  });

  const returnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  return { totalCost, totalValue, returnPct, returnAmt: totalValue - totalCost };
}

// Generate daily returns from price series
function generateReturnsFromPrices(prices: number[]): number[] {
  if (!prices || prices.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

function calculateBeta(stockReturns: number[], marketReturns: number[]): number | null {
  const n = Math.min(stockReturns.length, marketReturns.length);
  if (n < 2) return null;
  const sR = stockReturns.slice(-n), mR = marketReturns.slice(-n);
  const avgS = sR.reduce((a, b) => a + b, 0) / n;
  const avgM = mR.reduce((a, b) => a + b, 0) / n;
  let cov = 0, mVar = 0;
  for (let i = 0; i < n; i++) { cov += (sR[i] - avgS) * (mR[i] - avgM); mVar += Math.pow(mR[i] - avgM, 2); }
  return mVar === 0 ? null : cov / mVar;
}

function calculateSharpeRatio(returns: number[], riskFreeRate = 0.02): number | null {
  if (returns.length < 2) return null;
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualized = avg * 252;
  const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length;
  const annualStd = Math.sqrt(variance) * Math.sqrt(252);
  return annualStd === 0 ? null : (annualized - riskFreeRate) / annualStd;
}

function calculateMaxDrawdown(values: number[]): number {
  if (values.length < 2) return 0;
  let peak = values[0], maxDD = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) peak = values[i];
    const dd = ((peak - values[i]) / peak) * 100;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

function calculateVolatility(returns: number[]): number | null {
  if (returns.length < 2) return null;
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

function calculateVaR(returns: number[], confidence = 0.95): number | null {
  if (returns.length < 2) return null;
  const sorted = [...returns].sort((a, b) => a - b);
  return sorted[Math.floor((1 - confidence) * sorted.length)] || 0;
}

function calculateSortinoRatio(returns: number[]): number | null {
  if (returns.length < 2) return null;
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const annualized = avg * 252;
  const neg = returns.filter(r => r < 0);
  if (neg.length === 0) return null;
  const dsVar = neg.reduce((s, r) => s + Math.pow(r, 2), 0) / returns.length;
  const dsDev = Math.sqrt(dsVar) * Math.sqrt(252);
  return dsDev === 0 ? null : annualized / dsDev;
}

function calculateCalmarRatio(returns: number[], maxDD: number): number | null {
  if (returns.length < 2 || maxDD === 0) return null;
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  return (avg * 252) / Math.abs(maxDD);
}

function getRiskLevel(beta: number | null, sharpe: number | null, volatility: number | null): string {
  let score = 0;
  if (beta !== null) { if (beta > 1.5) score += 3; else if (beta > 1) score += 2; else if (beta < 0.5) score -= 1; }
  if (sharpe !== null) { if (sharpe > 2) score -= 2; else if (sharpe > 1) score -= 1; else if (sharpe < 0) score += 2; }
  if (volatility !== null) { if (volatility > 30) score += 3; else if (volatility > 20) score += 2; else if (volatility < 10) score -= 1; }
  if (score >= 3) return 'very_high';
  if (score >= 1) return 'high';
  if (score >= -1) return 'medium';
  if (score >= -3) return 'low';
  return 'very_low';
}

// Comprehensive risk analysis
export function analyzePortfolioRisk(historicalPrices: number[], marketPrices?: number[] | null): RiskResult {
  const returns = generateReturnsFromPrices(historicalPrices);
  if (returns.length < 2) {
    return { beta: null, sharpe: null, sortino: null, calmar: null, maxDrawdown: 0, volatility: null, var95: null, riskLevel: 'unknown', dataPoints: 0 };
  }
  const marketReturns = marketPrices ? generateReturnsFromPrices(marketPrices) : null;
  const beta = marketReturns ? calculateBeta(returns, marketReturns) : null;
  const sharpe = calculateSharpeRatio(returns);
  const maxDrawdown = calculateMaxDrawdown(historicalPrices);
  const volatility = calculateVolatility(returns);
  const var95 = calculateVaR(returns);
  const sortino = calculateSortinoRatio(returns);
  const calmar = calculateCalmarRatio(returns, maxDrawdown);
  return { beta, sharpe, sortino, calmar, maxDrawdown, volatility, var95, riskLevel: getRiskLevel(beta, sharpe, volatility), dataPoints: returns.length };
}

// Diversification analysis
export function analyzeDiversification(holdings: Holding[]): DiversificationResult {
  const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
  if (totalValue === 0) return { concentration: 0, diversification: 'unknown', herfindahl: 0, top5Concentration: 0, weights: [], count: 0 };

  const weights = holdings.map(h => ({ ...h, weight: (h.value / totalValue) * 100 }));
  const herfindahl = weights.reduce((sum, w) => sum + Math.pow(w.weight / 100, 2), 0);

  let diversification: string;
  if (herfindahl < 0.15) diversification = 'excellent';
  else if (herfindahl < 0.25) diversification = 'good';
  else if (herfindahl < 0.40) diversification = 'moderate';
  else diversification = 'concentrated';

  const sorted = weights.sort((a, b) => b.weight - a.weight);
  const top5Concentration = sorted.slice(0, 5).reduce((sum, w) => sum + w.weight, 0);

  return { concentration: herfindahl, diversification, herfindahl, top5Concentration, weights: sorted, count: holdings.length };
}
