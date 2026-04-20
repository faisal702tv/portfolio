import { NextRequest, NextResponse } from 'next/server';
import {
  createUser,
  findUser,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  validateUsername,
  validatePassword,
  comparePassword,
  UserPayload,
} from '@/lib/auth';
import { authSchema, refreshTokenSchema } from '@/lib/validations';
import { db } from '@/lib/db';
import { createPublicHandler } from '@/lib/api-handler';

export const POST = createPublicHandler(
  { rateLimit: { windowMs: 60_000, maxRequests: 10 } },
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const parsed = authSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'بيانات غير صالحة', details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })) },
          { status: 400 }
        );
      }

      const data = parsed.data;

      // ─── Login ──────────────────────────────────────────
      if (data.action === 'login') {
        const user = await findUser(data.email);
        if (!user) {
          return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
        }

        const isValidPassword = await comparePassword(data.password, user.password);
        if (!isValidPassword) {
          return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
        }

        const payload: UserPayload = {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
        };

        const accessToken = generateToken(payload);
        const refreshToken = generateRefreshToken(user.id);

        return NextResponse.json({
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          user: payload,
          token: accessToken,
          refreshToken,
        });
      }

      // ─── Register ──────────────────────────────────────
      if (data.action === 'register') {
        const usernameValidation = validateUsername(data.username);
        if (!usernameValidation.valid) {
          return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
        }

        const passwordValidation = validatePassword(data.password);
        if (!passwordValidation.valid) {
          return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
        }

        const existingEmail = await db.user.findUnique({ where: { email: data.email } });
        if (existingEmail) {
          return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
        }

        const existingUsername = await db.user.findUnique({ where: { username: data.username } });
        if (existingUsername) {
          return NextResponse.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 409 });
        }

        const user = await createUser({
          email: data.email,
          username: data.username,
          password: data.password,
          name: data.name,
        });

        // Create default watchlist
        await db.watchlist.create({
          data: {
            userId: user.id,
            name: 'قائمة المتابعة',
            description: 'القائمة الافتراضية للمتابعة',
            isDefault: true,
          },
        });

        const payload: UserPayload = {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
        };

        const accessToken = generateToken(payload);
        const refreshToken = generateRefreshToken(user.id);

        return NextResponse.json(
          { success: true, message: 'تم إنشاء الحساب بنجاح', user: payload, token: accessToken, refreshToken },
          { status: 201 }
        );
      }
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { error: process.env.NODE_ENV === 'production' ? 'حدث خطأ في الخادم' : (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  }
);

// ─── Refresh Token ─────────────────────────────────────────────
export const PUT = createPublicHandler(
  { rateLimit: { windowMs: 60_000, maxRequests: 30 } },
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const parsed = refreshTokenSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
      }

      const decoded = verifyRefreshToken(parsed.data.refreshToken);
      if (!decoded) {
        return NextResponse.json({ error: 'رمز التجديد غير صالح أو منتهي الصلاحية' }, { status: 401 });
      }

      const user = await db.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 401 });
      }

      const payload: UserPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
      };

      const newAccessToken = generateToken(payload);
      const newRefreshToken = generateRefreshToken(user.id);

      return NextResponse.json({
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
    }
  }
);

// ─── Get Current User ──────────────────────────────────────────
export const GET = createPublicHandler(async (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    return NextResponse.json({ user: payload });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
});
