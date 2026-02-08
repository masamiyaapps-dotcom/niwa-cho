import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { SubNavigation } from '../components/ui/SubNavigation';
import { CompletedBanner } from '../components/ui/CompletedBanner';
import { Stepper } from '../components/ui/Stepper';
import { MultiplierDetail } from '../components/ui/MultiplierDetail';
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      const est = getEstimate(id);
      if (est) setEstimate({ ...est });
    }
  }, [id, getEstimate]);

  const isLocked = estimate?.status === 'COMPLETED';

  // ─── 行の展開/折りたたみ ───
  const toggleExpand = useCallback((key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ─── アイテム取得 ───
  const getItem = useCallback(
    (workType: TreeWorkType, heightClass: HeightClass): EstimateItem | undefined => {
      if (!estimate) return undefined;
      return estimate.items.find(
        (i) =>
          i.category === 'TREE' &&
          i.workType === workType &&
          i.heightClass === heightClass,
      );
    },
    [estimate],
  );

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
      return getItem(workType, heightClass)?.quantity ?? 0;
    },
    [getItem],
  );

  // ─── 数量変更 ───
  const setQuantity = useCallback(
    (workType: TreeWorkType, heightClass: HeightClass, qty: number) => {
      if (!estimate || isLocked) return;

      const newItems = [...estimate.items];
      const idx = newItems.findIndex(
        (i) =>
          i.category === 'TREE' &&
          i.workType === workType &&
          i.heightClass === heightClass,
      );

      if (qty === 0 && idx >= 0) {
        newItems.splice(idx, 1);
        // 数量0なら展開も閉じる
        setExpandedRows((prev) => {
          const next = new Set(prev);
          next.delete(`${workType}_${heightClass}`);
          return next;
        });
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
    [estimate, isLocked, getUnitPrice, onUpdate],
  );

  // ─── 倍率・メモ・障害物の更新 ───
  const updateItemDetail = useCallback(
    (
      workType: TreeWorkType,
      heightClass: HeightClass,
      updates: Partial<Pick<EstimateItem, 'lineMultiplier' | 'multiplierQty' | 'note' | 'obstacles'>>,
    ) => {
      if (!estimate || isLocked) return;
      const newItems = estimate.items.map((i) => {
        if (
          i.category === 'TREE' &&
          i.workType === workType &&
          i.heightClass === heightClass
        ) {
          return { ...i, ...updates };
        }
        return i;
      });
      const updated = { ...estimate, items: newItems };
      setEstimate(updated);
      onUpdate(updated);
    },
    [estimate, isLocked, onUpdate],
  );

  // ─── 小計 ───
  const tabSubtotal = useCallback(
    (workType: TreeWorkType): number => {
      if (!estimate) return 0;
      return estimate.items
        .filter((i) => i.category === 'TREE' && i.workType === workType)
        .reduce(
          (sum, i) =>
            sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier, i.multiplierQty),
          0,
        );
    },
    [estimate],
  );

  const treeTotal = useCallback((): number => {
    if (!estimate) return 0;
    return estimate.items
      .filter((i) => i.category === 'TREE')
      .reduce(
        (sum, i) =>
          sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier, i.multiplierQty),
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
      <Header
        title={estimate.title}
        rightAction={<Link to="/" className="header-home-btn" aria-label="一覧へ">🏠 一覧</Link>}
      />
      <SubNavigation items={subNavItems} />

      {isLocked && <CompletedBanner />}

      <div className={`page-content ${isLocked ? 'page-content--locked' : ''}`}>
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

        {/* 高さ区分ごとの入力行 */}
        <div className="input-list">
          {HEIGHT_CLASSES.map((hc) => {
            const unitPrice = getUnitPrice(activeTab, hc);
            const qty = getQuantity(activeTab, hc);
            const item = getItem(activeTab, hc);
            const multiplier = item?.lineMultiplier ?? 1.0;
            const mQty = item?.multiplierQty ?? 0;
            const lineAmount = calcLineAmount(qty, unitPrice, multiplier, mQty);
            const rowKey = `${activeTab}_${hc}`;
            const isExpanded = expandedRows.has(rowKey);
            const hasMultiplier = mQty > 0 && multiplier !== 1.0;

            return (
              <div key={hc} className="input-row-group">
                <div className="input-row">
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
                    disabled={isLocked}
                  />
                  {qty > 0 && (
                    <button
                      type="button"
                      className={`multiplier-btn ${hasMultiplier ? 'multiplier-btn--active' : ''} ${isExpanded ? 'multiplier-btn--open' : ''}`}
                      onClick={() => toggleExpand(rowKey)}
                    >
                      {hasMultiplier ? `×${multiplier.toFixed(1)}/${mQty}本` : '倍率'}
                    </button>
                  )}
                  {qty > 0 && (
                    <span className="input-row-amount">{formatYen(lineAmount)}</span>
                  )}
                </div>

                {/* 倍率詳細（展開時のみ） */}
                {isExpanded && qty > 0 && (
                  <MultiplierDetail
                    multiplier={multiplier}
                    multiplierQty={mQty}
                    totalQty={qty}
                    unit="本"
                    note={item?.note ?? ''}
                    obstacles={item?.obstacles ?? []}
                    onMultiplierChange={(v) =>
                      updateItemDetail(activeTab, hc, { lineMultiplier: v })
                    }
                    onMultiplierQtyChange={(v) =>
                      updateItemDetail(activeTab, hc, { multiplierQty: v })
                    }
                    onNoteChange={(v) =>
                      updateItemDetail(activeTab, hc, { note: v })
                    }
                    onObstaclesChange={(v) =>
                      updateItemDetail(activeTab, hc, { obstacles: v })
                    }
                    disabled={isLocked}
                  />
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
