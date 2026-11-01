import React, { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

const STORAGE_PREFIX = "autosmartml_";

const loadSaved = (key, defaultVal = null) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const saveItem = (key, val) => {
  try {
    if (val === null || val === undefined) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } else {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(val));
    }
  } catch (e) {}
};

export const AppProvider = ({ children }) => {
  const [datasetInfo, setDatasetInfoState] = useState(() => loadSaved("datasetInfo", null));
  const [targetColumn, setTargetColumnState] = useState(() => loadSaved("targetColumn", null));
  const [cleanedData, setCleanedDataState] = useState(() => loadSaved("cleanedData", null));
  const [trainedModel, setTrainedModelState] = useState(() => loadSaved("trainedModel", null));
  const [featureImportance, setFeatureImportanceState] = useState(() => loadSaved("featureImportance", null));
  const [edaData, setEdaDataState] = useState(() => loadSaved("edaData", null));
  const [splitData, setSplitDataState] = useState(() => loadSaved("splitData", null));
  const [evaluationData, setEvaluationDataState] = useState(() => loadSaved("evaluationData", null));

  const setDatasetInfo = (val) => {
    setDatasetInfoState(val);
    saveItem("datasetInfo", val);
  };

  const setTargetColumn = (val) => {
    setTargetColumnState(val);
    saveItem("targetColumn", val);
  };

  const setCleanedData = (val) => {
    setCleanedDataState(val);
    saveItem("cleanedData", val);
  };

  const setTrainedModel = (val) => {
    setTrainedModelState(val);
    saveItem("trainedModel", val);
  };

  const setFeatureImportance = (val) => {
    setFeatureImportanceState(val);
    saveItem("featureImportance", val);
  };

  const setEdaData = (val) => {
    setEdaDataState(val);
    saveItem("edaData", val);
  };

  const setSplitData = (val) => {
    setSplitDataState(val);
    saveItem("splitData", val);
  };

  const setEvaluationData = (val) => {
    setEvaluationDataState(val);
    saveItem("evaluationData", val);
  };

  const resetAll = () => {
    setDatasetInfo(null);
    setTargetColumn(null);
    setCleanedData(null);
    setTrainedModel(null);
    setFeatureImportance(null);
    setEdaData(null);
    setSplitData(null);
    setEvaluationData(null);
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  };

  // Sync with backend on first load if localStorage was empty
  useEffect(() => {
    const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
    if (!datasetInfo) {
      fetch(`${API_BASE}/dataset-info`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.summary && data.summary.rows > 0) {
            setDatasetInfo({
              rows: data.summary.rows,
              columns: data.summary.columns,
              numeric_columns: data.summary.numeric_columns,
              categorical_columns: data.summary.categorical_columns,
              missing_values: data.summary.missing_values,
              sample_rows: []
            });
          }
        })
        .catch(() => {});
    }
  }, []);

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
        resetAll
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
