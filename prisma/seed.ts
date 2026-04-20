import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.DATABASE_URL || `file:/Users/faisalmohammed/Desktop/portfolio/prisma/dev.db`;
console.log('Using DB URL:', dbUrl);

const libsql = createClient({ url: dbUrl });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaLibSql(libsql as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const SALT_ROUNDS = 12;

  // Admin owner account
  const hashedPassword = await bcrypt.hash('Admin12345', SALT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { username: 'adminowner' },
    update: {
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      email: 'admin@portfolio.sa',
      username: 'adminowner',
      password: hashedPassword,
      name: 'مالك النظام',
      role: 'admin',
    },
  });

  console.log('✅ Admin owner account created/updated:', {
    id: adminUser.id,
    username: adminUser.username,
    email: adminUser.email,
    role: adminUser.role,
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
