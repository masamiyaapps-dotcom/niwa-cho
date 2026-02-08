// ─── カテゴリ・作業種別 ───
export type Category = 'TREE' | 'GROUND' | 'DISPOSAL' | 'CUSTOM';

export type TreeWorkType = 'PRUNE' | 'FELL' | 'SPRAY';
export type GroundWorkType = 'WEED_HAND' | 'WEED_MACHINE' | 'HERBICIDE' | 'WEED_SHEET';
export type DisposalWorkType = 'BRANCH_BAG' | 'TRUNK_KG';
export type WorkType = TreeWorkType | GroundWorkType | DisposalWorkType | string;

// 高さ区分
export type HeightClass = 'H3' | 'H4' | 'H5' | 'H7' | 'H9' | 'H11' | 'H13';

export const HEIGHT_CLASS_LABELS: Record<HeightClass, string> = {
  H3: '3m未満',
  H4: '4m',
  H5: '5m',
  H7: '7m',
  H9: '9m',
  H11: '11m',
  H13: '13m',
};

export const TREE_WORK_LABELS: Record<TreeWorkType, string> = {
  PRUNE: '剪定',
  FELL: '伐採',
  SPRAY: '消毒',
};

export const GROUND_WORK_LABELS: Record<GroundWorkType, string> = {
  WEED_HAND: '草むしり',
  WEED_MACHINE: '機械刈り',
  HERBICIDE: '除草剤散布',
  WEED_SHEET: '防草シート貼り',
};

export const DISPOSAL_WORK_LABELS: Record<DisposalWorkType, string> = {
  BRANCH_BAG: '枝葉(45L袋)',
  TRUNK_KG: '幹(kg)',
};

// ─── 明細 ───
export interface EstimateItem {
  id: string;
  category: Category;
  workType: WorkType;
  heightClass?: HeightClass;
  quantity: number;
  unit: string;
  unitPriceExclTax: number;
  lineMultiplier: number; // 既定 1.0
  species?: string; // 樹種（任意）
  note?: string;
}

// ─── 作業環境チェック ───
export type ObstacleCode =
  | 'ROAD'
  | 'LANTERN_FLOWERBED'
  | 'CAVE'
  | 'NEIGHBOR'
  | 'POND'
  | 'SLOPE'
  | 'CLIFF';

export const OBSTACLE_LABELS: Record<ObstacleCode, string> = {
  ROAD: '道路',
  LANTERN_FLOWERBED: '灯籠・花壇等',
  CAVE: '洞窟等',
  NEIGHBOR: '隣地',
  POND: '池',
  SLOPE: '傾斜地・法面',
  CLIFF: '石垣上・崖際',
};

// ─── 案件オプション ───
export interface EstimateOptions {
  obstacleChecks: ObstacleCode[];
  projectMultiplier: number; // 既定 1.0
}

// ─── 調整（追加費用/値引き）───
export interface Adjustment {
  id: string;
  type: 'ADD' | 'DISCOUNT';
  amountExclTax: number;
  reason: string;
}

// ─── 合計（表示用キャッシュ）───
export interface Totals {
  subtotalExclTax: number;
  afterProjectMultiplier: number;
  adjustmentTotal: number;
  totalExclTax: number;
  tax: number;
  totalInclTax: number;
  totalInclTaxRounded: number;
}

// ─── 案件 ───
export interface Estimate {
  id: string;
  title: string;
  address?: string;
  memo?: string;
  scheduledDate?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  items: EstimateItem[];
  options: EstimateOptions;
  adjustments: Adjustment[];
  totals: Totals;
}

// ─── エクスポート形式 ───
export interface EstimateExport {
  version: string;
  exportedAt: string;
  estimates: Estimate[];
}

