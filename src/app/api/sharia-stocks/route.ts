import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market');
  const symbol = searchParams.get('symbol');
  const status = searchParams.get('status');
  const grade = searchParams.get('grade');

  try {
    // Read stocks database
    const dataPath = path.join(process.cwd(), 'src/data/stocks_database.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const stocksData = JSON.parse(fileContent);

    // Flatten all stocks
    let allStocks: any[] = [];
    Object.entries(stocksData).forEach(([marketCode, stocks]: [string, any]) => {
      allStocks = allStocks.concat(stocks.map((s: any) => ({ ...s, market: marketCode })));
    });

    // Get specific symbol
    if (symbol) {
      const stock = allStocks.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
      if (!stock) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
      }
      return NextResponse.json({ stock });
    }

    // Filter by market
    if (market && market !== 'all') {
      allStocks = allStocks.filter(s => s.market === market);
    }

    // Filter by status
    if (status && status !== 'all') {
      allStocks = allStocks.filter(s => s.sharia?.status === status);
    }

    // Filter by grade
    if (grade && grade !== 'all') {
      allStocks = allStocks.filter(s => s.sharia?.grade === grade);
    }

    // Calculate statistics
    const stats = {
      total: allStocks.length,
      compliant: allStocks.filter(s => s.sharia?.status === 'compliant').length,
      nonCompliant: allStocks.filter(s => s.sharia?.status === 'non_compliant').length,
      pending: allStocks.filter(s => s.sharia?.status === 'pending').length,
    };

    // Market statistics
    const marketStats: any = {};
    Object.entries(stocksData).forEach(([code, stocks]: [string, any]) => {
      marketStats[code] = {
        total: stocks.length,
        compliant: stocks.filter((s: any) => s.sharia?.status === 'compliant').length,
        nonCompliant: stocks.filter((s: any) => s.sharia?.status === 'non_compliant').length,
        pending: stocks.filter((s: any) => s.sharia?.status === 'pending').length,
        name: stocks[0]?.marketName || code,
      };
    });

    // Grades distribution
    const grades: any = {};
    allStocks.forEach(s => {
      const g = s.sharia?.grade || 'N/A';
      grades[g] = (grades[g] || 0) + 1;
    });

    return NextResponse.json({
      stats,
      marketStats,
      grades,
      count: allStocks.length,
      stocks: stocksData,
    });
  } catch (error) {
    console.error('Error reading stocks database:', error);
    return NextResponse.json(
      { error: 'Failed to load stocks database' },
      { status: 500 }
    );
  }
}
