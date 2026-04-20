import { NextResponse } from 'next/server';
import { createHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import { validateUsername } from '@/lib/auth';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

function toLower(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function toUpper(value: string | null | undefined): string {
  return (value || '').trim().toUpperCase();
}

const METAL_KEYWORDS = [
  'gold', 'silver', 'platinum', 'palladium', 'copper', 'nickel', 'aluminum', 'aluminium', 'zinc', 'lead', 'iron',
  'ذهب', 'فضة', 'بلاتين', 'بلاديوم', 'نحاس', 'نيكل', 'المنيوم', 'ألمنيوم', 'حديد',
];

function isCommodityFundType(fundType: string): boolean {
  return fundType === 'commodities' || fundType === 'commodity';
}

function isMetalAsset(symbol: string, name: string): boolean {
  const target = `${symbol} ${name}`.toLowerCase();
  return METAL_KEYWORDS.some((keyword) => target.includes(keyword));
}

async function getUserProjectMetrics(userId: string) {
  try {
    const [
      totalTransactions,
      activePortfolios,
      totalWatchlists,
      totalWatchlistItems,
      totalAlerts,
      activeAlerts,
      stocks,
      bonds,
      funds,
    ] = await Promise.all([
      db.transaction.count({
        where: {
          portfolio: {
            userId,
          },
        },
      }),
      db.portfolio.count({
        where: { userId, isActive: true },
      }),
      db.watchlist.count({
        where: { userId },
      }),
      db.watchlistItem.count({
        where: {
          watchlist: {
            userId,
          },
        },
      }),
      db.alert.count({
        where: { userId },
      }),
      db.alert.count({
        where: { userId, isActive: true },
      }),
      db.stock.findMany({
        where: {
          portfolio: {
            userId,
          },
        },
        select: {
          symbol: true,
          name: true,
          sector: true,
          exchange: {
            select: { code: true },
          },
        },
      }),
      db.bond.findMany({
        where: {
          portfolio: {
            userId,
          },
        },
        select: {
          symbol: true,
          name: true,
          type: true,
        },
      }),
      db.fund.findMany({
        where: {
          portfolio: {
            userId,
          },
        },
        select: {
          symbol: true,
          name: true,
          fundType: true,
        },
      }),
    ]);

    const totals = {
      totalStocks: 0,
      totalCrypto: 0,
      totalForex: 0,
      totalBonds: 0,
      totalSukuk: 0,
      totalFunds: 0,
      totalCommodities: 0,
      totalMetals: 0,
    };

    for (const stock of stocks) {
      const sector = toLower(stock.sector);
      const exchangeCode = toUpper(stock.exchange?.code);
      const symbol = toUpper(stock.symbol);

      const isCrypto =
        sector.includes('crypto')
        || exchangeCode.includes('CRYPTO')
        || symbol.endsWith('-USD')
        || symbol.endsWith('/USD')
        || symbol.endsWith('USDT');

      const isForex =
        sector === 'forex'
        || exchangeCode.includes('FOREX')
        || symbol.endsWith('=X');

      if (isCrypto) totals.totalCrypto += 1;
      else if (isForex) totals.totalForex += 1;
      else totals.totalStocks += 1;
    }

    for (const bond of bonds) {
      const type = toLower(bond.type);
      if (type === 'sukuk') totals.totalSukuk += 1;
      else totals.totalBonds += 1;
    }

    for (const fund of funds) {
      const fundType = toLower(fund.fundType);
      if (isCommodityFundType(fundType)) {
        totals.totalCommodities += 1;
        if (isMetalAsset(fund.symbol || '', fund.name || '')) {
          totals.totalMetals += 1;
        }
      } else {
        totals.totalFunds += 1;
      }
    }

    return {
      totalTransactions,
      totalWatchlists,
      totalWatchlistItems,
      totalAlerts,
      activeAlerts,
      ...totals,
      activePortfolios,
      totalHoldings:
        totals.totalStocks
        + totals.totalCrypto
        + totals.totalForex
        + totals.totalBonds
        + totals.totalSukuk
        + totals.totalFunds
        + totals.totalCommodities,
    };
  } catch (error) {
    console.error('Failed to compute profile metrics:', error);
    return {
      totalTransactions: 0,
      totalWatchlists: 0,
      totalWatchlistItems: 0,
      totalAlerts: 0,
      activeAlerts: 0,
      totalStocks: 0,
      totalCrypto: 0,
      totalForex: 0,
      totalBonds: 0,
      totalSukuk: 0,
      totalFunds: 0,
      totalCommodities: 0,
      totalMetals: 0,
      activePortfolios: 0,
      totalHoldings: 0,
    };
  }
}

// ─── GET Profile ──────────────────────────────────────────
export const GET = createHandler(
  { auth: true },
  async ({ user }) => {
    const [dbUser, metrics] = await Promise.all([
      db.user.findUnique({
        where: { id: user!.id },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          avatar: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              portfolios: true,
              watchlists: true,
              alerts: true,
            },
          },
        },
      }),
      getUserProjectMetrics(user!.id),
    ]);

    if (!dbUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: dbUser, metrics });
  }
);

