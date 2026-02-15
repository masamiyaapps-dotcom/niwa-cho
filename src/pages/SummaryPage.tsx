import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { SubNavigation } from '../components/ui/SubNavigation';
import { CompletedBanner } from '../components/ui/CompletedBanner';
import { formatYen } from '../utils/format';
import { generateId } from '../utils/format';
import { calcLineAmount } from '../utils/calc';
import type { Estimate, Adjustment, EstimateItem } from '../types/estimate';
import {
  ESTIMATE_STATUS_LABELS,
  TREE_WORK_LABELS,
  HEIGHT_CLASS_LABELS,
  GROUND_WORK_LABELS,
  DISPOSAL_WORK_LABELS,
} from '../types/estimate';
import type { TreeWorkType, GroundWorkType, DisposalWorkType, HeightClass } from '../types/estimate';
import type { PriceMaster } from '../types/master';

interface Props {
  getEstimate: (id: string) => Estimate | undefined;
  onUpdate: (estimate: Estimate) => Estimate;
  priceMaster: PriceMaster;
}

export function SummaryPage({ getEstimate, onUpdate, priceMaster }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    if (id) {
      const est = getEstimate(id);
      if (est) setEstimate({ ...est });
    }
  }, [id, getEstimate]);

  const isLocked = estimate?.status === 'COMPLETED';

  const addAdjustment = useCallback(
    (type: 'ADD' | 'DISCOUNT', reason: string, amount: number) => {
      if (!estimate || isLocked) return;
      const adj: Adjustment = {
        id: generateId(),
        type,
        amountExclTax: type === 'DISCOUNT' ? -Math.abs(amount) : Math.abs(amount),
        reason,
      };
      const updated = {
        ...estimate,
        adjustments: [...estimate.adjustments, adj],
      };
      setEstimate(updated);
      onUpdate(updated);
    },
    [estimate, isLocked, onUpdate],
  );

  const removeAdjustment = useCallback(
    (adjId: string) => {
      if (!estimate || isLocked) return;
      const updated = {
        ...estimate,
        adjustments: estimate.adjustments.filter((a) => a.id !== adjId),
      };
      setEstimate(updated);
      onUpdate(updated);
    },
    [estimate, isLocked, onUpdate],
  );

  const addFromTemplate = useCallback(
    (templateId: string) => {
      const tpl = priceMaster.adjustmentTemplates.find((t) => t.id === templateId);
      if (!tpl) return;
      addAdjustment(tpl.type, tpl.label, tpl.defaultAmountExclTax);
    },
    [priceMaster, addAdjustment],
  );

  if (!estimate) {
    return (
      <div className="page">
        <Header title="合計" />
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

  const t = estimate.totals;

  return (
    <div className="page">
      <Header
        title={estimate.title}
        rightAction={<Link to="/" className="header-home-btn" aria-label="一覧へ">🏠 一覧</Link>}
      />
      <SubNavigation items={subNavItems} />

      {isLocked && <CompletedBanner />}

      <div className="page-content">
        {/* ステータス表示 */}
        <div className="summary-status">
          <span className="text-sm">ステータス：</span>
          <span className={`status-badge status-badge--${estimate.status.toLowerCase()}`}>
            {ESTIMATE_STATUS_LABELS[estimate.status]}
          </span>
        </div>

        {/* 追加費用テンプレート（完了時は非表示） */}
        {!isLocked && (
          <>
            <h2 className="section-title">追加費用テンプレート</h2>
            <div className="template-chips">
              {priceMaster.adjustmentTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={`chip ${tpl.type === 'DISCOUNT' ? 'chip--discount' : ''}`}
                  onClick={() => addFromTemplate(tpl.id)}
                >
                  {tpl.label}（{formatYen(tpl.defaultAmountExclTax)}）
                </button>
              ))}
            </div>
          </>
        )}

        {/* 調整一覧 */}
        {estimate.adjustments.length > 0 && (
          <div className="adjustment-list">
            <h3 className="section-subtitle">調整明細</h3>
            {estimate.adjustments.map((adj) => (
              <div key={adj.id} className="adjustment-row">
                <span className={adj.type === 'DISCOUNT' ? 'text-danger' : ''}>
                  {adj.reason}: {formatYen(adj.amountExclTax)}
                </span>
                {!isLocked && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeAdjustment(adj.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── セクション別内訳 ─── */}
        <BreakdownSection estimate={estimate} />

        {/* 合計表示 */}
        <div className="total-box">
          <div className="total-line">
            <span>小計（税抜）</span>
            <span>{formatYen(t.subtotalExclTax)}</span>
          </div>
          {estimate.options.projectMultiplier !== 1.0 && (
            <div className="total-line">
              <span>
                案件倍率 ×{estimate.options.projectMultiplier.toFixed(1)} 適用後
              </span>
              <span>{formatYen(t.afterProjectMultiplier)}</span>
            </div>
          )}
          {t.adjustmentTotal !== 0 && (
            <div className="total-line">
              <span>調整合計</span>
              <span>{formatYen(t.adjustmentTotal)}</span>
            </div>
          )}
          <div className="total-line">
            <span>合計（税抜）</span>
            <span>{formatYen(t.totalExclTax)}</span>
          </div>
          <div className="total-line">
            <span>消費税（{(priceMaster.taxRate * 100).toFixed(0)}%）</span>
            <span>{formatYen(t.tax)}</span>
          </div>
          <div className="total-line total-line--grand">
            <span>合計（税込）</span>
            <span>{formatYen(t.totalInclTaxRounded)}</span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="action-buttons">
          {!isLocked && (
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate(`/estimate/${id}`)}
            >
              📝 案件情報を編集
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline btn-full"
            onClick={() => navigate('/')}
          >
            📋 案件一覧に戻る
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 内訳表示サブコンポーネント ─── */

function itemAmount(item: EstimateItem): number {
  return calcLineAmount(item.quantity, item.unitPriceExclTax, item.lineMultiplier, item.speciesMultiplier);
}

function getItemLabel(item: EstimateItem): string {
  if (item.category === 'TREE') {
    const work = TREE_WORK_LABELS[item.workType as TreeWorkType] ?? item.workType;
    const height = item.heightClass ? HEIGHT_CLASS_LABELS[item.heightClass as HeightClass] : '';
    return `${work} ${height}`;
  }
  if (item.category === 'GROUND') {
    return GROUND_WORK_LABELS[item.workType as GroundWorkType] ?? item.workType;
  }
  if (item.category === 'DISPOSAL') {
    return DISPOSAL_WORK_LABELS[item.workType as DisposalWorkType] ?? item.workType;
  }
  return item.workType;
}

function multiplierInfo(item: EstimateItem): string {
  const parts: string[] = [];
  if (item.lineMultiplier !== 1.0) {
    parts.push(`障害物×${item.lineMultiplier.toFixed(1)}`);
  }
  if (item.speciesMultiplier && item.speciesMultiplier !== 1.0) {
    parts.push(`樹種×${item.speciesMultiplier.toFixed(1)}`);
  }
  return parts.join(' / ');
}

interface BreakdownProps {
  estimate: Estimate;
}

function BreakdownSection({ estimate }: BreakdownProps) {
  const treeItems = estimate.items.filter((i) => i.category === 'TREE');
  const groundItems = estimate.items.filter((i) => i.category === 'GROUND');
  const disposalItems = estimate.items.filter((i) => i.category === 'DISPOSAL');

  const treeTotal = treeItems.reduce((s, i) => s + itemAmount(i), 0);
  const groundTotal = groundItems.reduce((s, i) => s + itemAmount(i), 0);
  const disposalTotal = disposalItems.reduce((s, i) => s + itemAmount(i), 0);

  const hasAnyItems = treeItems.length > 0 || groundItems.length > 0 || disposalItems.length > 0;
  if (!hasAnyItems) return null;

  return (
    <div className="breakdown-section">
      <h2 className="section-title">内訳</h2>

      {treeItems.length > 0 && (
        <div className="breakdown-category">
          <h3 className="breakdown-category-title">🌳 木</h3>
          <div className="breakdown-items">
            {treeItems.map((item) => (
              <div key={item.id} className="breakdown-item">
                <div className="breakdown-item-main">
                  <span className="breakdown-item-label">{getItemLabel(item)}</span>
                  <span className="breakdown-item-detail">
                    {item.quantity}{item.unit}
                    {' '}@{formatYen(item.unitPriceExclTax)}
                  </span>
                  <span className="breakdown-item-amount">{formatYen(itemAmount(item))}</span>
                </div>
                {multiplierInfo(item) && (
                  <div className="breakdown-item-note">
                    {multiplierInfo(item)}
                  </div>
                )}
                {item.note && (
                  <div className="breakdown-item-note">📝 {item.note}</div>
                )}
              </div>
            ))}
          </div>
          <div className="breakdown-subtotal">
            <span>木 小計</span>
            <span>{formatYen(treeTotal)}</span>
          </div>
        </div>
      )}

      {groundItems.length > 0 && (
        <div className="breakdown-category">
          <h3 className="breakdown-category-title">🌿 除草・地面</h3>
          <div className="breakdown-items">
            {groundItems.map((item) => (
              <div key={item.id} className="breakdown-item">
                <div className="breakdown-item-main">
                  <span className="breakdown-item-label">{getItemLabel(item)}</span>
                  <span className="breakdown-item-detail">
                    {item.quantity}{item.unit}
                    {' '}@{formatYen(item.unitPriceExclTax)}/{item.unit}
                  </span>
                  <span className="breakdown-item-amount">{formatYen(itemAmount(item))}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="breakdown-subtotal">
            <span>除草 小計</span>
            <span>{formatYen(groundTotal)}</span>
          </div>
        </div>
      )}

      {disposalItems.length > 0 && (
        <div className="breakdown-category">
          <h3 className="breakdown-category-title">🚛 処分</h3>
          <div className="breakdown-items">
            {disposalItems.map((item) => (
              <div key={item.id} className="breakdown-item">
                <div className="breakdown-item-main">
                  <span className="breakdown-item-label">{getItemLabel(item)}</span>
                  <span className="breakdown-item-detail">
                    {item.quantity}{item.unit}
                    {' '}@{formatYen(item.unitPriceExclTax)}/{item.unit}
                  </span>
                  <span className="breakdown-item-amount">{formatYen(itemAmount(item))}</span>
                </div>
                {multiplierInfo(item) && (
                  <div className="breakdown-item-note">
                    {multiplierInfo(item)}
                  </div>
                )}
                {item.note && (
                  <div className="breakdown-item-note">📝 {item.note}</div>
                )}
              </div>
            ))}
          </div>
          <div className="breakdown-subtotal">
            <span>処分 小計</span>
            <span>{formatYen(disposalTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
