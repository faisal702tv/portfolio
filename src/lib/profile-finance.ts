import { convertCurrency } from '@/lib/helpers';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function toValidPositiveNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
}

export function parseActualInvestedCapitalSar(preferences: unknown): number | null {
  const root = asRecord(preferences);
  const nestedPreferences = asRecord(root.preferences);

  const direct = toValidPositiveNumber(root.actualInvestedCapitalSar);
  if (direct !== null) return direct;

  const nested = toValidPositiveNumber(nestedPreferences.actualInvestedCapitalSar);
  if (nested !== null) return nested;

  return null;
}

export function parseProfileDefaultCurrency(preferences: unknown, fallback = 'SAR'): string {
  const root = asRecord(preferences);
  const nestedPreferences = asRecord(root.preferences);
  const candidate = nestedPreferences.defaultCurrency || root.defaultCurrency || fallback;
  return String(candidate || fallback).toUpperCase();
}

export function convertSarToCurrency(amountSar: number, currency: string): number {
  return convertCurrency(amountSar, 'SAR', currency || 'SAR');
}

