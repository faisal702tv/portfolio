import { NextResponse } from 'next/server';

// ================================
// INVESTMENT FUNDS, SUKUK & BONDS API
// ================================

interface FundPrice {
  name: string;
  nameEn: string;
  nav: number;
  change: number;
  changePct: number;
  ytdReturn: number;
  oneYearReturn: number;
  isShariaCompliant: boolean;
  fundType: 'equity' | 'bond' | 'mixed' | 'money_market' | 'real_estate' | 'etf' | 'reit';
  currency: string;
  manager: string;
  lastUpdate: number;
}

interface SukukPrice {
  symbol: string;
  name: string;
  nameEn: string;
  couponRate: number;
  maturityDate: string;
  price: number;
  yield: number;
  rating: string;
  isShariaCompliant: boolean;
  issuer: string;
  currency: string;
  lastUpdate: number;
}

// Saudi REITs and ETFs symbols for Yahoo Finance
const SAUDI_REITS = [
  { symbol: '1598.SR', name: 'صندوق الراجحي للأسهم', nameEn: 'Al Rajhi REIT', type: 'reit' as const },
  { symbol: '4335.SR', name: 'صندوق الإنماء ريت', nameEn: 'Alinma REIT', type: 'reit' as const },
  { symbol: '4340.SR', name: 'صندوق الرياض ريت', nameEn: 'Riyad REIT', type: 'reit' as const },
  { symbol: '4342.SR', name: 'صندوق ساب ريت', nameEn: 'SAB REIT', type: 'reit' as const },
  { symbol: '4344.SR', name: 'صندوق تعليم ريت', nameEn: 'Taleem REIT', type: 'reit' as const },
  { symbol: '4346.SR', name: 'صندوق جدوى ريت', nameEn: 'Jadwa REIT', type: 'reit' as const },
  { symbol: '4350.SR', name: 'صندوق المسار ريت', nameEn: 'Al Masar REIT', type: 'reit' as const },
  { symbol: '4352.SR', name: 'صندوق المشاركة ريت', nameEn: 'Musharaka REIT', type: 'reit' as const },
  { symbol: '4354.SR', name: 'صندوق سيدكو ريت', nameEn: 'SEDCO REIT', type: 'reit' as const },
  { symbol: '4360.SR', name: 'صندوق الخليج ريت', nameEn: 'Gulf REIT', type: 'reit' as const },
];

// Saudi Investment Funds
const SAUDI_FUNDS: FundPrice[] = [
  // Equity Funds
  { name: 'صندوق الأهلي للأسهم السعودية', nameEn: 'NCB Saudi Equity Fund', nav: 185.50, change: 2.80, changePct: 1.53, ytdReturn: 8.5, oneYearReturn: 15.2, isShariaCompliant: true, fundType: 'equity', currency: 'SAR', manager: 'NCB Capital', lastUpdate: Date.now() },
  { name: 'صندوق الراجحي للأسهم السعودية', nameEn: 'Al Rajhi Saudi Equity Fund', nav: 142.30, change: 1.95, changePct: 1.39, ytdReturn: 7.8, oneYearReturn: 12.5, isShariaCompliant: true, fundType: 'equity', currency: 'SAR', manager: 'Al Rajhi Capital', lastUpdate: Date.now() },
  { name: 'صندوق الإنماء للأسهم السعودية', nameEn: 'Alinma Saudi Equity Fund', nav: 98.75, change: 1.25, changePct: 1.28, ytdReturn: 6.5, oneYearReturn: 11.2, isShariaCompliant: true, fundType: 'equity', currency: 'SAR', manager: 'Alinma Investment', lastUpdate: Date.now() },
  { name: 'صندوق الرياض للأسهم السعودية', nameEn: 'Riyad Saudi Equity Fund', nav: 125.80, change: 1.85, changePct: 1.49, ytdReturn: 7.2, oneYearReturn: 13.8, isShariaCompliant: true, fundType: 'equity', currency: 'SAR', manager: 'Riyad Capital', lastUpdate: Date.now() },
  { name: 'صندوق البلاد للأسهم السعودية', nameEn: 'Al Bilad Saudi Equity Fund', nav: 78.50, change: 0.95, changePct: 1.22, ytdReturn: 5.8, oneYearReturn: 9.5, isShariaCompliant: true, fundType: 'equity', currency: 'SAR', manager: 'Al Bilad Capital', lastUpdate: Date.now() },
  
  // Mixed Funds
  { name: 'صندوق الأهلي المتوازن', nameEn: 'NCB Balanced Fund', nav: 165.20, change: 2.10, changePct: 1.29, ytdReturn: 6.2, oneYearReturn: 10.5, isShariaCompliant: true, fundType: 'mixed', currency: 'SAR', manager: 'NCB Capital', lastUpdate: Date.now() },
  { name: 'صندوق الراجحي المتوازن', nameEn: 'Al Rajhi Balanced Fund', nav: 135.40, change: 1.65, changePct: 1.23, ytdReturn: 5.8, oneYearReturn: 9.2, isShariaCompliant: true, fundType: 'mixed', currency: 'SAR', manager: 'Al Rajhi Capital', lastUpdate: Date.now() },
  
  // Money Market Funds
  { name: 'صندوق الأهلي للنقد', nameEn: 'NCB Money Market Fund', nav: 105.25, change: 0.05, changePct: 0.05, ytdReturn: 4.5, oneYearReturn: 4.8, isShariaCompliant: true, fundType: 'money_market', currency: 'SAR', manager: 'NCB Capital', lastUpdate: Date.now() },
  { name: 'صندوق الراجحي للنقد', nameEn: 'Al Rajhi Money Market Fund', nav: 102.15, change: 0.03, changePct: 0.03, ytdReturn: 4.2, oneYearReturn: 4.5, isShariaCompliant: true, fundType: 'money_market', currency: 'SAR', manager: 'Al Rajhi Capital', lastUpdate: Date.now() },
  
  // Real Estate Funds
  { name: 'صندوق الأهلي العقاري', nameEn: 'NCB Real Estate Fund', nav: 195.80, change: 3.20, changePct: 1.66, ytdReturn: 9.5, oneYearReturn: 18.2, isShariaCompliant: true, fundType: 'real_estate', currency: 'SAR', manager: 'NCB Capital', lastUpdate: Date.now() },
  { name: 'صندوق الراجحي العقاري', nameEn: 'Al Rajhi Real Estate Fund', nav: 148.50, change: 2.35, changePct: 1.61, ytdReturn: 8.8, oneYearReturn: 15.5, isShariaCompliant: true, fundType: 'real_estate', currency: 'SAR', manager: 'Al Rajhi Capital', lastUpdate: Date.now() },
];

