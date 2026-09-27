import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import { AppContext } from "./context/AppContext";

import UploadDataset from "./pages/UploadDataset";
import DatasetInfo from "./pages/DatasetInfo";
import AIReport from "./pages/AIReport";
import CleanDataset from "./pages/CleanDataset";
import EDA from "./pages/EDA";
import TrainSplit from "./pages/TrainSplit";
import TrainModel from "./pages/TrainModel";
import FeatureImportance from "./pages/FeatureImportance";
import ModelEvaluation from "./pages/ModelEvaluation";
import Predict from "./pages/Predict";
import DownloadModel from "./pages/DownloadModel";

function App() {
  const { targetColumn } = useContext(AppContext);

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<UploadDataset />} />
          <Route path="/dataset" element={<DatasetInfo />} />
          <Route path="/ai-report" element={<AIReport />} />
          <Route path="/clean" element={<CleanDataset />} />
          <Route path="/eda" element={<EDA />} />
          <Route path="/split" element={<TrainSplit target={targetColumn} />} />
          <Route path="/train" element={<TrainModel target={targetColumn} />} />
          <Route path="/feature" element={<FeatureImportance target={targetColumn} />} />
          <Route path="/evaluation" element={<ModelEvaluation />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/download" element={<DownloadModel />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;