import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { SubNavigation } from '../components/ui/SubNavigation';
import { formatYen } from '../utils/format';
import { calcLineAmount } from '../utils/calc';
import type { Estimate, EstimateItem, DisposalWorkType, ObstacleCode } from '../types/estimate';
import { DISPOSAL_WORK_LABELS, OBSTACLE_LABELS } from '../types/estimate';
import type { PriceMaster } from '../types/master';

interface Props {
  getEstimate: (id: string) => Estimate | undefined;
  onUpdate: (estimate: Estimate) => Estimate;
  priceMaster: PriceMaster;
}

const DISPOSAL_WORKS: DisposalWorkType[] = ['BRANCH_BAG', 'TRUNK_KG'];
const ALL_OBSTACLES: ObstacleCode[] = [
  'ROAD', 'LANTERN_FLOWERBED', 'CAVE', 'NEIGHBOR', 'POND', 'SLOPE', 'CLIFF',
];

export function DisposalInputPage({ getEstimate, onUpdate, priceMaster }: Props) {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    if (id) {
      const est = getEstimate(id);
      if (est) setEstimate({ ...est });
    }
  }, [id, getEstimate]);

  const getUnitPrice = useCallback(
    (workType: DisposalWorkType): number => {
      const found = priceMaster.disposalPrices.find((p) => p.workType === workType);
      return found?.pricePerUnit ?? 0;
    },
    [priceMaster],
  );

  const getQuantity = useCallback(
    (workType: DisposalWorkType): number => {
      if (!estimate) return 0;
      const item = estimate.items.find(
        (i) => i.category === 'DISPOSAL' && i.workType === workType,
      );
      return item?.quantity ?? 0;
    },
    [estimate],
  );

  const setQuantity = useCallback(
    (workType: DisposalWorkType, qty: number) => {
      if (!estimate) return;
      const newItems = [...estimate.items];
      const idx = newItems.findIndex(
        (i) => i.category === 'DISPOSAL' && i.workType === workType,
      );

      const unit = workType === 'BRANCH_BAG' ? '袋' : 'kg';

      if (qty === 0 && idx >= 0) {
        newItems.splice(idx, 1);
      } else if (idx >= 0) {
        newItems[idx] = { ...newItems[idx], quantity: qty };
      } else if (qty > 0) {
        const unitPrice = getUnitPrice(workType);
        const newItem: EstimateItem = {
          id: `disposal_${workType}_${Date.now()}`,
          category: 'DISPOSAL',
          workType,
          quantity: qty,
          unit,
          unitPriceExclTax: unitPrice,
          lineMultiplier: 1.0,
        };
        newItems.push(newItem);
      }

      const updated = { ...estimate, items: newItems };
      setEstimate(updated);
      onUpdate(updated);
    },
    [estimate, getUnitPrice, onUpdate],
  );

  const toggleObstacle = useCallback(
    (code: ObstacleCode) => {
      if (!estimate) return;
      const checks = [...estimate.options.obstacleChecks];
      const idx = checks.indexOf(code);
      if (idx >= 0) {
        checks.splice(idx, 1);
      } else {
        checks.push(code);
      }

      // 推奨倍率を計算
      let recommendedMultiplier = 1.0;
      for (const c of checks) {
        const master = priceMaster.obstacleMultipliers.find((m) => m.code === c);
        if (master) {
          recommendedMultiplier = Math.max(
            recommendedMultiplier,
            master.recommendedMultiplier,
          );
        }
      }

      const updated: Estimate = {
        ...estimate,
        options: {
          ...estimate.options,
          obstacleChecks: checks,
          projectMultiplier: recommendedMultiplier,
        },
      };
      setEstimate(updated);
      onUpdate(updated);
    },
    [estimate, priceMaster, onUpdate],
  );

  const disposalTotal = useCallback((): number => {
    if (!estimate) return 0;
    return estimate.items
      .filter((i) => i.category === 'DISPOSAL')
      .reduce(
        (sum, i) =>
          sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier),
        0,
      );
  }, [estimate]);

  if (!estimate) {
    return (
      <div className="page">
        <Header title="処分・環境" />
        <div className="page-content"><p>案件が見つかりません</p></div>
      </div>
    );
  }

  const subNavItems = [
    { to: `/estimate/${id}/tree`, label: '🌳 木' },
    { to: `/estimate/${id}/ground`, label: '🌿 除草' },
    { to: `/estimate/${id}/disposal`, label: '🚛 処分' },
    { to: `/estimate/${id}/summary`, label: '📊 合計' },
  ];

  return (
    <div className="page">
      <Header title={estimate.title} />
      <SubNavigation items={subNavItems} />

      <div className="page-content">
        <h2 className="section-title">処分費</h2>
        {DISPOSAL_WORKS.map((wt) => {
          const unitPrice = getUnitPrice(wt);
          const qty = getQuantity(wt);
          const unit = wt === 'BRANCH_BAG' ? '袋' : 'kg';
          const lineAmount = calcLineAmount(qty, unitPrice, 1.0);

          return (
            <div key={wt} className="input-row input-row--ground">
              <div className="input-row-info">
                <span className="input-row-label">{DISPOSAL_WORK_LABELS[wt]}</span>
                <span className="text-sm text-muted">@{formatYen(unitPrice)}/{unit}</span>
              </div>
              <div className="input-row-qty">
                <input
                  type="number"
                  className="form-input form-input--sm"
                  value={qty || ''}
                  onChange={(e) => setQuantity(wt, Number(e.target.value) || 0)}
                  min={0}
                  placeholder="0"
                  inputMode="numeric"
                />
                <span className="unit-label">{unit}</span>
              </div>
              {qty > 0 && (
                <span className="input-row-amount">{formatYen(lineAmount)}</span>
              )}
            </div>
          );
        })}

        <div className="subtotal-box">
          <div className="subtotal-line subtotal-line--main">
            <span>処分 合計（税抜）</span>
            <span>{formatYen(disposalTotal())}</span>
          </div>
        </div>

        {/* 作業環境チェック */}
        <h2 className="section-title">作業環境（障害物）</h2>
        <p className="text-sm text-muted">
          該当する障害物をチェックすると、案件倍率が自動計算されます
        </p>
        <div className="checkbox-list">
          {ALL_OBSTACLES.map((code) => (
            <label key={code} className="checkbox-item">
              <input
                type="checkbox"
                checked={estimate.options.obstacleChecks.includes(code)}
                onChange={() => toggleObstacle(code)}
              />
              <span>{OBSTACLE_LABELS[code]}</span>
            </label>
          ))}
        </div>

        <div className="subtotal-box">
          <div className="subtotal-line">
            <span>案件倍率</span>
            <span className="multiplier-value">
              ×{estimate.options.projectMultiplier.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

