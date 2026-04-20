// Constants — Resources, Twitter, Market Indices, Initial DB
// Merged from portfolio-v4

export interface ResourceItem {
  name: string;
  url: string;
  icon: string;
  desc: string;
}

export interface ResourceCategory {
  cat: string;
  cls: string;
  items: ResourceItem[];
}

export interface TwitterAccount {
  h: string;
  c: string;
  e: string;
}

export interface MarketIndex {
  id: string;
  sym: string;
  label: string;
  flag: string;
}

export interface TaxSetting {
  label: string;
  cgt: number;
  divTax: number;
  brok: number;
  vat: number;
  zakat: number;
  bondTax: number;
  note: string;
}

export const RESOURCES: ResourceCategory[] = [
  {cat:'🏛️ البورصات الرسمية',cls:'icon-gold',items:[
    {name:'السوق المالية السعودية (تداول)',url:'https://www.saudiexchange.sa',icon:'🇸🇦',desc:'Saudi Exchange — البورصة الرسمية'},
    {name:'سوق أبوظبي للأوراق المالية (ADX)',url:'https://www.adx.ae',icon:'🇦🇪',desc:'Abu Dhabi Securities Exchange'},
    {name:'سوق دبي المالي (DFM)',url:'https://www.dfm.ae',icon:'🇦🇪',desc:'Dubai Financial Market'},
    {name:'ناسداك دبي',url:'https://www.nasdaqdubai.com',icon:'💹',desc:'Nasdaq Dubai'},
    {name:'بورصة الكويت',url:'https://www.boursakuwait.com.kw',icon:'🇰🇼',desc:'Boursa Kuwait — سوق الأسهم الكويتي'},
    {name:'بورصة قطر',url:'https://www.qatarexchange.qa',icon:'🇶🇦',desc:'Qatar Stock Exchange'},
    {name:'بورصة البحرين',url:'https://www.bahrainbourse.com',icon:'🇧🇭',desc:'Bahrain Bourse'},
    {name:'بورصة مسقط',url:'https://www.msm.gov.om',icon:'🇴🇲',desc:'Muscat Securities Market'},
    {name:'البورصة المصرية',url:'https://www.egx.com.eg',icon:'🇪🇬',desc:'Egyptian Exchange'},
    {name:'بورصة عمّان',url:'https://www.ase.com.jo',icon:'🇯🇴',desc:'Amman Stock Exchange'},
    {name:'Nasdaq',url:'https://www.nasdaq.com',icon:'🇺🇸',desc:'ناسداك — الأسهم الأمريكية'},
    {name:'NYSE',url:'https://www.nyse.com',icon:'🇺🇸',desc:'بورصة نيويورك'},
  ]},
  {cat:'🇸🇦 السوق السعودي (تاسي)',cls:'icon-green',items:[
    {name:'تداول (Saudi Exchange)',url:'https://www.saudiexchange.sa',icon:'📊',desc:'البورصة السعودية الرسمية'},
    {name:'أرقام (Argaam)',url:'https://www.argaam.com',icon:'📰',desc:'أخبار وبيانات السوق السعودي'},
    {name:'مباشر (Mubasher)',url:'https://www.mubasher.info',icon:'📡',desc:'أخبار مالية وأسعار مباشرة'},
    {name:'TradingView - تاسي',url:'https://www.tradingview.com/chart/?symbol=TADAWUL%3ATASI',icon:'📈',desc:'رسوم بيانية متقدمة'},
  ]},
  {cat:'🌍 أسواق الخليج والعرب',cls:'icon-purple',items:[
    {name:'سوق أبوظبي (ADX)',url:'https://www.adx.ae',icon:'🏛️',desc:'أبوظبي للأوراق المالية'},
    {name:'سوق دبي المالي (DFM)',url:'https://www.dfm.ae',icon:'💹',desc:'Dubai Financial Market'},
    {name:'ناسداك دبي',url:'https://www.nasdaqdubai.com',icon:'💹',desc:'Nasdaq Dubai'},
    {name:'بورصة قطر',url:'https://www.qatarexchange.qa',icon:'🇶🇦',desc:'Qatar Stock Exchange'},
    {name:'بورصة الكويت',url:'https://www.boursakuwait.com.kw',icon:'🇰🇼',desc:'Boursa Kuwait'},
    {name:'بورصة البحرين',url:'https://www.bahrainbourse.com',icon:'🇧🇭',desc:'Bahrain Bourse'},
    {name:'بورصة مسقط',url:'https://www.msm.gov.om',icon:'🇴🇲',desc:'Muscat Securities Market'},
    {name:'البورصة المصرية',url:'https://www.egx.com.eg',icon:'🇪🇬',desc:'Egyptian Exchange'},
    {name:'بورصة عمّان',url:'https://www.ase.com.jo',icon:'🇯🇴',desc:'Amman Stock Exchange'},
  ]},
  {cat:'🇺🇸 البيانات الأمريكية',cls:'icon-blue',items:[
    {name:'Yahoo Finance',url:'https://finance.yahoo.com',icon:'📊',desc:'بيانات وأخبار شاملة مجانية'},
    {name:'MarketWatch',url:'https://www.marketwatch.com',icon:'📰',desc:'أخبار الأسواق المالية'},
    {name:'Investing.com',url:'https://www.investing.com',icon:'💹',desc:'بيانات وتحليلات عالمية'},
    {name:'Stock Analysis',url:'https://stockanalysis.com',icon:'🔍',desc:'تحليل مالي مفصّل'},
    {name:'Finviz',url:'https://finviz.com',icon:'🔎',desc:'فلترة وبحث في الأسهم'},
    {name:'Macrotrends',url:'https://www.macrotrends.net',icon:'📈',desc:'بيانات تاريخية'},
  ]},
  {cat:'🔬 التحليل والتوصيات',cls:'icon-yellow',items:[
    {name:'Seeking Alpha',url:'https://seekingalpha.com',icon:'🎯',desc:'تحليلات ومقالات'},
    {name:'Morningstar',url:'https://www.morningstar.com',icon:'⭐',desc:'تقييمات الصناديق'},
    {name:'TipRanks',url:'https://www.tipranks.com',icon:'📌',desc:'توصيات المحللين'},
    {name:'Simply Wall St',url:'https://simplywall.st',icon:'🧱',desc:'تحليل مرئي'},
    {name:'TradingView',url:'https://www.tradingview.com',icon:'📉',desc:'رسوم بيانية تفاعلية'},
    {name:'ROIC.ai',url:'https://roic.ai',icon:'🤖',desc:'بيانات بالذكاء الاصطناعي'},
  ]},
  {cat:'📋 البيانات الرسمية',cls:'icon-blue',items:[
    {name:'SEC EDGAR',url:'https://www.sec.gov/cgi-bin/browse-edgar',icon:'🏛️',desc:'الإيداعات الرسمية'},
    {name:'Whalewisdom',url:'https://whalewisdom.com',icon:'🐳',desc:'محافظ المستثمرين الكبار'},
    {name:'Data Roma',url:'https://www.dataroma.com',icon:'📂',desc:'محافظ كبار المستثمرين'},
    {name:'Dividend.com',url:'https://www.dividend.com',icon:'💰',desc:'توزيعات الأرباح'},
    {name:'Split History',url:'https://www.splithistory.com',icon:'✂️',desc:'تقسيمات الأسهم'},
  ]},
  {cat:'🪙 الكريبتو والسلع',cls:'icon-red',items:[
    {name:'CoinMarketCap',url:'https://coinmarketcap.com',icon:'🪙',desc:'أسعار العملات الرقمية'},
    {name:'Binance',url:'https://www.binance.com',icon:'🟡',desc:'أكبر منصة تداول كريبتو'},
    {name:'Oilprice.com',url:'https://oilprice.com',icon:'🛢️',desc:'أسعار النفط والطاقة'},
    {name:'Trading Economics',url:'https://tradingeconomics.com',icon:'🌐',desc:'مؤشرات اقتصادية'},
  ]},
  {cat:'📚 التعلم',cls:'icon-purple',items:[
    {name:'Investopedia',url:'https://www.investopedia.com',icon:'📖',desc:'مرجع الاستثمار'},
    {name:'Federal Reserve',url:'https://www.federalreserve.gov',icon:'🏦',desc:'البنك المركزي الأمريكي'},
    {name:'Webull',url:'https://www.webull.com',icon:'📱',desc:'منصة تداول وتحليل'},
    {name:'NetDania',url:'https://www.netdania.com',icon:'🌐',desc:'مخططات مباشرة'},
  ]},
];

