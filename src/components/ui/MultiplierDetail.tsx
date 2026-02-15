import { OBSTACLE_LABELS, ALL_OBSTACLES } from '../../types/estimate';
import type { ObstacleCode } from '../../types/estimate';
import type { TreeSpeciesCode, TreeSpeciesMultiplier } from '../../types/master';
import { TREE_SPECIES_LABELS, TREE_SPECIES_CATEGORIES } from '../../types/master';

interface MultiplierDetailProps {
  multiplier: number;
  multiplierQty: number;
  totalQty: number;
  unit: string; // '本' | '袋' | 'kg'
  note: string;
  obstacles: ObstacleCode[];
  speciesCode?: string; // TreeSpeciesCode
  speciesMultiplier?: number;
  treeSpeciesMultipliers?: TreeSpeciesMultiplier[]; // 木の場合のみ渡す
  onMultiplierChange: (value: number) => void;
  onMultiplierQtyChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  onObstaclesChange: (obstacles: ObstacleCode[]) => void;
  onSpeciesChange?: (code: string | undefined, multiplier: number) => void;
  disabled?: boolean;
}

export function MultiplierDetail({
  multiplier,
  multiplierQty,
  totalQty,
  unit,
  note,
  obstacles,
  speciesCode,
  speciesMultiplier = 1.0,
  treeSpeciesMultipliers,
  onMultiplierChange,
  onMultiplierQtyChange,
  onNoteChange,
  onObstaclesChange,
  onSpeciesChange,
  disabled = false,
}: MultiplierDetailProps) {
  const toggleObstacle = (code: ObstacleCode) => {
    if (disabled) return;
    const next = obstacles.includes(code)
      ? obstacles.filter((c) => c !== code)
      : [...obstacles, code];
    onObstaclesChange(next);
  };

  const handleSpeciesSelect = (code: TreeSpeciesCode | undefined) => {
    if (!onSpeciesChange || disabled) return;
    if (!code) {
      onSpeciesChange(undefined, 1.0);
      return;
    }
    const found = treeSpeciesMultipliers?.find((s) => s.code === code);
    onSpeciesChange(code, found?.recommendedMultiplier ?? 1.0);
  };

  const normalQty = totalQty - Math.min(multiplierQty, totalQty);
  const isTree = unit === '本';

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

      {/* 樹種選択（木の場合のみ） */}
      {isTree && treeSpeciesMultipliers && onSpeciesChange && (
        <div className="multiplier-detail-field">
          <label className="multiplier-detail-label">樹種</label>
          <select
            className="form-input form-select"
            value={speciesCode || ''}
            onChange={(e) => handleSpeciesSelect((e.target.value || undefined) as TreeSpeciesCode | undefined)}
            disabled={disabled}
          >
            <option value="">なし（通常）</option>
            {Object.entries(TREE_SPECIES_CATEGORIES).map(([category, codes]) => (
              <optgroup key={category} label={category}>
                {codes.map((code) => (
                  <option key={code} value={code}>
                    {TREE_SPECIES_LABELS[code]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {speciesCode && speciesMultiplier !== 1.0 && (
            <div className="multiplier-detail-inputs" style={{ marginTop: 'var(--space-xs)' }}>
              <div className="multiplier-detail-field">
                <label className="multiplier-detail-label">樹種倍率</label>
                <input
                  type="number"
                  className="form-input form-input--multiplier"
                  value={speciesMultiplier}
                  onChange={(e) => onSpeciesChange(speciesCode, Number(e.target.value) || 1.0)}
                  min={1.0}
                  max={3.0}
                  step={0.1}
                  inputMode="decimal"
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 障害物チップ（理由選択） */}
      <div className="multiplier-detail-field">
        <label className="multiplier-detail-label">理由（障害物）</label>
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
