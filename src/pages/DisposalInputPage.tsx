import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { SubNavigation } from '../components/ui/SubNavigation';
import { CompletedBanner } from '../components/ui/CompletedBanner';
import { MultiplierDetail } from '../components/ui/MultiplierDetail';
import { formatYen } from '../utils/format';
import { calcLineAmount } from '../utils/calc';
import type { Estimate, EstimateItem, DisposalWorkType } from '../types/estimate';
import { DISPOSAL_WORK_LABELS } from '../types/estimate';
import type { PriceMaster } from '../types/master';

interface Props {
  getEstimate: (id: string) => Estimate | undefined;
  onUpdate: (estimate: Estimate) => Estimate;
  priceMaster: PriceMaster;
}

const DISPOSAL_WORKS: DisposalWorkType[] = ['BRANCH_BAG', 'TRUNK_KG'];

export function DisposalInputPage({ getEstimate, onUpdate, priceMaster }: Props) {
  const { id } = useParams<{ id: string }>();
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
    (workType: DisposalWorkType): EstimateItem | undefined => {
      if (!estimate) return undefined;
      return estimate.items.find(
        (i) => i.category === 'DISPOSAL' && i.workType === workType,
      );
    },
    [estimate],
  );

  const getUnitPrice = useCallback(
    (workType: DisposalWorkType): number => {
      const found = priceMaster.disposalPrices.find((p) => p.workType === workType);
      return found?.pricePerUnit ?? 0;
    },
    [priceMaster],
  );

  const getQuantity = useCallback(
    (workType: DisposalWorkType): number => {
      return getItem(workType)?.quantity ?? 0;
    },
    [getItem],
  );

  // ─── 数量変更 ───
  const setQuantity = useCallback(
    (workType: DisposalWorkType, qty: number) => {
      if (!estimate || isLocked) return;
      const newItems = [...estimate.items];
      const idx = newItems.findIndex(
        (i) => i.category === 'DISPOSAL' && i.workType === workType,
      );

      const unit = workType === 'BRANCH_BAG' ? '袋' : 'kg';

      if (qty === 0 && idx >= 0) {
        newItems.splice(idx, 1);
        setExpandedRows((prev) => {
          const next = new Set(prev);
          next.delete(workType);
          return next;
        });
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
    [estimate, isLocked, getUnitPrice, onUpdate],
  );

  // ─── 倍率・メモ・障害物の更新 ───
  const updateItemDetail = useCallback(
    (
      workType: DisposalWorkType,
      updates: Partial<Pick<EstimateItem, 'lineMultiplier' | 'multiplierQty' | 'note' | 'obstacles'>>,
    ) => {
      if (!estimate || isLocked) return;
      const newItems = estimate.items.map((i) => {
        if (i.category === 'DISPOSAL' && i.workType === workType) {
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
  const disposalTotal = useCallback((): number => {
    if (!estimate) return 0;
    return estimate.items
      .filter((i) => i.category === 'DISPOSAL')
      .reduce(
        (sum, i) =>
          sum + calcLineAmount(i.quantity, i.unitPriceExclTax, i.lineMultiplier, i.multiplierQty),
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
      <Header
        title={estimate.title}
        rightAction={<Link to="/" className="header-home-btn" aria-label="一覧へ">🏠 一覧</Link>}
      />
      <SubNavigation items={subNavItems} />

      {isLocked && <CompletedBanner />}

      <div className={`page-content ${isLocked ? 'page-content--locked' : ''}`}>
        <h2 className="section-title">処分費</h2>

        <div className="input-list">
          {DISPOSAL_WORKS.map((wt) => {
            const unitPrice = getUnitPrice(wt);
            const qty = getQuantity(wt);
            const item = getItem(wt);
            const multiplier = item?.lineMultiplier ?? 1.0;
            const mQty = item?.multiplierQty ?? 0;
            const unit = wt === 'BRANCH_BAG' ? '袋' : 'kg';
            const lineAmount = calcLineAmount(qty, unitPrice, multiplier, mQty);
            const isExpanded = expandedRows.has(wt);
            const hasMultiplier = mQty > 0 && multiplier !== 1.0;

            return (
              <div key={wt} className="input-row-group">
                <div className="input-row input-row--ground">
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
                      disabled={isLocked}
                    />
                    <span className="unit-label">{unit}</span>
                  </div>
                  {qty > 0 && (
                    <button
                      type="button"
                      className={`multiplier-btn ${hasMultiplier ? 'multiplier-btn--active' : ''} ${isExpanded ? 'multiplier-btn--open' : ''}`}
                      onClick={() => toggleExpand(wt)}
                    >
                      {hasMultiplier ? `×${multiplier.toFixed(1)}/${mQty}${unit}` : '倍率'}
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
                    unit={unit}
                    note={item?.note ?? ''}
                    obstacles={item?.obstacles ?? []}
                    onMultiplierChange={(v) =>
                      updateItemDetail(wt, { lineMultiplier: v })
                    }
                    onMultiplierQtyChange={(v) =>
                      updateItemDetail(wt, { multiplierQty: v })
                    }
                    onNoteChange={(v) =>
                      updateItemDetail(wt, { note: v })
                    }
                    onObstaclesChange={(v) =>
                      updateItemDetail(wt, { obstacles: v })
                    }
                    disabled={isLocked}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="subtotal-box">
          <div className="subtotal-line subtotal-line--main">
            <span>処分 合計（税抜）</span>
            <span>{formatYen(disposalTotal())}</span>
          </div>
          <div className="subtotal-line text-sm text-muted">
            <span>税込</span>
            <span>{formatYen(disposalTotal() * (1 + priceMaster.taxRate))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
