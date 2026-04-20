'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  height?: number;
}

function mapSymbol(symbol: string): string {
  if (symbol.endsWith('.SR')) return `TADAWUL:${symbol.replace('.SR', '')}`;
  if (symbol.endsWith('.AD')) return `ADX:${symbol.replace('.AD', '')}`;
  if (symbol.endsWith('.DU')) return `DFM:${symbol.replace('.DU', '')}`;
  if (symbol.endsWith('.KW')) return `KSE:${symbol.replace('.KW', '')}`;
  if (symbol.endsWith('.QA')) return `QSE:${symbol.replace('.QA', '')}`;
  if (symbol.endsWith('.BH')) return `BHB:${symbol.replace('.BH', '')}`;
  if (symbol.endsWith('.OM')) return `MSX:${symbol.replace('.OM', '')}`;
  if (symbol.endsWith('.CA')) return `EGX:${symbol.replace('.CA', '')}`;
  return symbol;
}

function TradingViewWidgetInner({ symbol = 'TADAWUL:2222', theme = 'dark', height = 500 }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const mappedSymbol = mapSymbol(symbol);
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: mappedSymbol,
      interval: 'D',
      timezone: 'Asia/Riyadh',
      theme: theme,
      style: '1',
      locale: 'ar',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });

    containerRef.current.appendChild(script);
  }, [symbol, theme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container rounded-lg overflow-hidden"
      style={{ height }}
    />
  );
}

export const TradingViewWidget = memo(TradingViewWidgetInner);