// Sukuk and Bonds
const SUKUK_BONDS: SukukPrice[] = [
  // Government Sukuk
  { symbol: 'SUKUK-2025', name: 'صكوك حكومية 2025', nameEn: 'Government Sukuk 2025', couponRate: 3.25, maturityDate: '2025-12-15', price: 100.25, yield: 3.15, rating: 'AAA', isShariaCompliant: true, issuer: 'Ministry of Finance', currency: 'SAR', lastUpdate: Date.now() },
  { symbol: 'SUKUK-2026', name: 'صكوك حكومية 2026', nameEn: 'Government Sukuk 2026', couponRate: 3.50, maturityDate: '2026-06-15', price: 100.50, yield: 3.35, rating: 'AAA', isShariaCompliant: true, issuer: 'Ministry of Finance', currency: 'SAR', lastUpdate: Date.now() },
  { symbol: 'SUKUK-2027', name: 'صكوك حكومية 2027', nameEn: 'Government Sukuk 2027', couponRate: 3.75, maturityDate: '2027-03-15', price: 100.75, yield: 3.55, rating: 'AAA', isShariaCompliant: true, issuer: 'Ministry of Finance', currency: 'SAR', lastUpdate: Date.now() },
  { symbol: 'SUKUK-2030', name: 'صكوك حكومية 2030', nameEn: 'Government Sukuk 2030', couponRate: 4.00, maturityDate: '2030-09-15', price: 101.25, yield: 3.85, rating: 'AAA', isShariaCompliant: true, issuer: 'Ministry of Finance', currency: 'SAR', lastUpdate: Date.now() },
  
  // Corporate Sukuk
  { symbol: 'ARAMCO-SUKUK-2026', name: 'صكوك أرامكو 2026', nameEn: 'Aramco Sukuk 2026', couponRate: 2.95, maturityDate: '2026-04-15', price: 99.85, yield: 2.88, rating: 'AA+', isShariaCompliant: true, issuer: 'Saudi Aramco', currency: 'SAR', lastUpdate: Date.now() },
  { symbol: 'ARAMCO-SUKUK-2028', name: 'صكوك أرامكو 2028', nameEn: 'Aramco Sukuk 2028', couponRate: 3.25, maturityDate: '2028-10-15', price: 100.15, yield: 3.18, rating: 'AA+', isShariaCompliant: true, issuer: 'Saudi Aramco', currency: 'SAR', lastUpdate: Date.now() },
  { symbol: 'STC-SUKUK-2025', name: 'صكوك STC 2025', nameEn: 'STC Sukuk 2025', couponRate: 2.50, maturityDate: '2025-06-15', price: 100.10, yield: 2.45, rating: 'A+', isShariaCompliant: true, issuer: 'Saudi Telecom', currency: 'SAR', lastUpdate: Date.now() },
  { symbol: 'SABIC-SUKUK-2027', name: 'صكوك سابك 2027', nameEn: 'SABIC Sukuk 2027', couponRate: 3.15, maturityDate: '2027-08-15', price: 100.30, yield: 3.08, rating: 'A', isShariaCompliant: true, issuer: 'SABIC', currency: 'SAR', lastUpdate: Date.now() },
  
  // Bank Sukuk
  { symbol: 'ALRAJHI-SUKUK-2025', name: 'صكوك الراجحي 2025', nameEn: 'Al Rajhi Sukuk 2025', couponRate: 2.75, maturityDate: '2025-09-15', price: 99.95, yield: 2.70, rating: 'A+', isShariaCompliant: true, issuer: 'Al Rajhi Bank', currency: 'SAR', lastUpdate: Date.now() },
  { symbol: 'ALINMA-SUKUK-2026', name: 'صكوك الإنماء 2026', nameEn: 'Alinma Sukuk 2026', couponRate: 2.85, maturityDate: '2026-03-15', price: 100.05, yield: 2.80, rating: 'A', isShariaCompliant: true, issuer: 'Alinma Bank', currency: 'SAR', lastUpdate: Date.now() },
  { symbol: 'NCB-SUKUK-2027', name: 'صكوك الأهلي 2027', nameEn: 'NCB Sukuk 2027', couponRate: 3.00, maturityDate: '2027-01-15', price: 100.20, yield: 2.95, rating: 'AA-', isShariaCompliant: true, issuer: 'NCB', currency: 'SAR', lastUpdate: Date.now() },
];

