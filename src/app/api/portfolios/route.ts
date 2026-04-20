import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, UserPayload } from '@/lib/auth';
import { createPortfolioSchema, addStockSchema, addBondSchema, addFundSchema } from '@/lib/validations';
import { createHandler } from '@/lib/api-handler';

function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

function calcPortfolioValue(portfolio: {
  stocks: { qty: number; currentPrice: number | null; buyPrice: number }[];
  bonds: { qty: number; faceValue: number; currentPrice: number | null; buyPrice: number }[];
  funds: { units: number; currentPrice: number | null; buyPrice: number }[];
}) {
  const stocksValue = portfolio.stocks.reduce(
    (sum, stock) => sum + Number(stock.qty) * Number(stock.currentPrice ?? stock.buyPrice),
    0
  );
  const bondsValue = portfolio.bonds.reduce(
    (sum, bond) => sum + Number(bond.qty) * Number(bond.faceValue) * (Number(bond.currentPrice ?? bond.buyPrice) / 100),
    0
  );
  const fundsValue = portfolio.funds.reduce(
    (sum, fund) => sum + Number(fund.units) * Number(fund.currentPrice ?? fund.buyPrice),
    0
  );
  return stocksValue + bondsValue + fundsValue;
}

// ─── GET: List all portfolios ──────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    let userId = user?.id;
    if (!userId) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstUser) return NextResponse.json({ portfolios: [] });
      userId = firstUser.id;
    }

    const portfolios = await db.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        stocks: {
          select: {
            id: true, symbol: true, name: true, sector: true, industry: true,
            qty: true, buyPrice: true, currentPrice: true, change: true, changePct: true,
            totalCost: true, currentValue: true, profitLoss: true, profitLossPct: true,
            buyCurrency: true, buyDate: true, isShariaCompliant: true, week52High: true, week52Low: true,
          },
        },
        bonds: {
          select: {
            id: true, symbol: true, name: true, type: true,
            faceValue: true, couponRate: true, maturityDate: true,
            qty: true, buyPrice: true, currentPrice: true,
          },
        },
        funds: {
          select: {
            id: true, symbol: true, name: true, fundType: true,
            units: true, buyPrice: true, currentPrice: true, ytdReturn: true,
          },
        },
        _count: { select: { stocks: true, bonds: true, funds: true, transactions: true } },
      },
    });

    const enriched = portfolios.map(p => ({
      ...p,
      totalValue: calcPortfolioValue(p),
      stockCount: p._count.stocks,
      bondCount: p._count.bonds,
      fundCount: p._count.funds,
      transactionCount: p._count.transactions,
    }));

    return NextResponse.json({ portfolios: enriched });
  } catch (error) {
    console.error('Get portfolios error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── POST: Create portfolio / Add asset ───────────────────────
export async function POST(request: NextRequest) {
  try {
    let user = await getUserFromRequest(request);
    if (!user) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      user = { id: firstUser.id, username: firstUser.username, role: firstUser.role } as NonNullable<typeof user>;
    }

    const body = await request.json();
    const { action } = body;

    // ── Create Portfolio ──
    if (action === 'create') {
      const parsed = createPortfolioSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'بيانات غير صالحة', details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) },
          { status: 400 }
        );
      }
      const data = parsed.data;

      const portfolio = await db.portfolio.create({
        data: {
          userId: user.id,
          name: data.name,
          description: data.description,
          type: data.type,
          currency: data.currency,
        },
      });

      return NextResponse.json({ success: true, portfolio }, { status: 201 });
    }

    // ── Add Stock ──
    if (action === 'add-stock') {
      const parsed = addStockSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'بيانات غير صالحة', details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) },
          { status: 400 }
        );
      }
      const data = parsed.data;
      const { portfolioId } = body; // extracted from body (not validated by schema)

      if (!portfolioId) return NextResponse.json({ error: 'معرف المحفظة مطلوب' }, { status: 400 });

      // Verify ownership
      const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
      if (!portfolio) return NextResponse.json({ error: 'المحفظة غير موجودة' }, { status: 404 });

      const totalCost = Number(data.qty) * Number(data.buyPrice);
      const stock = await db.stock.create({
        data: {
          portfolioId,
          symbol: data.symbol,
          name: data.name,
          exchangeId: data.exchangeId,
          sector: data.sector,
          industry: data.industry,
          qty: data.qty,
          buyPrice: data.buyPrice,
          buyDate: data.buyDate ? new Date(data.buyDate) : null,
          buyCurrency: data.buyCurrency,
          notes: data.notes,
          totalCost,
        },
      });

      return NextResponse.json({ success: true, stock }, { status: 201 });
    }

    // ── Add Bond ──
    if (action === 'add-bond') {
      const parsed = addBondSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'بيانات غير صالحة', details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) },
          { status: 400 }
        );
      }
      const data = parsed.data;
      const { portfolioId } = body;

      if (!portfolioId) return NextResponse.json({ error: 'معرف المحفظة مطلوب' }, { status: 400 });

      const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
      if (!portfolio) return NextResponse.json({ error: 'المحفظة غير موجودة' }, { status: 404 });

      const bond = await db.bond.create({
        data: {
          portfolioId,
          ...data,
          buyDate: data.buyDate ? new Date(data.buyDate) : null,
          maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
          issueDate: data.issueDate ? new Date(data.issueDate) : null,
        },
      });

      return NextResponse.json({ success: true, bond }, { status: 201 });
    }

    // ── Add Fund ──
    if (action === 'add-fund') {
      const parsed = addFundSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'بيانات غير صالحة', details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) },
          { status: 400 }
        );
      }
      const data = parsed.data;
      const { portfolioId } = body;

      if (!portfolioId) return NextResponse.json({ error: 'معرف المحفظة مطلوب' }, { status: 400 });

      const portfolio = await db.portfolio.findFirst({ where: { id: portfolioId, userId: user.id } });
      if (!portfolio) return NextResponse.json({ error: 'المحفظة غير موجودة' }, { status: 404 });

      const fund = await db.fund.create({
        data: {
          portfolioId,
          ...data,
          buyDate: data.buyDate ? new Date(data.buyDate) : null,
        },
      });

      return NextResponse.json({ success: true, fund }, { status: 201 });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('Post portfolios error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── PUT: Update portfolio ──────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    let user = await getUserFromRequest(request);
    if (!user) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      user = { id: firstUser.id, username: firstUser.username, role: firstUser.role } as NonNullable<typeof user>;
    }

    const body = await request.json();
    const { id, name } = body;
    if (!id) return NextResponse.json({ error: 'معرف المحفظة مطلوب' }, { status: 400 });

    const portfolio = await db.portfolio.findFirst({ where: { id, userId: user.id } });
    if (!portfolio) return NextResponse.json({ error: 'المحفظة غير موجودة' }, { status: 404 });

    const updateData: any = {};
    if (name) updateData.name = name;

    const updated = await db.portfolio.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, portfolio: updated });
  } catch (error) {
    console.error('Put portfolio error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── DELETE: Delete portfolio ───────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    let user = await getUserFromRequest(request);
    if (!user) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstUser) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      user = { id: firstUser.id, username: firstUser.username, role: firstUser.role } as NonNullable<typeof user>;
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'معرف المحفظة مطلوب' }, { status: 400 });

    const portfolio = await db.portfolio.findFirst({ where: { id, userId: user.id } });
    if (!portfolio) return NextResponse.json({ error: 'المحفظة غير موجودة' }, { status: 404 });

    await db.portfolio.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
