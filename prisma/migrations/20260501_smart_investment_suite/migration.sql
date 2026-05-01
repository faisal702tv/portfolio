-- Smart Investment Suite migration
-- Adds target allocation support and performance-focused composite indexes.

-- 1) Portfolio target allocation (flexible JSON storage)
ALTER TABLE "portfolios"
ADD COLUMN IF NOT EXISTS "targetAllocation" JSONB;

-- 2) Composite indexes for heavy analytics queries
CREATE INDEX IF NOT EXISTS "user_earnings_records_userId_symbol_announcementDate_idx"
ON "user_earnings_records"("userId", "symbol", "announcementDate");

CREATE INDEX IF NOT EXISTS "user_corporate_action_records_userId_symbol_effectiveDate_idx"
ON "user_corporate_action_records"("userId", "symbol", "effectiveDate");

CREATE INDEX IF NOT EXISTS "portfolios_userId_createdAt_idx"
ON "portfolios"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "transactions_portfolioId_assetSymbol_date_idx"
ON "transactions"("portfolioId", "assetSymbol", "date");
