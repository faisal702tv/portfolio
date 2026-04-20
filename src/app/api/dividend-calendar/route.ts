import { NextResponse } from 'next/server';

const DIVIDENDS_API = 'https://www.saudiexchange.sa/wps/portal/saudiexchange/!ut/p/z1/pZDBDoIwDIafpjtA0mOaMm2T7WPb0IG0FRBiwWCTEMJur1e1d3ZcIfj58XeSxQ0QChN2qhKvjY-NZnbbW8FqWpYTGJqammqm6FO-2pZmjfaSR2L4BHnqUT9_d-w4GciBH4X3pkntMBnkPmGKCB9Dc9Phn9q3_S6dU74Dr-GCnKQUTjyQBtAgw48Lx1bZU3O0hlQuj1UmWHrTiG7V6MN2K9hdTpXuEf3ea0B_TbegRe1HEDPuRlooZ9FUXJORT5yCq9QpIuyJhg_w!!/dz/d5/L2dBISEvZ0FBIS9nQSEh/';

const CACHE_DURATION = 15 * 60 * 1000;
let cache: { data: any[]; timestamp: number } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json({ success: true, cached: true, data: cache.data, count: cache.data.length });
  }

  try {
    const res = await fetch(
      'https://www.saudiexchange.sa/wps/portal/saudiexchange/listing/company-listing/!ut/p/z1/lZHLDoIwEEV_xS_ooC0gSdGkMWQxWRQ2K2A5CBbDEmK-2yW7Obl3ztrdvVJdBxwS4LWNghKYWAf2dHbfG4KOotxNjM3FbU31Cdy8y0ZyM51f2CFYAlX_4PfuGBV0IgR-F96ZJ3SAZ5D5BiggfQ3Pb4Z_at_3unVO-A6_hgpykFE48kAbQIMOPC8ZW2VNztIZULo9VJlh604hulejDdivYXU6V7hH93mtAf023oEXtRxAz7kZaKGfRVFyTkU-cgqvUKSLsiYYP4!/dz/d5/L2dBISEvZ0FBIS9nQSEh/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        data: [],
        message: 'تعذر الاتصال بموقع تداول',
        fallback: true,
      });
    }

    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({
        success: false,
        data: [],
        message: 'تعذر قراءة البيانات',
        fallback: true,
      });
    }

    const items = Array.isArray(parsed) ? parsed : parsed?.data ?? parsed?.items ?? parsed?.results ?? [];
    cache = { data: items, timestamp: Date.now() };

    return NextResponse.json({ success: true, cached: false, data: items, count: items.length });
  } catch {
    const fallbackData = cache?.data ?? [];
    return NextResponse.json({
      success: fallbackData.length > 0,
      data: fallbackData,
      count: fallbackData.length,
      message: fallbackData.length > 0 ? 'يتم عرض بيانات محفوظة مسبقاً' : 'تعذر الاتصال بموقع تداول',
      fallback: true,
    });
  }
}
