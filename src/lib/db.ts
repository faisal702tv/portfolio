import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDbUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  try {
    const cwd = process.cwd()
    return `file:${cwd}/prisma/dev.db`
  } catch {
    return 'file:./prisma/dev.db'
  }
}

function createPrismaClient() {
  const dbUrl = getDbUrl()

  // Prisma 7.x: PrismaLibSql is a factory that takes config, not a pre-created client
  const adapter = new PrismaLibSql({ url: dbUrl })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
