import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-request';
import { Prisma } from '@prisma/client';
import { withApiTelemetry } from '@/lib/api-telemetry';

type EarningsResult = 'beat' | 'miss' | 'inline' | null;
type EarningsSource = 'auto' | 'manual';

interface EarningsRecord {
  id: string;
  symbol: string;
  name: string;
  quarter: string;
  year: number;
  announcementDate: string;
  expectedEPS: number | null;
  actualEPS: number | null;
  surprise: number | null;
  surprisePct: number | null;
  result: EarningsResult;
  currency: string;
  source: EarningsSource;
  notes: string;
  createdAt: string;
}

const MAX_RECORDS = 3000;

function scopedSettingKey(userId: string, key: string): string {
  return `user:${userId}:${key}`;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseDateOrNull(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}

function sanitizeRecords(input: unknown[]): EarningsRecord[] {
  const out: EarningsRecord[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;

    const id = String(rec.id || '').trim();
    const symbol = String(rec.symbol || '').trim().toUpperCase();
    const name = String(rec.name || '').trim();
    const quarter = String(rec.quarter || '').trim();
    const year = Number.parseInt(String(rec.year ?? ''), 10);
    if (!id || !symbol || !name || !quarter || !Number.isFinite(year)) continue;

    const resultRaw = rec.result;
    const result: EarningsResult =
      resultRaw === 'beat' || resultRaw === 'miss' || resultRaw === 'inline' ? resultRaw : null;

    const sourceRaw = rec.source;
    const source: EarningsSource = sourceRaw === 'manual' ? 'manual' : 'auto';

    out.push({
      id,
      symbol,
      name,
      quarter,
      year,
      announcementDate: String(rec.announcementDate || ''),
      expectedEPS: toNumberOrNull(rec.expectedEPS),
      actualEPS: toNumberOrNull(rec.actualEPS),
      surprise: toNumberOrNull(rec.surprise),
      surprisePct: toNumberOrNull(rec.surprisePct),
      result,
      currency: String(rec.currency || 'USD'),
      source,
      notes: String(rec.notes || ''),
      createdAt: String(rec.createdAt || new Date().toISOString()),
    });
  }

  return out.slice(0, MAX_RECORDS);
}

function fromDbRecords(
  rows: Array<{
    clientId: string;
    symbol: string;
    name: string;
    quarter: string;
    year: number;
    announcementDate: Date | null;
    expectedEPS: number | null;
    actualEPS: number | null;
    surprise: number | null;
    surprisePct: number | null;
    result: string | null;
    currency: string;
    source: string;
    notes: string | null;
    createdAt: Date;
  }>
): EarningsRecord[] {
  return rows.map((row) => ({
    id: row.clientId,
    symbol: row.symbol,
    name: row.name,
    quarter: row.quarter,
    year: row.year,
    announcementDate: row.announcementDate ? row.announcementDate.toISOString().split('T')[0] : '',
    expectedEPS: row.expectedEPS,
    actualEPS: row.actualEPS,
    surprise: row.surprise,
    surprisePct: row.surprisePct,
    result: row.result === 'beat' || row.result === 'miss' || row.result === 'inline' ? row.result : null,
    currency: row.currency,
    source: row.source === 'manual' ? 'manual' : 'auto',
    notes: row.notes || '',
    createdAt: row.createdAt.toISOString(),
  }));
}

async function readLegacyRecords(userId: string): Promise<EarningsRecord[]> {
  const key = scopedSettingKey(userId, 'earnings_records');
  const setting = await db.setting.findUnique({ where: { key } });
  return Array.isArray(setting?.value) ? sanitizeRecords(setting.value as unknown[]) : [];
}

async function writeLegacyRecords(userId: string, records: EarningsRecord[]): Promise<void> {
  const key = scopedSettingKey(userId, 'earnings_records');
  await db.setting.upsert({
    where: { key },
    create: {
      key,
      value: records as unknown as Prisma.InputJsonValue,
      description: 'User earnings records (legacy JSON fallback)',
    },
    update: {
      value: records as unknown as Prisma.InputJsonValue,
    },
  });
}

function toDbData(userId: string, record: EarningsRecord) {
  return {
    userId,
    clientId: record.id,
    symbol: record.symbol,
    name: record.name,
    quarter: record.quarter,
    year: record.year,
    announcementDate: parseDateOrNull(record.announcementDate),
    expectedEPS: record.expectedEPS,
    actualEPS: record.actualEPS,
    surprise: record.surprise,
    surprisePct: record.surprisePct,
    result: record.result,
    currency: record.currency || 'USD',
    source: record.source || 'auto',
    notes: record.notes || null,
    createdAt: parseDateOrNull(record.createdAt) || new Date(),
  };
}

async function getEarningsRecords(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    let rows = await db.userEarningsRecord.findMany({
      where: { userId: user.id },
      orderBy: [{ announcementDate: 'desc' }, { createdAt: 'desc' }],
    });

    if (rows.length === 0) {
      const legacy = await readLegacyRecords(user.id);
      if (legacy.length > 0) {
        await db.userEarningsRecord.createMany({
          data: legacy.map((record) => toDbData(user.id, record)),
        });
        rows = await db.userEarningsRecord.findMany({
          where: { userId: user.id },
          orderBy: [{ announcementDate: 'desc' }, { createdAt: 'desc' }],
        });
      }
    }

    return NextResponse.json({ success: true, records: fromDbRecords(rows) });
  } catch (error) {
    if (isMissingTableError(error)) {
      const records = await readLegacyRecords(user.id);
      return NextResponse.json({ success: true, records, legacy: true });
    }
    console.error('Get earnings records error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

async function putEarningsRecords(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let records: EarningsRecord[] = [];

  try {
    const body = await request.json();
    const incoming = Array.isArray(body?.records) ? body.records : [];
    records = sanitizeRecords(incoming);

    await db.$transaction(async (tx) => {
      await tx.userEarningsRecord.deleteMany({ where: { userId: user.id } });
      if (records.length > 0) {
        await tx.userEarningsRecord.createMany({
          data: records.map((record) => toDbData(user.id, record)),
        });
      }
    });

    return NextResponse.json({ success: true, count: records.length });
  } catch (error) {
    if (isMissingTableError(error)) {
      await writeLegacyRecords(user.id, records);
      return NextResponse.json({ success: true, count: records.length, legacy: true });
    }
    console.error('Save earnings records error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export const GET = withApiTelemetry('/api/market/earnings-records', getEarningsRecords);
export const PUT = withApiTelemetry('/api/market/earnings-records', putEarningsRecords);
