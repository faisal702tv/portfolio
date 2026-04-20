import { NextResponse } from 'next/server';
import { markets } from '@/data/markets';

export async function GET() {
  try {
    // Fetch live prices
    const pricesRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'}/api/prices`, {
      cache: 'no-store'
    });
    
    let livePrices: Record<string, any> = {};
    if (pricesRes.ok) {
      const pricesData = await pricesRes.json();
      livePrices = pricesData.data || {};
    }
    
    return NextResponse.json({
      markets,
      livePrices,
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
