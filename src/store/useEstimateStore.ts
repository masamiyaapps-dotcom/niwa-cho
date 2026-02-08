import { useState, useCallback } from 'react';
import type { Estimate } from '../types/estimate';
import type { PriceMaster } from '../types/master';
import { DEFAULT_PRICE_MASTER } from '../utils/defaultMaster';
import { recalcTotals } from '../utils/calc';
import { generateId } from '../utils/format';

// ─── 新規案件の雛形 ───
export function createEmptyEstimate(title: string = ''): Estimate {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title,
    createdAt: now,
    updatedAt: now,
    items: [],
    options: {
      obstacleChecks: [],
      projectMultiplier: 1.0,
    },
    adjustments: [],
    totals: {
      subtotalExclTax: 0,
      afterProjectMultiplier: 0,
      adjustmentTotal: 0,
      totalExclTax: 0,
      tax: 0,
      totalInclTax: 0,
      totalInclTaxRounded: 0,
    },
  };
}

/**
 * 案件ストア（React state ベース）
 * 将来 Zustand / Dexie に移行しやすいよう hook で抽象化
 */
export function useEstimateStore() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [priceMaster, setPriceMaster] = useState<PriceMaster>(DEFAULT_PRICE_MASTER);

  /** 案件を追加 */
  const addEstimate = useCallback(
    (est: Estimate) => {
      const withTotals = {
        ...est,
        totals: recalcTotals(est, priceMaster.taxRate, priceMaster.roundingRule),
      };
      setEstimates((prev) => [withTotals, ...prev]);
      return withTotals;
    },
    [priceMaster],
  );

  /** 案件を更新 */
  const updateEstimate = useCallback(
    (est: Estimate) => {
      const withTotals = {
        ...est,
        updatedAt: new Date().toISOString(),
        totals: recalcTotals(est, priceMaster.taxRate, priceMaster.roundingRule),
      };
      setEstimates((prev) =>
        prev.map((e) => (e.id === est.id ? withTotals : e)),
      );
      return withTotals;
    },
    [priceMaster],
  );

  /** 案件を削除 */
  const deleteEstimate = useCallback((id: string) => {
    setEstimates((prev) => prev.filter((e) => e.id !== id));
  }, []);

  /** IDで取得 */
  const getEstimate = useCallback(
    (id: string) => estimates.find((e) => e.id === id),
    [estimates],
  );

  /** 案件を複製 */
  const duplicateEstimate = useCallback(
    (id: string) => {
      const original = estimates.find((e) => e.id === id);
      if (!original) return null;
      const now = new Date().toISOString();
      const dup: Estimate = {
        ...original,
        id: generateId(),
        title: `${original.title}（コピー）`,
        createdAt: now,
        updatedAt: now,
      };
      setEstimates((prev) => [dup, ...prev]);
      return dup;
    },
    [estimates],
  );

  return {
    estimates,
    setEstimates,
    priceMaster,
    setPriceMaster,
    addEstimate,
    updateEstimate,
    deleteEstimate,
    getEstimate,
    duplicateEstimate,
  };
}

