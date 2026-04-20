import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const hoisted = vi.hoisted(() => {
  class MockKnownRequestError extends Error {
    code: string;

    constructor(code: string) {
      super(`Prisma known request error: ${code}`);
      this.code = code;
    }
  }

  const user = {
    id: 'user-1',
    email: 'user@example.com',
    username: 'user1',
    name: null,
    role: 'user' as const,
  };

  const mockDb = {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    userEarningsRecord: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    userCorporateActionRecord: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockGetUserFromRequest = vi.fn();

  return {
    MockKnownRequestError,
    user,
    mockDb,
    mockGetUserFromRequest,
  };
});

vi.mock('@/lib/db', () => ({
  db: hoisted.mockDb,
}));

vi.mock('@/lib/auth-request', () => ({
  getUserFromRequest: hoisted.mockGetUserFromRequest,
}));

vi.mock('@prisma/client', () => ({
  Prisma: {
    PrismaClientKnownRequestError: hoisted.MockKnownRequestError,
  },
}));

import {
  GET as earningsGet,
  PUT as earningsPut,
} from '@/app/api/market/earnings-records/route';
import {
  GET as corporateActionsGet,
  PUT as corporateActionsPut,
} from '@/app/api/market/corporate-actions-records/route';

function createRequest(body?: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body ?? {}),
    headers: { get: vi.fn().mockReturnValue(null) },
    cookies: { get: vi.fn().mockReturnValue(undefined) },
  } as unknown as NextRequest;
}

function createMissingTableError(): Error {
  return new hoisted.MockKnownRequestError('P2021');
}

