import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { SubNavigation } from '../components/ui/SubNavigation';
import { CompletedBanner } from '../components/ui/CompletedBanner';
import { formatYen } from '../utils/format';
import { generateId } from '../utils/format';
import type { Estimate, Adjustment } from '../types/estimate';
import { ESTIMATE_STATUS_LABELS } from '../types/estimate';
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
