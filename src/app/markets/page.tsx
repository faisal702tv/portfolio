'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MarketOverviewBar, MarketTicker } from '@/components/dashboard/MarketTicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  marketIndices,
  getMarketsByType,
  cryptoData,
  commoditiesData,
  formatLargeNumber
} from '@/data/markets';
import { formatNumber } from '@/lib/helpers';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Clock,
  Bitcoin,
  Coins,
  Search,
  RefreshCw,
  BarChart3,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

type RegionCode = 'middle_east' | 'asia' | 'europe' | 'americas';
type RegionFilter = 'all' | RegionCode;

interface GlobalIndexDef {
  yahoo: string;
  symbol: string;
  name: string;
  country: string;
  region: RegionCode;
  exchange: string;
  sourceUrl: string;
  yahooUrl: string;
}

interface TrackedStockDef {
  yahoo: string;
  symbol: string;
  name: string;
  country: string;
  region: RegionCode;
  exchange: string;
}

interface LiveIndex {
  yahoo: string;
  symbol: string;
  name: string;
  country: string;
  region: RegionCode;
  exchange: string;
  sourceUrl: string;
  yahooUrl: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  source: string | null;
  live: boolean;
}

interface LiveStock {
  yahoo: string;
  symbol: string;
  name: string;
  country: string;
  region: RegionCode;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  valueTraded: number;
  valueTradedUsd: number;
  live: boolean;
}

interface TickerQuote {
  price: number;
  change: number;
  changePct: number;
  volume: number;
  currency?: string;
  source?: string;
}

interface TopCardConfig {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  items: LiveStock[];
  valueLabel: string;
  valueGetter: (stock: LiveStock) => string;
  secondaryValueGetter?: (stock: LiveStock) => string;
  rowClass: string;
  valueClass: string;
}

const REGION_LABELS: Record<RegionFilter, string> = {
  all: 'كل المناطق',
  middle_east: 'الشرق الأوسط',
  asia: 'آسيا',
  europe: 'أوروبا',
  americas: 'الأمريكتان',
};

const TOP_LIST_SIZE = 10;
const AUTO_REFRESH_MS = 30_000;
const SAUDI_EXCHANGE_INDICES_URL = 'https://www.saudiexchange.sa/wps/portal/saudiexchange/ourmarkets/nomuc-market-watch/nomu-indices-performance';
const NSE_INDICES_URL = 'https://www.nseindia.com/market-data/live-equity-market';
const BSE_SENSEX_URL = 'https://www.bseindia.com/sensex/code/16/';
const HSI_HOME_URL = 'https://www.hsi.com.hk/eng';
const JPX_INDICES_URL = 'https://www.jpx.co.jp/english/markets/indices/';
const KRX_GLOBAL_URL = 'https://global.krx.co.kr/main/main.jsp';
const LSE_FTSE100_URL = 'https://www.londonstockexchange.com/indices/ftse-100';
const LSE_FTSE250_URL = 'https://www.londonstockexchange.com/indices/ftse-250';
const DEUTSCHE_BOERSE_HOME_URL = 'https://www.deutsche-boerse.com/dbg-en/';
const EURONEXT_PARIS_INDICES_URL = 'https://live.euronext.com/en/markets/paris/indices';
const STOXX_HOME_URL = 'https://www.stoxx.com/';
const EURONEXT_AMSTERDAM_INDICES_URL = 'https://live.euronext.com/en/markets/amsterdam/indices';
const SIX_MARKET_DATA_URL = 'https://www.six-group.com/en/market-data.html';
const NASDAQ_NORDIC_INDICES_URL = 'https://www.nasdaqomxnordic.com/index/index_info';
const CBOE_VIX_URL = 'https://www.cboe.com/tradable_products/vix/';

const EXCHANGE_SOURCE_BY_SYMBOL: Record<string, string> = {
  TASI: 'https://www.saudiexchange.sa/wps/portal/saudiexchange/ourmarkets/main-market-watch',
  NOMUC: SAUDI_EXCHANGE_INDICES_URL,
  MT30: SAUDI_EXCHANGE_INDICES_URL,
  NIFTY50: NSE_INDICES_URL,
  NIFTYBANK: NSE_INDICES_URL,
  SENSEX: BSE_SENSEX_URL,
  NIKKEI: JPX_INDICES_URL,
  TOPIX: JPX_INDICES_URL,
  HSI: HSI_HOME_URL,
  HSCEI: HSI_HOME_URL,
  KOSPI: KRX_GLOBAL_URL,
  KOSPI200: KRX_GLOBAL_URL,
  KOSDAQ: KRX_GLOBAL_URL,
  FTSE100: LSE_FTSE100_URL,
  FTSE250: LSE_FTSE250_URL,
  DAX: DEUTSCHE_BOERSE_HOME_URL,
  CAC40: EURONEXT_PARIS_INDICES_URL,
  STOXX50: STOXX_HOME_URL,
  AEX: EURONEXT_AMSTERDAM_INDICES_URL,
  SMI: SIX_MARKET_DATA_URL,
  OMXH25: NASDAQ_NORDIC_INDICES_URL,
  VIX: CBOE_VIX_URL,
};

const OFFICIAL_SOURCE_BY_EXCHANGE: Record<string, string> = {
  'تداول': 'https://www.saudiexchange.sa',
  'تداول - نمو': SAUDI_EXCHANGE_INDICES_URL,
  'أبوظبي ADX': 'https://www.adx.ae',
  'دبي DFM': 'https://www.dfm.ae',
  'بورصة الكويت': 'https://www.boursakuwait.com.kw',
  'بورصة قطر': 'https://www.qatarexchange.qa',
  'بورصة البحرين': 'https://www.bahrainbourse.com',
  'بورصة مسقط': 'https://www.msx.om',
  'البورصة المصرية': 'https://www.egx.com.eg',
  'بورصة طوكيو': 'https://www.jpx.co.jp',
  'HKEX': 'https://www.hkex.com.hk',
  'SSE': 'https://english.sse.com.cn',
  'SZSE': 'https://www.szse.cn/English',
  'CSI': 'https://www.csindex.com.cn/#/indices/index-detail',
  'BSE': 'https://www.bseindia.com',
  'NSE': 'https://www.nseindia.com',
  'KRX': 'https://global.krx.co.kr',
  'TWSE': 'https://www.twse.com.tw/en/',
  'SGX': 'https://www.sgx.com',
  'LSE': 'https://www.londonstockexchange.com',
  'XETRA': 'https://www.deutsche-boerse.com',
  'Euronext Paris': 'https://www.euronext.com/en/markets/paris',
  'STOXX': 'https://www.stoxx.com',
  'Euronext Amsterdam': 'https://www.euronext.com/en/markets/amsterdam',
  'SIX': 'https://www.six-group.com/en/market-data.html',
  'Nasdaq Helsinki': 'https://www.nasdaqomxnordic.com',
  'Borsa Istanbul': 'https://www.borsaistanbul.com/en',
  'S&P Dow Jones': 'https://www.spglobal.com/spdji/en/indices/equity/',
  'NASDAQ': 'https://www.nasdaq.com/market-activity/index',
  'FTSE Russell': 'https://www.lseg.com/en/ftse-russell',
  'CBOE': 'https://www.cboe.com/tradable_products/vix/',
  'NYSE': 'https://www.nyse.com/index',
  'Wilshire': 'https://www.wilshireindexes.com/',
  'TSX': 'https://www.tsx.com',
  'TSE': 'https://www.jpx.co.jp/english/',
};

function buildYahooQuoteUrl(symbol: string): string {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
}

function buildSourceUrl(def: Omit<GlobalIndexDef, 'sourceUrl' | 'yahooUrl'>): string {
  return EXCHANGE_SOURCE_BY_SYMBOL[def.symbol] || OFFICIAL_SOURCE_BY_EXCHANGE[def.exchange] || buildYahooQuoteUrl(def.yahoo);
}