// UAE Funds
const UAE_FUNDS: FundPrice[] = [
  { name: 'صندوق أبوظبي للأسهم', nameEn: 'ADIA Equity Fund', nav: 215.50, change: 3.80, changePct: 1.79, ytdReturn: 9.2, oneYearReturn: 16.5, isShariaCompliant: true, fundType: 'equity', currency: 'AED', manager: 'ADIA', lastUpdate: Date.now() },
  { name: 'صندوق دبي للأسهم', nameEn: 'DFM Equity Fund', nav: 168.30, change: 2.45, changePct: 1.48, ytdReturn: 7.5, oneYearReturn: 12.8, isShariaCompliant: true, fundType: 'equity', currency: 'AED', manager: 'Emirates NBD', lastUpdate: Date.now() },
  { name: 'صندوق الفجيرة العقاري', nameEn: 'Fujairah Real Estate Fund', nav: 125.80, change: 1.85, changePct: 1.49, ytdReturn: 8.2, oneYearReturn: 14.5, isShariaCompliant: true, fundType: 'real_estate', currency: 'AED', manager: 'Fujairah Holding', lastUpdate: Date.now() },
];

// Kuwait Funds
const KUWAIT_FUNDS: FundPrice[] = [
  { name: 'صندوق الكويت للأسهم', nameEn: 'Kuwait Equity Fund', nav: 185.20, change: 2.65, changePct: 1.45, ytdReturn: 8.8, oneYearReturn: 15.2, isShariaCompliant: true, fundType: 'equity', currency: 'KWD', manager: 'NBK Capital', lastUpdate: Date.now() },
  { name: 'صندوق بيت التمويل العقاري', nameEn: 'KFH Real Estate Fund', nav: 142.50, change: 2.10, changePct: 1.49, ytdReturn: 7.5, oneYearReturn: 13.5, isShariaCompliant: true, fundType: 'real_estate', currency: 'KWD', manager: 'KFH', lastUpdate: Date.now() },
];

// Fetch live REIT prices from Yahoo
async function fetchREITPrices() {
  const results: Record<string, any> = {};
  
  for (const reit of SAUDI_REITS) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${reit.symbol}?interval=1d&range=2d`,
        {
          next: { revalidate: 60 },
          headers: { 'User-Agent': 'Mozilla/5.0' }
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        
        if (meta) {
          const price = meta.regularMarketPrice || 0;
          const prevClose = meta.previousClose || price;
          const change = price - prevClose;
          const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
          
          results[reit.symbol] = {
            ...reit,
            nav: price,
            change,
            changePct,
            price,
            isShariaCompliant: true,
            currency: 'SAR',
            lastUpdate: Date.now()
          };
        }
      }
    } catch (e) {
      // Continue with next
    }
  }
  
  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'funds', 'sukuk', 'reits', 'all'
  
  try {
    const reitPrices = await fetchREITPrices();
    
    const response = {
      success: true,
      timestamp: Date.now(),
      
      // Saudi REITs (live from Yahoo)
      reits: reitPrices,
      
      // Investment Funds
      funds: {
        saudi: SAUDI_FUNDS,
        uae: UAE_FUNDS,
        kuwait: KUWAIT_FUNDS,
      },
      
      // Sukuk and Bonds
      sukuk: {
        government: SUKUK_BONDS.filter(s => s.issuer === 'Ministry of Finance'),
        corporate: SUKUK_BONDS.filter(s => s.issuer !== 'Ministry of Finance'),
      },
      
      // Summary
      summary: {
        totalFunds: SAUDI_FUNDS.length + UAE_FUNDS.length + KUWAIT_FUNDS.length,
        totalSukuk: SUKUK_BONDS.length,
        totalREITs: Object.keys(reitPrices).length,
        shariaCompliantFunds: [...SAUDI_FUNDS, ...UAE_FUNDS, ...KUWAIT_FUNDS].filter(f => f.isShariaCompliant).length,
        shariaCompliantSukuk: SUKUK_BONDS.filter(s => s.isShariaCompliant).length,
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Funds API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch funds data'
    }, { status: 500 });
  }
}