export const TWITTER: TwitterAccount[] = [
  {h:'GaryBlack2020',c:'أمريكي - أسهم',e:'🇺🇸'},{h:'MktSensory',c:'تحليلات',e:'📊'},
  {h:'ZeroHedge',c:'أخبار',e:'📰'},{h:'business',c:'Bloomberg',e:'💼'},
  {h:'CNBC',c:'CNBC أخبار',e:'📺'},{h:'SeekingAlpha',c:'تحليلات',e:'🎯'},
  {h:'MorningstarInc',c:'Morningstar',e:'⭐'},{h:'StockTwits',c:'مجتمع التداول',e:'💬'},
  {h:'tipranks',c:'TipRanks',e:'📌'},{h:'talz123',c:'خليجي - أسهم',e:'🇸🇦'},
  {h:'TadawulOnline',c:'تداول - سعودي',e:'🇸🇦'},
];

export const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export const MARKET_INDICES: MarketIndex[] = [
  { id:'TASI',   sym:'^TASI.SR',   label:'تاسي 🇸🇦',        flag:'🇸🇦' },
  { id:'MT30',   sym:'MT30',       label:'تداول 30 🇸🇦',    flag:'🇸🇦' },
  { id:'NOMUC',  sym:'NOMUC',      label:'نمو 🇸🇦',         flag:'🇸🇦' },
  { id:'ADX',    sym:'^FTFADGI',   label:'أبوظبي 🇦🇪',      flag:'🇦🇪' },
  { id:'DFM',    sym:'^DFMGI',     label:'دبي 🇦🇪',          flag:'🇦🇪' },
  { id:'NDXDXB', sym:'NASDAQ.DU',  label:'ناسداك دبي 🇦🇪',  flag:'🇦🇪' },
  { id:'KSE',    sym:'^KWSE',      label:'كويت 🇰🇼',         flag:'🇰🇼' },
  { id:'QSI',    sym:'^QSII',      label:'قطر 🇶🇦',           flag:'🇶🇦' },
  { id:'EGX',    sym:'^CASE',      label:'مصر 🇪🇬',           flag:'🇪🇬' },
  { id:'BHB',    sym:'^BAX',       label:'بحرين 🇧🇭',         flag:'🇧🇭' },
  { id:'MSI',    sym:'^MSM',       label:'مسقط 🇴🇲',          flag:'🇴🇲' },
  { id:'ASE',    sym:'^AMGNRLX',  label:'عمّان 🇯🇴',          flag:'🇯🇴' },
  { id:'SPX',    sym:'^GSPC',      label:'S&P 500 🇺🇸',       flag:'🇺🇸' },
  { id:'NDX',    sym:'^IXIC',      label:'ناسداك 🇺🇸',        flag:'🇺🇸' },
  { id:'DJI',    sym:'^DJI',       label:'داوجونز 🇺🇸',       flag:'🇺🇸' },
  { id:'RUT',    sym:'^RUT',       label:'راسل 2000 🇺🇸',     flag:'🇺🇸' },
  { id:'VIX',    sym:'^VIX',       label:'مؤشر الخوف VIX',    flag:'😱' },
  { id:'GLD',    sym:'GC=F',       label:'ذهب',               flag:'🥇' },
  { id:'OIL',    sym:'BZ=F',       label:'نفط برنت',          flag:'🛢️' },
  { id:'WTI',    sym:'CL=F',       label:'نفط WTI',           flag:'🛢️' },
  { id:'SILVER', sym:'SI=F',       label:'فضة',               flag:'🥈' },
  { id:'BTC',    sym:'BTC-USD',    label:'بيتكوين',           flag:'🪙' },
  { id:'ETH',    sym:'ETH-USD',    label:'إيثريوم',           flag:'🔷' },
];

