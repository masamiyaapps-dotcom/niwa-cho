import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { CompletedBanner } from '../components/ui/CompletedBanner';
import type { Estimate } from '../types/estimate';
import { createEmptyEstimate } from '../store/useEstimateStore';

interface Props {
  getEstimate: (id: string) => Estimate | undefined;
  onSave: (estimate: Estimate) => Estimate;
}

export function EstimateFormPage({ getEstimate, onSave }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // 編集モードなら既存データをロード
  useEffect(() => {
    if (!isNew && id) {
      const existing = getEstimate(id);
      if (existing) {
        setTitle(existing.title);
        setAddress(existing.address ?? '');
        setMemo(existing.memo ?? '');
        setScheduledDate(existing.scheduledDate ?? '');
        setIsLocked(existing.status === 'COMPLETED');
      }
    }
  }, [id, isNew, getEstimate]);

  // 完了済の場合はリダイレクト
  if (isLocked && !isNew) {
    return (
      <div className="page">
        <Header
          title="案件情報"
          rightAction={<Link to="/" className="header-home-btn" aria-label="一覧へ">🏠 一覧</Link>}
        />
        <CompletedBanner />
        <div className="page-content">
          <div className="form">
            <div className="form-group">
              <label className="form-label">案件名</label>
              <div className="locked-value">{title}</div>
            </div>
            {address && (
              <div className="form-group">
                <label className="form-label">住所</label>
                <div className="locked-value">{address}</div>
              </div>
            )}
            {scheduledDate && (
              <div className="form-group">
                <label className="form-label">作業予定日</label>
                <div className="locked-value">{scheduledDate}</div>
              </div>
            )}
            {memo && (
              <div className="form-group">
                <label className="form-label">メモ</label>
                <div className="locked-value">{memo}</div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-full"
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/')}
          >
            📋 案件一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let estimate: Estimate;
    if (isNew) {
      estimate = createEmptyEstimate(title.trim());
    } else {
      const existing = getEstimate(id!);
      if (!existing) return;
      estimate = { ...existing };
    }

    estimate.title = title.trim();
    estimate.address = address.trim() || undefined;
    estimate.memo = memo.trim() || undefined;
    estimate.scheduledDate = scheduledDate || undefined;

    const saved = onSave(estimate);
    navigate(`/estimate/${saved.id}/tree`);
  };

  return (
    <div className="page">
      <Header
        title={isNew ? '新規見積' : '案件情報 編集'}
        rightAction={<Link to="/" className="header-home-btn" aria-label="一覧へ">🏠 一覧</Link>}
      />

      <div className="page-content">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              案件名 <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：山田邸 庭木剪定"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">
              住所
            </label>
            <input
              id="address"
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例：東京都世田谷区…"
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduledDate" className="form-label">
              作業予定日
            </label>
            <input
              id="scheduledDate"
              type="date"
              className="form-input"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="memo" className="form-label">
              メモ
            </label>
            <textarea
              id="memo"
              className="form-input form-textarea"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="現場メモ、注意点など"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!title.trim()}
          >
            保存して次へ →
          </button>
        </form>
      </div>
    </div>
  );
}
