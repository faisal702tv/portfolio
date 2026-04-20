import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

async function getOrCreatePortfolio(userId: string, portfolioId?: string | null) {
  if (portfolioId) {
    const selected = await db.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: { stocks: true, bonds: true, funds: true, transactions: true },
    });
    if (selected) return selected;
  }

  let portfolio = await db.portfolio.findFirst({
    where: { userId, isActive: true },
    include: { stocks: true, bonds: true, funds: true, transactions: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!portfolio) {
    portfolio = await db.portfolio.findFirst({
      where: { userId },
      include: { stocks: true, bonds: true, funds: true, transactions: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!portfolio) {
    portfolio = await db.portfolio.create({
      data: {
        userId,
        name: 'المحفظة الرئيسية',
        type: 'mixed',
        currency: 'SAR',
        isActive: true,
      },
      include: { stocks: true, bonds: true, funds: true, transactions: true },
    });
  }

  return portfolio;
}

function toSnapshot(portfolio: Awaited<ReturnType<typeof getOrCreatePortfolio>>) {
  const parseMeta = (raw: string | null | undefined) => {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  return {
    portfolioId: portfolio.id,
    portfolioName: portfolio.name,
    currency: portfolio.currency,
    exportedAt: new Date().toISOString(),
    stocks: portfolio.stocks.map((stock) => {
      const stockMeta = parseMeta(stock.notes) as Record<string, unknown>;
      return {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        exchange: (stockMeta.exchange as string | undefined) ?? undefined,
        sector: stock.sector ?? undefined,
        type: stock.industry ?? undefined,
        qty: Number(stock.qty),
        buyPrice: Number(stock.buyPrice),
        currentPrice: stock.currentPrice ?? undefined,
        buyDate: stock.buyDate ? stock.buyDate.toISOString().split('T')[0] : undefined,
        currency: stock.buyCurrency ?? undefined,
        high52w: stock.week52High != null ? Number(stock.week52High) : undefined,
        low52w: stock.week52Low != null ? Number(stock.week52Low) : undefined,
        shariaStatus: stock.shariaStatus ?? undefined,
        shariaBilad: stockMeta.shariaBilad as string | undefined,
        shariaRajhi: stockMeta.shariaRajhi as string | undefined,
        shariaMaqasid: stockMeta.shariaMaqasid as string | undefined,
        shariaZero: stockMeta.shariaZero as string | undefined,
        customBrok: stockMeta.customBrok as string | number | undefined,
        customVat: stockMeta.customVat as string | number | undefined,
        editReason: stockMeta.editReason as string | undefined,
        lastEditedAt: stockMeta.lastEditedAt as string | undefined,
      };
    }),
    bonds: portfolio.bonds.map((bond) => {
      const bondMeta = parseMeta(bond.notes) as Record<string, unknown>;
      return {
        id: bond.id,
        symbol: bond.symbol,
        name: bond.name,
        type: (bond.type === 'sukuk' ? 'sukuk' : 'bond') as 'sukuk' | 'bond',
        exchange: bond.issuer ?? undefined,
        currency: bondMeta.currency as string | undefined,
        faceValue: bond.faceValue ?? undefined,
        couponRate: bond.couponRate ?? undefined,
        maturityDate: bond.maturityDate ? bond.maturityDate.toISOString() : undefined,
        qty: Number(bond.qty),
        buyPrice: Number(bond.buyPrice),
        currentPrice: bond.currentPrice ?? undefined,
        buyDate: bond.buyDate ? bond.buyDate.toISOString().split('T')[0] : undefined,
        shariaStatus: bondMeta.shariaStatus as string | undefined,
        shariaBilad: bondMeta.shariaBilad as string | undefined,
        shariaRajhi: bondMeta.shariaRajhi as string | undefined,
        shariaMaqasid: bondMeta.shariaMaqasid as string | undefined,
        shariaZero: bondMeta.shariaZero as string | undefined,
        editReason: bondMeta.editReason as string | undefined,
        lastEditedAt: bondMeta.lastEditedAt as string | undefined,
      };
    }),
    funds: portfolio.funds.map((fund) => {
      const fundMeta = parseMeta(fund.notes) as Record<string, unknown>;
      return {
        id: fund.id,
        symbol: fund.symbol ?? undefined,
        name: fund.name,
        fundType: fund.fundType ?? undefined,
        exchange: fundMeta.exchange as string | undefined,
        currency: fundMeta.currency as string | undefined,
        sector: fundMeta.sector as string | undefined,
        units: Number(fund.units),
        buyPrice: Number(fund.buyPrice),
        currentPrice: fund.currentPrice ?? undefined,
        buyDate: fund.buyDate ? fund.buyDate.toISOString().split('T')[0] : undefined,
        shariaStatus: fundMeta.shariaStatus as string | undefined,
        shariaBilad: fundMeta.shariaBilad as string | undefined,
        shariaRajhi: fundMeta.shariaRajhi as string | undefined,
        shariaMaqasid: fundMeta.shariaMaqasid as string | undefined,
        shariaZero: fundMeta.shariaZero as string | undefined,
        customBrok: fundMeta.customBrok as string | number | undefined,
        customVat: fundMeta.customVat as string | number | undefined,
        editReason: fundMeta.editReason as string | undefined,
        lastEditedAt: fundMeta.lastEditedAt as string | undefined,
      };
    }),
    sellHistory: portfolio.transactions
      .filter((tx) => tx.type === 'sell')
      .map((tx) => {
        const notesMeta = parseMeta(tx.notes) as Record<string, any>;
        return {
          id: notesMeta.id ?? tx.id,
          symbol: tx.assetSymbol,
          name: tx.assetName,
          assetType: tx.assetType as any,
          qty: Number(tx.qty),
          buyPrice: Number(notesMeta.buyPrice ?? 0),
          sellPrice: Number(tx.price),
          buyDate: notesMeta.buyDate ?? undefined,
          sellDate: tx.date.toISOString(),
          profitLoss: Number(tx.profitLoss ?? 0),
          profitLossPct: Number(tx.profitLossPct ?? 0),
          fees: tx.fees !== null ? Number(tx.fees) : undefined,
          purificationPct: notesMeta.purificationPct !== undefined ? Number(notesMeta.purificationPct) : undefined,
          purificationAmount: notesMeta.purificationAmount !== undefined ? Number(notesMeta.purificationAmount) : undefined,
          interestIncomeToRevenuePct: notesMeta.interestIncomeToRevenuePct !== undefined ? Number(notesMeta.interestIncomeToRevenuePct) : undefined,
          debtToMarketCapPct: notesMeta.debtToMarketCapPct !== undefined ? Number(notesMeta.debtToMarketCapPct) : undefined,
          currency: notesMeta.currency ?? undefined,
          exchange: notesMeta.exchange ?? undefined,
          editReason: notesMeta.editReason ?? undefined,
          high52w: notesMeta.high52w !== undefined ? Number(notesMeta.high52w) : undefined,
          low52w: notesMeta.low52w !== undefined ? Number(notesMeta.low52w) : undefined,
        };
      }),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    let userId = user?.id;
    if (!userId) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstUser) return NextResponse.json({ error: 'لا يوجد مستخدم' }, { status: 404 });
      userId = firstUser.id;
    }

    const { searchParams } = new URL(request.url);
    const selectedPortfolioId = searchParams.get('portfolioId');
    const portfolio = await getOrCreatePortfolio(userId, selectedPortfolioId);
    const portfolios = await db.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        isActive: true,
        currency: true,
      },
    });
    return NextResponse.json({
      success: true,
      snapshot: toSnapshot(portfolio),
      portfolios,
    });
  } catch (error) {
    console.error('Portfolio backup GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    let effectiveUserId = authUser?.id;
    if (!effectiveUserId) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstUser) {
        return NextResponse.json({ error: 'لا يوجد مستخدم' }, { status: 404 });
      }
      effectiveUserId = firstUser.id;
    }

    const body = await request.json();
    const snapshot = body?.snapshot;
    const selectedPortfolioId = body?.portfolioId ?? null;
    if (!snapshot || typeof snapshot !== 'object') {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const portfolio = await getOrCreatePortfolio(effectiveUserId, selectedPortfolioId);

    const stocks = Array.isArray(snapshot.stocks) ? snapshot.stocks : [];
    const bonds = Array.isArray(snapshot.bonds) ? snapshot.bonds : [];
    const funds = Array.isArray(snapshot.funds) ? snapshot.funds : [];
    const sellHistory = Array.isArray(snapshot.sellHistory) ? snapshot.sellHistory : [];

    await db.$transaction(async (tx) => {
      const buildMeta = (meta: Record<string, unknown>) => {
        const entries = Object.entries(meta).filter(([, value]) => value !== undefined && value !== null && value !== '');
        if (entries.length === 0) return null;
        return JSON.stringify(Object.fromEntries(entries));
      };

      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: {
          name: String(snapshot.portfolioName || portfolio.name),
          currency: String(snapshot.currency || portfolio.currency),
        },
      });

      await tx.stock.deleteMany({ where: { portfolioId: portfolio.id } });
      await tx.bond.deleteMany({ where: { portfolioId: portfolio.id } });
      await tx.fund.deleteMany({ where: { portfolioId: portfolio.id } });
      await tx.transaction.deleteMany({ where: { portfolioId: portfolio.id, type: 'sell' } });

      if (stocks.length > 0) {
        await tx.stock.createMany({
          data: stocks.map((stock: any) => {
            const qty = Number(stock.qty || 0);
            const buyPrice = Number(stock.buyPrice || 0);
            const currentPrice =
              stock.currentPrice === null || stock.currentPrice === undefined
                ? buyPrice
                : Number(stock.currentPrice);
            const totalCost = qty * buyPrice;
            const currentValue = qty * currentPrice;
            const profitLoss = currentValue - totalCost;
            const profitLossPct = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

            return {
              portfolioId: portfolio.id,
              symbol: String(stock.symbol || ''),
              name: String(stock.name || ''),
              sector: stock.sector ? String(stock.sector) : null,
              industry: stock.type ? String(stock.type) : null,
              qty,
              buyPrice,
              currentPrice,
              totalCost,
              currentValue,
              profitLoss,
              profitLossPct,
              buyDate: stock.buyDate ? new Date(stock.buyDate) : null,
              buyCurrency: stock.currency ? String(stock.currency) : 'SAR',
              week52High: stock.high52w != null ? Number(stock.high52w) : null,
              week52Low: stock.low52w != null ? Number(stock.low52w) : null,
              shariaStatus: stock.shariaStatus ? String(stock.shariaStatus) : null,
              notes: buildMeta({
                exchange: stock.exchange ? String(stock.exchange) : undefined,
                shariaBilad: stock.shariaBilad ? String(stock.shariaBilad) : undefined,
                shariaRajhi: stock.shariaRajhi ? String(stock.shariaRajhi) : undefined,
                shariaMaqasid: stock.shariaMaqasid ? String(stock.shariaMaqasid) : undefined,
                shariaZero: stock.shariaZero ? String(stock.shariaZero) : undefined,
                customBrok: stock.customBrok != null ? String(stock.customBrok) : undefined,
                customVat: stock.customVat != null ? String(stock.customVat) : undefined,
                editReason: stock.editReason ? String(stock.editReason) : undefined,
                lastEditedAt: stock.lastEditedAt ? String(stock.lastEditedAt) : undefined,
              }),
            };
          }),
        });
      }

      if (bonds.length > 0) {
        await tx.bond.createMany({
          data: bonds.map((bond: any) => ({
            portfolioId: portfolio.id,
            symbol: String(bond.symbol || ''),
            name: String(bond.name || ''),
            issuer: bond.exchange ? String(bond.exchange) : null,
            type: bond.type === 'sukuk' ? 'sukuk' : 'bond',
            faceValue: Number(bond.faceValue || 0),
            couponRate:
              bond.couponRate === null || bond.couponRate === undefined
                ? null
                : Number(bond.couponRate),
            maturityDate: bond.maturityDate ? new Date(bond.maturityDate) : null,
            qty: Number(bond.qty || 0),
            buyPrice: Number(bond.buyPrice || 0),
            currentPrice:
              bond.currentPrice === null || bond.currentPrice === undefined
                ? null
                : Number(bond.currentPrice),
            buyDate: bond.buyDate ? new Date(bond.buyDate) : null,
            notes: buildMeta({
              currency: bond.currency ? String(bond.currency) : undefined,
              shariaStatus: bond.shariaStatus ? String(bond.shariaStatus) : undefined,
              shariaBilad: bond.shariaBilad ? String(bond.shariaBilad) : undefined,
              shariaRajhi: bond.shariaRajhi ? String(bond.shariaRajhi) : undefined,
              shariaMaqasid: bond.shariaMaqasid ? String(bond.shariaMaqasid) : undefined,
              shariaZero: bond.shariaZero ? String(bond.shariaZero) : undefined,
              editReason: bond.editReason ? String(bond.editReason) : undefined,
              lastEditedAt: bond.lastEditedAt ? String(bond.lastEditedAt) : undefined,
            }),
          })),
        });
      }

      if (funds.length > 0) {
        await tx.fund.createMany({
          data: funds.map((fund: any) => ({
            portfolioId: portfolio.id,
            symbol: fund.symbol ? String(fund.symbol) : null,
            name: String(fund.name || ''),
            fundType: fund.fundType ? String(fund.fundType) : null,
            units: Number(fund.units || 0),
            buyPrice: Number(fund.buyPrice || 0),
            currentPrice:
              fund.currentPrice === null || fund.currentPrice === undefined
                ? null
                : Number(fund.currentPrice),
            buyDate: fund.buyDate ? new Date(fund.buyDate) : null,
            notes: buildMeta({
              exchange: fund.exchange ? String(fund.exchange) : undefined,
              sector: fund.sector ? String(fund.sector) : undefined,
              currency: fund.currency ? String(fund.currency) : undefined,
              shariaStatus: fund.shariaStatus ? String(fund.shariaStatus) : undefined,
              shariaBilad: fund.shariaBilad ? String(fund.shariaBilad) : undefined,
              shariaRajhi: fund.shariaRajhi ? String(fund.shariaRajhi) : undefined,
              shariaMaqasid: fund.shariaMaqasid ? String(fund.shariaMaqasid) : undefined,
              shariaZero: fund.shariaZero ? String(fund.shariaZero) : undefined,
              customBrok: fund.customBrok != null ? String(fund.customBrok) : undefined,
              customVat: fund.customVat != null ? String(fund.customVat) : undefined,
              editReason: fund.editReason ? String(fund.editReason) : undefined,
              lastEditedAt: fund.lastEditedAt ? String(fund.lastEditedAt) : undefined,
            }),
          })),
        });
      }

      if (sellHistory.length > 0) {
        await tx.transaction.createMany({
          data: sellHistory.map((sell: any) => {
            const qty = Number(sell.qty || 0);
            const sellPrice = Number(sell.sellPrice || 0);
            const total = qty * sellPrice;
            
            return {
              portfolioId: portfolio.id,
              type: 'sell',
              assetType: String(sell.assetType || 'stock'),
              assetSymbol: String(sell.symbol || ''),
              assetName: String(sell.name || ''),
              qty,
              price: sellPrice,
              total,
              fees: sell.fees != null ? Number(sell.fees) : null,
              profitLoss: sell.profitLoss != null ? Number(sell.profitLoss) : null,
                profitLossPct: sell.profitLossPct != null ? Number(sell.profitLossPct) : null,
                date: sell.sellDate ? new Date(sell.sellDate) : new Date(),
                notes: buildMeta({
                  id: sell.id ? String(sell.id) : undefined,
                  buyPrice: sell.buyPrice != null ? Number(sell.buyPrice) : undefined,
                  buyDate: sell.buyDate ? String(sell.buyDate) : undefined,
                  purificationPct: sell.purificationPct != null ? Number(sell.purificationPct) : undefined,
                  purificationAmount: sell.purificationAmount != null ? Number(sell.purificationAmount) : undefined,
                  interestIncomeToRevenuePct: sell.interestIncomeToRevenuePct != null ? Number(sell.interestIncomeToRevenuePct) : undefined,
                  debtToMarketCapPct: sell.debtToMarketCapPct != null ? Number(sell.debtToMarketCapPct) : undefined,
                  currency: sell.currency ? String(sell.currency) : undefined,
                  exchange: sell.exchange ? String(sell.exchange) : undefined,
                  editReason: sell.editReason ? String(sell.editReason) : undefined,
                  high52w: sell.high52w != null ? Number(sell.high52w) : undefined,
                  low52w: sell.low52w != null ? Number(sell.low52w) : undefined,
              }),
            };
          }),
        });
      }
    });

    const updated = await getOrCreatePortfolio(effectiveUserId, portfolio.id);
    const portfolios = await db.portfolio.findMany({
      where: { userId: effectiveUserId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        isActive: true,
        currency: true,
      },
    });
    return NextResponse.json({
      success: true,
      message: 'تم حفظ النسخة الاحتياطية في قاعدة البيانات',
      snapshot: toSnapshot(updated),
      portfolios,
    });
  } catch (error) {
    console.error('Portfolio backup PUT error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
