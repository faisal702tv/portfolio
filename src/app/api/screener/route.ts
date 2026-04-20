import { NextResponse } from 'next/server';

interface ScreenerStock {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  rvolume: number;
  volumeChangePct: number;
  intradayChangePct: number;
  rsi: number | null;
  ma20: number | null;
  ma50: number | null;
  maCrossBullish: boolean;
  marketCap: number | null;
  capType: string | null;
  high52w: number | null;
  low52w: number | null;
}

const MARKETS: Record<string, { name: string; currency: string; currencyAr: string }> = {
  saudi: { name: 'تداول', currency: 'SAR', currencyAr: 'ريال' },
  abuDhabi: { name: 'أبوظبي', currency: 'AED', currencyAr: 'درهم' },
  dubai: { name: 'دبي', currency: 'AED', currencyAr: 'درهم' },
  kuwait: { name: 'الكويت', currency: 'KWD', currencyAr: 'دينار' },
  qatar: { name: 'قطر', currency: 'QAR', currencyAr: 'ريال' },
  bahrain: { name: 'البحرين', currency: 'BHD', currencyAr: 'دينار' },
  oman: { name: 'عُمان', currency: 'OMR', currencyAr: 'ريال' },
  egypt: { name: 'مصر', currency: 'EGP', currencyAr: 'جنيه' },
  jordan: { name: 'الأردن', currency: 'JOD', currencyAr: 'دينار' },
  usa: { name: 'أمريكا', currency: 'USD', currencyAr: 'دولار' },
};

