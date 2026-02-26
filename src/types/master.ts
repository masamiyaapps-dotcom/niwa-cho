import type { HeightClass, ObstacleCode, TreeWorkType, GroundWorkType } from './estimate';

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
  workType: GroundWorkType;
  pricePerUnit: number; // 税抜 / ㎡
}

// ─── 処分単価 ───
export interface DisposalPrice {
  workType: 'TRUCK_FULL' | 'TRUCK_HALF';
  pricePerUnit: number; // 税抜
}

// ─── 障害物倍率マスタ ───
export interface ObstacleMultiplier {
  code: ObstacleCode;
  recommendedMultiplier: number;
  minMultiplier: number;
  maxMultiplier: number;
}

// ─── 樹種倍率マスタ ───
export type TreeSpeciesCode =
  | 'PINE_MAINTAINED'           // 黒松赤松(手入れ)
  | 'MAKI_MAINTAINED'            // マキ(手入れ)
  | 'BAMBOO_MOSO'                // 孟宗竹
  | 'BAMBOO_MADAKE'              // 真竹
  | 'BAMBOO_HACHIKU'             // 淡竹(ﾊﾁｸ)
  | 'BAMBOO_MEDAKE_NEZASA'       // メダケネザサ
  | 'THORN_KARATACHI_SANSHO_ROSE' // ｶﾗﾀﾁ・山椒・ﾊﾞﾗ
  | 'THORN_PYRACANTHA_BOKE_NANTEN' // ﾋﾟﾗｶﾝｻ・ﾎﾞｹ・ナンテン
  | 'THORN_CITRUS'               // ﾐｶﾝ・ﾚﾓﾝ柑橘類
  | 'THORN_TARANOKI_HARIGIRI_ACACIA'; // ﾀﾗﾉｷ・ﾊﾘｷﾞﾘ・ｱｶｼｱ類

export const TREE_SPECIES_LABELS: Record<TreeSpeciesCode, string> = {
  PINE_MAINTAINED: '黒松赤松(手入れ)',
  MAKI_MAINTAINED: 'マキ(手入れ)',
  BAMBOO_MOSO: '孟宗竹',
  BAMBOO_MADAKE: '真竹',
  BAMBOO_HACHIKU: '淡竹(ﾊﾁｸ)',
  BAMBOO_MEDAKE_NEZASA: 'メダケネザサ',
  THORN_KARATACHI_SANSHO_ROSE: 'ｶﾗﾀﾁ・山椒・ﾊﾞﾗ',
  THORN_PYRACANTHA_BOKE_NANTEN: 'ﾋﾟﾗｶﾝｻ・ﾎﾞｹ・ナンテン',
  THORN_CITRUS: 'ﾐｶﾝ・ﾚﾓﾝ柑橘類',
  THORN_TARANOKI_HARIGIRI_ACACIA: 'ﾀﾗﾉｷ・ﾊﾘｷﾞﾘ・ｱｶｼｱ類',
};

export const TREE_SPECIES_CATEGORIES = {
  '特殊手入れ': ['PINE_MAINTAINED', 'MAKI_MAINTAINED'] as TreeSpeciesCode[],
  '竹': ['BAMBOO_MOSO', 'BAMBOO_MADAKE', 'BAMBOO_HACHIKU', 'BAMBOO_MEDAKE_NEZASA'] as TreeSpeciesCode[],
  'トゲ物': [
    'THORN_KARATACHI_SANSHO_ROSE',
    'THORN_PYRACANTHA_BOKE_NANTEN',
    'THORN_CITRUS',
    'THORN_TARANOKI_HARIGIRI_ACACIA',
  ] as TreeSpeciesCode[],
};

export interface TreeSpeciesMultiplier {
  code: TreeSpeciesCode;
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
  treeSpeciesMultipliers: TreeSpeciesMultiplier[]; // 樹種倍率マスタ
  adjustmentTemplates: AdjustmentTemplate[];
}

