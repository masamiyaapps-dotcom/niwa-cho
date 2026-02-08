import { Routes, Route } from 'react-router-dom';
import { useEstimateStore } from './store/useEstimateStore';
import { EstimateListPage } from './pages/EstimateListPage';
import { EstimateFormPage } from './pages/EstimateFormPage';
import { TreeInputPage } from './pages/TreeInputPage';
import { GroundInputPage } from './pages/GroundInputPage';
import { DisposalInputPage } from './pages/DisposalInputPage';
import { SummaryPage } from './pages/SummaryPage';
import { PriceMasterPage } from './pages/PriceMasterPage';
import './App.css';

function App() {
  const store = useEstimateStore();

  const handleSave = (est: import('./types/estimate').Estimate) => {
    const exists = store.getEstimate(est.id);
    if (exists) {
      return store.updateEstimate(est);
    }
    return store.addEstimate(est);
  };

  return (
    <div className="app">
      <Routes>
        {/* 案件一覧 */}
        <Route
          path="/"
          element={
            <EstimateListPage
              estimates={store.estimates}
              onDuplicate={store.duplicateEstimate}
              onDelete={store.deleteEstimate}
            />
          }
        />

        {/* 案件基本情報 - 新規 */}
        <Route
          path="/estimate/new"
          element={
            <EstimateFormPage
              getEstimate={store.getEstimate}
              onSave={handleSave}
            />
          }
        />

        {/* 案件基本情報 - 編集 */}
        <Route
          path="/estimate/:id"
          element={
            <EstimateFormPage
              getEstimate={store.getEstimate}
              onSave={handleSave}
            />
          }
        />

        {/* 木入力 */}
        <Route
          path="/estimate/:id/tree"
          element={
            <TreeInputPage
              getEstimate={store.getEstimate}
              onUpdate={store.updateEstimate}
              priceMaster={store.priceMaster}
            />
          }
        />

        {/* 除草/地面 */}
        <Route
          path="/estimate/:id/ground"
          element={
            <GroundInputPage
              getEstimate={store.getEstimate}
              onUpdate={store.updateEstimate}
              priceMaster={store.priceMaster}
            />
          }
        />

        {/* 処分・作業環境 */}
        <Route
          path="/estimate/:id/disposal"
          element={
            <DisposalInputPage
              getEstimate={store.getEstimate}
              onUpdate={store.updateEstimate}
              priceMaster={store.priceMaster}
            />
          }
        />

        {/* 合計 */}
        <Route
          path="/estimate/:id/summary"
          element={
            <SummaryPage
              getEstimate={store.getEstimate}
              onUpdate={store.updateEstimate}
              priceMaster={store.priceMaster}
            />
          }
        />

        {/* 単価マスタ */}
        <Route
          path="/settings/prices"
          element={
            <PriceMasterPage
              priceMaster={store.priceMaster}
              onUpdate={store.setPriceMaster}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