const MARKET_STOCKS: Record<string, { symbol: string; name: string }[]> = {
  saudi: [
    { symbol: '2222.SR', name: 'أرامكو السعودية' },
    { symbol: '1120.SR', name: 'مصرف الراجحي' },
    { symbol: '7010.SR', name: 'الاتصالات السعودية' },
    { symbol: '2002.SR', name: 'سابك' },
    { symbol: '4002.SR', name: 'بنك الرياض' },
    { symbol: '4180.SR', name: 'بنك البلاد' },
    { symbol: '4050.SR', name: 'البنك السعودي الفرنسي' },
    { symbol: '4160.SR', name: 'البنك العربي الوطني' },
    { symbol: '4190.SR', name: 'بنك الجزيرة' },
    { symbol: '2020.SR', name: 'سافكو' },
    { symbol: '2050.SR', name: 'ينساب' },
    { symbol: '2010.SR', name: 'الصناعة الكيماوية' },
    { symbol: '6002.SR', name: 'مجموعة سافولا' },
    { symbol: '6010.SR', name: 'المراعي' },
    { symbol: '8070.SR', name: 'التعاونية' },
    { symbol: '5110.SR', name: 'الشركة السعودية للكهرباء' },
    { symbol: '7020.SR', name: 'موبايلي' },
    { symbol: '7030.SR', name: 'زين السعودية' },
    { symbol: '4260.SR', name: 'مصرف الإنماء' },
    { symbol: '3001.SR', name: 'الصحارية للصناعة' },
    { symbol: '2100.SR', name: 'أسمنت السعودية' },
    { symbol: '2110.SR', name: 'أسمنت القصيم' },
    { symbol: '4200.SR', name: 'أسواق العثيم' },
    { symbol: '4150.SR', name: 'بنك بلوم' },
    { symbol: '8110.SR', name: 'الأهلي للتكافل' },
    { symbol: '8040.SR', name: 'بوبا العربية' },
    { symbol: '2380.SR', name: 'الإنماء للتطوير' },
  ],
  abuDhabi: [
    { symbol: 'ADCB.AD', name: 'بنك أبوظبي التجاري' },
    { symbol: 'FAB.AD', name: 'بنك أبوظبي الأول' },
    { symbol: 'ADIB.AD', name: 'بنك أبوظبي الإسلامي' },
    { symbol: 'ETISALAT.AD', name: 'اتصالات' },
    { symbol: 'ALDAR.AD', name: 'الدار العقارية' },
    { symbol: 'ADNOC.AD', name: 'أدنوك للتوزيع' },
    { symbol: 'TAQA.AD', name: 'طاقة أبوظبي' },
    { symbol: 'RAKBNK.AD', name: 'بنك رأس الخيمة' },
    { symbol: 'WIO.AD', name: 'واحة كابيتال' },
    { symbol: 'AGTHIA.AD', name: 'أغذية' },
    { symbol: 'JULPHAR.AD', name: 'جلفار الطبية' },
    { symbol: 'EMIRATES.AD', name: 'الإمارات للقيادة' },
  ],
  dubai: [
    { symbol: 'EMAAR.DU', name: 'إعمار العقارية' },
    { symbol: 'EMIRATESNBD.DU', name: 'الإمارات دبي الوطني' },
    { symbol: 'DIB.DU', name: 'بنك دبي الإسلامي' },
    { symbol: 'DEWA.DU', name: 'ديوا' },
    { symbol: 'AIRARABIA.DU', name: 'العربية للطيران' },
    { symbol: 'ARAMEX.DU', name: 'أرامكس' },
    { symbol: 'DAMAC.DU', name: 'داماك' },
    { symbol: 'DFM.DU', name: 'سوق دبي المالي' },
    { symbol: 'EMAARDEV.DU', name: 'إعمار للتطوير' },
    { symbol: 'TABREED.DU', name: 'تبريد' },
    { symbol: 'DPWORLD.DU', name: 'موانئ دبي العالمية' },
    { symbol: 'AJMANBANK.DU', name: 'بنك عجمان' },
  ],
  kuwait: [
    { symbol: 'NBK.KW', name: 'بنك الكويت الوطني' },
    { symbol: 'KFH.KW', name: 'بيت التمويل الكويتي' },
    { symbol: 'ZAIN.KW', name: 'زين الكويت' },
    { symbol: 'AGILITY.KW', name: 'أجيليتي' },
    { symbol: 'BOUBYAN.KW', name: 'بنك بوبيان' },
    { symbol: 'GLBL.KW', name: 'البنك الخليجي' },
    { symbol: 'MABANEE.KW', name: 'مباني' },
    { symbol: 'MEZZAN.KW', name: 'ميزان القابضة' },
    { symbol: 'BURGAN.KW', name: 'بنك برقان' },
  ],
  qatar: [
    { symbol: 'QNBK.QA', name: 'بنك قطر الوطني' },
    { symbol: 'MARKA.QA', name: 'مصرف الريان' },
    { symbol: 'QIIB.QA', name: 'البنك الدولي الإسلامي' },
    { symbol: 'DOBK.QA', name: 'بنك الدوحة' },
    { symbol: 'CBQK.QA', name: 'البنك التجاري' },
    { symbol: 'QTEL.QA', name: 'أوريدو قطر' },
    { symbol: 'INDO.QA', name: 'صناعات قطر' },
    { symbol: 'EZDK.QA', name: 'إزدان القابضة' },
    { symbol: 'VFQS.QA', name: 'فودافون قطر' },
  ],
  bahrain: [
    { symbol: 'ABC.BH', name: 'المؤسسة العربية المصرفية' },
    { symbol: 'NBB.BH', name: 'بنك البحرين الوطني' },
    { symbol: 'BISB.BH', name: 'بنك البحرين الإسلامي' },
    { symbol: 'SEEF.BH', name: 'سيف العقارية' },
    { symbol: 'INOVEST.BH', name: 'إنفست' },
    { symbol: 'BMMI.BH', name: 'BMMI' },
  ],
  oman: [
    { symbol: 'BKME.OM', name: 'بنك مسقط' },
    { symbol: 'NBO.OM', name: 'البنك الوطني العماني' },
    { symbol: 'OOREDOO.OM', name: 'أوريدو عمان' },
    { symbol: 'OMANTEL.OM', name: 'عمانتل' },
    { symbol: 'OCC.OM', name: 'أسمنت عمان' },
    { symbol: 'ALJAZEERA.OM', name: 'الجزيرة للصلب' },
  ],
  egypt: [
    { symbol: 'COMI.CA', name: 'البنك التجاري الدولي' },
    { symbol: 'ETAL.CA', name: 'عز للصلب' },
    { symbol: 'HRHO.CA', name: 'الإسكان والتعمير' },
    { symbol: 'ORHD.CA', name: 'أوراسكوم' },
    { symbol: 'EAST.CA', name: 'الشرقية للدخان' },
    { symbol: 'AMER.CA', name: 'مجموعة عامر' },
    { symbol: 'SWDY.CA', name: 'السويدي إلكتريك' },
  ],
  jordan: [
    { symbol: 'ARBK.JO', name: 'البنك العربي' },
    { symbol: 'BOJX.JO', name: 'بنك الأردن' },
    { symbol: 'JOPH.JO', name: 'الشركة العربية للفوسفات' },
    { symbol: 'JTC.JO', name: 'الاتصالات الأردنية' },
  ],
  usa: [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'NFLX', name: 'Netflix' },
    { symbol: 'AMD', name: 'AMD' },
    { symbol: 'INTC', name: 'Intel' },
    { symbol: 'BA', name: 'Boeing' },
    { symbol: 'JPM', name: 'JPMorgan' },
    { symbol: 'V', name: 'Visa' },
    { symbol: 'MA', name: 'Mastercard' },
    { symbol: 'DIS', name: 'Disney' },
    { symbol: 'PFE', name: 'Pfizer' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart' },
    { symbol: 'HD', name: 'Home Depot' },
    { symbol: 'NKE', name: 'Nike' },
    { symbol: 'CSCO', name: 'Cisco' },
    { symbol: 'ORCL', name: 'Oracle' },
    { symbol: 'CRM', name: 'Salesforce' },
    { symbol: 'ADBE', name: 'Adobe' },
    { symbol: 'PYPL', name: 'PayPal' },
    { symbol: 'SQ', name: 'Block' },
    { symbol: 'SNAP', name: 'Snap' },
    { symbol: 'RIVN', name: 'Rivian' },
    { symbol: 'PLTR', name: 'Palantir' },
    { symbol: 'CRWD', name: 'CrowdStrike' },
  ],
};

