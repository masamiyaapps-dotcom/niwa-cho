import type { HeightClass, ObstacleCode, TreeWorkType } from './estimate';

// ─── 丸めルール ───
export type RoundingRule = 'NONE' | 'ROUND_10' | 'ROUND_100';

export const ROUNDING_LABELS: Record<RoundingRule, string> = {
  NONE: 'なし',
  ROUND_10: '10円単位',
  ROUND_100: '100円単位',
};

// ─── 木の単価 ───
export interface TreePrice {
  workType: TreeWorkType;
  heightClass: HeightClass;
  priceExclTax: number;
}

// ─── 除草単価 ───
export interface GroundPrice {
  workType: 'WEED_HAND' | 'WEED_MACHINE';
  pricePerUnit: number; // 税抜 / ㎡
}

// ─── 処分単価 ───
export interface DisposalPrice {
  workType: 'BRANCH_BAG' | 'TRUNK_KG';
  pricePerUnit: number; // 税抜
}

// ─── 障害物倍率マスタ ───
export interface ObstacleMultiplier {
  code: ObstacleCode;
  recommendedMultiplier: number;
  minMultiplier: number;
  maxMultiplier: number;
}

// ─── 追加費用テンプレート ───
export interface AdjustmentTemplate {
  id: string;
  label: string;
  defaultAmountExclTax: number;
  type: 'ADD' | 'DISCOUNT';
}

// ─── 単価マスタ ───
export interface PriceMaster {
  version: string;
  taxRate: number; // 例: 0.10
  roundingRule: RoundingRule;
  treePrices: TreePrice[];
  groundPrices: GroundPrice[];
  disposalPrices: DisposalPrice[];
  obstacleMultipliers: ObstacleMultiplier[];
  adjustmentTemplates: AdjustmentTemplate[];
}

