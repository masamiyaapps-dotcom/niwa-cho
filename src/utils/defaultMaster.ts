import type { PriceMaster } from '../types/master';

/** 初期単価マスタ（税抜価格） */
export const DEFAULT_PRICE_MASTER: PriceMaster = {
  version: '1.0.0',
  taxRate: 0.1,
  roundingRule: 'ROUND_100',
  treePrices: [
    // 剪定
    { workType: 'PRUNE', heightClass: 'H3', priceExclTax: 3000 },
    { workType: 'PRUNE', heightClass: 'H4', priceExclTax: 5000 },
    { workType: 'PRUNE', heightClass: 'H5', priceExclTax: 8000 },
    { workType: 'PRUNE', heightClass: 'H7', priceExclTax: 15000 },
    { workType: 'PRUNE', heightClass: 'H9', priceExclTax: 25000 },
    { workType: 'PRUNE', heightClass: 'H11', priceExclTax: 35000 },
    { workType: 'PRUNE', heightClass: 'H13', priceExclTax: 50000 },
    // 伐採
    { workType: 'FELL', heightClass: 'H3', priceExclTax: 5000 },
    { workType: 'FELL', heightClass: 'H4', priceExclTax: 8000 },
    { workType: 'FELL', heightClass: 'H5', priceExclTax: 12000 },
    { workType: 'FELL', heightClass: 'H7', priceExclTax: 20000 },
    { workType: 'FELL', heightClass: 'H9', priceExclTax: 35000 },
    { workType: 'FELL', heightClass: 'H11', priceExclTax: 50000 },
    { workType: 'FELL', heightClass: 'H13', priceExclTax: 70000 },
    // 消毒
    { workType: 'SPRAY', heightClass: 'H3', priceExclTax: 2000 },
    { workType: 'SPRAY', heightClass: 'H4', priceExclTax: 3000 },
    { workType: 'SPRAY', heightClass: 'H5', priceExclTax: 4000 },
    { workType: 'SPRAY', heightClass: 'H7', priceExclTax: 6000 },
    { workType: 'SPRAY', heightClass: 'H9', priceExclTax: 8000 },
    { workType: 'SPRAY', heightClass: 'H11', priceExclTax: 10000 },
    { workType: 'SPRAY', heightClass: 'H13', priceExclTax: 13000 },
  ],
  groundPrices: [
    { workType: 'WEED_HAND', pricePerUnit: 500 },
    { workType: 'WEED_MACHINE', pricePerUnit: 300 },
    { workType: 'HERBICIDE', pricePerUnit: 200 },
    { workType: 'WEED_SHEET', pricePerUnit: 1500 },
  ],
  disposalPrices: [
    { workType: 'BRANCH_BAG', pricePerUnit: 500 },
    { workType: 'TRUNK_KG', pricePerUnit: 50 },
  ],
  obstacleMultipliers: [
    { code: 'ROAD', recommendedMultiplier: 1.2, minMultiplier: 1.0, maxMultiplier: 1.5 },
    { code: 'LANTERN_FLOWERBED', recommendedMultiplier: 1.1, minMultiplier: 1.0, maxMultiplier: 1.3 },
    { code: 'CAVE', recommendedMultiplier: 1.3, minMultiplier: 1.0, maxMultiplier: 1.5 },
    { code: 'NEIGHBOR', recommendedMultiplier: 1.2, minMultiplier: 1.0, maxMultiplier: 1.5 },
    { code: 'POND', recommendedMultiplier: 1.3, minMultiplier: 1.0, maxMultiplier: 1.5 },
    { code: 'SLOPE', recommendedMultiplier: 1.3, minMultiplier: 1.0, maxMultiplier: 1.5 },
    { code: 'CLIFF', recommendedMultiplier: 1.5, minMultiplier: 1.0, maxMultiplier: 2.0 },
  ],
  adjustmentTemplates: [
    { id: 'tpl_safety', label: '安全対策費', defaultAmountExclTax: 5000, type: 'ADD' },
    { id: 'tpl_carry', label: '搬出手運び', defaultAmountExclTax: 3000, type: 'ADD' },
    { id: 'tpl_special', label: '特殊作業', defaultAmountExclTax: 10000, type: 'ADD' },
    { id: 'tpl_parking', label: '駐車場代', defaultAmountExclTax: 2000, type: 'ADD' },
    { id: 'tpl_discount', label: 'お値引き', defaultAmountExclTax: -5000, type: 'DISCOUNT' },
  ],
};