export const INITIAL_DB = {
  portfolios: [{id:'p1',name:'المحفظة الرئيسية',type:'mixed',desc:'الافتراضية',createdAt:new Date().toISOString()}],
  activePortfolioId: 'p1',
  stocks: [], bonds: [], funds: [], alerts: [], alertsLog: [], priceCache: {} as Record<string, unknown>, sellHistory: [], buyHistory: [],
  dividends: [], corporateActions: [], earnings: [], journal: [],
  settings: {
    companyName:'نظام إدارة الاستثمار', userName:'admin',
    currency:'SAR', theme:'classic-light', numbers:'arabic',
    fontSize:18, fontFamily:'Cairo',
    vat:15, brokerage:0.15, password:'YWRtaW4xMjM0',
    apiKeys: {
      alphaVantage:'', financialModelingPrep:'', polygon:'', twelveData:'', newsapi:'', openai:'',
      openRouter:'', googleAI:'', anthropic:'', groq:'', deepseek:'', xai:'', cohere:'', mistral:''
    },
    taxSettings: {
      sa: { label:'🇸🇦 السعودية',   cgt:0,    divTax:0,   brok:0.15, vat:15, zakat:2.5, bondTax:0,  note:'لا ضريبة أرباح رأسمالية للمقيمين — زكاة 2.5% سنوياً' },
      ae: { label:'🇦🇪 الإمارات',   cgt:0,    divTax:0,   brok:0.15, vat:5,  zakat:0,   bondTax:0,  note:'0% ضريبة أرباح — VAT 5% على العمولات' },
      kw: { label:'🇰🇼 الكويت',     cgt:0,    divTax:0,   brok:0.175,vat:0,  zakat:0,   bondTax:0,  note:'لا ضريبة على المستثمرين الأفراد' },
      qa: { label:'🇶🇦 قطر',        cgt:0,    divTax:0,   brok:0.2,  vat:0,  zakat:0,   bondTax:0,  note:'0% ضريبة أرباح رأسمالية' },
      bh: { label:'🇧🇭 البحرين',    cgt:0,    divTax:0,   brok:0.1,  vat:10, zakat:0,   bondTax:0,  note:'0% ضريبة — VAT 10% على الخدمات' },
      eg: { label:'🇪🇬 مصر',        cgt:10,   divTax:10,  brok:0.15, vat:14, zakat:0,   bondTax:20, note:'10% ضريبة أرباح رأسمالية + 10% على التوزيعات' },
      us: { label:'🇺🇸 أمريكا',     cgt:15,   divTax:30,  brok:0.10, vat:0,  zakat:0,   bondTax:30, note:'15% CGT طويل الأمد — 30% حجب على التوزيعات للأجانب' },
      om: { label:'🇴🇲 عُمان',      cgt:0,    divTax:0,   brok:0.15, vat:5,  zakat:0,   bondTax:0,  note:'0% ضريبة على المستثمرين' },
      global:{ label:'🌍 افتراضي',  cgt:0,    divTax:0,   brok:0.15, vat:15, zakat:0,   bondTax:0,  note:'الإعدادات الافتراضية العامة' }
    } as Record<string, TaxSetting>
  }
};
