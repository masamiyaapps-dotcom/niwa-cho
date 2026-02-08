import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { formatYen, formatDate } from '../utils/format';
import type { Estimate } from '../types/estimate';

interface Props {
  estimates: Estimate[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EstimateListPage({ estimates, onDuplicate, onDelete }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = search
    ? estimates.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()),
      )
    : estimates;

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
            {filtered.map((est) => (
              <div key={est.id} className="estimate-card">
                <Link
                  to={`/estimate/${est.id}/tree`}
                  className="estimate-card-link"
                >
                  <div className="estimate-card-header">
                    <strong>{est.title}</strong>
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
            ))}
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

