import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Helper to get user from token
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// GET - Get single watchlist with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const watchlist = await db.watchlist.findFirst({
      where: { id, userId: user.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'القائمة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({
      watchlist: {
        ...watchlist,
        itemCount: watchlist.items.length,
      },
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// POST - Add item to watchlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id: watchlistId } = await params;
    const body = await request.json();
    const { symbol, name, market, marketFlag, price, change, changePct, targetPrice, alertAbove, alertBelow, notes } = body;

    if (!symbol) {
      return NextResponse.json({ error: 'رمز السهم مطلوب' }, { status: 400 });
    }

    // Check if watchlist belongs to user
    const watchlist = await db.watchlist.findFirst({
      where: { id: watchlistId, userId: user.id },
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'القائمة غير موجودة' }, { status: 404 });
    }

    // Check if item already exists in this watchlist
    const existingItem = await db.watchlistItem.findFirst({
      where: { watchlistId, symbol },
    });

    if (existingItem) {
      return NextResponse.json({ error: 'السهم موجود بالفعل في هذه القائمة' }, { status: 400 });
    }

    // Get max order for this watchlist
    const maxOrderItem = await db.watchlistItem.findFirst({
      where: { watchlistId },
      orderBy: { order: 'desc' },
    });

    const newItem = await db.watchlistItem.create({
      data: {
        watchlistId,
        symbol,
        name,
        market,
        marketFlag,
        price,
        change,
        changePct,
        targetPrice,
        alertAbove,
        alertBelow,
        notes,
        order: (maxOrderItem?.order || 0) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تمت إضافة السهم بنجاح',
      item: newItem,
    });
  } catch (error) {
    console.error('Add watchlist item error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// PUT - Update item in watchlist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id: watchlistId } = await params;
    const body = await request.json();
    const { itemId, targetPrice, alertAbove, alertBelow, notes, order } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'معرف السهم مطلوب' }, { status: 400 });
    }

    // Check if watchlist belongs to user
    const watchlist = await db.watchlist.findFirst({
      where: { id: watchlistId, userId: user.id },
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'القائمة غير موجودة' }, { status: 404 });
    }

    // Check if item belongs to this watchlist
    const existingItem = await db.watchlistItem.findFirst({
      where: { id: itemId, watchlistId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'السهم غير موجود في القائمة' }, { status: 404 });
    }

    const updatedItem = await db.watchlistItem.update({
      where: { id: itemId },
      data: {
        targetPrice,
        alertAbove,
        alertBelow,
        notes,
        order,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث السهم بنجاح',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Update watchlist item error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE - Remove item from watchlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id: watchlistId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'معرف السهم مطلوب' }, { status: 400 });
    }

    // Check if watchlist belongs to user
    const watchlist = await db.watchlist.findFirst({
      where: { id: watchlistId, userId: user.id },
    });

    if (!watchlist) {
      return NextResponse.json({ error: 'القائمة غير موجودة' }, { status: 404 });
    }

    // Check if item belongs to this watchlist
    const existingItem = await db.watchlistItem.findFirst({
      where: { id: itemId, watchlistId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'السهم غير موجود في القائمة' }, { status: 404 });
    }

    await db.watchlistItem.delete({ where: { id: itemId } });

    return NextResponse.json({
      success: true,
      message: 'تم حذف السهم من القائمة',
    });
  } catch (error) {
    console.error('Delete watchlist item error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
