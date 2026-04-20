import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-request';
import {
  DEFAULT_MONITORING_ALERT_SETTINGS,
  normalizeMonitoringAlertSettings,
} from '@/lib/monitoring-alerts';
import { withApiTelemetry } from '@/lib/api-telemetry';
import { sendMonitoringTestWebhook } from '@/lib/monitoring-notifier';

const SETTINGS_KEY = 'monitoring_alert_settings';

function scopedSettingKey(userId: string, key: string): string {
  return `user:${userId}:${key}`;
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function requireAdmin(request: NextRequest): { id: string; role: string } | NextResponse {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مسموح' }, { status: 403 });
  }
  return user;
}

async function getAlertSettings(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const key = scopedSettingKey(user.id, SETTINGS_KEY);
    const setting = await db.setting.findUnique({ where: { key } });
    const normalized = setting
      ? normalizeMonitoringAlertSettings(readObject(setting.value))
      : DEFAULT_MONITORING_ALERT_SETTINGS;

    return NextResponse.json({ success: true, settings: normalized });
  } catch (error) {
    console.error('Get monitoring alert settings error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

async function putAlertSettings(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const raw = readObject(body?.settings ?? body);
    if (!raw) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const normalized = normalizeMonitoringAlertSettings(raw);
    const key = scopedSettingKey(user.id, SETTINGS_KEY);

    await db.setting.upsert({
      where: { key },
      create: {
        key,
        value: normalized as unknown as Prisma.InputJsonValue,
        description: 'Monitoring alerts settings (admin)',
      },
      update: {
        value: normalized as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ success: true, settings: normalized });
  } catch (error) {
    console.error('Save monitoring alert settings error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

async function postAlertSettingsTest(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const key = scopedSettingKey(user.id, SETTINGS_KEY);
    const setting = await db.setting.findUnique({ where: { key } });
    let normalized = setting
      ? normalizeMonitoringAlertSettings(readObject(setting.value))
      : DEFAULT_MONITORING_ALERT_SETTINGS;

    const body = await request.json().catch(() => ({}));
    const overrideWebhook = typeof body?.webhookUrl === 'string' ? body.webhookUrl.trim() : '';
    if (overrideWebhook) {
      normalized = {
        ...normalized,
        external: {
          ...normalized.external,
          enabled: true,
          webhookUrl: overrideWebhook,
        },
      };
    }

    if (!normalized.external.enabled || !normalized.external.webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook غير مفعّل أو الرابط غير موجود' },
        { status: 400 }
      );
    }

    await sendMonitoringTestWebhook(normalized);
    return NextResponse.json({ success: true, message: 'تم إرسال رسالة اختبار بنجاح' });
  } catch (error) {
    console.error('Monitoring alert settings test error:', error);
    return NextResponse.json({ error: 'فشل إرسال رسالة الاختبار' }, { status: 500 });
  }
}

export const GET = withApiTelemetry('/api/monitoring/alert-settings', getAlertSettings);
export const PUT = withApiTelemetry('/api/monitoring/alert-settings', putAlertSettings);
export const POST = withApiTelemetry('/api/monitoring/alert-settings', postAlertSettingsTest);
