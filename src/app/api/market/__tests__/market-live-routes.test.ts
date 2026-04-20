import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

function createRequest(url: string): NextRequest {
  return { url } as NextRequest;
}

function responseWithJson(payload: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('Market live API routes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('/api/market/earnings', () => {
    it('returns 400 when symbol is missing', async () => {
      vi.stubGlobal('fetch', vi.fn());
      const { GET } = await import('@/app/api/market/earnings/route');

      const response = await GET(createRequest('http://localhost/api/market/earnings'));
      expect(response.status).toBe(400);
    });

    it('parses quarterly and upcoming earnings data', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        responseWithJson({
          quoteSummary: {
            result: [
              {
                earnings: {
                  earningsChart: {
                    quarterly: [
                      { date: '1Q2025', actual: { raw: 1.2 }, estimate: { raw: 1.0 } },
                    ],
                  },
                },
                earningsTrend: {
                  trend: [
                    {
                      period: '0q',
                      earningsEstimate: { avg: { raw: 1.6 } },
                    },
                  ],
                },
                calendarEvents: {
                  earnings: {
                    earningsDate: [{ fmt: '2026-08-01' }],
                    earningsAverage: { raw: 1.5 },
                  },
                },
              },
            ],
          },
        })
      );

      vi.stubGlobal('fetch', fetchMock);
      const { GET } = await import('@/app/api/market/earnings/route');

      const response = await GET(
        createRequest('http://localhost/api/market/earnings?symbol=aapl&name=Apple')
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.records)).toBe(true);
      expect(json.records.length).toBeGreaterThanOrEqual(2);

      const historical = json.records.find(
        (record: Record<string, unknown>) =>
          record.symbol === 'AAPL' && record.quarter === 'Q1' && record.year === 2025
      );
      expect(historical).toMatchObject({
        result: 'beat',
      });

      const upcoming = json.records.find(
        (record: Record<string, unknown>) => record.announcementDate === '2026-08-01'
      );
      expect(upcoming).toMatchObject({
        quarter: 'Q3',
        year: 2026,
        expectedEPS: 1.6,
        result: null,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to secondary Yahoo host when first host fails', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(responseWithJson({}, false))
        .mockResolvedValueOnce(
          responseWithJson({
            quoteSummary: {
              result: [
                {
                  earnings: { earningsChart: { quarterly: [] } },
                  calendarEvents: {},
                },
              ],
            },
          })
        );

      vi.stubGlobal('fetch', fetchMock);
      const { GET } = await import('@/app/api/market/earnings/route');

      const response = await GET(
        createRequest('http://localhost/api/market/earnings?symbol=MSFT&name=Microsoft')
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[0]?.[0])).toContain('query1.finance.yahoo.com');
      expect(String(fetchMock.mock.calls[1]?.[0])).toContain('query2.finance.yahoo.com');
    });

    it('serves cached earnings response for repeated request', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        responseWithJson({
          quoteSummary: {
            result: [{ earnings: { earningsChart: { quarterly: [] } }, calendarEvents: {} }],
          },
        })
      );

      vi.stubGlobal('fetch', fetchMock);
      const { GET } = await import('@/app/api/market/earnings/route');
      const request = createRequest('http://localhost/api/market/earnings?symbol=NVDA&name=NVIDIA');

      const first = await GET(request);
      const second = await GET(request);
      const secondJson = await second.json();

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(secondJson.cached).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('/api/market/corporate-actions', () => {
    it('returns 400 when symbol is missing', async () => {
      vi.stubGlobal('fetch', vi.fn());
      const { GET } = await import('@/app/api/market/corporate-actions/route');

      const response = await GET(createRequest('http://localhost/api/market/corporate-actions'));
      expect(response.status).toBe(400);
    });

    it('parses splits, reverse splits, and dividends and sorts by date', async () => {
      const splitsPayload = {
        chart: {
          result: [
            {
              events: {
                splits: {
                  one: { date: 1609459200, numerator: 4, denominator: 1, splitRatio: '4/1' },
                  two: { date: 1672444800, numerator: 1, denominator: 5, splitRatio: '1/5' },
                },
              },
            },
          ],
        },
      };

      const dividendsPayload = {
        chart: {
          result: [
            {
              events: {
                dividends: {
                  one: { date: 1704067200, amount: 0.82 },
                },
              },
            },
          ],
        },
      };

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(responseWithJson(splitsPayload))
        .mockResolvedValueOnce(responseWithJson(dividendsPayload));

      vi.stubGlobal('fetch', fetchMock);
      const { GET } = await import('@/app/api/market/corporate-actions/route');

      const response = await GET(
        createRequest('http://localhost/api/market/corporate-actions?symbol=tsla&name=Tesla')
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.actions).toHaveLength(3);

      const split = json.actions.find((action: Record<string, unknown>) => action.type === 'split');
      const reverseSplit = json.actions.find(
        (action: Record<string, unknown>) => action.type === 'reverse_split'
      );
      const dividend = json.actions.find((action: Record<string, unknown>) => action.type === 'dividend');

      expect(split).toMatchObject({ ratio: '4:1', symbol: 'TSLA' });
      expect(reverseSplit).toMatchObject({ ratio: '5:1', symbol: 'TSLA' });
      expect(dividend).toMatchObject({ dividendAmount: 0.82, symbol: 'TSLA' });

      expect(json.actions[0].effectiveDate).toBe('2024-01-01');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('serves cached corporate actions response for repeated request', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(responseWithJson({ chart: { result: [{ events: { splits: {} } }] } }))
        .mockResolvedValueOnce(responseWithJson({ chart: { result: [{ events: { dividends: {} } }] } }));

      vi.stubGlobal('fetch', fetchMock);
      const { GET } = await import('@/app/api/market/corporate-actions/route');
      const request = createRequest('http://localhost/api/market/corporate-actions?symbol=AAPL&name=Apple');

      const first = await GET(request);
      const second = await GET(request);
      const secondJson = await second.json();

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(secondJson.cached).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('/api/market/snapshot', () => {
    it('returns 400 when index and symbols are missing', async () => {
      vi.stubGlobal('fetch', vi.fn());
      const { GET } = await import('@/app/api/market/snapshot/route');

      const response = await GET(createRequest('http://localhost/api/market/snapshot'));
      expect(response.status).toBe(400);
    });

    it('returns index and symbols snapshot payload', async () => {
      const indexPayload = {
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 110,
                chartPreviousClose: 100,
              },
              timestamp: [1710000000, 1710086400, 1710172800, 1710259200, 1710345600],
              indicators: {
                quote: [
                  {
                    close: [100, 102, 104, 108, 110],
                  },
                ],
              },
            },
          ],
        },
      };

      const pricesPayload = {
        quoteResponse: {
          result: [
            {
              symbol: 'AAPL',
              regularMarketPrice: 200,
              regularMarketPreviousClose: 190,
              regularMarketChangePercent: 5.26,
              regularMarketVolume: 123456,
            },
            {
              symbol: 'MSFT',
              regularMarketPrice: 300,
              regularMarketOpen: 290,
              regularMarketVolume: 654321,
            },
          ],
        },
      };

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(responseWithJson(indexPayload))
        .mockResolvedValueOnce(responseWithJson(pricesPayload));

      vi.stubGlobal('fetch', fetchMock);
      const { GET } = await import('@/app/api/market/snapshot/route');

      const response = await GET(
        createRequest('http://localhost/api/market/snapshot?indexSym=%5EGSPC&symbols=AAPL,MSFT')
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.index.price).toBe(110);
      expect(json.index.chg).toBe(10);
      expect(json.index.history).toHaveLength(5);
      expect(json.prices.AAPL).toMatchObject({ price: 200, changePct: 5.26, volume: 123456 });
      expect(json.prices.MSFT.price).toBe(300);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('serves cached snapshot payload for repeated request', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(
          responseWithJson({
            chart: {
              result: [
                {
                  meta: { regularMarketPrice: 150, chartPreviousClose: 100 },
                  timestamp: [1710000000],
                  indicators: { quote: [{ close: [150] }] },
                },
              ],
            },
          })
        )
        .mockResolvedValueOnce(
          responseWithJson({
            quoteResponse: {
              result: [{ symbol: 'AAPL', regularMarketPrice: 100, regularMarketVolume: 10 }],
            },
          })
        );

      vi.stubGlobal('fetch', fetchMock);
      const { GET } = await import('@/app/api/market/snapshot/route');
      const request = createRequest(
        'http://localhost/api/market/snapshot?indexSym=%5EGSPC&symbols=AAPL'
      );

      const first = await GET(request);
      const second = await GET(request);
      const secondJson = await second.json();

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(secondJson.cached).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
