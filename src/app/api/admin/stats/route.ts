import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHandler } from '@/lib/api-handler';

/**
 * Admin stats endpoint - aggregates system-wide metrics.
 * Restricted to admin role only.
 */
export const GET = createHandler(
  { auth: true, roles: ['admin'] },
  async () => {
    try {
      const [
        userCount,
        portfolioCount,
        stockCount,
        bondCount,
        fundCount,
        transactionCount,
        sellCount,
        alertCount,
        activeAlertCount,
        triggeredAlertCount,
        watchlistCount,
        watchlistItemCount,
        notificationCount,
        unreadNotificationCount,
        journalCount,
        stocks,
        bonds,
        funds,
        users,
      ] = await Promise.all([
        db.user.count(),
        db.portfolio.count(),
        db.stock.count(),
        db.bond.count(),
        db.fund.count(),
        db.transaction.count(),
        db.transaction.count({ where: { type: 'sell' } }),
        db.alert.count(),
        db.alert.count({ where: { isActive: true } }),
        db.alert.count({ where: { isTriggered: true } }),
        db.watchlist.count(),
        db.watchlistItem.count(),
        db.notification.count(),
        db.notification.count({ where: { isRead: false } }),
        db.journal.count(),
        db.stock.findMany({
          select: {
            qty: true,
            buyPrice: true,
            currentPrice: true,
            notes: true,
          },
        }),
        db.bond.findMany({
          select: {
            qty: true,
            buyPrice: true,
            currentPrice: true,
            faceValue: true,
          },
        }),
        db.fund.findMany({
          select: {
            units: true,
            buyPrice: true,
            currentPrice: true,
            fundType: true,
          },
        }),
        db.user.findMany({
          select: { role: true },
        }),
      ]);

      // Distinct roles (role groups)
      const roleSet = new Set<string>();
      for (const u of users) {
        if (u.role) roleSet.add(u.role);
      }

      // Classify stocks by exchange stored in notes JSON
      let equitiesCount = 0;
      let cryptoCount = 0;
      let forexCount = 0;
      let stocksInvested = 0;
      let stocksValue = 0;

      for (const s of stocks) {
        const qty = Number(s.qty || 0);
        const buy = Number(s.buyPrice || 0);
        const current = Number(s.currentPrice ?? s.buyPrice ?? 0);
        stocksInvested += qty * buy;
        stocksValue += qty * current;

        let exchange: string | undefined;
        try {
          if (s.notes) {
            const parsed = JSON.parse(s.notes) as { exchange?: string };
            exchange = parsed?.exchange;
          }
        } catch {
          // ignore parse errors
        }

        if (exchange === 'CRYPTO') cryptoCount += 1;
        else if (exchange === 'FOREX') forexCount += 1;
        else equitiesCount += 1;
      }

      // Bonds - use qty * buyPrice for invested, qty * (currentPrice or buyPrice) for value
      let bondsInvested = 0;
      let bondsValue = 0;
      for (const b of bonds) {
        const qty = Number(b.qty || 0);
        const buy = Number(b.buyPrice || 0);
        const current = Number(b.currentPrice ?? b.buyPrice ?? 0);
        bondsInvested += qty * buy;
        bondsValue += qty * current;
      }

      // Funds & commodities
      let fundsInvested = 0;
      let fundsValue = 0;
      let commoditiesCount = 0;
      let plainFundsCount = 0;
      for (const f of funds) {
        const units = Number(f.units || 0);
        const buy = Number(f.buyPrice || 0);
        const current = Number(f.currentPrice ?? f.buyPrice ?? 0);
        fundsInvested += units * buy;
        fundsValue += units * current;
        if (f.fundType === 'commodities') commoditiesCount += 1;
        else plainFundsCount += 1;
      }

      const totalInvested = stocksInvested + bondsInvested + fundsInvested;
      const currentValue = stocksValue + bondsValue + fundsValue;
      const profitLoss = currentValue - totalInvested;
      const profitLossPct = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

      return NextResponse.json({
        success: true,
        system: {
          userCount,
          roleCount: roleSet.size,
          roles: Array.from(roleSet),
          portfolioCount,
          alertCount,
          activeAlertCount,
          triggeredAlertCount,
          watchlistCount,
          watchlistItemCount,
          notificationCount,
          unreadNotificationCount,
          journalCount,
          transactionCount,
        },
        assets: {
          stockCount,
          equitiesCount,
          cryptoCount,
          forexCount,
          bondCount,
          fundCount: plainFundsCount,
          commoditiesCount,
          sellHistoryCount: sellCount,
          totalFundRows: fundCount,
        },
        financial: {
          totalInvested,
          currentValue,
          profitLoss,
          profitLossPct,
          stocksInvested,
          stocksValue,
          bondsInvested,
          bondsValue,
          fundsInvested,
          fundsValue,
        },
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
    }
  }
);
