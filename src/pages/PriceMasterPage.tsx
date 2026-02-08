import { Header } from '../components/ui/Header';
import { formatYen } from '../utils/format';
import type { PriceMaster } from '../types/master';
import { ROUNDING_LABELS } from '../types/master';
import { HEIGHT_CLASS_LABELS, TREE_WORK_LABELS, GROUND_WORK_LABELS, DISPOSAL_WORK_LABELS } from '../types/estimate';
import type { HeightClass, TreeWorkType } from '../types/estimate';

interface Props {
  priceMaster: PriceMaster;
}

const HEIGHT_CLASSES: HeightClass[] = ['H3', 'H4', 'H5', 'H7', 'H9', 'H11', 'H13'];
const TREE_WORKS: TreeWorkType[] = ['PRUNE', 'FELL', 'SPRAY'];

export function PriceMasterPage({ priceMaster }: Props) {
  const getTreePrice = (workType: TreeWorkType, hc: HeightClass): number => {
    const found = priceMaster.treePrices.find(
      (p) => p.workType === workType && p.heightClass === hc,
    );
    return found?.priceExclTax ?? 0;
  };

  return (
    <div className="page">
      <Header title="単価マスタ" />

      <div className="page-content">
        {/* 基本設定 */}
        <div className="master-section">
          <h2 className="section-title">基本設定</h2>
          <div className="master-info-row">
            <span>税率</span>
            <span>{(priceMaster.taxRate * 100).toFixed(0)}%</span>
          </div>
          <div className="master-info-row">
            <span>丸めルール</span>
            <span>{ROUNDING_LABELS[priceMaster.roundingRule]}</span>
          </div>
        </div>

        {/* 木の単価 */}
        <div className="master-section">
          <h2 className="section-title">木（税抜単価）</h2>
          <div className="price-table-wrapper">
            <table className="price-table">
              <thead>
                <tr>
                  <th>高さ</th>
                  {TREE_WORKS.map((wt) => (
                    <th key={wt}>{TREE_WORK_LABELS[wt]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEIGHT_CLASSES.map((hc) => (
                  <tr key={hc}>
                    <td>{HEIGHT_CLASS_LABELS[hc]}</td>
                    {TREE_WORKS.map((wt) => (
                      <td key={wt}>{formatYen(getTreePrice(wt, hc))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 除草単価 */}
        <div className="master-section">
          <h2 className="section-title">除草（税抜 / ㎡）</h2>
          {priceMaster.groundPrices.map((gp) => (
            <div key={gp.workType} className="master-info-row">
              <span>{GROUND_WORK_LABELS[gp.workType]}</span>
              <span>{formatYen(gp.pricePerUnit)}/㎡</span>
            </div>
          ))}
        </div>

        {/* 処分単価 */}
        <div className="master-section">
          <h2 className="section-title">処分（税抜）</h2>
          {priceMaster.disposalPrices.map((dp) => (
            <div key={dp.workType} className="master-info-row">
              <span>{DISPOSAL_WORK_LABELS[dp.workType]}</span>
              <span>
                {formatYen(dp.pricePerUnit)}/{dp.workType === 'BRANCH_BAG' ? '袋' : 'kg'}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted" style={{ marginTop: '1.5rem' }}>
          ※ 単価の編集機能は今後追加予定です
        </p>
      </div>
    </div>
  );
}