describe('Market records routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hoisted.mockGetUserFromRequest.mockReturnValue(hoisted.user);

    hoisted.mockDb.setting.findUnique.mockResolvedValue(null);
    hoisted.mockDb.setting.upsert.mockResolvedValue({ key: 'ok' });

    hoisted.mockDb.userEarningsRecord.findMany.mockResolvedValue([]);
    hoisted.mockDb.userEarningsRecord.createMany.mockResolvedValue({ count: 0 });
    hoisted.mockDb.userEarningsRecord.deleteMany.mockResolvedValue({ count: 0 });

    hoisted.mockDb.userCorporateActionRecord.findMany.mockResolvedValue([]);
    hoisted.mockDb.userCorporateActionRecord.createMany.mockResolvedValue({ count: 0 });
    hoisted.mockDb.userCorporateActionRecord.deleteMany.mockResolvedValue({ count: 0 });

    hoisted.mockDb.$transaction.mockImplementation(async (callback: (tx: typeof hoisted.mockDb) => Promise<void>) => {
      return callback(hoisted.mockDb);
    });
  });

  describe('earnings-records route', () => {
    it('returns 401 when request is unauthenticated', async () => {
      hoisted.mockGetUserFromRequest.mockReturnValue(null);

      const response = await earningsGet(createRequest());
      expect(response.status).toBe(401);
    });

    it('reads structured earnings records from database', async () => {
      hoisted.mockDb.userEarningsRecord.findMany.mockResolvedValue([
        {
          clientId: 'rec-1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quarter: 'Q1',
          year: 2026,
          announcementDate: new Date('2026-01-30'),
          expectedEPS: 1.2,
          actualEPS: 1.3,
          surprise: 0.1,
          surprisePct: 8.3,
          result: 'beat',
          currency: 'USD',
          source: 'manual',
          notes: 'strong quarter',
          createdAt: new Date('2026-01-29T10:00:00.000Z'),
        },
      ]);

      const response = await earningsGet(createRequest());
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.records).toHaveLength(1);
      expect(json.records[0]).toMatchObject({
        id: 'rec-1',
        symbol: 'AAPL',
        result: 'beat',
        source: 'manual',
      });
    });

    it('migrates legacy earnings records to structured table when empty', async () => {
      hoisted.mockDb.userEarningsRecord.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            clientId: 'legacy-1',
            symbol: 'MSFT',
            name: 'Microsoft',
            quarter: 'Q4',
            year: 2025,
            announcementDate: new Date('2025-10-30'),
            expectedEPS: 2.8,
            actualEPS: 3.1,
            surprise: 0.3,
            surprisePct: 10.7,
            result: 'beat',
            currency: 'USD',
            source: 'auto',
            notes: null,
            createdAt: new Date('2025-10-29T10:00:00.000Z'),
          },
        ]);

      hoisted.mockDb.setting.findUnique.mockResolvedValue({
        key: 'user:user-1:earnings_records',
        value: [
          {
            id: 'legacy-1',
            symbol: 'msft',
            name: 'Microsoft',
            quarter: 'Q4',
            year: 2025,
            announcementDate: '2025-10-30',
            expectedEPS: '2.8',
            actualEPS: '3.1',
            surprise: '0.3',
            surprisePct: '10.7',
            result: 'beat',
            currency: 'USD',
            source: 'auto',
            notes: '',
            createdAt: '2025-10-29T10:00:00.000Z',
          },
        ],
      });

      const response = await earningsGet(createRequest());
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(hoisted.mockDb.userEarningsRecord.createMany).toHaveBeenCalledTimes(1);
      expect(json.records).toHaveLength(1);
      expect(json.records[0].id).toBe('legacy-1');
    });

    it('falls back to legacy settings when structured table is missing', async () => {
      hoisted.mockDb.userEarningsRecord.findMany.mockRejectedValue(createMissingTableError());
      hoisted.mockDb.setting.findUnique.mockResolvedValue({
        key: 'user:user-1:earnings_records',
        value: [
          {
            id: 'legacy-only',
            symbol: 'tsla',
            name: 'Tesla',
            quarter: 'Q2',
            year: 2026,
            announcementDate: '2026-07-20',
            expectedEPS: 0.5,
            actualEPS: 0.45,
            surprise: -0.05,
            surprisePct: -10,
            result: 'miss',
            currency: 'USD',
            source: 'manual',
            notes: 'legacy mode',
            createdAt: '2026-07-20T00:00:00.000Z',
          },
        ],
      });

      const response = await earningsGet(createRequest());
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.legacy).toBe(true);
      expect(json.records).toHaveLength(1);
      expect(json.records[0].symbol).toBe('TSLA');
    });

    it('writes sanitized earnings records through transaction', async () => {
      const response = await earningsPut(
        createRequest({
          records: [
            {
              id: 'ok-1',
              symbol: 'nvda',
              name: 'NVIDIA',
              quarter: 'Q3',
              year: 2026,
              announcementDate: '2026-09-01',
              expectedEPS: '1.0',
              actualEPS: 1.2,
              result: 'beat',
              source: 'manual',
              createdAt: '2026-08-31T10:00:00.000Z',
            },
            {
              id: '',
              symbol: '',
              name: '',
              quarter: '',
              year: 'oops',
            },
          ],
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(hoisted.mockDb.userEarningsRecord.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(hoisted.mockDb.userEarningsRecord.createMany).toHaveBeenCalledTimes(1);
      expect(json.count).toBe(1);
    });

    it('falls back to legacy write when structured earnings table is missing', async () => {
      hoisted.mockDb.$transaction.mockRejectedValue(createMissingTableError());

      const response = await earningsPut(
        createRequest({
          records: [
            {
              id: 'legacy-write',
              symbol: 'amzn',
              name: 'Amazon',
              quarter: 'Q1',
              year: 2026,
            },
          ],
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.legacy).toBe(true);
      expect(json.count).toBe(1);
      expect(hoisted.mockDb.setting.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('corporate-actions-records route', () => {
    it('returns 401 when request is unauthenticated', async () => {
      hoisted.mockGetUserFromRequest.mockReturnValue(null);

      const response = await corporateActionsGet(createRequest());
      expect(response.status).toBe(401);
    });

    it('migrates legacy corporate actions when structured table is empty', async () => {
      hoisted.mockDb.userCorporateActionRecord.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            clientId: 'corp-1',
            symbol: 'AAPL',
            name: 'Apple',
            type: 'split',
            ratio: '4:1',
            ratioFrom: 1,
            ratioTo: 4,
            dividendAmount: null,
            effectiveDate: new Date('2020-08-31'),
            currency: 'USD',
            applied: true,
            source: 'auto',
            notes: null,
            createdAt: new Date('2020-08-30T10:00:00.000Z'),
          },
        ]);

      hoisted.mockDb.setting.findUnique.mockResolvedValue({
        key: 'user:user-1:corporate_actions_records',
        value: [
          {
            id: 'corp-1',
            symbol: 'aapl',
            name: 'Apple',
            type: 'split',
            ratio: '4:1',
            ratioFrom: '1',
            ratioTo: '4',
            effectiveDate: '2020-08-31',
            currency: 'USD',
            applied: true,
            source: 'auto',
            notes: '',
            createdAt: '2020-08-30T10:00:00.000Z',
          },
        ],
      });

      const response = await corporateActionsGet(createRequest());
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(hoisted.mockDb.userCorporateActionRecord.createMany).toHaveBeenCalledTimes(1);
      expect(json.actions).toHaveLength(1);
      expect(json.actions[0].id).toBe('corp-1');
    });

    it('writes sanitized corporate actions through transaction', async () => {
      const response = await corporateActionsPut(
        createRequest({
          actions: [
            {
              id: 'corp-valid',
              symbol: 'tsla',
              name: 'Tesla',
              type: 'dividend',
              dividendAmount: '0.45',
              effectiveDate: '2026-11-01',
              source: 'manual',
            },
            {
              id: 'corp-invalid',
              symbol: 'X',
              name: 'Ignored',
              type: 'bad-type',
            },
          ],
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(hoisted.mockDb.userCorporateActionRecord.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(hoisted.mockDb.userCorporateActionRecord.createMany).toHaveBeenCalledTimes(1);
      expect(json.count).toBe(1);
    });

    it('falls back to legacy write when structured corporate table is missing', async () => {
      hoisted.mockDb.$transaction.mockRejectedValue(createMissingTableError());

      const response = await corporateActionsPut(
        createRequest({
          actions: [
            {
              id: 'legacy-corp',
              symbol: 'meta',
              name: 'Meta',
              type: 'split',
              ratio: '2:1',
              ratioFrom: 1,
              ratioTo: 2,
            },
          ],
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.legacy).toBe(true);
      expect(json.count).toBe(1);
      expect(hoisted.mockDb.setting.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
