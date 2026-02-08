import type { Estimate, Totals } from '../types/estimate';
import type { RoundingRule } from '../types/master';

/** 明細の税抜金額 */
export function calcLineAmount(
  quantity: number,
  unitPriceExclTax: number,
  lineMultiplier: number,
): number {
  return quantity * unitPriceExclTax * lineMultiplier;
}

/** 丸め処理 */
export function applyRounding(value: number, rule: RoundingRule): number {
  switch (rule) {
    case 'ROUND_10':
      return Math.ceil(value / 10) * 10;
    case 'ROUND_100':
      return Math.ceil(value / 100) * 100;
    case 'NONE':
    default:
      return Math.ceil(value); // 小数は常に切り上げ
  }
}

/** 案件の合計を再計算 */
export function recalcTotals(
  estimate: Estimate,
  taxRate: number,
  roundingRule: RoundingRule,
): Totals {
  // 小計税抜 = Σ 明細税抜
  const subtotalExclTax = estimate.items.reduce(
    (sum, item) =>
      sum + calcLineAmount(item.quantity, item.unitPriceExclTax, item.lineMultiplier),
    0,
  );

  // 案件倍率適用
  const afterProjectMultiplier =
    subtotalExclTax * estimate.options.projectMultiplier;

  // 調整合計
  const adjustmentTotal = estimate.adjustments.reduce(
    (sum, adj) => sum + adj.amountExclTax,
    0,
  );

  // 合計税抜
  const totalExclTax = afterProjectMultiplier + adjustmentTotal;

  // 消費税
  const tax = totalExclTax * taxRate;

  // 合計税込
  const totalInclTax = totalExclTax + tax;

  // 丸め適用
  const totalInclTaxRounded = applyRounding(totalInclTax, roundingRule);

  return {
    subtotalExclTax,
    afterProjectMultiplier,
    adjustmentTotal,
    totalExclTax,
    tax,
    totalInclTax,
    totalInclTaxRounded,
  };
}

