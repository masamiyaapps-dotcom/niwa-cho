import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { SubNavigation } from '../components/ui/SubNavigation';
import { formatYen } from '../utils/format';
import { calcLineAmount } from '../utils/calc';
import type { Estimate, EstimateItem, GroundWorkType } from '../types/estimate';
import { GROUND_WORK_LABELS } from '../types/estimate';
import type { PriceMaster } from '../types/master';

interface Props {
  getEstimate: (id: string) => Estimate | undefined;
  onUpdate: (estimate: Estimate) => Estimate;
  priceMaster: PriceMaster;
}

const GROUND_WORKS: GroundWorkType[] = ['WEED_HAND', 'WEED_MACHINE'];

export function GroundInputPage({ getEstimate, onUpdate, priceMaster }: Props) {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    if (id) {
      const est = getEstimate(id);
      if (est) setEstimate({ ...est });
    }
  }, [id, getEstimate]);

  const getUnitPrice = useCallback(
    (workType: GroundWorkType): number => {
      const found = priceMaster.groundPrices.find((p) => p.workType === workType);
      return found?.pricePerUnit ?? 0;
    },
    [priceMaster],
  );

  const getQuantity = useCallback(
    (workType: GroundWorkType): number => {
      if (!estimate) return 0;
      const item = estimate.items.find(
        (i) => i.category === 'GROUND' && i.workType === workType,
      );
      return item?.quantity ?? 0;
    },
    [estimate],
  );

  const setQuantity = useCallback(
    (workType: GroundWorkType, qty: number) => {
      if (!estimate) return;
      const newItems = [...estimate.items];
      const idx = newItems.findIndex(
        (i) => i.category === 'GROUND' && i.workType === workType,
      );

      if (qty === 0 && idx >= 0) {
        newItems.splice(idx, 1);
      } else if (idx >= 0) {
        newItems[idx] = { ...newItems[idx], quantity: qty };
      } else if (qty > 0) {
        const unitPrice = getUnitPrice(workType);
        const newItem: EstimateItem = {
          id: `ground_${workType}_${Date.now()}`,
          category: 'GROUND',
          workType,
          quantity: qty,
          unit: '㎡',
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

  const groundTotal = useCallback((): number => {
    if (!estimate) return 0;
    return estimate.items
      .filter((i) => i.category === 'GROUND')
      .reduce(
        (sum, i) =>
          sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier),
        0,
      );
  }, [estimate]);

  if (!estimate) {
    return (
      <div className="page">
        <Header title="除草/地面" />
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
        <h2 className="section-title">除草・地面作業</h2>

        {GROUND_WORKS.map((wt) => {
          const unitPrice = getUnitPrice(wt);
          const qty = getQuantity(wt);
          const lineAmount = calcLineAmount(qty, unitPrice, 1.0);

          return (
            <div key={wt} className="input-row input-row--ground">
              <div className="input-row-info">
                <span className="input-row-label">{GROUND_WORK_LABELS[wt]}</span>
                <span className="text-sm text-muted">@{formatYen(unitPrice)}/㎡</span>
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
                <span className="unit-label">㎡</span>
              </div>
              {qty > 0 && (
                <span className="input-row-amount">{formatYen(lineAmount)}</span>
              )}
            </div>
          );
        })}

        <div className="subtotal-box">
          <div className="subtotal-line subtotal-line--main">
            <span>除草 合計（税抜）</span>
            <span>{formatYen(groundTotal())}</span>
          </div>
          <div className="subtotal-line text-sm text-muted">
            <span>税込</span>
            <span>{formatYen(groundTotal() * (1 + priceMaster.taxRate))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

