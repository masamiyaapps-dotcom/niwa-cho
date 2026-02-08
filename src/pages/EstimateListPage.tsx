import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { formatYen, formatDate } from '../utils/format';
import type { Estimate, EstimateStatus } from '../types/estimate';
import { ESTIMATE_STATUS_LABELS } from '../types/estimate';

interface Props {
  estimates: Estimate[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: EstimateStatus) => void;
}

export function EstimateListPage({
  estimates,
  onDuplicate,
  onDelete,
  onUpdateStatus,
}: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<EstimateStatus | 'ALL'>('ALL');

  const filtered = estimates.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page">
      <Header title="庭師見積ツール" showBack={false} />

      <div className="page-content">
        {/* 検索バー */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="案件名で検索…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {/* ステータスフィルター */}
        <div className="status-filter">
          {(['ALL', 'DRAFT', 'SUBMITTED', 'COMPLETED'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`status-filter-btn ${filterStatus === s ? 'status-filter-btn--active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'ALL' ? 'すべて' : ESTIMATE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* 新規作成ボタン */}
        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => navigate('/estimate/new')}
        >
          ＋ 新規見積作成
        </button>

        {/* 案件カード一覧 */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>案件がありません</p>
            <p className="text-sm text-muted">
              「＋ 新規見積作成」で最初の見積を作りましょう
            </p>
          </div>
        ) : (
          <div className="card-list">
            {filtered.map((est) => {
              const isCompleted = est.status === 'COMPLETED';
              return (
                <div
                  key={est.id}
                  className={`estimate-card ${isCompleted ? 'estimate-card--completed' : ''}`}
                >
                  <Link
                    to={`/estimate/${est.id}/summary`}
                    className="estimate-card-link"
                  >
                    <div className="estimate-card-header">
                      <div className="estimate-card-title-row">
                        <strong>{est.title}</strong>
                        <span className={`status-badge status-badge--${est.status.toLowerCase()}`}>
                          {ESTIMATE_STATUS_LABELS[est.status]}
                        </span>
                      </div>
                      <span className="text-sm text-muted">
                        {formatDate(est.updatedAt)}
                      </span>
                    </div>
                    <div className="estimate-card-body">
                      <span className="estimate-total">
                        {formatYen(est.totals.totalInclTaxRounded)}
                      </span>
                      <span className="text-sm text-muted">
                        (税抜 {formatYen(est.totals.totalExclTax)})
                      </span>
                    </div>
                  </Link>
                  <div className="estimate-card-actions">
                    {/* ステータス切り替え */}
                    {est.status === 'DRAFT' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-status-submit"
                        onClick={() => onUpdateStatus(est.id, 'SUBMITTED')}
                      >
                        📤 提出済にする
                      </button>
                    )}
                    {est.status === 'SUBMITTED' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onUpdateStatus(est.id, 'DRAFT')}
                        >
                          ✏️ 下書きに戻す
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-status-complete"
                          onClick={() => {
                            if (confirm('完了にすると編集できなくなります。よろしいですか？')) {
                              onUpdateStatus(est.id, 'COMPLETED');
                            }
                          }}
                        >
                          ✅ 完了にする
                        </button>
                      </>
                    )}
                    {est.status === 'COMPLETED' && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => onDuplicate(est.id)}
                      >
                        📋 複製して新規作成
                      </button>
                    )}

                    {/* 編集・複製・削除（完了以外） */}
                    {!isCompleted && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => navigate(`/estimate/${est.id}`)}
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onDuplicate(est.id)}
                        >
                          複製
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (confirm('この案件を削除しますか？')) {
                          onDelete(est.id);
                        }
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 設定リンク */}
        <div className="bottom-links">
          <Link to="/settings/prices" className="btn btn-outline">
            ⚙ 単価マスタ
          </Link>
        </div>
      </div>
    </div>
  );
}
