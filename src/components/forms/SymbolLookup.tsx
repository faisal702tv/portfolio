'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';

type LookupType = 'stock' | 'fund';

interface MarketSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  type?: string;
  source: string;
  sector?: string;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
}

interface SymbolLookupProps {
  type: LookupType;
  value: string;
  onChange: (value: string) => void;
  onPick: (item: {
    symbol: string;
    name: string;
    exchange?: string;
    currency?: string;
    type?: string;
    sector?: string;
    shariaStatus?: string;
    shariaBilad?: string;
    shariaRajhi?: string;
    shariaMaqasid?: string;
    shariaZero?: string;
    quote?: { price: number; changePct: number; source: string };
  }) => void;
}

export function SymbolLookup({ type, value, onChange, onPick }: SymbolLookupProps) {
  const [query, setQuery] = useState(value);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MarketSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const placeholder = useMemo(
    () => (type === 'stock' ? 'ابحث بالرمز أو الاسم (مثال: 2222 أو AAPL)' : 'ابحث بصندوق/ETF (مثال: SPY أو QQQ)'),
    [type]
  );

  const runSearch = async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}&type=${type}`, { cache: 'no-store' });
      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const onInput = (next: string) => {
    setQuery(next);
    onChange(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void runSearch(next);
    }, 350);
  };

  const pick = async (item: MarketSearchResult) => {
    setQuery(item.symbol);
    onChange(item.symbol);
    setOpen(false);
    setLoading(true);
    try {
      const quoteRes = await fetch(`/api/market/quote?symbol=${encodeURIComponent(item.symbol)}`, { cache: 'no-store' });
      const quoteData = await quoteRes.json();
      const quote = quoteData?.quote
        ? { price: Number(quoteData.quote.price), changePct: Number(quoteData.quote.changePct), source: String(quoteData.quote.source) }
        : undefined;
      onPick({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
        currency: item.currency,
        type: item.type,
        sector: item.sector,
        shariaStatus: item.shariaStatus,
        shariaBilad: item.shariaBilad,
        shariaRajhi: item.shariaRajhi,
        shariaMaqasid: item.shariaMaqasid,
        shariaZero: item.shariaZero,
        quote,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => onInput(e.target.value)} placeholder={placeholder} className="pr-9" />
        </div>
        <Button variant="outline" type="button" onClick={() => void runSearch(query)}>
          بحث
        </Button>
      </div>

      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جاري البحث...
        </div>
      ) : null}

      {open && results.length > 0 ? (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-lg border bg-background p-1 shadow-lg">
          {results.map((item) => (
            <button
              key={`${item.symbol}-${item.source}`}
              type="button"
              className="w-full rounded-md px-3 py-2 text-right hover:bg-accent"
              onClick={() => void pick(item)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{item.symbol}</span>
                <Badge variant="outline" className="text-[10px]">{item.source}</Badge>
              </div>
              <div className="truncate text-sm text-muted-foreground">{item.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {item.exchange ?? '—'} {item.currency ? `• ${item.currency}` : ''}
              </div>
              {item.shariaStatus && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${item.shariaStatus === 'نقي' || item.shariaStatus === 'حلال' ? 'border-green-500 text-green-600 bg-green-50' : item.shariaStatus === 'مختلط' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' : 'border-red-500 text-red-600 bg-red-50'}`}>
                    {item.shariaStatus}
                  </Badge>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