const GLOBAL_INDEX_DEFS: Omit<GlobalIndexDef, 'sourceUrl' | 'yahooUrl'>[] = [
  // الشرق الأوسط
  { yahoo: '^TASI.SR', symbol: 'TASI', name: 'مؤشر تداول لجميع الأسهم', country: 'السعودية', region: 'middle_east', exchange: 'تداول' },
  { yahoo: '^MT30.SR', symbol: 'MT30', name: 'مؤشر تداول 30', country: 'السعودية', region: 'middle_east', exchange: 'تداول' },
  { yahoo: '^NOMUC.SR', symbol: 'NOMUC', name: 'مؤشر سوق نمو (NomuC)', country: 'السعودية', region: 'middle_east', exchange: 'تداول - نمو' },
  { yahoo: 'FADGI.AE', symbol: 'FTFADGI', name: 'فوتسي أبوظبي العام', country: 'الإمارات', region: 'middle_east', exchange: 'أبوظبي ADX' },
  { yahoo: 'DFMGI.DU', symbol: 'DFMGI', name: 'مؤشر دبي العام', country: 'الإمارات', region: 'middle_east', exchange: 'دبي DFM' },
  { yahoo: '^KWSE', symbol: 'KWSE', name: 'مؤشر الكويت العام', country: 'الكويت', region: 'middle_east', exchange: 'بورصة الكويت' },
  { yahoo: 'QSI.QA', symbol: 'QSI', name: 'مؤشر قطر العام', country: 'قطر', region: 'middle_east', exchange: 'بورصة قطر' },
  { yahoo: 'MSI.OM', symbol: 'MSX30', name: 'مؤشر مسقط 30', country: 'عُمان', region: 'middle_east', exchange: 'بورصة مسقط' },
  { yahoo: '^BAX', symbol: 'BHB', name: 'مؤشر البحرين العام', country: 'البحرين', region: 'middle_east', exchange: 'بورصة البحرين' },
  { yahoo: '^CASE30', symbol: 'EGX30', name: 'مؤشر مصر 30', country: 'مصر', region: 'middle_east', exchange: 'البورصة المصرية' },
  { yahoo: 'EGX70.CA', symbol: 'EGX70', name: 'مؤشر مصر 70', country: 'مصر', region: 'middle_east', exchange: 'البورصة المصرية' },
  { yahoo: 'EGX100.CA', symbol: 'EGX100', name: 'مؤشر مصر 100', country: 'مصر', region: 'middle_east', exchange: 'البورصة المصرية' },

  // آسيا
  { yahoo: '^N225', symbol: 'NIKKEI', name: 'نيكاي 225', country: 'اليابان', region: 'asia', exchange: 'بورصة طوكيو' },
  { yahoo: '^TOPX', symbol: 'TOPIX', name: 'مؤشر توبكس', country: 'اليابان', region: 'asia', exchange: 'بورصة طوكيو' },
  { yahoo: '^HSI', symbol: 'HSI', name: 'هانغ سنغ', country: 'هونغ كونغ', region: 'asia', exchange: 'HKEX' },
  { yahoo: '^HSCE', symbol: 'HSCEI', name: 'مؤشر الشركات الصينية H', country: 'هونغ كونغ', region: 'asia', exchange: 'HKEX' },
  { yahoo: '000001.SS', symbol: 'SSEC', name: 'شنغهاي المركب', country: 'الصين', region: 'asia', exchange: 'SSE' },
  { yahoo: '399001.SZ', symbol: 'SZSE', name: 'شنتشن المركب', country: 'الصين', region: 'asia', exchange: 'SZSE' },
  { yahoo: '000300.SS', symbol: 'CSI300', name: 'CSI 300', country: 'الصين', region: 'asia', exchange: 'CSI' },
  { yahoo: '^BSESN', symbol: 'SENSEX', name: 'سينسكس', country: 'الهند', region: 'asia', exchange: 'BSE' },
  { yahoo: '^NSEI', symbol: 'NIFTY50', name: 'نيفتي 50', country: 'الهند', region: 'asia', exchange: 'NSE' },
  { yahoo: '^NSEBANK', symbol: 'NIFTYBANK', name: 'مؤشر بنك نيفتي', country: 'الهند', region: 'asia', exchange: 'NSE' },
  { yahoo: '^KS11', symbol: 'KOSPI', name: 'كوسبي', country: 'كوريا الجنوبية', region: 'asia', exchange: 'KRX' },
  { yahoo: '^KS200', symbol: 'KOSPI200', name: 'كوسبي 200', country: 'كوريا الجنوبية', region: 'asia', exchange: 'KRX' },
  { yahoo: '^KQ11', symbol: 'KOSDAQ', name: 'كوسداك المركب', country: 'كوريا الجنوبية', region: 'asia', exchange: 'KRX' },
  { yahoo: '^TWII', symbol: 'TAIEX', name: 'تايكس', country: 'تايوان', region: 'asia', exchange: 'TWSE' },
  { yahoo: '^STI', symbol: 'STI', name: 'مؤشر سنغافورة', country: 'سنغافورة', region: 'asia', exchange: 'SGX' },

  // أوروبا
  { yahoo: '^FTSE', symbol: 'FTSE100', name: 'فوتسي 100', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: '^FTMC', symbol: 'FTSE250', name: 'فوتسي 250', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: '^FTAS', symbol: 'FTSEALLSH', name: 'فوتسي جميع الأسهم', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: '^GDAXI', symbol: 'DAX', name: 'داكس 40', country: 'ألمانيا', region: 'europe', exchange: 'XETRA' },
  { yahoo: '^FCHI', symbol: 'CAC40', name: 'كاك 40', country: 'فرنسا', region: 'europe', exchange: 'Euronext Paris' },
  { yahoo: '^STOXX50E', symbol: 'STOXX50', name: 'يورو ستوكس 50', country: 'منطقة اليورو', region: 'europe', exchange: 'STOXX' },
  { yahoo: '^AEX', symbol: 'AEX', name: 'مؤشر هولندا AEX', country: 'هولندا', region: 'europe', exchange: 'Euronext Amsterdam' },
  { yahoo: '^SSMI', symbol: 'SMI', name: 'المؤشر السويسري SMI', country: 'سويسرا', region: 'europe', exchange: 'SIX' },
  { yahoo: '^OMXH25', symbol: 'OMXH25', name: 'OMX هلسنكي 25', country: 'فنلندا', region: 'europe', exchange: 'Nasdaq Helsinki' },
  { yahoo: 'XU100.IS', symbol: 'BIST100', name: 'BIST 100', country: 'تركيا', region: 'europe', exchange: 'Borsa Istanbul' },

  // الأمريكتان
  { yahoo: '^GSPC', symbol: 'SPX', name: 'S&P 500', country: 'الولايات المتحدة', region: 'americas', exchange: 'S&P Dow Jones' },
  { yahoo: '^DJI', symbol: 'DJI', name: 'داو جونز الصناعي', country: 'الولايات المتحدة', region: 'americas', exchange: 'S&P Dow Jones' },
  { yahoo: '^IXIC', symbol: 'NASDAQ', name: 'ناسداك المركب', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: '^NDX', symbol: 'NDX', name: 'ناسداك 100', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: '^RUT', symbol: 'RUSSELL2000', name: 'راسل 2000', country: 'الولايات المتحدة', region: 'americas', exchange: 'FTSE Russell' },
  { yahoo: '^MID', symbol: 'SP400', name: 'S&P 400 (متوسط)', country: 'الولايات المتحدة', region: 'americas', exchange: 'S&P Dow Jones' },
  { yahoo: '^SML', symbol: 'SP600', name: 'S&P 600 (صغير)', country: 'الولايات المتحدة', region: 'americas', exchange: 'S&P Dow Jones' },
  { yahoo: '^VIX', symbol: 'VIX', name: 'مؤشر الخوف VIX', country: 'الولايات المتحدة', region: 'americas', exchange: 'CBOE' },
  { yahoo: '^RUI', symbol: 'RUSSELL1000', name: 'راسل 1000', country: 'الولايات المتحدة', region: 'americas', exchange: 'FTSE Russell' },
  { yahoo: '^RUA', symbol: 'RUSSELL3000', name: 'راسل 3000', country: 'الولايات المتحدة', region: 'americas', exchange: 'FTSE Russell' },
  { yahoo: '^W5000', symbol: 'WILSHIRE5000', name: 'ويلشاير 5000', country: 'الولايات المتحدة', region: 'americas', exchange: 'Wilshire' },
  { yahoo: '^DJT', symbol: 'DJTRAN', name: 'داو جونز للنقل', country: 'الولايات المتحدة', region: 'americas', exchange: 'S&P Dow Jones' },
  { yahoo: '^DJU', symbol: 'DJUTIL', name: 'داو جونز للمرافق', country: 'الولايات المتحدة', region: 'americas', exchange: 'S&P Dow Jones' },
  { yahoo: '^SOX', symbol: 'SOX', name: 'فيلادلفيا لأشباه الموصلات', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: '^NYA', symbol: 'NYSE', name: 'NYSE Composite', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: '^GSPTSE', symbol: 'TSX', name: 'S&P/TSX Composite', country: 'كندا', region: 'americas', exchange: 'TSX' },
];

