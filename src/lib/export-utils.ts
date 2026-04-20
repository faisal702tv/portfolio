/**
 * Export utilities for Portfolio data.
 * Supports PDF (jsPDF) and Excel (xlsx) export.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────

export interface ExportStock {
  symbol: string;
  name: string;
  qty: number;
  buyPrice: number;
  currentPrice: number | null;
  totalCost?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPct?: number;
  sector?: string;
}

export interface SnapshotStock extends ExportStock {
  id: string;
  exchange?: string;
  currency?: string;
  buyDate?: string;
  editReason?: string;
  lastEditedAt?: string;
  type?: string;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
  high52w?: number;
  low52w?: number;
  customBrok?: string | number;
  customVat?: string | number;
  customOtherFees?: string | number;
}

export interface SellRecord {
  id: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'bond' | 'fund' | 'crypto' | 'forex' | 'commodity';
  qty: number;
  buyPrice: number;
  sellPrice: number;
  buyDate?: string;
  sellDate: string;
  profitLoss: number;
  profitLossPct: number;
  fees?: number;
  purificationPct?: number;
  purificationAmount?: number;
  interestIncomeToRevenuePct?: number;
  debtToMarketCapPct?: number;
  currency?: string;
  exchange?: string;
  editReason?: string;
  high52w?: number;
  low52w?: number;
}

export interface PortfolioOption {
  id: string;
  name: string;
  isActive: boolean;
  currency: string;
}

export interface SnapshotBond {
  id: string;
  symbol: string;
  name: string;
  qty: number;
  buyPrice: number;
  currentPrice: number | null;
  faceValue: number;
  couponRate?: number | null;
  maturityDate?: string | null;
  currency?: string;
  exchange?: string;
  type?: string;
  buyDate?: string;
  editReason?: string;
  lastEditedAt?: string;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
  high52w?: number;
  low52w?: number;
  customBrok?: string | number;
  customVat?: string | number;
  customOtherFees?: string | number;
}

export interface SnapshotFund {
  id: string;
  symbol: string;
  name: string;
  units: number;
  buyPrice: number;
  currentPrice: number | null;
  nav?: number | null;
  fundType?: string;
  currency?: string;
  exchange?: string;
  type?: string;
  buyDate?: string;
  editReason?: string;
  lastEditedAt?: string;
  sector?: string;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
  high52w?: number;
  low52w?: number;
  customBrok?: string | number;
  customVat?: string | number;
  customOtherFees?: string | number;
}

export interface PortfolioSnapshot {
  portfolioId: string | null;
  portfolioName: string;
  currency: string;
  stocks: SnapshotStock[];
  bonds: SnapshotBond[];
  funds: SnapshotFund[];
  sellHistory?: SellRecord[];
  exportedAt: string;
}

export interface ExportOptions {
  title?: string;
  subtitle?: string;
  date?: Date;
  currency?: string;
}

export interface PersistPortfolioResult {
  ok: boolean;
  snapshot?: PortfolioSnapshot;
  portfolios?: PortfolioOption[];
  message?: string;
}

// ─── Excel Export ─────────────────────────────────────────────

export function exportToExcel(
  data: Record<string, any>[],
  sheetName: string = 'Sheet1',
  fileName: string = 'portfolio.xlsx'
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length + 2, ...data.map(row => String(row[key] || '').length + 2)),
  }));
  ws['!cols'] = colWidths;

  // RTL support
  if (!ws['!sheetViews']) ws['!sheetViews'] = [{}];

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

export function exportMultiSheetExcel(
  sheets: { name: string; data: Record<string, any>[] }[],
  fileName: string = 'portfolio.xlsx'
) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    const colWidths = Object.keys(sheet.data[0] || {}).map(key => ({
      wch: Math.max(key.length + 2, ...sheet.data.map(row => String(row[key] || '').length + 2)),
    }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  XLSX.writeFile(wb, fileName);
}

// ─── PDF Export ───────────────────────────────────────────────

export function exportToPDF(
  stocks: ExportStock[],
  options: ExportOptions = {}
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const isArabic = true;

  // Note: jsPDF has limited Arabic support.
  // For full Arabic PDF support, consider using a server-side library like puppeteer.
  // This implementation uses English labels with Arabic values.

  const totalValue = stocks.reduce((sum, s) => sum + (s.currentValue || 0), 0);
  const totalCost = stocks.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  // Title
  doc.setFontSize(20);
  doc.text(options.title || 'Portfolio Report', 105, 20, { align: 'center' });

  if (options.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(options.subtitle, 105, 28, { align: 'center' });
  }

  // Date
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const dateStr = (options.date || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated: ${dateStr}`, 105, 35, { align: 'center' });

  // Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', 14, 48);

  doc.setFontSize(10);
  doc.text(`Total Value: ${totalValue.toLocaleString()} ${options.currency || 'SAR'}`, 14, 56);
  doc.text(`Total Cost: ${totalCost.toLocaleString()} ${options.currency || 'SAR'}`, 14, 63);

  doc.setTextColor(totalPL >= 0 ? 0 : 200, totalPL >= 0 ? 150 : 0, 0);
  doc.text(`P/L: ${totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString()} (${totalPLPct >= 0 ? '+' : ''}${totalPLPct.toFixed(2)}%)`, 14, 70);

  // Table
  const tableData = stocks.map(s => [
    s.symbol,
    s.qty.toString(),
    s.buyPrice.toFixed(2),
    (s.currentPrice ?? s.buyPrice).toFixed(2),
    (s.currentValue || 0).toLocaleString(),
    (s.profitLoss || 0).toLocaleString(),
    `${(s.profitLossPct || 0) >= 0 ? '+' : ''}${(s.profitLossPct || 0).toFixed(2)}%`,
  ]);

  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: 78,
    head: [['Symbol', 'Qty', 'Buy Price', 'Current', 'Value', 'P/L', 'P/L %']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129], // emerald
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didParseCell: (data) => {
      // Color negative P/L red
      if (data.section === 'body' && data.column.index >= 5) {
        const value = data.cell.raw as string;
        if (value.startsWith('-')) {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Portfolio Manager Pro`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`portfolio-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Aliases & Additional Helpers ─────────────────────────────

/** Copy portfolio summary to clipboard */
export async function copyPortfolioSummary(data: any): Promise<boolean> {
  try {
    const list = Array.isArray(data) ? data : (data?.stocks || []);
    const text = list.map((item: any) =>
      `${item.symbol || item.name}: ${item.currentValue || item.value} (${item.profitLossPct >= 0 ? '+' : ''}${item.profitLossPct?.toFixed(2) || 0}%)`
    ).join('\n');
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Helper to fetch with auto token refresh on 401 */
async function tryRefreshAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await fetch('/api/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;

    const data = await response.json().catch(() => null);
    const nextToken = typeof data?.token === 'string' ? data.token : '';
    const nextRefreshToken = typeof data?.refreshToken === 'string' ? data.refreshToken : '';
    const nextUser = data?.user;

    if (!nextToken) return null;

    localStorage.setItem('token', nextToken);
    if (nextRefreshToken) localStorage.setItem('refreshToken', nextRefreshToken);
    if (nextUser && typeof nextUser === 'object') {
      localStorage.setItem('user', JSON.stringify(nextUser));
    }
    return nextToken;
  } catch {
    return null;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const isClient = typeof window !== 'undefined';
  const token = isClient ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const firstResponse = await fetch(url, { ...options, headers });
  if (!isClient || firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshedToken = await tryRefreshAuthToken();
  if (!refreshedToken) {
    return firstResponse;
  }

  const retryHeaders = new Headers(options.headers);
  retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);
  return fetch(url, { ...options, headers: retryHeaders });
}

/** Fetch a portfolio snapshot from the real database via API */
export async function fetchPortfolioSnapshot(portfolioId?: string): Promise<{
  snapshot: PortfolioSnapshot | null;
  portfolios: PortfolioOption[];
}> {
  try {
    const query = portfolioId ? `?portfolioId=${encodeURIComponent(portfolioId)}` : '';
    const res = await fetchWithAuth(`/api/portfolio/backup${query}`);
    
    if (!res.ok) {
      return {
        snapshot: buildDemoSnapshot(),
        portfolios: [{ id: 'demo', name: 'المحفظة التجريبية', isActive: true, currency: 'SAR' }],
      };
    }

    const data = await res.json();
    if (data.success && data.snapshot) {
      return {
        snapshot: data.snapshot,
        portfolios: data.portfolios || [{ id: 'demo', name: 'المحفظة التجريبية', isActive: true, currency: 'SAR' }],
      };
    }
    
    return {
      snapshot: buildDemoSnapshot(),
      portfolios: [{ id: 'demo', name: 'المحفظة التجريبية', isActive: true, currency: 'SAR' }],
    };
  } catch {
    return {
      snapshot: buildDemoSnapshot(),
      portfolios: [{ id: 'demo', name: 'المحفظة التجريبية', isActive: true, currency: 'SAR' }],
    };
  }
}

/** Fetch ALL portfolios snapshots across the entire account */
export async function fetchAllPortfoliosSnapshots(portfolios: PortfolioOption[]): Promise<PortfolioSnapshot[]> {
  try {
    const results = await Promise.all(
      portfolios.map(async (p) => {
        const query = `?portfolioId=${encodeURIComponent(p.id)}`;
        const res = await fetchWithAuth(`/api/portfolio/backup${query}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.success && data.snapshot ? (data.snapshot as PortfolioSnapshot) : null;
      })
    );
    return results.filter(Boolean) as PortfolioSnapshot[];
  } catch {
    return [];
  }
}

/** Build a demo snapshot for first-time users or fallbacks */
export function buildDemoSnapshot(): PortfolioSnapshot {
  return {
    portfolioId: 'demo',
    portfolioName: 'المحفظة التجريبية',
    currency: 'SAR',
    stocks: [
      {
        id: '1',
        symbol: '1120.SR',
        name: 'بنك الراجحي',
        qty: 100,
        buyPrice: 85.0,
        currentPrice: 88.5,
        totalCost: 8500,
        currentValue: 8850,
        profitLoss: 350,
        profitLossPct: 4.12,
        exchange: 'TADAWUL',
        currency: 'SAR',
        sector: 'Financials',
        shariaStatus: 'Compliant',
      },
      {
        id: '2',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        qty: 10,
        buyPrice: 175.0,
        currentPrice: 182.3,
        totalCost: 1750,
        currentValue: 1823,
        profitLoss: 73,
        profitLossPct: 4.17,
        exchange: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
      },
    ],
    bonds: [],
    funds: [],
    sellHistory: [],
    exportedAt: new Date().toISOString(),
  };
}

/** Persist a portfolio snapshot to storage */
export async function persistPortfolioSnapshot(snapshot: PortfolioSnapshot, portfolioId?: string): Promise<PersistPortfolioResult> {
  try {
    const query = portfolioId ? `?portfolioId=${encodeURIComponent(portfolioId)}` : '';
    const response = await fetchWithAuth(`/api/portfolio/backup${query}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ snapshot, portfolioId }),
    });
    if (!response.ok) {
      let message = '';
      try {
        const data = await response.json();
        message = typeof data?.error === 'string'
          ? data.error
          : (typeof data?.message === 'string' ? data.message : '');
      } catch {
        message = '';
      }
      return { ok: false, message: message || `HTTP ${response.status}` };
    }
    const data = await response.json().catch(() => null);
    return {
      ok: true,
      snapshot: data?.snapshot as PortfolioSnapshot | undefined,
      portfolios: data?.portfolios as PortfolioOption[] | undefined,
      message: typeof data?.message === 'string' ? data.message : undefined,
    };
  } catch {
    return { ok: false };
  }
}

/** Export portfolio as Excel (convenience alias) */
export function exportPortfolioExcel(data: any, fileName?: string) {
  const arr = Array.isArray(data) ? data : [data];
  exportToExcel(arr, 'Portfolio', fileName || `portfolio-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Export portfolio as JSON */
export function exportPortfolioJSON(data: any, fileName?: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `portfolio-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Print portfolio report using browser print */
export function printPortfolioReport() {
  window.print();
}
