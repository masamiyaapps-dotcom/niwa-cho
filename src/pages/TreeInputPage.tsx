import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { SubNavigation } from '../components/ui/SubNavigation';
import { Stepper } from '../components/ui/Stepper';
import { formatYen } from '../utils/format';
import { calcLineAmount } from '../utils/calc';
import type { Estimate, EstimateItem, HeightClass, TreeWorkType } from '../types/estimate';
import { HEIGHT_CLASS_LABELS, TREE_WORK_LABELS } from '../types/estimate';
import type { PriceMaster } from '../types/master';

interface Props {
  getEstimate: (id: string) => Estimate | undefined;
  onUpdate: (estimate: Estimate) => Estimate;
  priceMaster: PriceMaster;
}

const TREE_TABS: TreeWorkType[] = ['PRUNE', 'FELL', 'SPRAY'];
const HEIGHT_CLASSES: HeightClass[] = ['H3', 'H4', 'H5', 'H7', 'H9', 'H11', 'H13'];

export function TreeInputPage({ getEstimate, onUpdate, priceMaster }: Props) {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TreeWorkType>('PRUNE');
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    if (id) {
      const est = getEstimate(id);
      if (est) setEstimate({ ...est });
    }
  }, [id, getEstimate]);

  const getUnitPrice = useCallback(
    (workType: TreeWorkType, heightClass: HeightClass): number => {
      const found = priceMaster.treePrices.find(
        (p) => p.workType === workType && p.heightClass === heightClass,
      );
      return found?.priceExclTax ?? 0;
    },
    [priceMaster],
  );

  const getQuantity = useCallback(
    (workType: TreeWorkType, heightClass: HeightClass): number => {
      if (!estimate) return 0;
      const item = estimate.items.find(
        (i) =>
          i.category === 'TREE' &&
          i.workType === workType &&
          i.heightClass === heightClass,
      );
      return item?.quantity ?? 0;
    },
    [estimate],
  );

  const setQuantity = useCallback(
    (workType: TreeWorkType, heightClass: HeightClass, qty: number) => {
      if (!estimate) return;

      const newItems = [...estimate.items];
      const idx = newItems.findIndex(
        (i) =>
          i.category === 'TREE' &&
          i.workType === workType &&
          i.heightClass === heightClass,
      );

      if (qty === 0 && idx >= 0) {
        // 0なら明細を削除
        newItems.splice(idx, 1);
      } else if (idx >= 0) {
        newItems[idx] = { ...newItems[idx], quantity: qty };
      } else if (qty > 0) {
        const unitPrice = getUnitPrice(workType, heightClass);
        const newItem: EstimateItem = {
          id: `tree_${workType}_${heightClass}_${Date.now()}`,
          category: 'TREE',
          workType,
          heightClass,
          quantity: qty,
          unit: '本',
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

  // タブの小計計算
  const tabSubtotal = useCallback(
    (workType: TreeWorkType): number => {
      if (!estimate) return 0;
      return estimate.items
        .filter((i) => i.category === 'TREE' && i.workType === workType)
        .reduce(
          (sum, i) =>
            sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier),
          0,
        );
    },
    [estimate],
  );

  // 木カテゴリ全体の小計
  const treeTotal = useCallback((): number => {
    if (!estimate) return 0;
    return estimate.items
      .filter((i) => i.category === 'TREE')
      .reduce(
        (sum, i) =>
          sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier),
        0,
      );
  }, [estimate]);

  if (!estimate) {
    return (
      <div className="page">
        <Header title="木 入力" />
        <div className="page-content">
          <p>案件が見つかりません</p>
        </div>
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
        {/* タブ切り替え */}
        <div className="tabs">
          {TREE_TABS.map((wt) => (
            <button
              key={wt}
              type="button"
              className={`tab ${activeTab === wt ? 'tab--active' : ''}`}
              onClick={() => setActiveTab(wt)}
            >
              {TREE_WORK_LABELS[wt]}
            </button>
          ))}
        </div>

        {/* 高さ区分ごとのステッパー */}
        <div className="input-list">
          {HEIGHT_CLASSES.map((hc) => {
            const unitPrice = getUnitPrice(activeTab, hc);
            const qty = getQuantity(activeTab, hc);
            const lineAmount = calcLineAmount(qty, unitPrice, 1.0);
            return (
              <div key={hc} className="input-row">
                <div className="input-row-info">
                  <span className="input-row-label">
                    {HEIGHT_CLASS_LABELS[hc]}
                  </span>
                  <span className="text-sm text-muted">
                    @{formatYen(unitPrice)}
                  </span>
                </div>
                <Stepper
                  value={qty}
                  onChange={(v) => setQuantity(activeTab, hc, v)}
                />
                {qty > 0 && (
                  <span className="input-row-amount">{formatYen(lineAmount)}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* 小計 */}
        <div className="subtotal-box">
          <div className="subtotal-line">
            <span>{TREE_WORK_LABELS[activeTab]} 小計（税抜）</span>
            <span>{formatYen(tabSubtotal(activeTab))}</span>
          </div>
          <div className="subtotal-line subtotal-line--main">
            <span>木 合計（税抜）</span>
            <span>{formatYen(treeTotal())}</span>
          </div>
          <div className="subtotal-line text-sm text-muted">
            <span>税込</span>
            <span>{formatYen(treeTotal() * (1 + priceMaster.taxRate))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