const ALL_GLOBAL_INDEX_DEFS: GlobalIndexDef[] = Array.from(
  GLOBAL_INDEX_DEFS.reduce<Map<string, GlobalIndexDef>>((acc, def) => {
    acc.set(def.yahoo, {
      ...def,
      sourceUrl: buildSourceUrl(def),
      yahooUrl: buildYahooQuoteUrl(def.yahoo),
    });
    return acc;
  }, new Map()).values()
);

const MARKET_MAIN_INDEX_BY_CODE_BASE: Record<string, { yahoo?: string; symbol: string; name: string }> = marketIndices
  .reduce<Record<string, { yahoo?: string; symbol: string; name: string }>>((acc, index) => {
    if (!acc[index.market]) {
      acc[index.market] = {
        yahoo: index.yahoo,
        symbol: index.symbol,
        name: index.name,
      };
    }
    return acc;
  }, {});

const MARKET_MAIN_INDEX_BY_CODE: Record<string, { yahoo?: string; symbol: string; name: string }> = {
  ...MARKET_MAIN_INDEX_BY_CODE_BASE,
  TADAWUL: {
    symbol: 'TASI',
    name: 'مؤشر تداول لجميع الأسهم',
    yahoo: '^TASI.SR',
  },
};

const GLOBAL_STOCK_UNIVERSE: TrackedStockDef[] = [
  // الشرق الأوسط
  { yahoo: '2222.SR', symbol: '2222.SR', name: 'أرامكو', country: 'السعودية', region: 'middle_east', exchange: 'تداول' },
  { yahoo: '1180.SR', symbol: '1180.SR', name: 'مصرف الراجحي', country: 'السعودية', region: 'middle_east', exchange: 'تداول' },
  { yahoo: '1120.SR', symbol: '1120.SR', name: 'الراجحي المالية', country: 'السعودية', region: 'middle_east', exchange: 'تداول' },
  { yahoo: '7010.SR', symbol: '7010.SR', name: 'الاتصالات السعودية', country: 'السعودية', region: 'middle_east', exchange: 'تداول' },
  { yahoo: '1050.SR', symbol: '1050.SR', name: 'البنك السعودي الأول', country: 'السعودية', region: 'middle_east', exchange: 'تداول' },
  { yahoo: '1211.SR', symbol: '1211.SR', name: 'معادن', country: 'السعودية', region: 'middle_east', exchange: 'تداول' },
  { yahoo: 'EAND.DU', symbol: 'EAND.DU', name: 'e& (اتصالات)', country: 'الإمارات', region: 'middle_east', exchange: 'DFM' },
  { yahoo: 'EMAAR.DU', symbol: 'EMAAR.DU', name: 'إعمار العقارية', country: 'الإمارات', region: 'middle_east', exchange: 'DFM' },
  { yahoo: 'QNBK.QA', symbol: 'QNBK.QA', name: 'بنك قطر الوطني', country: 'قطر', region: 'middle_east', exchange: 'QSE' },
  { yahoo: 'IQCD.QA', symbol: 'IQCD.QA', name: 'الصناعات القطرية', country: 'قطر', region: 'middle_east', exchange: 'QSE' },

  // أمريكا
  { yahoo: 'AAPL', symbol: 'AAPL', name: 'Apple', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'MSFT', symbol: 'MSFT', name: 'Microsoft', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'NVDA', symbol: 'NVDA', name: 'NVIDIA', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'AMZN', symbol: 'AMZN', name: 'Amazon', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'META', symbol: 'META', name: 'Meta', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'TSLA', symbol: 'TSLA', name: 'Tesla', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'AMD', symbol: 'AMD', name: 'AMD', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'AVGO', symbol: 'AVGO', name: 'Broadcom', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'NFLX', symbol: 'NFLX', name: 'Netflix', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'PLTR', symbol: 'PLTR', name: 'Palantir', country: 'الولايات المتحدة', region: 'americas', exchange: 'NASDAQ' },
  { yahoo: 'JPM', symbol: 'JPM', name: 'JPMorgan', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'BAC', symbol: 'BAC', name: 'Bank of America', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'WFC', symbol: 'WFC', name: 'Wells Fargo', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'GS', symbol: 'GS', name: 'Goldman Sachs', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'XOM', symbol: 'XOM', name: 'Exxon Mobil', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'CVX', symbol: 'CVX', name: 'Chevron', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'BA', symbol: 'BA', name: 'Boeing', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'KO', symbol: 'KO', name: 'Coca-Cola', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'WMT', symbol: 'WMT', name: 'Walmart', country: 'الولايات المتحدة', region: 'americas', exchange: 'NYSE' },
  { yahoo: 'RY.TO', symbol: 'RY.TO', name: 'Royal Bank of Canada', country: 'كندا', region: 'americas', exchange: 'TSX' },
  { yahoo: 'TD.TO', symbol: 'TD.TO', name: 'Toronto-Dominion', country: 'كندا', region: 'americas', exchange: 'TSX' },
  { yahoo: 'SHOP.TO', symbol: 'SHOP.TO', name: 'Shopify', country: 'كندا', region: 'americas', exchange: 'TSX' },
  { yahoo: 'ENB.TO', symbol: 'ENB.TO', name: 'Enbridge', country: 'كندا', region: 'americas', exchange: 'TSX' },
  { yahoo: 'CNR.TO', symbol: 'CNR.TO', name: 'Canadian National Railway', country: 'كندا', region: 'americas', exchange: 'TSX' },

  // أوروبا
  { yahoo: 'SHEL.L', symbol: 'SHEL.L', name: 'Shell', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: 'HSBA.L', symbol: 'HSBA.L', name: 'HSBC', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: 'BP.L', symbol: 'BP.L', name: 'BP', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: 'AZN.L', symbol: 'AZN.L', name: 'AstraZeneca', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: 'ULVR.L', symbol: 'ULVR.L', name: 'Unilever', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: 'GSK.L', symbol: 'GSK.L', name: 'GSK', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: 'VOD.L', symbol: 'VOD.L', name: 'Vodafone', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: 'BARC.L', symbol: 'BARC.L', name: 'Barclays', country: 'المملكة المتحدة', region: 'europe', exchange: 'LSE' },
  { yahoo: 'SAP.DE', symbol: 'SAP.DE', name: 'SAP', country: 'ألمانيا', region: 'europe', exchange: 'XETRA' },
  { yahoo: 'SIE.DE', symbol: 'SIE.DE', name: 'Siemens', country: 'ألمانيا', region: 'europe', exchange: 'XETRA' },
  { yahoo: 'BMW.DE', symbol: 'BMW.DE', name: 'BMW', country: 'ألمانيا', region: 'europe', exchange: 'XETRA' },
  { yahoo: 'MBG.DE', symbol: 'MBG.DE', name: 'Mercedes-Benz', country: 'ألمانيا', region: 'europe', exchange: 'XETRA' },
  { yahoo: 'DTE.DE', symbol: 'DTE.DE', name: 'Deutsche Telekom', country: 'ألمانيا', region: 'europe', exchange: 'XETRA' },
  { yahoo: 'ALV.DE', symbol: 'ALV.DE', name: 'Allianz', country: 'ألمانيا', region: 'europe', exchange: 'XETRA' },
  { yahoo: 'MC.PA', symbol: 'MC.PA', name: 'LVMH', country: 'فرنسا', region: 'europe', exchange: 'Euronext Paris' },
  { yahoo: 'OR.PA', symbol: 'OR.PA', name: 'L’Oréal', country: 'فرنسا', region: 'europe', exchange: 'Euronext Paris' },
  { yahoo: 'BNP.PA', symbol: 'BNP.PA', name: 'BNP Paribas', country: 'فرنسا', region: 'europe', exchange: 'Euronext Paris' },
  { yahoo: 'AIR.PA', symbol: 'AIR.PA', name: 'Airbus', country: 'فرنسا', region: 'europe', exchange: 'Euronext Paris' },
  { yahoo: 'SAN.PA', symbol: 'SAN.PA', name: 'Sanofi', country: 'فرنسا', region: 'europe', exchange: 'Euronext Paris' },
  { yahoo: 'ASML.AS', symbol: 'ASML.AS', name: 'ASML', country: 'هولندا', region: 'europe', exchange: 'Euronext Amsterdam' },
  { yahoo: 'INGA.AS', symbol: 'INGA.AS', name: 'ING Group', country: 'هولندا', region: 'europe', exchange: 'Euronext Amsterdam' },
  { yahoo: 'AD.AS', symbol: 'AD.AS', name: 'Ahold Delhaize', country: 'هولندا', region: 'europe', exchange: 'Euronext Amsterdam' },
  { yahoo: 'SHELL.AS', symbol: 'SHELL.AS', name: 'Shell (NL)', country: 'هولندا', region: 'europe', exchange: 'Euronext Amsterdam' },
  { yahoo: 'NESN.SW', symbol: 'NESN.SW', name: 'Nestlé', country: 'سويسرا', region: 'europe', exchange: 'SIX' },
  { yahoo: 'NOVN.SW', symbol: 'NOVN.SW', name: 'Novartis', country: 'سويسرا', region: 'europe', exchange: 'SIX' },
  { yahoo: 'ROG.SW', symbol: 'ROG.SW', name: 'Roche', country: 'سويسرا', region: 'europe', exchange: 'SIX' },
  { yahoo: 'UBSG.SW', symbol: 'UBSG.SW', name: 'UBS', country: 'سويسرا', region: 'europe', exchange: 'SIX' },
  { yahoo: 'NOKIA.HE', symbol: 'NOKIA.HE', name: 'Nokia', country: 'فنلندا', region: 'europe', exchange: 'Nasdaq Helsinki' },

  // آسيا
  { yahoo: '7203.T', symbol: '7203.T', name: 'Toyota', country: 'اليابان', region: 'asia', exchange: 'TSE' },
  { yahoo: '6758.T', symbol: '6758.T', name: 'Sony', country: 'اليابان', region: 'asia', exchange: 'TSE' },
  { yahoo: '9984.T', symbol: '9984.T', name: 'SoftBank Group', country: 'اليابان', region: 'asia', exchange: 'TSE' },
  { yahoo: '8306.T', symbol: '8306.T', name: 'Mitsubishi UFJ', country: 'اليابان', region: 'asia', exchange: 'TSE' },
  { yahoo: '9432.T', symbol: '9432.T', name: 'NTT', country: 'اليابان', region: 'asia', exchange: 'TSE' },
  { yahoo: '0700.HK', symbol: '0700.HK', name: 'Tencent', country: 'هونغ كونغ', region: 'asia', exchange: 'HKEX' },
  { yahoo: '9988.HK', symbol: '9988.HK', name: 'Alibaba', country: 'هونغ كونغ', region: 'asia', exchange: 'HKEX' },
  { yahoo: '0939.HK', symbol: '0939.HK', name: 'CCB', country: 'هونغ كونغ', region: 'asia', exchange: 'HKEX' },
  { yahoo: '1299.HK', symbol: '1299.HK', name: 'AIA Group', country: 'هونغ كونغ', region: 'asia', exchange: 'HKEX' },
  { yahoo: '2318.HK', symbol: '2318.HK', name: 'Ping An', country: 'هونغ كونغ', region: 'asia', exchange: 'HKEX' },
  { yahoo: '600519.SS', symbol: '600519.SS', name: 'Kweichow Moutai', country: 'الصين', region: 'asia', exchange: 'SSE' },
  { yahoo: '601398.SS', symbol: '601398.SS', name: 'ICBC', country: 'الصين', region: 'asia', exchange: 'SSE' },
  { yahoo: '601857.SS', symbol: '601857.SS', name: 'PetroChina', country: 'الصين', region: 'asia', exchange: 'SSE' },
  { yahoo: '000858.SZ', symbol: '000858.SZ', name: 'Wuliangye', country: 'الصين', region: 'asia', exchange: 'SZSE' },
  { yahoo: 'RELIANCE.NS', symbol: 'RELIANCE.NS', name: 'Reliance Industries', country: 'الهند', region: 'asia', exchange: 'NSE' },
  { yahoo: 'TCS.NS', symbol: 'TCS.NS', name: 'TCS', country: 'الهند', region: 'asia', exchange: 'NSE' },
  { yahoo: 'HDFCBANK.NS', symbol: 'HDFCBANK.NS', name: 'HDFC Bank', country: 'الهند', region: 'asia', exchange: 'NSE' },
  { yahoo: 'INFY.NS', symbol: 'INFY.NS', name: 'Infosys', country: 'الهند', region: 'asia', exchange: 'NSE' },
  { yahoo: 'ICICIBANK.NS', symbol: 'ICICIBANK.NS', name: 'ICICI Bank', country: 'الهند', region: 'asia', exchange: 'NSE' },
  { yahoo: 'SBIN.NS', symbol: 'SBIN.NS', name: 'State Bank of India', country: 'الهند', region: 'asia', exchange: 'NSE' },
  { yahoo: '005930.KS', symbol: '005930.KS', name: 'Samsung Electronics', country: 'كوريا الجنوبية', region: 'asia', exchange: 'KRX' },
  { yahoo: '000660.KS', symbol: '000660.KS', name: 'SK Hynix', country: 'كوريا الجنوبية', region: 'asia', exchange: 'KRX' },
  { yahoo: '035420.KS', symbol: '035420.KS', name: 'NAVER', country: 'كوريا الجنوبية', region: 'asia', exchange: 'KRX' },
  { yahoo: '005380.KS', symbol: '005380.KS', name: 'Hyundai Motor', country: 'كوريا الجنوبية', region: 'asia', exchange: 'KRX' },
  { yahoo: '2330.TW', symbol: '2330.TW', name: 'TSMC', country: 'تايوان', region: 'asia', exchange: 'TWSE' },
  { yahoo: '2317.TW', symbol: '2317.TW', name: 'Hon Hai', country: 'تايوان', region: 'asia', exchange: 'TWSE' },
  { yahoo: '2454.TW', symbol: '2454.TW', name: 'MediaTek', country: 'تايوان', region: 'asia', exchange: 'TWSE' },
  { yahoo: '2308.TW', symbol: '2308.TW', name: 'Delta Electronics', country: 'تايوان', region: 'asia', exchange: 'TWSE' },
  { yahoo: 'D05.SI', symbol: 'D05.SI', name: 'DBS', country: 'سنغافورة', region: 'asia', exchange: 'SGX' },
  { yahoo: 'O39.SI', symbol: 'O39.SI', name: 'OCBC', country: 'سنغافورة', region: 'asia', exchange: 'SGX' },
  { yahoo: 'U11.SI', symbol: 'U11.SI', name: 'UOB', country: 'سنغافورة', region: 'asia', exchange: 'SGX' },
];

