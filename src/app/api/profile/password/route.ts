import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import { comparePassword, hashPassword, validatePassword } from '@/lib/auth';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 خانات على الأقل'),
});

export const POST = createHandler(
  { auth: true },
  async ({ request, user }) => {
    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;
    const policy = validatePassword(newPassword);
    if (!policy.valid) {
      return NextResponse.json({ error: policy.error || 'كلمة المرور الجديدة غير صالحة' }, { status: 400 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user!.id },
      select: { id: true, password: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const validCurrent = await comparePassword(currentPassword, dbUser.password);
    if (!validCurrent) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    const repeated = await comparePassword(newPassword, dbUser.password);
    if (repeated) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user!.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  }
);