function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const recent = changes.slice(-period);
  let sumGain = 0;
  let sumLoss = 0;
  for (const c of recent) {
    if (c > 0) sumGain += c;
    else sumLoss += Math.abs(c);
  }
  const avgGain = sumGain / period;
  const avgLoss = sumLoss / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

function computeMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return parseFloat((slice.reduce((a, b) => a + b, 0) / period).toFixed(4));
}

function detectBullishCross(closes: number[]): boolean {
  if (closes.length < 52) return false;
  const prevCloses = closes.slice(0, -1);
  const ma20y = computeMA(prevCloses, 20);
  const ma50y = computeMA(prevCloses, 50);
  const ma20t = computeMA(closes, 20);
  const ma50t = computeMA(closes, 50);
  if (!ma20y || !ma50y || !ma20t || !ma50t) return false;
  return ma50y <= ma20y && ma50t > ma20t;
}

const screenerCache: Record<string, { data: ScreenerStock[]; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000;

const USD_RATES: Record<string, number> = {
  SAR: 3.75, AED: 3.6725, KWD: 0.308, QAR: 3.64, BHD: 0.377,
  OMR: 0.385, EGP: 48.5, JOD: 0.709, USD: 1,
};

async function fetchStockData(
  symbol: string,
  name: string,
  market: string
): Promise<ScreenerStock | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];
    if (!meta || !quote) return null;

    const closes: number[] = (quote.close || []).filter((c: number | null): c is number => c != null);
    const volumes: number[] = (quote.volume || []).filter((v: number | null): v is number => v != null);
    const opens: number[] = (quote.open || []).filter((o: number | null): o is number => o != null);

    const price = meta.regularMarketPrice || closes[closes.length - 1] || 0;
    const prevClose = meta.previousClose || (closes.length > 1 ? closes[closes.length - 2] : price);
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    const volume = volumes[volumes.length - 1] || 0;
    const prevVolume = volumes.length > 1 ? volumes[volumes.length - 2] : volume;
    const volumeChangePct = prevVolume > 0 ? ((volume - prevVolume) / prevVolume) * 100 : 0;

    const avgVolume = volumes.length > 0
      ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length)
      : 0;
    const rvolume = avgVolume > 0 ? volume / avgVolume : 0;

    const openPrice = opens[opens.length - 1] || price;
    const intradayChangePct = openPrice > 0 ? ((price - openPrice) / openPrice) * 100 : 0;

    const rsi = computeRSI(closes);
    const ma20 = computeMA(closes, 20);
    const ma50 = computeMA(closes, 50);
    const maCrossBullish = detectBullishCross(closes);

    const marketInfo = MARKETS[market];
    const rawCap = (meta as any).marketCap || null;
    let capType: string | null = null;
    if (rawCap) {
      const rate = USD_RATES[marketInfo.currency] || 1;
      const capUSD = rawCap / rate;
      if (capUSD < 2e9) capType = 'small';
      else if (capUSD < 10e9) capType = 'mid';
      else capType = 'large';
    }

    const stockName = (meta as any).shortName || (meta as any).longName || name;

    return {
      symbol,
      name: stockName,
      market: marketInfo.name,
      currency: marketInfo.currency,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(2)),
      open: parseFloat(openPrice.toFixed(2)),
      high: quote.high?.slice(-1)[0] ? parseFloat(quote.high.slice(-1)[0].toFixed(2)) : 0,
      low: quote.low?.slice(-1)[0] ? parseFloat(quote.low.slice(-1)[0].toFixed(2)) : 0,
      volume,
      avgVolume,
      rvolume: parseFloat(rvolume.toFixed(2)),
      volumeChangePct: parseFloat(volumeChangePct.toFixed(2)),
      intradayChangePct: parseFloat(intradayChangePct.toFixed(2)),
      rsi,
      ma20,
      ma50,
      maCrossBullish,
      marketCap: rawCap,
      capType,
      high52w: meta.fiftyTwoWeekHigh || null,
      low52w: meta.fiftyTwoWeekLow || null,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market');

  if (!market || !MARKET_STOCKS[market]) {
    return NextResponse.json({
      success: false,
      error: 'يرجى اختيار سوق صالح',
      availableMarkets: Object.keys(MARKET_STOCKS),
    }, { status: 400 });
  }

  const cached = screenerCache[market];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      market,
      marketInfo: MARKETS[market],
      cached: true,
      timestamp: cached.timestamp,
      count: cached.data.length,
      total: MARKET_STOCKS[market].length,
      data: cached.data,
    });
  }

  const stocks = MARKET_STOCKS[market];
  const results: ScreenerStock[] = [];
  const BATCH = 8;

  for (let i = 0; i < stocks.length; i += BATCH) {
    const batch = stocks.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map(s => fetchStockData(s.symbol, s.name, market))
    );
    results.push(...batchResults.filter((r): r is ScreenerStock => r !== null));
  }

  screenerCache[market] = { data: results, timestamp: Date.now() };

  return NextResponse.json({
    success: true,
    market,
    marketInfo: MARKETS[market],
    cached: false,
    timestamp: Date.now(),
    count: results.length,
    total: stocks.length,
    data: results,
  });
}
