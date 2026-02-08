import { useState } from 'react';
import { Header } from '../components/ui/Header';
import type { PriceMaster, RoundingRule, AdjustmentTemplate } from '../types/master';
import { ROUNDING_LABELS } from '../types/master';
import {
  HEIGHT_CLASS_LABELS,
  TREE_WORK_LABELS,
  GROUND_WORK_LABELS,
  DISPOSAL_WORK_LABELS,
  OBSTACLE_LABELS,
} from '../types/estimate';
import type { HeightClass, TreeWorkType, ObstacleCode } from '../types/estimate';
import { generateId } from '../utils/format';

interface Props {
  priceMaster: PriceMaster;
  onUpdate: (master: PriceMaster) => void;
}

const HEIGHT_CLASSES: HeightClass[] = ['H3', 'H4', 'H5', 'H7', 'H9', 'H11', 'H13'];
const TREE_WORKS: TreeWorkType[] = ['PRUNE', 'FELL', 'SPRAY'];
const ROUNDING_OPTIONS: RoundingRule[] = ['NONE', 'ROUND_10', 'ROUND_100'];

export function PriceMasterPage({ priceMaster, onUpdate }: Props) {
  const [master, setMaster] = useState<PriceMaster>(() => structuredClone(priceMaster));
  const [saved, setSaved] = useState(false);

  // ─── ヘルパー ───
  const update = (partial: Partial<PriceMaster>) => {
    setMaster((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  };

  const handleSave = () => {
    onUpdate(master);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ─── 木の単価 ───
  const getTreePrice = (workType: TreeWorkType, hc: HeightClass): number => {
    const found = master.treePrices.find(
      (p) => p.workType === workType && p.heightClass === hc,
    );
    return found?.priceExclTax ?? 0;
  };

  const setTreePrice = (workType: TreeWorkType, hc: HeightClass, value: number) => {
    const newPrices = [...master.treePrices];
    const idx = newPrices.findIndex(
      (p) => p.workType === workType && p.heightClass === hc,
    );
    if (idx >= 0) {
      newPrices[idx] = { ...newPrices[idx], priceExclTax: value };
    } else {
      newPrices.push({ workType, heightClass: hc, priceExclTax: value });
    }
    update({ treePrices: newPrices });
  };

  // ─── 除草単価 ───
  const setGroundPrice = (workType: string, value: number) => {
    const newPrices = master.groundPrices.map((p) =>
      p.workType === workType ? { ...p, pricePerUnit: value } : p,
    );
    update({ groundPrices: newPrices });
  };

  // ─── 処分単価 ───
  const setDisposalPrice = (workType: string, value: number) => {
    const newPrices = master.disposalPrices.map((p) =>
      p.workType === workType ? { ...p, pricePerUnit: value } : p,
    );
    update({ disposalPrices: newPrices });
  };

  // ─── 障害物倍率 ───
  const setObstacleMultiplier = (
    code: ObstacleCode,
    field: 'recommendedMultiplier' | 'minMultiplier' | 'maxMultiplier',
    value: number,
  ) => {
    const newMultipliers = master.obstacleMultipliers.map((m) =>
      m.code === code ? { ...m, [field]: value } : m,
    );
    update({ obstacleMultipliers: newMultipliers });
  };

  // ─── 追加費用テンプレート ───
  const updateTemplate = (id: string, partial: Partial<AdjustmentTemplate>) => {
    const newTemplates = master.adjustmentTemplates.map((t) =>
      t.id === id ? { ...t, ...partial } : t,
    );
    update({ adjustmentTemplates: newTemplates });
  };

  const addTemplate = () => {
    const newTpl: AdjustmentTemplate = {
      id: generateId(),
      label: '',
      defaultAmountExclTax: 0,
      type: 'ADD',
    };
    update({ adjustmentTemplates: [...master.adjustmentTemplates, newTpl] });
  };

  const removeTemplate = (id: string) => {
    update({
      adjustmentTemplates: master.adjustmentTemplates.filter((t) => t.id !== id),
    });
  };

  return (
    <div className="page">
      <Header title="単価マスタ 編集" />

      <div className="page-content">
        {/* 保存ボタン（上部固定） */}
        <div className="master-save-bar">
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={handleSave}
          >
            {saved ? '✅ 保存しました' : '💾 保存する'}
          </button>
        </div>

        {/* ─── 基本設定 ─── */}
        <div className="master-section">
          <h2 className="section-title">基本設定</h2>

          <div className="master-edit-row">
            <label className="master-edit-label">税率（%）</label>
            <input
              type="number"
              className="form-input form-input--sm"
              value={master.taxRate * 100}
              onChange={(e) =>
                update({ taxRate: (Number(e.target.value) || 0) / 100 })
              }
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
            />
          </div>

          <div className="master-edit-row">
            <label className="master-edit-label">丸めルール</label>
            <select
              className="form-input form-select"
              value={master.roundingRule}
              onChange={(e) =>
                update({ roundingRule: e.target.value as RoundingRule })
              }
            >
              {ROUNDING_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROUNDING_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── 木の単価テーブル ─── */}
        <div className="master-section">
          <h2 className="section-title">木（税抜単価 / 本）</h2>
          {TREE_WORKS.map((wt) => (
            <div key={wt} className="master-subsection">
              <h3 className="section-subtitle">{TREE_WORK_LABELS[wt]}</h3>
              <div className="master-price-list">
                {HEIGHT_CLASSES.map((hc) => (
                  <div key={hc} className="master-edit-row">
                    <label className="master-edit-label">
                      {HEIGHT_CLASS_LABELS[hc]}
                    </label>
                    <div className="master-edit-input-wrap">
                      <span className="input-prefix">¥</span>
                      <input
                        type="number"
                        className="form-input form-input--price"
                        value={getTreePrice(wt, hc) || ''}
                        onChange={(e) =>
                          setTreePrice(wt, hc, Number(e.target.value) || 0)
                        }
                        min={0}
                        step={100}
                        inputMode="numeric"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ─── 除草単価 ─── */}
        <div className="master-section">
          <h2 className="section-title">除草（税抜 / ㎡）</h2>
          <div className="master-price-list">
            {master.groundPrices.map((gp) => (
              <div key={gp.workType} className="master-edit-row">
                <label className="master-edit-label">
                  {GROUND_WORK_LABELS[gp.workType]}
                </label>
                <div className="master-edit-input-wrap">
                  <span className="input-prefix">¥</span>
                  <input
                    type="number"
                    className="form-input form-input--price"
                    value={gp.pricePerUnit || ''}
                    onChange={(e) =>
                      setGroundPrice(gp.workType, Number(e.target.value) || 0)
                    }
                    min={0}
                    step={10}
                    inputMode="numeric"
                    placeholder="0"
                  />
                  <span className="input-suffix">/㎡</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 処分単価 ─── */}
        <div className="master-section">
          <h2 className="section-title">処分（税抜）</h2>
          <div className="master-price-list">
            {master.disposalPrices.map((dp) => {
              const unit = dp.workType === 'BRANCH_BAG' ? '袋' : 'kg';
              return (
                <div key={dp.workType} className="master-edit-row">
                  <label className="master-edit-label">
                    {DISPOSAL_WORK_LABELS[dp.workType]}
                  </label>
                  <div className="master-edit-input-wrap">
                    <span className="input-prefix">¥</span>
                    <input
                      type="number"
                      className="form-input form-input--price"
                      value={dp.pricePerUnit || ''}
                      onChange={(e) =>
                        setDisposalPrice(dp.workType, Number(e.target.value) || 0)
                      }
                      min={0}
                      step={10}
                      inputMode="numeric"
                      placeholder="0"
                    />
                    <span className="input-suffix">/{unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 障害物倍率 ─── */}
        <div className="master-section">
          <h2 className="section-title">障害物倍率</h2>
          <div className="master-price-list">
            {master.obstacleMultipliers.map((om) => (
              <div key={om.code} className="master-obstacle-row">
                <span className="master-obstacle-label">
                  {OBSTACLE_LABELS[om.code]}
                </span>
                <div className="master-obstacle-inputs">
                  <div className="master-obstacle-field">
                    <span className="text-sm text-muted">推奨</span>
                    <input
                      type="number"
                      className="form-input form-input--multiplier"
                      value={om.recommendedMultiplier}
                      onChange={(e) =>
                        setObstacleMultiplier(
                          om.code,
                          'recommendedMultiplier',
                          Number(e.target.value) || 1.0,
                        )
                      }
                      min={1.0}
                      max={3.0}
                      step={0.1}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="master-obstacle-field">
                    <span className="text-sm text-muted">最小</span>
                    <input
                      type="number"
                      className="form-input form-input--multiplier"
                      value={om.minMultiplier}
                      onChange={(e) =>
                        setObstacleMultiplier(
                          om.code,
                          'minMultiplier',
                          Number(e.target.value) || 1.0,
                        )
                      }
                      min={1.0}
                      max={3.0}
                      step={0.1}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="master-obstacle-field">
                    <span className="text-sm text-muted">最大</span>
                    <input
                      type="number"
                      className="form-input form-input--multiplier"
                      value={om.maxMultiplier}
                      onChange={(e) =>
                        setObstacleMultiplier(
                          om.code,
                          'maxMultiplier',
                          Number(e.target.value) || 1.0,
                        )
                      }
                      min={1.0}
                      max={3.0}
                      step={0.1}
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 追加費用テンプレート ─── */}
        <div className="master-section">
          <h2 className="section-title">追加費用テンプレート</h2>
          <div className="master-price-list">
            {master.adjustmentTemplates.map((tpl) => (
              <div key={tpl.id} className="master-template-row">
                <div className="master-template-fields">
                  <input
                    type="text"
                    className="form-input"
                    value={tpl.label}
                    onChange={(e) =>
                      updateTemplate(tpl.id, { label: e.target.value })
                    }
                    placeholder="項目名"
                  />
                  <div className="master-template-bottom">
                    <select
                      className="form-input form-select form-select--sm"
                      value={tpl.type}
                      onChange={(e) =>
                        updateTemplate(tpl.id, {
                          type: e.target.value as 'ADD' | 'DISCOUNT',
                        })
                      }
                    >
                      <option value="ADD">追加</option>
                      <option value="DISCOUNT">値引</option>
                    </select>
                    <div className="master-edit-input-wrap">
                      <span className="input-prefix">¥</span>
                      <input
                        type="number"
                        className="form-input form-input--price"
                        value={Math.abs(tpl.defaultAmountExclTax) || ''}
                        onChange={(e) => {
                          const abs = Math.abs(Number(e.target.value) || 0);
                          updateTemplate(tpl.id, {
                            defaultAmountExclTax:
                              tpl.type === 'DISCOUNT' ? -abs : abs,
                          });
                        }}
                        min={0}
                        step={100}
                        inputMode="numeric"
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeTemplate(tpl.id)}
                      aria-label="削除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-full"
            onClick={addTemplate}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            ＋ テンプレート追加
          </button>
        </div>

        {/* 保存ボタン（下部） */}
        <div className="master-save-bar" style={{ marginTop: 'var(--space-xl)' }}>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={handleSave}
          >
            {saved ? '✅ 保存しました' : '💾 保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}