// ─── PUT Update Profile ───────────────────────────────────
export const PUT = createHandler(
  { auth: true },
  async ({ request, user }) => {
    const body = await request.json();
    const { name, avatar, preferences, email, username } = body;

    const current = await db.user.findUnique({
      where: { id: user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        preferences: true,
      },
    });

    if (!current) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json({ error: 'الاسم غير صالح' }, { status: 400 });
      }
      updateData.name = name.trim() ? name.trim() : null;
    }
    if (avatar !== undefined) updateData.avatar = avatar;

    if (email !== undefined) {
      if (typeof email !== 'string') {
        return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
      }
      const normalizedEmail = normalizeEmail(email);
      if (!isValidEmail(normalizedEmail)) {
        return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة' }, { status: 400 });
      }

      if (normalizedEmail !== current.email) {
        const existing = await db.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (existing && existing.id !== current.id) {
          return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
        }
      }
      updateData.email = normalizedEmail;
    }

    if (username !== undefined) {
      if (typeof username !== 'string') {
        return NextResponse.json({ error: 'اسم المستخدم غير صالح' }, { status: 400 });
      }
      const normalizedUsername = username.trim();
      if (!normalizedUsername) {
        return NextResponse.json({ error: 'اسم المستخدم مطلوب' }, { status: 400 });
      }

      if (normalizedUsername !== current.username) {
        const validation = validateUsername(normalizedUsername);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error || 'اسم المستخدم غير صالح' }, { status: 400 });
        }

        const existing = await db.user.findUnique({
          where: { username: normalizedUsername },
          select: { id: true },
        });
        if (existing && existing.id !== current.id) {
          return NextResponse.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 409 });
        }
      }
      updateData.username = normalizedUsername;
    }

    if (preferences !== undefined) {
      if (!isObjectRecord(preferences)) {
        return NextResponse.json({ error: 'صيغة الإعدادات غير صحيحة' }, { status: 400 });
      }
      const existingPreferences = isObjectRecord(current.preferences) ? current.preferences : {};
      updateData.preferences = {
        ...existingPreferences,
        ...preferences,
      };
    }

    if (Object.keys(updateData).length === 0) {
      const [profile, metrics] = await Promise.all([
        db.user.findUnique({
          where: { id: user!.id },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            avatar: true,
            preferences: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                portfolios: true,
                watchlists: true,
                alerts: true,
              },
            },
          },
        }),
        getUserProjectMetrics(user!.id),
      ]);
      return NextResponse.json({ success: true, profile, metrics });
    }

    const [updated, metrics] = await Promise.all([
      db.user.update({
        where: { id: user!.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          avatar: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              portfolios: true,
              watchlists: true,
              alerts: true,
            },
          },
        },
      }),
      getUserProjectMetrics(user!.id),
    ]);

    return NextResponse.json({ success: true, profile: updated, metrics });
  }
);
