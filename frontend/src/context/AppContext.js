import React, { createContext, useState } from "react";

// Create Context
export const AppContext = createContext();

// Provider Component
export const AppProvider = ({ children }) => {
  // Global States
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [targetColumn, setTargetColumn] = useState(null);
  const [cleanedData, setCleanedData] = useState(null);
  const [trainedModel, setTrainedModel] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);    const [edaData, setEdaData] = useState(null);
  const [splitData, setSplitData] = useState(null);
  const [evaluationData, setEvaluationData] = useState(null);

  return (
    <AppContext.Provider
      value={{
        datasetInfo,
        setDatasetInfo,
        targetColumn,
        setTargetColumn,
        cleanedData,
        setCleanedData,
        trainedModel,
        setTrainedModel,
        featureImportance,
        setFeatureImportance,
        edaData,
        setEdaData,
        splitData,
        setSplitData,
        evaluationData,
        setEvaluationData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};  