const ALL_TRACKED_SYMBOLS = Array.from(
  new Set([
    ...ALL_GLOBAL_INDEX_DEFS.map((item) => item.yahoo),
    ...GLOBAL_STOCK_UNIVERSE.map((item) => item.yahoo),
  ])
).join(',');

const USD_PER_CURRENCY: Record<string, number> = {
  USD: 1,
  SAR: 1 / 3.75,
  AED: 1 / 3.6725,
  QAR: 1 / 3.64,
  KWD: 3.25,
  BHD: 2.65,
  OMR: 2.60,
  JOD: 1.41,
  EGP: 1 / 48,
  GBP: 1.27,
  EUR: 1.09,
  CHF: 1.12,
  SEK: 1 / 10.5,
  DKK: 1 / 6.9,
  NOK: 1 / 10.8,
  PLN: 1 / 4.0,
  TRY: 1 / 32,
  CAD: 1 / 1.35,
  BRL: 1 / 5.1,
  MXN: 1 / 17,
  ARS: 1 / 900,
  CLP: 1 / 900,
  JPY: 1 / 151,
  HKD: 1 / 7.8,
  CNY: 1 / 7.2,
  INR: 1 / 83,
  KRW: 1 / 1350,
  TWD: 1 / 31.5,
  SGD: 1 / 1.35,
  AUD: 1 / 1.52,
  NZD: 1 / 1.67,
  THB: 1 / 36,
};

const MARKET_SUFFIX_TO_CURRENCY: Record<string, string> = {
  SR: 'SAR',
  DU: 'AED',
  QA: 'QAR',
  TO: 'CAD',
  SA: 'BRL',
  MX: 'MXN',
  L: 'GBP',
  DE: 'EUR',
  PA: 'EUR',
  AS: 'EUR',
  MI: 'EUR',
  MC: 'EUR',
  HE: 'EUR',
  LS: 'EUR',
  SW: 'CHF',
  ST: 'SEK',
  CO: 'DKK',
  OL: 'NOK',
  IS: 'TRY',
  T: 'JPY',
  HK: 'HKD',
  SS: 'CNY',
  SZ: 'CNY',
  NS: 'INR',
  KS: 'KRW',
  TW: 'TWD',
  SI: 'SGD',
  AX: 'AUD',
  NZ: 'NZD',
  BK: 'THB',
};

