import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { SubNavigation } from '../components/ui/SubNavigation';
import { CompletedBanner } from '../components/ui/CompletedBanner';
import { Stepper } from '../components/ui/Stepper';
import { IndividualItemDetail } from '../components/ui/IndividualItemDetail';
import { formatYen, generateId } from '../utils/format';
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

  // ─── アイテム取得（グループ） ───
  const getItems = useCallback(
    (workType: TreeWorkType, heightClass: HeightClass): EstimateItem[] => {
      if (!estimate) return [];
      return estimate.items.filter(
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

  // ─── 数量変更（アイテム追加/削除） ───
  const setQuantity = useCallback(
    (workType: TreeWorkType, heightClass: HeightClass, newQty: number) => {
      if (!estimate || isLocked) return;

      const currentItems = getItems(workType, heightClass);
      const currentQty = currentItems.length;

      if (newQty === currentQty) return;

      let newItems = [...estimate.items];

      if (newQty < currentQty) {
        // 減らす：末尾から削除
        const toRemove = currentQty - newQty;
        const idsToRemove = currentItems.slice(-toRemove).map((i) => i.id);
        newItems = newItems.filter((i) => !idsToRemove.includes(i.id));
      } else {
        // 増やす：新規アイテム追加
        const toAdd = newQty - currentQty;
        const unitPrice = getUnitPrice(workType, heightClass);
        for (let i = 0; i < toAdd; i++) {
          newItems.push({
            id: generateId(),
            category: 'TREE',
            workType,
            heightClass,
            quantity: 1,
            unit: '本',
            unitPriceExclTax: unitPrice,
            lineMultiplier: 1.0,
          });
        }
      }

      const updated = { ...estimate, items: newItems };
      setEstimate(updated);
      onUpdate(updated);
    },
    [estimate, isLocked, getItems, getUnitPrice, onUpdate],
  );

  // ─── 個別アイテム更新 ───
  const updateItem = useCallback(
    (itemId: string, updates: Partial<EstimateItem>) => {
      if (!estimate || isLocked) return;
      const newItems = estimate.items.map((i) =>
        i.id === itemId ? { ...i, ...updates } : i,
      );
      const updated = { ...estimate, items: newItems };
      setEstimate(updated);
      onUpdate(updated);
    },
    [estimate, isLocked, onUpdate],
  );

  // ─── 個別アイテム削除 ───
  const removeItem = useCallback(
    (itemId: string) => {
      if (!estimate || isLocked) return;
      const newItems = estimate.items.filter((i) => i.id !== itemId);
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
            sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier, i.speciesMultiplier),
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
          sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier, i.speciesMultiplier),
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
            const items = getItems(activeTab, hc);
            const qty = items.length;
            const totalAmount = items.reduce(
              (sum, i) => sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier, i.speciesMultiplier),
              0,
            );
            const rowKey = `${activeTab}_${hc}`;
            const isExpanded = expandedRows.has(rowKey);
            const hasDetails = items.some(
              (i) => i.lineMultiplier !== 1.0 || i.speciesCode || (i.obstacles && i.obstacles.length > 0) || i.note,
            );

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
                      className={`multiplier-btn ${hasDetails ? 'multiplier-btn--active' : ''} ${isExpanded ? 'multiplier-btn--open' : ''}`}
                      onClick={() => toggleExpand(rowKey)}
                    >
                      内訳
                    </button>
                  )}
                  {qty > 0 && (
                    <span className="input-row-amount">{formatYen(totalAmount)}</span>
                  )}
                </div>

                {/* 個別アイテム詳細（展開時のみ） */}
                {isExpanded && qty > 0 && (
                  <div className="individual-items-panel">
                    {items.map((item, idx) => (
                      <IndividualItemDetail
                        key={item.id}
                        itemNumber={idx + 1}
                        lineMultiplier={item.lineMultiplier}
                        note={item.note ?? ''}
                        obstacles={item.obstacles ?? []}
                        speciesCode={item.speciesCode}
                        speciesMultiplier={item.speciesMultiplier}
                        treeSpeciesMultipliers={priceMaster.treeSpeciesMultipliers}
                        onMultiplierChange={(v) =>
                          updateItem(item.id, { lineMultiplier: v })
                        }
                        onNoteChange={(v) =>
                          updateItem(item.id, { note: v })
                        }
                        onObstaclesChange={(v) =>
                          updateItem(item.id, { obstacles: v })
                        }
                        onSpeciesChange={(code, mult) =>
                          updateItem(item.id, { speciesCode: code, speciesMultiplier: mult })
                        }
                        onRemove={() => removeItem(item.id)}
                        disabled={isLocked}
                      />
                    ))}
                  </div>
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
