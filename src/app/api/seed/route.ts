import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Check for seed secret (basic protection)
    const { secret } = await request.json();
    if (secret !== 'portfolio-seed-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create admin owner account
    const hashedPassword = await hashPassword('Admin12345');

    const adminUser = await db.user.upsert({
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

    return NextResponse.json({
      success: true,
      message: 'Admin owner account created/updated',
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
