import { NextResponse } from 'next/server';
import { 
  markets, 
  marketIndices, 
  marketStocks, 
  cryptoData,
  commoditiesData,
  getMarketByCode, 
  getIndicesByMarket, 
  getStocksByMarket 
} from '@/data/markets';

interface RouteParams {
  params: Promise<{ market: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const marketCode = resolvedParams.market.toUpperCase();
    
    const market = getMarketByCode(marketCode);
    
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }
    
    const indices = getIndicesByMarket(marketCode);
    const stocks = getStocksByMarket(marketCode);
    
    // Include crypto data if it's a crypto market
    if (market.type === 'crypto') {
      return NextResponse.json({
        market,
        indices,
        stocks,
        crypto: cryptoData,
      });
    }
    
    // Include commodities data if it's a commodities market
    if (market.type === 'commodity') {
      return NextResponse.json({
        market,
        indices,
        stocks,
        commodities: commoditiesData,
      });
    }
    
    // Default for stock markets
    return NextResponse.json({
      market,
      indices,
      stocks,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
