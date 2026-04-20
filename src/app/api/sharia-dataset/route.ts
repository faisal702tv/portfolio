import { NextRequest, NextResponse } from 'next/server';
import {
  getShariaDatasetSnapshot,
  refreshShariaDataset,
} from '@/lib/sharia-dataset-store';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const autoRefresh = searchParams.get('auto') !== 'false';

  try {
    const { payload, autoRefreshed } = await getShariaDatasetSnapshot({ autoRefresh });
    return NextResponse.json({
      success: true,
      autoRefreshed,
      shariaMarkets: payload.shariaMarkets,
      funds: payload.funds,
      meta: payload.meta,
    });
  } catch (error) {
    console.error('GET /api/sharia-dataset failed:', error);
    return NextResponse.json(
      { success: false, error: 'failed_to_load_sharia_dataset' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body?.mode === 'auto' ? 'auto' : 'manual';
    const payload = await refreshShariaDataset(mode);
    return NextResponse.json({
      success: true,
      autoRefreshed: mode === 'auto',
      shariaMarkets: payload.shariaMarkets,
      funds: payload.funds,
      meta: payload.meta,
    });
  } catch (error) {
    console.error('POST /api/sharia-dataset failed:', error);
    return NextResponse.json(
      { success: false, error: 'failed_to_refresh_sharia_dataset' },
      { status: 500 }
    );
  }
}

