import { OBSTACLE_LABELS, ALL_OBSTACLES } from '../../types/estimate';
import type { ObstacleCode } from '../../types/estimate';
import type { TreeSpeciesCode, TreeSpeciesMultiplier } from '../../types/master';
import { TREE_SPECIES_LABELS, TREE_SPECIES_CATEGORIES } from '../../types/master';

interface IndividualItemDetailProps {
  itemNumber: number;
  lineMultiplier: number;
  note: string;
  obstacles: ObstacleCode[];
  speciesCode?: string;
  speciesMultiplier?: number;
  treeSpeciesMultipliers?: TreeSpeciesMultiplier[];
  onMultiplierChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  onObstaclesChange: (obstacles: ObstacleCode[]) => void;
  onSpeciesChange?: (code: string | undefined, multiplier: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function IndividualItemDetail({
  itemNumber,
  lineMultiplier,
  note,
  obstacles,
  speciesCode,
  speciesMultiplier = 1.0,
  treeSpeciesMultipliers,
  onMultiplierChange,
  onNoteChange,
  onObstaclesChange,
  onSpeciesChange,
  onRemove,
  disabled = false,
}: IndividualItemDetailProps) {
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

  const totalMultiplier = lineMultiplier * speciesMultiplier;

  return (
    <div className="individual-item-detail">
      <div className="individual-item-header">
        <span className="individual-item-number">{itemNumber}本目</span>
        {!disabled && (
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={onRemove}
          >
            削除
          </button>
        )}
      </div>

      {/* 樹種選択 */}
      {treeSpeciesMultipliers && onSpeciesChange && (
        <div className="individual-item-field">
          <label className="individual-item-label">樹種</label>
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
            <div className="individual-item-multiplier-adjust">
              <label className="individual-item-label-sm">樹種倍率</label>
              <input
                type="number"
                className="form-input form-input--sm"
                value={speciesMultiplier}
                onChange={(e) => onSpeciesChange(speciesCode, Number(e.target.value) || 1.0)}
                min={1.0}
                max={3.0}
                step={0.1}
                inputMode="decimal"
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}

      {/* 障害物チップ */}
      <div className="individual-item-field">
        <label className="individual-item-label">理由（障害物）</label>
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

      {/* 障害物倍率調整 */}
      {obstacles.length > 0 && (
        <div className="individual-item-field">
          <label className="individual-item-label">障害物倍率</label>
          <input
            type="number"
            className="form-input form-input--sm"
            value={lineMultiplier}
            onChange={(e) => onMultiplierChange(Number(e.target.value) || 1.0)}
            min={1.0}
            max={5.0}
            step={0.1}
            inputMode="decimal"
            disabled={disabled}
          />
        </div>
      )}

      {/* メモ */}
      <div className="individual-item-field">
        <label className="individual-item-label">メモ</label>
        <input
          type="text"
          className="form-input"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="自由入力"
          disabled={disabled}
        />
      </div>

      {/* 合計倍率表示 */}
      {totalMultiplier !== 1.0 && (
        <div className="individual-item-summary">
          合計倍率: ×{totalMultiplier.toFixed(2)}
        </div>
      )}
    </div>
  );
}

