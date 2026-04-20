'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PortfolioOption, PortfolioSnapshot } from '@/lib/export-utils';
import { buildDemoSnapshot, fetchPortfolioSnapshot, persistPortfolioSnapshot } from '@/lib/export-utils';

interface UsePortfolioSnapshotReturn {
  snapshot: PortfolioSnapshot | null;
  portfolios: PortfolioOption[];
  selectedPortfolioId: string | null;
  setSelectedPortfolioId: (portfolioId: string) => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (next: PortfolioSnapshot) => Promise<boolean>;
}

const SELECTED_PORTFOLIO_KEY = 'selected_portfolio_id';

function readSelectedPortfolioId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_PORTFOLIO_KEY);
}

function writeSelectedPortfolioId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (!id) {
    localStorage.removeItem(SELECTED_PORTFOLIO_KEY);
    return;
  }
  localStorage.setItem(SELECTED_PORTFOLIO_KEY, id);
}

export function usePortfolioSnapshot(): UsePortfolioSnapshotReturn {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioIdState] = useState<string | null>(() => readSelectedPortfolioId());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortfolioSnapshot(selectedPortfolioId ?? undefined);
      setSnapshot(data.snapshot ?? buildDemoSnapshot());
      const options = data.portfolios.length
        ? data.portfolios
        : [
            {
              id: data.snapshot?.portfolioId ?? 'demo',
              name: data.snapshot?.portfolioName ?? 'المحفظة التجريبية',
              isActive: true,
              currency: data.snapshot?.currency ?? 'SAR',
            },
          ];
      setPortfolios(options);
      const hasSelected = selectedPortfolioId ? options.some((option) => option.id === selectedPortfolioId) : false;
      if (!hasSelected) {
        const fallbackId = options[0]?.id ?? null;
        setSelectedPortfolioIdState(fallbackId);
        writeSelectedPortfolioId(fallbackId);
      }
    } catch (err) {
      setSnapshot(buildDemoSnapshot());
      setPortfolios([
        {
          id: buildDemoSnapshot().portfolioId ?? 'demo',
          name: buildDemoSnapshot().portfolioName,
          isActive: true,
          currency: buildDemoSnapshot().currency,
        },
      ]);
      setError(err instanceof Error ? err.message : 'فشل في تحميل بيانات المحفظة');
    } finally {
      setLoading(false);
    }
  }, [selectedPortfolioId]);

  const save = useCallback(async (next: PortfolioSnapshot) => {
    setSaving(true);
    setError(null);
    setSnapshot(next);
    try {
      const result = await persistPortfolioSnapshot(next, selectedPortfolioId ?? undefined);
      if (result.snapshot) {
        setSnapshot(result.snapshot);
      }
      if (result.portfolios && result.portfolios.length > 0) {
        setPortfolios(result.portfolios);
      }
      if (!result.ok) {
        setError('تم التعديل محليًا فقط. سجل الدخول للحفظ في قاعدة البيانات.');
      }
      return result.ok;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ البيانات');
      return false;
    } finally {
      setSaving(false);
    }
  }, [selectedPortfolioId]);

  const setSelectedPortfolioId = useCallback((portfolioId: string) => {
    setSelectedPortfolioIdState(portfolioId);
    writeSelectedPortfolioId(portfolioId);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    snapshot,
    portfolios,
    selectedPortfolioId,
    setSelectedPortfolioId,
    loading,
    saving,
    error,
    reload,
    save,
  };
}
