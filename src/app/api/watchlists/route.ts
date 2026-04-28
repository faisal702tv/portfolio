import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createWatchlistSchema, updateWatchlistSchema, addWatchlistItemSchema } from '@/lib/validations';

function isDbUnavailable(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error ?? '');
  return /connectionfailed|unable to open connection|p1000|p1001|p1017|database/i.test(text.toLowerCase());
}

async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return await verifyToken(authHeader.substring(7));
}

// GET
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    let userId = user?.id;
    if (!userId) {
      const firstUser = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstUser) return NextResponse.json({ watchlists: [] });
      userId = firstUser.id;
    }

    const watchlists = await db.watchlist.findMany({
      where: { userId },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      watchlists: watchlists.map(wl => ({ ...wl, itemCount: wl.items.length })),
    });
  } catch (error) {
    console.error('Get watchlists error:', error);
    if (isDbUnavailable(error)) {
      return NextResponse.json({
        watchlists: [],
        fallback: true,
        reason: 'db_unavailable',
      });
    }
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { action } = body;

    if (action === 'add-item') {
      const parsed = addWatchlistItemSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'بيانات غير صالحة', details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) },
          { status: 400 }
        );
      }
      const data = parsed.data;
      const { watchlistId } = body;
      if (!watchlistId) return NextResponse.json({ error: 'معرف القائمة مطلوب' }, { status: 400 });

      const watchlist = await db.watchlist.findFirst({ where: { id: watchlistId, userId: user.id } });
      if (!watchlist) return NextResponse.json({ error: 'القائمة غير موجودة' }, { status: 404 });

      // Check duplicate
      const existing = await db.watchlistItem.findFirst({ where: { watchlistId, symbol: data.symbol } });
      if (existing) return NextResponse.json({ error: 'السهم موجود بالفعل في القائمة' }, { status: 409 });

      const item = await db.watchlistItem.create({
        data: { watchlistId, ...data },
      });

      return NextResponse.json({ success: true, item }, { status: 201 });
    }

    // Create watchlist
    const parsed = createWatchlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const existingList = await db.watchlist.findFirst({ where: { userId: user.id, name: data.name.trim() } });
    if (existingList) return NextResponse.json({ error: 'لديك قائمة بنفس الاسم بالفعل' }, { status: 409 });

    const watchlist = await db.watchlist.create({
      data: {
        userId: user.id,
        name: data.name.trim(),
        description: data.description?.trim(),
        color: data.color || '#F59E0B',
        isDefault: data.isDefault ?? false,
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, message: 'تم إنشاء القائمة بنجاح', watchlist: { ...watchlist, itemCount: 0 } }, { status: 201 });
  } catch (error) {
    console.error('Create watchlist error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// PUT
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'معرف القائمة مطلوب' }, { status: 400 });

    const parsed = updateWatchlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      );
    }

    const existing = await db.watchlist.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'القائمة غير موجودة' }, { status: 404 });

    const watchlist = await db.watchlist.update({
      where: { id },
      data: {
        name: parsed.data.name?.trim(),
        description: parsed.data.description?.trim(),
        color: parsed.data.color,
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, message: 'تم تحديث القائمة بنجاح', watchlist: { ...watchlist, itemCount: watchlist.items.length } });
  } catch (error) {
    console.error('Update watchlist error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'معرف القائمة مطلوب' }, { status: 400 });

    const existing = await db.watchlist.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'القائمة غير موجودة' }, { status: 404 });
    if (existing.isDefault) return NextResponse.json({ error: 'لا يمكن حذف القائمة الافتراضية' }, { status: 400 });

    await db.watchlist.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'تم حذف القائمة بنجاح' });
  } catch (error) {
    console.error('Delete watchlist error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
