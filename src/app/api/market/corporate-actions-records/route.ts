import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-request';
import { Prisma } from '@prisma/client';
import { withApiTelemetry } from '@/lib/api-telemetry';

type ActionType = 'split' | 'reverse_split' | 'dividend' | 'bonus_issue' | 'rights_issue';
type ActionSource = 'auto' | 'manual';

interface CorporateAction {
  id: string;
  symbol: string;
  name: string;
  type: ActionType;
  ratio: string | null;
  ratioFrom: number | null;
  ratioTo: number | null;
  dividendAmount: number | null;
  effectiveDate: string;
  currency: string;
  applied: boolean;
  source: ActionSource;
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

function sanitizeRecords(input: unknown[]): CorporateAction[] {
  const out: CorporateAction[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;

    const typeRaw = rec.type;
    if (
      typeRaw !== 'split' &&
      typeRaw !== 'reverse_split' &&
      typeRaw !== 'dividend' &&
      typeRaw !== 'bonus_issue' &&
      typeRaw !== 'rights_issue'
    ) continue;

    const id = String(rec.id || '').trim();
    const symbol = String(rec.symbol || '').trim().toUpperCase();
    const name = String(rec.name || '').trim();
    if (!id || !symbol || !name) continue;

    const sourceRaw = rec.source;
    const source: ActionSource = sourceRaw === 'manual' ? 'manual' : 'auto';

    out.push({
      id,
      symbol,
      name,
      type: typeRaw,
      ratio: rec.ratio == null ? null : String(rec.ratio),
      ratioFrom: toNumberOrNull(rec.ratioFrom),
      ratioTo: toNumberOrNull(rec.ratioTo),
      dividendAmount: toNumberOrNull(rec.dividendAmount),
      effectiveDate: String(rec.effectiveDate || ''),
      currency: String(rec.currency || 'USD'),
      applied: Boolean(rec.applied),
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
    type: string;
    ratio: string | null;
    ratioFrom: number | null;
    ratioTo: number | null;
    dividendAmount: number | null;
    effectiveDate: Date | null;
    currency: string;
    applied: boolean;
    source: string;
    notes: string | null;
    createdAt: Date;
  }>
): CorporateAction[] {
  return rows.map((row) => ({
    id: row.clientId,
    symbol: row.symbol,
    name: row.name,
    type:
      row.type === 'reverse_split'
        ? 'reverse_split'
        : row.type === 'dividend'
          ? 'dividend'
          : row.type === 'bonus_issue'
            ? 'bonus_issue'
            : row.type === 'rights_issue'
              ? 'rights_issue'
              : 'split',
    ratio: row.ratio,
    ratioFrom: row.ratioFrom,
    ratioTo: row.ratioTo,
    dividendAmount: row.dividendAmount,
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString().split('T')[0] : '',
    currency: row.currency,
    applied: row.applied,
    source: row.source === 'manual' ? 'manual' : 'auto',
    notes: row.notes || '',
    createdAt: row.createdAt.toISOString(),
  }));
}

async function readLegacyRecords(userId: string): Promise<CorporateAction[]> {
  const key = scopedSettingKey(userId, 'corporate_actions_records');
  const setting = await db.setting.findUnique({ where: { key } });
  return Array.isArray(setting?.value) ? sanitizeRecords(setting.value as unknown[]) : [];
}

async function writeLegacyRecords(userId: string, actions: CorporateAction[]): Promise<void> {
  const key = scopedSettingKey(userId, 'corporate_actions_records');
  await db.setting.upsert({
    where: { key },
    create: {
      key,
      value: actions as unknown as Prisma.InputJsonValue,
      description: 'User corporate actions records (legacy JSON fallback)',
    },
    update: {
      value: actions as unknown as Prisma.InputJsonValue,
    },
  });
}

function toDbData(userId: string, action: CorporateAction) {
  return {
    userId,
    clientId: action.id,
    symbol: action.symbol,
    name: action.name,
    type: action.type,
    ratio: action.ratio,
    ratioFrom: action.ratioFrom,
    ratioTo: action.ratioTo,
    dividendAmount: action.dividendAmount,
    effectiveDate: parseDateOrNull(action.effectiveDate),
    currency: action.currency || 'USD',
    applied: action.applied,
    source: action.source || 'auto',
    notes: action.notes || null,
    createdAt: parseDateOrNull(action.createdAt) || new Date(),
  };
}

async function getCorporateActionsRecords(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    let rows = await db.userCorporateActionRecord.findMany({
      where: { userId: user.id },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });

    if (rows.length === 0) {
      const legacy = await readLegacyRecords(user.id);
      if (legacy.length > 0) {
        await db.userCorporateActionRecord.createMany({
          data: legacy.map((action) => toDbData(user.id, action)),
        });
        rows = await db.userCorporateActionRecord.findMany({
          where: { userId: user.id },
          orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
        });
      }
    }

    return NextResponse.json({ success: true, actions: fromDbRecords(rows) });
  } catch (error) {
    if (isMissingTableError(error)) {
      const actions = await readLegacyRecords(user.id);
      return NextResponse.json({ success: true, actions, legacy: true });
    }
    console.error('Get corporate actions records error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

async function putCorporateActionsRecords(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let actions: CorporateAction[] = [];

  try {
    const body = await request.json();
    const incoming = Array.isArray(body?.actions) ? body.actions : [];
    actions = sanitizeRecords(incoming);

    await db.$transaction(async (tx) => {
      await tx.userCorporateActionRecord.deleteMany({ where: { userId: user.id } });
      if (actions.length > 0) {
        await tx.userCorporateActionRecord.createMany({
          data: actions.map((action) => toDbData(user.id, action)),
        });
      }
    });

    return NextResponse.json({ success: true, count: actions.length });
  } catch (error) {
    if (isMissingTableError(error)) {
      await writeLegacyRecords(user.id, actions);
      return NextResponse.json({ success: true, count: actions.length, legacy: true });
    }
    console.error('Save corporate actions records error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export const GET = withApiTelemetry('/api/market/corporate-actions-records', getCorporateActionsRecords);
export const PUT = withApiTelemetry('/api/market/corporate-actions-records', putCorporateActionsRecords);
