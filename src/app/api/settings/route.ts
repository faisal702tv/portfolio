import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/security/encryption';
import { db } from '@/lib/db';
import { z } from 'zod';

const saveApiKeysSchema = z.object({
  keys: z.record(z.string(), z.string().min(1)),
  provider: z.string().optional(),
  model: z.string().optional(),
});

const getApiKeysSchema = z.object({
  provider: z.string().optional(),
});

function userScopedSettingKey(userId: string, suffix: string): string {
  return `user:${userId}:${suffix}`;
}

// ─── GET: Retrieve decrypted API keys ─────────────────────────
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const user = verifyToken(authHeader.substring(7));
  if (!user) {
    return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
  }

  try {
    const scopedPrefix = `user:${user.id}:api_key_`;
    const scopedSettings = await db.setting.findMany({
      where: { key: { startsWith: scopedPrefix } },
    });
    const settings =
      scopedSettings.length > 0
        ? scopedSettings
        : await db.setting.findMany({
            where: { key: { startsWith: 'api_key_' } },
          });

    const keys: Record<string, string> = {};
    for (const setting of settings) {
      try {
        const value = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value);
        const rawKey = setting.key.startsWith(scopedPrefix)
          ? setting.key.slice(scopedPrefix.length)
          : setting.key.replace('api_key_', '');
        keys[rawKey] = decrypt(value);
      } catch {
        // Key might not be encrypted yet (migration), skip
      }
    }

    // Get default provider/model
    const providerSetting =
      (await db.setting.findUnique({
        where: { key: userScopedSettingKey(user.id, 'default_provider') },
      })) ||
      (await db.setting.findUnique({ where: { key: 'default_provider' } }));
    const modelSetting =
      (await db.setting.findUnique({
        where: { key: userScopedSettingKey(user.id, 'default_model') },
      })) ||
      (await db.setting.findUnique({ where: { key: 'default_model' } }));

    return NextResponse.json({
      keys,
      defaultProvider: providerSetting?.value as string || null,
      defaultModel: modelSetting?.value as string || null,
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── POST: Save encrypted API keys ────────────────────────────
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const user = verifyToken(authHeader.substring(7));
  if (!user) {
    return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = saveApiKeysSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    // Encrypt and save each key
    for (const [provider, key] of Object.entries(parsed.data.keys)) {
      const encrypted = encrypt(key);
      await db.setting.upsert({
        where: { key: userScopedSettingKey(user.id, `api_key_${provider}`) },
        create: {
          key: userScopedSettingKey(user.id, `api_key_${provider}`),
          value: encrypted,
          description: `Encrypted API key for ${provider} (user scoped)`,
        },
        update: { value: encrypted },
      });
    }

    // Save default provider/model
    if (parsed.data.provider) {
      await db.setting.upsert({
        where: { key: userScopedSettingKey(user.id, 'default_provider') },
        create: { key: userScopedSettingKey(user.id, 'default_provider'), value: parsed.data.provider },
        update: { value: parsed.data.provider },
      });
    }
    if (parsed.data.model) {
      await db.setting.upsert({
        where: { key: userScopedSettingKey(user.id, 'default_model') },
        create: { key: userScopedSettingKey(user.id, 'default_model'), value: parsed.data.model },
        update: { value: parsed.data.model },
      });
    }

    return NextResponse.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error) {
    console.error('Save API keys error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

// ─── DELETE: Remove an API key ────────────────────────────────
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const user = verifyToken(authHeader.substring(7));
  if (!user) {
    return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (!provider) {
    return NextResponse.json({ error: 'provider مطلوب' }, { status: 400 });
  }

  try {
    await db.setting.deleteMany({
      where: {
        key: userScopedSettingKey(user.id, `api_key_${provider}`),
      },
    });
    return NextResponse.json({ success: true, message: 'تم حذف المفتاح' });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
