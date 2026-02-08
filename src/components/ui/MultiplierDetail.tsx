import { OBSTACLE_LABELS, ALL_OBSTACLES } from '../../types/estimate';
import type { ObstacleCode } from '../../types/estimate';

interface MultiplierDetailProps {
  multiplier: number;
  multiplierQty: number;
  totalQty: number;
  unit: string; // '本' | '袋' | 'kg'
  note: string;
  obstacles: ObstacleCode[];
  onMultiplierChange: (value: number) => void;
  onMultiplierQtyChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  onObstaclesChange: (obstacles: ObstacleCode[]) => void;
  disabled?: boolean;
}

export function MultiplierDetail({
  multiplier,
  multiplierQty,
  totalQty,
  unit,
  note,
  obstacles,
  onMultiplierChange,
  onMultiplierQtyChange,
  onNoteChange,
  onObstaclesChange,
  disabled = false,
}: MultiplierDetailProps) {
  const toggleObstacle = (code: ObstacleCode) => {
    if (disabled) return;
    const next = obstacles.includes(code)
      ? obstacles.filter((c) => c !== code)
      : [...obstacles, code];
    onObstaclesChange(next);
  };

  const normalQty = totalQty - Math.min(multiplierQty, totalQty);

  return (
    <div className="multiplier-detail">
      {/* 倍率 + 本数 */}
      <div className="multiplier-detail-inputs">
        <div className="multiplier-detail-field">
          <label className="multiplier-detail-label">倍率</label>
          <input
            type="number"
            className="form-input form-input--multiplier"
            value={multiplier}
            onChange={(e) => onMultiplierChange(Number(e.target.value) || 1.0)}
            min={0.1}
            max={5.0}
            step={0.1}
            inputMode="decimal"
            disabled={disabled}
          />
        </div>
        <div className="multiplier-detail-field">
          <label className="multiplier-detail-label">適用{unit}数</label>
          <input
            type="number"
            className="form-input form-input--sm"
            value={multiplierQty || ''}
            onChange={(e) => {
              const v = Math.max(0, Math.min(Number(e.target.value) || 0, totalQty));
              onMultiplierQtyChange(v);
            }}
            min={0}
            max={totalQty}
            inputMode="numeric"
            placeholder="0"
            disabled={disabled}
          />
        </div>
      </div>

      {/* 内訳サマリ */}
      {multiplierQty > 0 && multiplier !== 1.0 && (
        <div className="multiplier-detail-summary">
          通常 {normalQty}{unit} ＋ ×{multiplier.toFixed(1)} が {Math.min(multiplierQty, totalQty)}{unit}
        </div>
      )}

      {/* 障害物チップ（理由選択） */}
      <div className="multiplier-detail-field">
        <label className="multiplier-detail-label">理由</label>
        <div className="obstacle-chips">
          {ALL_OBSTACLES.map((code) => (
            <button
              key={code}
              type="button"
              className={`obstacle-chip ${obstacles.includes(code) ? 'obstacle-chip--active' : ''}`}
              onClick={() => toggleObstacle(code)}
              disabled={disabled}
            >
              {OBSTACLE_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      {/* 自由入力メモ */}
      <div className="multiplier-detail-field">
        <label className="multiplier-detail-label">メモ</label>
        <input
          type="text"
          className="form-input"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="自由入力"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
