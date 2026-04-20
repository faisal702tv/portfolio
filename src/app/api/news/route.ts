import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry { data: NewsArticle[]; timestamp: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 8 * 60 * 1000;
const translationCache = new Map<string, string>();

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  sourceIcon: string;
  date: string;
  summary: string;
  category: string;
  categoryAr: string;
  market: string;
  symbols?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

const CATEGORY_AR: Record<string, string> = {
  stocks: 'أسهم', funds: 'صناديق استثمار', bonds: 'سندات وصكوك',
  crypto: 'عملات مشفرة', forex: 'فوركس', commodities: 'سلع ومعادن', all: 'أخبار مالية',
};

const SOURCE_ICONS: Record<string, string> = {
  'Yahoo Finance': '📊', 'Google News': '🔍', 'أخبار Google': '🔍',
  'Google Finance': '💶', 'Reuters': '🌐', 'رويترز': '🌐', 'Investing.com': '📈',
  'CNBC': '📺', 'Bloomberg': '💹', 'MarketWatch': '📰',
  'TradingView': '📉', 'CoinDesk': '₿', 'CoinTelegraph': '🪙',
  'Webull': '📊', 'Seeking Alpha': '🔎', 'Financial Times': '📑',
  'أرقام': '🇸🇦', 'تداول': '🏛️', 'الاقتصادية': '📋', 'مباشر': '📡',
  'Arab News': '🌍', 'Tadawul': '🏛️',
  'default': '📰',
};

function getSourceIcon(source: string): string {
  for (const [key, icon] of Object.entries(SOURCE_ICONS)) {
    if (key === 'default') continue;
    if (source.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return SOURCE_ICONS.default;
}

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text.substring(0, 100));
}

async function translateToArabic(text: string): Promise<string> {
  if (!text || isArabic(text)) return text;
  const cacheKey = text.substring(0, 300).trim();
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 500))}&langpair=en|ar&de=portfolio@news.local`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    const translated = data.responseData?.translatedText;
    if (translated && !translated.startsWith('MYMEMORY')) {
      translationCache.set(cacheKey, translated);
      return translated;
    }
    return text;
  } catch { return text; }
}

interface SymbolInfo { symbol: string; name: string; }

function parseSymbolsParam(raw: string): SymbolInfo[] {
  if (!raw) return [];
  return raw.split(',').map(pair => {
    const [symbol, name] = pair.split(':').map(s => s.trim());
    return { symbol: symbol || '', name: name || '' };
  }).filter(s => s.symbol);
}

const QUERY_MAP: Record<string, Record<string, string>> = {
  stocks: {
    saudi: 'تداول السعودية أسهم سوق مال TASI',
    uae: 'سوق دبي المالي أبوظبي أسهم إمارات',
    kuwait: 'بورصة الكويت أسهم كويتية',
    qatar: 'بورصة قطر أسهم قطرية',
    egypt: 'البورصة المصرية أسهم مصرية',
    bahrain: 'بورصة البحرين أسهم',
    oman: 'سوق مسقط عمان أسهم',
    jordan: 'بورصة عمان الأردن أسهم',
    us: 'وول ستريت S&P NASDAQ أسهم أمريكية',
    global: 'أسواق عالمية مالية أسهم بورصة',
    all: 'أسهم بورصة سوق مال تداول',
  },
  funds: { all: 'صناديق استثمار ETF صندوق مالي' },
  bonds: { all: 'صكوك سندات حكومية' },
  crypto: { all: 'بيتكوين إيثريوم عملات مشفرة كريبتو' },
  forex: { all: 'أسعار صرف عملات فوركس دولار يورو' },
  commodities: { all: 'ذهب نفط فضة نحاس سلع معادن أسعار' },
  all: { all: 'أخبار مالية اقتصاد أسواق أسهم بورصة ذهب نفط عملات' },
};

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  if (!match) return '';
  return (match[1] || match[2] || '').trim();
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/<[^>]+>/g, '');
}

function parseRssItems(xml: string, sourceName: string, category: string, market: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const x = m[1];
    const title = decodeHtmlEntities(extractTag(x, 'title'));
    const link = extractTag(x, 'link');
    const pubDate = extractTag(x, 'pubDate');
    const description = decodeHtmlEntities(extractTag(x, 'description'));
    const src = decodeHtmlEntities(extractTag(x, 'source')) || sourceName;
    if (!title || !link) continue;
    articles.push({
      title, link,
      source: src || sourceName,
      sourceIcon: getSourceIcon(src || sourceName),
      date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      summary: description.substring(0, 400),
      category, categoryAr: CATEGORY_AR[category] || 'أخبار', market,
      sentiment: detectSentiment(title + ' ' + description),
    });
  }
  return articles;
}

function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const pos = ['ارتفاع', 'صعود', 'نمو', 'أرباح', 'إيجابي', 'تفوق', 'قياسي', 'أعلى', 'مكاسب', 'انتعاش', 'rally', 'surge', 'gain', 'rise', 'bullish', 'growth', 'record', 'high', 'upgrade'];
  const neg = ['انخفاض', 'هبوط', 'خسائر', 'تراجع', 'سلبي', 'أزمة', 'ركود', 'انهيار', 'قلق', 'drop', 'fall', 'loss', 'decline', 'crash', 'bearish', 'recession', 'sell-off', 'downgrade', 'plunge'];
  let ps = 0, ns = 0;
  for (const w of pos) if (lower.includes(w)) ps++;
  for (const w of neg) if (lower.includes(w)) ns++;
  return ps > ns ? 'positive' : ns > ps ? 'negative' : 'neutral';
}

async function fetchGoogleNews(query: string, category: string, market: string, lang: string = 'ar'): Promise<NewsArticle[]> {
  try {
    const gl = lang === 'ar' ? 'SA' : 'US';
    const ceid = lang === 'ar' ? 'SA:ar' : 'US:en';
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}&gl=${gl}&ceid=${ceid}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/2.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return [];
    const xml = await response.text();
    return parseRssItems(xml, lang === 'ar' ? 'أخبار Google' : 'Google News', category, market);
  } catch { return []; }
}

function matchSymbolsToArticle(article: NewsArticle, symbolInfos: SymbolInfo[]): string[] {
  if (!symbolInfos.length) return [];
  const text = (article.title + ' ' + article.summary).toLowerCase();
  const matched: string[] = [];

  for (const info of symbolInfos) {
    const sym = info.symbol;
    const name = info.name;
    const symClean = sym.replace(/\.SR|\.AD|\.DU|-USD|=X|\^/g, '').toLowerCase();
    const symUpper = sym.toUpperCase();

    if (text.includes(symClean) || text.includes(symUpper)) {
      matched.push(sym);
      continue;
    }

    if (name) {
      const nameLower = name.toLowerCase();
      const nameParts = name.split(/\s+/).filter(p => p.length > 2);
      if (text.includes(nameLower)) {
        matched.push(sym);
        continue;
      }
      for (const part of nameParts) {
        if (part.length >= 3 && text.includes(part.toLowerCase())) {
          matched.push(sym);
          break;
        }
      }
      if (matched[matched.length - 1] === sym) continue;
    }

    const knownAliases: Record<string, string[]> = {
      'BTC': ['بيتكوين', 'bitcoin', 'btc'],
      'ETH': ['إيثريوم', 'ethereum', 'eth'],
      'SOL': ['سولانا', 'solana'],
      'BNB': ['بينانس', 'binance'],
      'XRP': ['ريبل', 'ripple'],
      'DOGE': ['دوج', 'dogecoin'],
      'ADA': ['كاردانو', 'cardano'],
      'AAPL': ['أبل', 'apple'],
      'MSFT': ['مايكروسوفت', 'microsoft'],
      'NVDA': ['إنفيديا', 'nvidia'],
      'GOOGL': ['جوجل', 'google', 'alphabet'],
      'AMZN': ['أمازون', 'amazon'],
      'TSLA': ['تسلا', 'tesla'],
      'META': ['ميتا', 'meta', 'فيسبوك', 'facebook'],
      '2222': ['أرامكو', 'aramco'],
      '1120': ['الراجحي', 'rajhi'],
      '1180': ['الإنماء', 'alinma'],
      '1010': ['الأهلي', 'ncb', 'البنك الأهلي'],
      '1080': ['الراجحي مصرف'],
      '1030': ['السعودي الفرنسي', 'sabb'],
      '4001': ['تكافل الراجحي'],
      '4005': ['الدرع العربي'],
      'GC=F': ['ذهب', 'gold'],
      'CL=F': ['نفط', 'oil', 'wti', 'brent'],
      'SI=F': ['فضة', 'silver'],
      'HG=F': ['نحاس', 'copper'],
    };

    const aliases = knownAliases[sym] || knownAliases[sym.replace(/\.SR|\.AD|\.DU|-USD|=X/g, '')] || [];
    let found = false;
    for (const alias of aliases) {
      if (text.includes(alias.toLowerCase())) {
        matched.push(sym);
        found = true;
        break;
      }
    }
    if (found) continue;
  }

  return [...new Set(matched)];
}

function filterRecentArticles(articles: NewsArticle[], days: number = 5): NewsArticle[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return articles.filter(a => { const d = new Date(a.date); return !isNaN(d.getTime()) && d >= cutoff; });
}

function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter(a => {
    const key = a.title.toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category') || 'all';
    const market = searchParams.get('market') || 'all';
    const symbolsRaw = searchParams.get('symbols') || '';
    const q = searchParams.get('q') || '';
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '5', 10) || 5, 1), 14);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '80', 10) || 80, 1), 200);

    const symbolInfos = parseSymbolsParam(symbolsRaw);
    const cacheKey = `news:${category}:${market}:${symbolsRaw.substring(0, 200)}:${q}:${days}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const articles = cached.data.slice(0, limit);
      return NextResponse.json({ success: true, count: articles.length, total: cached.data.length, category, market, cached: true, fetchedAt: new Date(cached.timestamp).toISOString(), articles });
    }

    const cat = QUERY_MAP[category] ? category : 'all';
    const baseQuery = q || QUERY_MAP[cat]?.[market] || QUERY_MAP[cat]?.all || QUERY_MAP.all.all;

    const fetchPromises: Promise<NewsArticle[]>[] = [
      fetchGoogleNews(baseQuery, cat, market, 'ar'),
      fetchGoogleNews(baseQuery, cat, market, 'en'),
    ];

    if (symbolInfos.length > 0) {
      const names = symbolInfos.map(s => s.name || s.symbol).filter(n => n.length > 1);
      const batchSize = 5;
      for (let i = 0; i < Math.min(names.length, 30); i += batchSize) {
        const batch = names.slice(i, i + batchSize);
        const batchQuery = batch.join(' OR ');
        fetchPromises.push(fetchGoogleNews(batchQuery, cat, market, 'ar'));
      }

      const yahooSymbols = symbolInfos.slice(0, 20).map(s => {
        const clean = s.symbol.replace(/\.SR/, '').replace(/\.AD/, '').replace(/\.DU/, '');
        if (/^[A-Z]{1,5}$/.test(clean) || /^[A-Z]+-USD$/.test(clean) || /^[A-Z]+=X$/.test(clean) || clean.startsWith('^')) {
          return clean;
        }
        return '';
      }).filter(Boolean).join(',');
      if (yahooSymbols) {
        try {
          const yahooUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(yahooSymbols)}&region=US&lang=en-US`;
          const yahooRes = await fetch(yahooUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/2.0)' },
            signal: AbortSignal.timeout(12000),
          });
          if (yahooRes.ok) {
            const yahooXml = await yahooRes.text();
            fetchPromises.push(Promise.resolve(parseRssItems(yahooXml, 'Yahoo Finance', cat, market)));
          }
        } catch { /* */ }
      }
    }

    const arabSources = [
      { name: 'أرقام', site: 'argaam.com', q: baseQuery },
      { name: 'مباشر', site: 'mubasher.info', q: baseQuery },
      { name: 'الاقتصادية', site: 'aleqt.com', q: baseQuery },
    ];
    for (const src of arabSources) {
      fetchPromises.push(
        fetchGoogleNews(`${src.q} site:${src.site}`, cat, market, 'ar').then(arts =>
          arts.map(a => ({ ...a, source: a.source === 'أخبار Google' ? src.name : a.source, sourceIcon: getSourceIcon(src.name) }))
        )
      );
    }

    fetchPromises.push(
      fetchGoogleNews(`${baseQuery} site:reuters.com OR site:ar.reuters.com`, cat, market, 'ar').then(arts =>
        arts.map(a => ({ ...a, source: a.source === 'أخبار Google' ? 'رويترز' : a.source, sourceIcon: '🌐' }))
      )
    );

    fetchPromises.push(
      fetchGoogleNews(`${baseQuery} site:investing.com OR site:ar.investing.com`, cat, market, 'ar').then(arts =>
        arts.map(a => ({ ...a, source: a.source === 'أخبار Google' ? 'Investing.com' : a.source, sourceIcon: '📈' }))
      )
    );

    fetchPromises.push(
      fetchGoogleNews(`${baseQuery} site:tradingview.com`, cat, market, 'en').then(arts =>
        arts.map(a => ({ ...a, source: a.source === 'Google News' ? 'TradingView' : a.source, sourceIcon: '📉' }))
      )
    );

    fetchPromises.push(
      fetchGoogleNews(`${baseQuery} site:webull.com`, cat, market, 'en').then(arts =>
        arts.map(a => ({ ...a, source: a.source === 'Google News' ? 'Webull' : a.source, sourceIcon: '📊' }))
      )
    );

    fetchPromises.push(
      fetchGoogleNews(`${baseQuery} site:finance.google.com OR site:google.com/finance`, cat, market, 'en').then(arts =>
        arts.map(a => ({ ...a, source: a.source === 'Google News' ? 'Google Finance' : a.source, sourceIcon: '💶' }))
      )
    );

    const results = await Promise.allSettled(fetchPromises);
    let allArticles: NewsArticle[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') allArticles.push(...result.value);
    }

    const englishArticles = allArticles.filter(a => !isArabic(a.title));
    if (englishArticles.length > 0) {
      const translated = await Promise.all(englishArticles.slice(0, 40).map(async a => {
        const [title, summary] = await Promise.all([
          translateToArabic(a.title),
          a.summary ? translateToArabic(a.summary.substring(0, 300)) : Promise.resolve(a.summary),
        ]);
        return { ...a, title, summary };
      }));
      const translatedMap = new Map(translated.map(a => [a.link, a]));
      allArticles = allArticles.map(a => translatedMap.get(a.link) || a);
    }

    if (symbolInfos.length > 0) {
      allArticles = allArticles.map(a => ({
        ...a,
        symbols: matchSymbolsToArticle(a, symbolInfos),
      }));
    }

    allArticles = deduplicateArticles(allArticles);
    allArticles = filterRecentArticles(allArticles, days);
    allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    cache.set(cacheKey, { data: allArticles, timestamp: Date.now() });
    if (cache.size > 80) {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) { if (now - entry.timestamp > CACHE_TTL) cache.delete(key); }
    }
    if (translationCache.size > 500) {
      const keys = [...translationCache.keys()];
      keys.slice(0, 100).forEach(k => translationCache.delete(k));
    }

    const articles = allArticles.slice(0, limit);
    return NextResponse.json({
      success: true, count: articles.length, total: allArticles.length,
      category, market, cached: false, fetchedAt: new Date().toISOString(),
      sources: [...new Set(articles.map(a => a.source))],
      matchedSymbolCount: symbolInfos.length,
      articles,
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch news' }, { status: 500 });
  }
}