function inferCurrencyFromSymbol(symbol?: string): string | undefined {
  if (!symbol) return undefined;
  const upper = symbol.toUpperCase();
  const suffix = upper.split('.').pop();
  if (!suffix) return undefined;
  return MARKET_SUFFIX_TO_CURRENCY[suffix];
}

function convertToUsd(amount: number, currency?: string): number {
  if (!Number.isFinite(amount)) return 0;
  if (!currency) return amount;
  const usdPerUnit = USD_PER_CURRENCY[currency.toUpperCase()];
  return usdPerUnit ? amount * usdPerUnit : amount;
}

function formatCompactAmount(value: number): string {
  if (value >= 1e12) return `${formatNumber(value / 1e12, 2)} ترليون`;
  if (value >= 1e9) return `${formatNumber(value / 1e9, 2)} مليار`;
  if (value >= 1e6) return `${formatNumber(value / 1e6, 2)} مليون`;
  if (value >= 1e3) return `${formatNumber(value / 1e3, 2)} ألف`;
  return formatNumber(value, 0);
}

const COMMODITY_YAHOO_MAP: Record<string, string> = {
  'الذهب': 'GC=F', 'Gold': 'GC=F', 'GOLD': 'GC=F', 'XAU': 'GC=F',
  'الفضة': 'SI=F', 'Silver': 'SI=F', 'SILVER': 'SI=F', 'XAG': 'SI=F',
  'البلاتين': 'PL=F', 'Platinum': 'PL=F', 'XPT': 'PL=F',
  'البلاديوم': 'PA=F', 'Palladium': 'PA=F', 'XPD': 'PA=F',
  'نفط WTI': 'CL=F', 'Crude Oil WTI': 'CL=F', 'WTI': 'CL=F', 'CL': 'CL=F',
  'نفط برنت': 'BZ=F', 'Brent Crude': 'BZ=F', 'BRENT': 'BZ=F', 'BR': 'BZ=F',
  'الغاز الطبيعي': 'NG=F', 'Natural Gas': 'NG=F', 'NGAS': 'NG=F', 'NG': 'NG=F',
  'النحاس': 'HG=F', 'Copper': 'HG=F', 'COPPER': 'HG=F', 'HG': 'HG=F',
  'القمح': 'ZW=F', 'Wheat': 'ZW=F', 'WHEAT': 'ZW=F', 'ZW': 'ZW=F',
  'الذرة': 'ZC=F', 'Corn': 'ZC=F', 'CORN': 'ZC=F', 'ZC': 'ZC=F',
  'فول الصويا': 'ZS=F', 'Soybeans': 'ZS=F', 'SOYB': 'ZS=F', 'ZS': 'ZS=F',
  'القهوة': 'KC=F', 'Coffee': 'KC=F', 'COFFEE': 'KC=F', 'KC': 'KC=F',
  'القطن': 'CT=F', 'Cotton': 'CT=F', 'COTTON': 'CT=F', 'CT': 'CT=F',
  'السكر': 'SB=F', 'Sugar': 'SB=F', 'SUGAR': 'SB=F', 'SB': 'SB=F',
  'الكاكاو': 'CC=F', 'Cocoa': 'CC=F', 'COCOA': 'CC=F', 'CC': 'CC=F',
};

function formatUsdAmount(value: number): string {
  return `US$ ${formatCompactAmount(value)}`;
}

function getQuoteSourceMeta(source?: string | null): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  if (!source) return { label: 'غير محدد', variant: 'outline' };
  if (source.startsWith('yahoo_')) return { label: 'Yahoo', variant: 'default' };
  if (source.startsWith('official_')) return { label: 'رسمي', variant: 'secondary' };
  if (source === 'stooq') return { label: 'Stooq', variant: 'secondary' };
  if (source.startsWith('provider_')) return { label: 'مزود بديل', variant: 'outline' };
  return { label: source, variant: 'outline' };
}

export default function MarketsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [liveIndices, setLiveIndices] = useState<LiveIndex[]>(
    ALL_GLOBAL_INDEX_DEFS.map((def) => ({
      yahoo: def.yahoo,
      symbol: def.symbol,
      name: def.name,
      country: def.country,
      region: def.region,
      exchange: def.exchange,
      sourceUrl: def.sourceUrl,
      yahooUrl: def.yahooUrl,
      price: null,
      change: null,
      changePct: null,
      source: null,
      live: false,
    }))
  );
  const [liveStocks, setLiveStocks] = useState<LiveStock[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, TickerQuote>>({});
  const [liveCrypto, setLiveCrypto] = useState<Record<string, any>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchLiveData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setFetchError(null);

      const COMMODITY_SYMBOLS = ['GC=F', 'SI=F', 'PL=F', 'PA=F', 'CL=F', 'BZ=F', 'NG=F', 'HO=F', 'RB=F', 'HG=F', 'ZW=F', 'ZC=F', 'ZS=F'];
      const symbolsToFetch = ALL_TRACKED_SYMBOLS + ',' + COMMODITY_SYMBOLS.join(',');

      const [tickerRes, cryptoRes] = await Promise.allSettled([
        fetch(`/api/ticker?symbols=${encodeURIComponent(symbolsToFetch)}`, { cache: 'no-store' }),
        fetch('/api/real-prices?type=crypto', { cache: 'no-store' })
      ]);

      let quotes: Record<string, TickerQuote> = {};
      if (tickerRes.status === 'fulfilled' && tickerRes.value.ok) {
        const payload = await tickerRes.value.json();
        if (payload?.success && payload?.data) {
          quotes = payload.data;
          setLiveQuotes(quotes);
        }
      }

      let cryptoDataFromApi: Record<string, any> = {};
      if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
        const payload = await cryptoRes.value.json();
        if (payload?.success && payload?.data) {
          cryptoDataFromApi = payload.data;
        }
      }

      // --- FALLBACK LOGIC FOR CRITICAL SYMBOLS ---
      let savedKeys: Record<string, string> = {};
      try { savedKeys = JSON.parse(localStorage.getItem('api_keys') || '{}'); } catch (e) { }

      // 1. Binance for Crypto (BTC, ETH)
      try {
        const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22PAXGUSDT%22%5D');
        if (binanceRes.ok) {
          const data = await binanceRes.json();
          data.forEach((item: any) => {
            if (item.symbol === 'BTCUSDT' || item.symbol === 'ETHUSDT') {
              const sym = item.symbol === 'BTCUSDT' ? 'BTC' : 'ETH';
              const price = parseFloat(item.lastPrice);
              const change = parseFloat(item.priceChange);
              const changePct = parseFloat(item.priceChangePercent);
              cryptoDataFromApi[sym] = { price, change, changePct, source: 'Binance' };
              cryptoDataFromApi[`${sym}-USD`] = cryptoDataFromApi[sym];
              quotes[`${sym}-USD`] = { price, change, changePct, volume: parseFloat(item.volume), source: 'Binance' };
            } else if (item.symbol === 'PAXGUSDT') {
              if (!quotes['GC=F'] || !quotes['GC=F'].price) {
                quotes['GC=F'] = { price: parseFloat(item.lastPrice), change: parseFloat(item.priceChange), changePct: parseFloat(item.priceChangePercent), volume: parseFloat(item.volume), source: 'Binance PAXG' };
              }
            }
          });
        }
      } catch (e) { }

      // 2. FMP / TwelveData for Gold, Silver, VIX
      const needFmp = !quotes['GC=F']?.price || !quotes['SI=F']?.price || !quotes['^VIX']?.price;
      if (needFmp && savedKeys.financial_modeling_prep) {
        try {
          const fmpRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/GC=F,SI=F,^VIX?apikey=${savedKeys.financial_modeling_prep}`);
          if (fmpRes.ok) {
            const data = await fmpRes.json();
            data.forEach((item: any) => { quotes[item.symbol] = { price: item.price, change: item.change, changePct: item.changesPercentage, volume: item.volume || 0, source: 'FMP' }; });
          }
        } catch (e) { }
      }
      if (needFmp && savedKeys.twelve_data && (!quotes['GC=F']?.price || !quotes['^VIX']?.price)) {
        try {
          const tdRes = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD,XAG/USD,VIX&apikey=${savedKeys.twelve_data}`);
          if (tdRes.ok) {
            const tdData = await tdRes.json();
            if (tdData['XAU/USD']) quotes['GC=F'] = { price: parseFloat(tdData['XAU/USD'].close), change: parseFloat(tdData['XAU/USD'].change), changePct: parseFloat(tdData['XAU/USD'].percent_change), volume: 0, source: 'TwelveData' };
            if (tdData['XAG/USD']) quotes['SI=F'] = { price: parseFloat(tdData['XAG/USD'].close), change: parseFloat(tdData['XAG/USD'].change), changePct: parseFloat(tdData['XAG/USD'].percent_change), volume: 0, source: 'TwelveData' };
            if (tdData['VIX']) quotes['^VIX'] = { price: parseFloat(tdData['VIX'].close), change: parseFloat(tdData['VIX'].change), changePct: parseFloat(tdData['VIX'].percent_change), volume: 0, source: 'TwelveData' };
          }
        } catch (e) { }
      }

      setLiveCrypto(cryptoDataFromApi);
      setLiveQuotes(quotes);

      const indices = ALL_GLOBAL_INDEX_DEFS.map((def) => {
        const quote = quotes[def.yahoo];
        const hasLivePrice = Boolean(quote && Number.isFinite(quote.price) && quote.price > 0);

        return {
          yahoo: def.yahoo,
          symbol: def.symbol,
          name: def.name,
          country: def.country,
          region: def.region,
          exchange: def.exchange,
          sourceUrl: def.sourceUrl,
          yahooUrl: def.yahooUrl,
          price: hasLivePrice ? quote!.price : null,
          change: hasLivePrice ? quote!.change : null,
          changePct: hasLivePrice ? quote!.changePct : null,
          source: hasLivePrice ? (quote!.source || null) : null,
          live: hasLivePrice,
        } satisfies LiveIndex;
      });

      const stocks = GLOBAL_STOCK_UNIVERSE.map((def) => {
        const quote = quotes[def.yahoo];
        if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) return null;
        const price = quote.price;
        const volume = quote?.volume ?? 0;
        const currency =
          quote?.currency ||
          inferCurrencyFromSymbol(def.yahoo) ||
          inferCurrencyFromSymbol(def.symbol) ||
          'USD';
        const valueTraded = price * volume;
        const valueTradedUsd = convertToUsd(valueTraded, currency);

        return {
          yahoo: def.yahoo,
          symbol: def.symbol,
          name: def.name,
          country: def.country,
          region: def.region,
          exchange: def.exchange,
          currency,
          price,
          change: quote.change ?? 0,
          changePct: quote.changePct ?? 0,
          volume,
          valueTraded,
          valueTradedUsd,
          live: Boolean(quote),
        } satisfies LiveStock;
      }).filter((item): item is LiveStock => item !== null && item.price > 0);

      if (!mountedRef.current) return;

      setLiveIndices(indices);
      setLiveStocks(stocks);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch live market data:', error);
      if (mountedRef.current) {
        setFetchError('تعذر تحديث الأسعار المباشرة حالياً. يتم عرض آخر بيانات متاحة.');
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchLiveData();
    const interval = setInterval(() => {
      void fetchLiveData();
    }, AUTO_REFRESH_MS);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchLiveData]);

  const allMarketIndices = liveIndices;
  const liveIndexByYahoo = new Map(liveIndices.map((index) => [index.yahoo, index] as const));

  const handleRefresh = () => {
    void fetchLiveData();
  };

  const stockMarkets = getMarketsByType('stock');
  const filteredByRegion = allMarketIndices.filter((m) => {
    return regionFilter === 'all' || m.region === regionFilter;
  });

  const countries = ['all', ...new Set(filteredByRegion.map((m) => m.country))];

  useEffect(() => {
    if (countryFilter !== 'all' && !countries.includes(countryFilter)) {
      setCountryFilter('all');
    }
  }, [countryFilter, countries]);

  const filteredMarketIndices = filteredByRegion.filter((m) => {
    const matchesSearch = m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || m.name.includes(searchQuery);
    const matchesCountry = countryFilter === 'all' || m.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const filteredStocksByScope = liveStocks.filter((stock) => {
    const matchesRegion = regionFilter === 'all' || stock.region === regionFilter;
    const matchesCountry = countryFilter === 'all' || stock.country === countryFilter;
    return matchesRegion && matchesCountry;
  });

  const filteredStocksCount = filteredStocksByScope.length;
  const selectedScopeLabel = countryFilter !== 'all'
    ? countryFilter
    : regionFilter !== 'all'
      ? REGION_LABELS[regionFilter]
      : 'كل الأسواق';

  const topGainers = [...filteredStocksByScope]
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, TOP_LIST_SIZE);
  const topLosers = [...filteredStocksByScope]
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, TOP_LIST_SIZE);
  const stocksWithVolume = filteredStocksByScope.filter((stock) => stock.volume > 0);
  const activeUniverse = stocksWithVolume.length > 0 ? stocksWithVolume : filteredStocksByScope;
  const mostActiveByVolume = [...activeUniverse]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, TOP_LIST_SIZE);
  const mostActiveByValue = [...activeUniverse]
    .sort((a, b) => b.valueTradedUsd - a.valueTradedUsd)
    .slice(0, TOP_LIST_SIZE);

  const liveIndexCount = allMarketIndices.filter((index) => index.live && index.price !== null).length;
  const liveStockCount = liveStocks.filter((stock) => stock.live).length;
  const advancersCount = allMarketIndices.filter((index) => index.changePct !== null && index.changePct > 0).length;
  const declinersCount = allMarketIndices.filter((index) => index.changePct !== null && index.changePct < 0).length;

  const regionalPerformance = Object.entries(
    allMarketIndices.reduce<Record<RegionCode, { total: number; count: number }>>((acc, item) => {
      if (item.changePct === null) return acc;
      const current = acc[item.region] || { total: 0, count: 0 };
      current.total += item.changePct;
      current.count += 1;
      acc[item.region] = current;
      return acc;
    }, { middle_east: { total: 0, count: 0 }, asia: { total: 0, count: 0 }, europe: { total: 0, count: 0 }, americas: { total: 0, count: 0 } })
  )
    .map(([region, values]) => ({
      region: region as RegionCode,
      avg: values.count ? values.total / values.count : 0,
    }))
    .sort((a, b) => b.avg - a.avg);

  const bestRegion = regionalPerformance[0];
  const worstRegion = regionalPerformance[regionalPerformance.length - 1];

  const topCards: TopCardConfig[] = [
    {
      key: 'gainers',
      title: 'الأكثر ارتفاعاً',
      description: `أفضل ${TOP_LIST_SIZE} أسهم تغيراً - ${selectedScopeLabel}`,
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      items: topGainers,
      valueLabel: 'التغير',
      valueGetter: (stock: LiveStock) => `${stock.changePct >= 0 ? '+' : ''}${formatNumber(stock.changePct, 2)}%`,
      rowClass: 'bg-green-50/70 dark:bg-green-900/20',
      valueClass: 'text-green-600',
    },
    {
      key: 'losers',
      title: 'الأكثر انخفاضاً',
      description: `أضعف ${TOP_LIST_SIZE} أسهم تغيراً - ${selectedScopeLabel}`,
      icon: <TrendingDown className="h-5 w-5 text-red-600" />,
      items: topLosers,
      valueLabel: 'التغير',
      valueGetter: (stock: LiveStock) => `${stock.changePct >= 0 ? '+' : ''}${formatNumber(stock.changePct, 2)}%`,
      rowClass: 'bg-red-50/70 dark:bg-red-900/20',
      valueClass: 'text-red-600',
    },
    {
      key: 'active-volume',
      title: 'الأكثر نشاطاً بالكمية',
      description: `أعلى ${TOP_LIST_SIZE} أسهم من حيث حجم التداول - ${selectedScopeLabel}`,
      icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
      items: mostActiveByVolume,
      valueLabel: 'الحجم',
      valueGetter: (stock: LiveStock) => formatCompactAmount(stock.volume),
      rowClass: 'bg-blue-50/70 dark:bg-blue-900/20',
      valueClass: 'text-blue-600',
    },
    {
      key: 'active-value',
      title: 'الأكثر نشاطاً بالقيمة',
      description: `أعلى ${TOP_LIST_SIZE} أسهم من حيث قيمة التداول (موحد بالدولار) - ${selectedScopeLabel}`,
      icon: <Activity className="h-5 w-5 text-amber-600" />,
      items: mostActiveByValue,
      valueLabel: 'القيمة (USD)',
      valueGetter: (stock: LiveStock) => formatUsdAmount(stock.valueTradedUsd),
      secondaryValueGetter: (stock: LiveStock) => `محلي: ${formatCompactAmount(stock.valueTraded)} ${stock.currency}`,
      rowClass: 'bg-amber-50/70 dark:bg-amber-900/20',
      valueClass: 'text-amber-600',
    },
  ];

  const indicesGroupedByCountry = Object.entries(
    filteredMarketIndices.reduce<Record<string, LiveIndex[]>>((acc, index) => {
      if (!acc[index.country]) acc[index.country] = [];
      acc[index.country].push(index);
      return acc;
    }, {})
  )
    .map(([country, items]) => ({
      country,
      items: items.sort((a, b) => a.name.localeCompare(b.name, 'ar')),
    }))
    .sort((a, b) => a.country.localeCompare(b.country, 'ar'));

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />

      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar
          title="الأسواق المالية"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <MarketOverviewBar />
        <MarketTicker />

        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">الأسواق المالية العالمية</h1>
              <p className="text-muted-foreground">
                تابع جميع الأسواق المالية العربية والعالمية من مكان واحد
              </p>
            </div>
          </div>

          {/* Market Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="grid w-full grid-cols-4 max-w-lg">
              <TabsTrigger value="daily" className="gap-2">
                <Activity className="h-4 w-4" />
                السوق اليومي
              </TabsTrigger>
              <TabsTrigger value="stocks" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                أسواق الأسهم
              </TabsTrigger>
              <TabsTrigger value="crypto" className="gap-2">
                <Bitcoin className="h-4 w-4" />
                العملات المشفرة
              </TabsTrigger>
              <TabsTrigger value="commodities" className="gap-2">
                <Coins className="h-4 w-4" />
                السلع
              </TabsTrigger>
            </TabsList>

            {/* Daily Market Tab (السوق اليومي) */}
            <TabsContent value="daily" className="space-y-6">
              <Card>
                <CardContent className="py-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث عن دولة أو مؤشر..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-9"
                      />
                    </div>
                    <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                      <RefreshCw className={`h-4 w-4 me-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      تحديث مباشر
                    </Button>
                    {lastUpdated && (
                      <Badge variant="secondary">
                        آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA-u-ca-gregory')}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">اختر المنطقة</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {(['all', 'middle_east', 'asia', 'europe', 'americas'] as RegionFilter[]).map((region) => (
                          <Button
                            key={region}
                            variant={regionFilter === region ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setRegionFilter(region)}
                          >
                            <Globe className="h-3.5 w-3.5 me-1" />
                            {REGION_LABELS[region]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">اختر الدولة</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {countries.map((country) => (
                          <Button
                            key={country}
                            variant={countryFilter === country ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCountryFilter(country)}
                          >
                            {country === 'all' ? 'كل الدول' : country}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {fetchError && (
                <Card className="border-amber-500/40 bg-amber-50/40 dark:bg-amber-900/10">
                  <CardContent className="py-3 text-sm text-amber-700 dark:text-amber-300">
                    {fetchError}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-5">
                {indicesGroupedByCountry.length > 0 ? (
                  indicesGroupedByCountry.map((group) => (
                    <div key={group.country} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{group.country}</h3>
                        <Badge variant="outline">{group.items.length} مؤشر</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {group.items.map((market) => (
                          <Card key={`${group.country}-${market.symbol}`} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold text-primary">{market.symbol}</p>
                                  <p className="text-sm text-muted-foreground">{market.name}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge variant={market.live ? 'default' : 'outline'} className="text-[11px]">
                                    {market.live ? 'مباشر' : 'غير متاح'}
                                  </Badge>
                                  <Badge variant={getQuoteSourceMeta(market.source).variant} className="text-[11px]">
                                    {getQuoteSourceMeta(market.source).label}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-end justify-between">
                                <p className="text-2xl font-bold">
                                  {market.price === null ? '—' : formatNumber(market.price, 2)}
                                </p>
                                {market.changePct !== null ? (
                                  <div className={`flex items-center gap-1 text-sm font-semibold ${market.changePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {market.changePct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    {market.changePct >= 0 ? '+' : ''}{formatNumber(market.changePct, 2)}%
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">لا توجد بيانات مباشرة</span>
                                )}
                              </div>
                              <div className="pt-2 border-t text-xs text-muted-foreground flex items-center justify-between gap-2">
                                <span>{market.exchange}</span>
                                <div className="flex items-center gap-2">
                                  <span>
                                    {market.change === null ? 'التغير: غير متاح' : `التغير: ${market.change >= 0 ? '+' : ''}${formatNumber(market.change, 2)}`}
                                  </span>
                                  <a
                                    href={market.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline underline-offset-2"
                                  >
                                    المصدر الرسمي
                                  </a>
                                  <a
                                    href={market.yahooUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-muted-foreground hover:text-primary hover:underline underline-offset-2"
                                  >
                                    Yahoo
                                  </a>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      لا توجد مؤشرات مطابقة للفلاتر الحالية.
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {topCards.map((card) => (
                  <Card key={card.key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{card.title}</span>
                        {card.icon}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {card.items.length > 0 ? card.items.slice(0, TOP_LIST_SIZE).map((stock, index) => (
                          <div key={`${card.key}-${stock.symbol}-${index}`} className={`p-3 rounded-lg border ${card.rowClass}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-7 w-7 rounded-full bg-background border flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold truncate">{stock.symbol}</p>
                                  <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                                </div>
                              </div>
                              <div className="text-right" dir="ltr">
                                <p className="font-semibold">{formatNumber(stock.price, 2)}</p>
                                <p className={`text-xs font-semibold ${card.valueClass}`}>
                                  {card.valueLabel}: {card.valueGetter(stock)}
                                </p>
                                {card.secondaryValueGetter && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {card.secondaryValueGetter(stock)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {stock.country} • {stock.exchange}
                            </p>
                          </div>
                        )) : (
                          <p className="text-center py-3 text-muted-foreground">
                            {filteredStocksCount > 0
                              ? 'لا توجد بيانات كافية لهذا التصنيف حالياً.'
                              : `لا توجد أسهم متاحة ضمن نطاق ${selectedScopeLabel}.`}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إحصائيات شاملة للأسواق والمؤشرات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <p className="text-sm text-muted-foreground">إجمالي المؤشرات المتابعة</p>
                      <p className="text-2xl font-bold mt-1">{allMarketIndices.length}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <p className="text-sm text-muted-foreground">المؤشرات المباشرة</p>
                      <p className="text-2xl font-bold mt-1">{liveIndexCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {allMarketIndices.length > 0 ? `${formatNumber((liveIndexCount / allMarketIndices.length) * 100, 1)}% تغطية مباشرة` : '0%'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <p className="text-sm text-muted-foreground">الأسهم المباشرة في شاشة النشاط</p>
                      <p className="text-2xl font-bold mt-1">{liveStockCount}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-green-50/60 dark:bg-green-900/20">
                      <p className="text-sm text-muted-foreground">أسواق صاعدة</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{advancersCount}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-red-50/60 dark:bg-red-900/20">
                      <p className="text-sm text-muted-foreground">أسواق هابطة</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{declinersCount}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-blue-50/60 dark:bg-blue-900/20">
                      <p className="text-sm text-muted-foreground">متوسط الأداء حسب المنطقة</p>
                      <p className="text-sm mt-1">
                        الأفضل: {bestRegion ? `${REGION_LABELS[bestRegion.region]} (${bestRegion.avg >= 0 ? '+' : ''}${formatNumber(bestRegion.avg, 2)}%)` : '—'}
                      </p>
                      <p className="text-sm mt-1">
                        الأضعف: {worstRegion ? `${REGION_LABELS[worstRegion.region]} (${worstRegion.avg >= 0 ? '+' : ''}${formatNumber(worstRegion.avg, 2)}%)` : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stock Markets */}
            <TabsContent value="stocks" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stockMarkets.map((market) => {
                  const mainMeta = MARKET_MAIN_INDEX_BY_CODE[market.code];
                  const liveMainIndex = mainMeta?.yahoo ? liveIndexByYahoo.get(mainMeta.yahoo) : undefined;
                  const isPositive = (liveMainIndex?.changePct ?? 0) >= 0;

                  return (
                    <Link key={market.code} href={`/markets/${market.code.toLowerCase()}`}>
                      <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{market.flag}</span>
                              <div>
                                <CardTitle className="text-base">{market.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">{market.nameEn}</p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {mainMeta && (
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div>
                                <p className="text-xs text-muted-foreground">{mainMeta.symbol}</p>
                                <p className="text-lg font-bold">
                                  {liveMainIndex?.price === null || liveMainIndex?.price === undefined
                                    ? '—'
                                    : formatNumber(liveMainIndex.price, 2)}
                                </p>
                                <Badge variant={getQuoteSourceMeta(liveMainIndex?.source).variant} className="text-[10px] mt-1">
                                  {getQuoteSourceMeta(liveMainIndex?.source).label}
                                </Badge>
                              </div>
                              {liveMainIndex?.changePct !== null && liveMainIndex?.changePct !== undefined ? (
                                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                  <span className="font-medium">
                                    {isPositive ? '+' : ''}{formatNumber(liveMainIndex.changePct, 2)}%
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-[11px]">غير متاح</Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">العملة:</span>
                            <Badge variant="outline">
                              {market.currencySymbol} {market.currencyName}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              التداول:
                            </span>
                            <span className="text-xs">{market.openTime} - {market.closeTime}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </TabsContent>

            {/* Crypto Markets */}
            <TabsContent value="crypto" className="space-y-6">
              {/* Market Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cryptoData.indices.map((index) => {
                  const live = liveCrypto[index.symbol] || liveCrypto[`${index.symbol}-USD`];
                  const price = live?.price ?? index.price;
                  const change = live?.change ?? index.change;
                  const changePct = live?.changePct ?? index.changePct;
                  const isPositive = change >= 0;
                  return (
                    <Card key={index.symbol}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{index.name}</p>
                            <p className="text-2xl font-bold mt-1">
                              {index.symbol === 'TOTAL'
                                ? formatLargeNumber(price)
                                : `${formatNumber(price, 2)}${index.currencySymbol}`
                              }
                            </p>
                          </div>
                          <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            {isPositive ? (
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            ) : (
                              <TrendingDown className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                        </div>
                        <div className={`mt-2 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{formatNumber(changePct, 2)}%
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Top Cryptos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bitcoin className="h-5 w-5" />
                    العملات المشفرة الرائجة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">#</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">العملة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">السعر</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">التغيير 24h</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">القيمة السوقية</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحجم 24h</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cryptoData.coins.slice(0, 15).map((coin, index) => {
                          const live = liveCrypto[coin.symbol] || liveCrypto[`${coin.symbol}-USD`] || liveCrypto[`${coin.symbol}USDT`];
                          const price = live?.price ?? coin.price;
                          const change = live?.change ?? coin.change;
                          const changePct = live?.changePct ?? coin.changePct;
                          const marketCap = live?.marketCap ?? coin.marketCap;
                          const volume = live?.volume ?? coin.volume;
                          const isPositive = change >= 0;
                          return (
                            <tr key={coin.symbol} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{coin.icon}</span>
                                  <div>
                                    <p className="font-bold">{coin.symbol}</p>
                                    <p className="text-xs text-muted-foreground">{coin.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold" dir="ltr">
                                ${formatNumber(price, price < 1 ? 4 : 2)}
                              </td>
                              <td className={`py-3 px-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                <div className="flex items-center gap-1">
                                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                  {isPositive ? '+' : ''}{formatNumber(changePct, 2)}%
                                </div>
                              </td>
                              <td className="py-3 px-4">{formatLargeNumber(marketCap)}</td>
                              <td className="py-3 px-4">{formatLargeNumber(volume)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Crypto Exchanges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    بورصات العملات المشفرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cryptoData.exchanges.map((exchange) => (
                      <div key={exchange.code} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{exchange.flag}</span>
                          <div>
                            <p className="font-semibold">{exchange.name}</p>
                            <p className="text-xs text-muted-foreground">{exchange.country}</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">حجم التداول 24h:</span>
                            <span className="font-medium">{formatLargeNumber(exchange.volume24h)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">أزواج التداول:</span>
                            <span className="font-medium">{exchange.pairs.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commodities */}
            <TabsContent value="commodities" className="space-y-6">
              {/* Commodity Indices */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {commoditiesData.indices.map((index) => {
                  const yahooSym = COMMODITY_YAHOO_MAP[index.symbol] || COMMODITY_YAHOO_MAP[index.name] || COMMODITY_YAHOO_MAP[(index as any).nameEn] || index.symbol;
                  const live = yahooSym ? liveQuotes[yahooSym] : null;
                  const price = live?.price ?? index.price;
                  const change = live?.change ?? index.change;
                  const changePct = live?.changePct ?? index.changePct;
                  const isPositive = change >= 0;
                  return (
                    <Card key={index.symbol}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{index.name}</p>
                            <p className="text-2xl font-bold mt-1">{formatNumber(price, 2)}</p>
                          </div>
                          <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            {isPositive ? (
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            ) : (
                              <TrendingDown className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                        </div>
                        <div className={`mt-2 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{formatNumber(change, 2)} ({isPositive ? '+' : ''}{formatNumber(changePct, 2)}%)
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Precious Metals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🥇 المعادن الثمينة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {commoditiesData.preciousMetals.map((item) => {
                      const yahooSym = COMMODITY_YAHOO_MAP[item.symbol] || COMMODITY_YAHOO_MAP[item.name] || COMMODITY_YAHOO_MAP[(item as any).nameEn] || item.symbol;
                      const live = yahooSym ? liveQuotes[yahooSym] : null;
                      const price = live?.price ?? item.price;
                      const changePct = live?.changePct ?? item.changePct;
                      const isPositive = changePct >= 0;
                      return (
                        <div key={item.symbol} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-3xl">{item.icon}</span>
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold" dir="ltr">${formatNumber(price, 2)}</span>
                              <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
                                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {isPositive ? '+' : ''}{formatNumber(changePct, 2)}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">للكل {item.unitAr}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Energy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🛢️ الطاقة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {commoditiesData.energy.map((item) => {
                      const yahooSym = COMMODITY_YAHOO_MAP[item.symbol] || COMMODITY_YAHOO_MAP[item.name] || COMMODITY_YAHOO_MAP[(item as any).nameEn] || item.symbol;
                      const live = yahooSym ? liveQuotes[yahooSym] : null;
                      const price = live?.price ?? item.price;
                      const changePct = live?.changePct ?? item.changePct;
                      const isPositive = changePct >= 0;
                      return (
                        <div key={item.symbol} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-3xl">{item.icon}</span>
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold" dir="ltr">${formatNumber(price, 2)}</span>
                              <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
                                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {isPositive ? '+' : ''}{formatNumber(changePct, 2)}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">للكل {item.unitAr}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Agriculture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🌾 المنتجات الزراعية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">السلعة</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">السعر</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">التغيير</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">الوحدة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commoditiesData.agriculture.map((item) => {
                          const yahooSym = COMMODITY_YAHOO_MAP[item.symbol] || COMMODITY_YAHOO_MAP[item.name] || COMMODITY_YAHOO_MAP[(item as any).nameEn] || item.symbol;
                          const live = yahooSym ? liveQuotes[yahooSym] : null;
                          const price = live?.price ?? item.price;
                          const changePct = live?.changePct ?? item.changePct;
                          const isPositive = changePct >= 0;
                          return (
                            <tr key={item.symbol} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{item.icon}</span>
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold" dir="ltr">${formatNumber(price, 2)}</td>
                              <td className={`py-3 px-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                <div className="flex items-center gap-1">
                                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                  {isPositive ? '+' : ''}{formatNumber(changePct, 2)}%
                                </div>
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">{item.unitAr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Industrial Metals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ⚙️ المعادن الصناعية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {commoditiesData.industrialMetals.map((item) => {
                      const yahooSym = COMMODITY_YAHOO_MAP[item.symbol] || COMMODITY_YAHOO_MAP[item.name] || COMMODITY_YAHOO_MAP[(item as any).nameEn] || item.symbol;
                      const live = yahooSym ? liveQuotes[yahooSym] : null;
                      const price = live?.price ?? item.price;
                      const changePct = live?.changePct ?? item.changePct;
                      const isPositive = changePct >= 0;
                      return (
                        <div key={item.symbol} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{item.icon}</span>
                            <p className="font-semibold">{item.name}</p>
                          </div>
                          <p className="text-xl font-bold" dir="ltr">${formatNumber(price, 2)}</p>
                          <Badge variant={isPositive ? "outline" : "destructive"} className="mt-2 gap-1">
                            {isPositive ? '+' : ''}{formatNumber(changePct, 2)}%
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
