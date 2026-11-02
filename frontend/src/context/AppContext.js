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

  // Sync with backend on mount to restore workspace state seamlessly across refreshes
  useEffect(() => {
    const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
    fetch(`${API_BASE}/pipeline-state`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.has_dataset) {
          // Sync datasetInfo
          setDatasetInfoState((prev) => {
            const updated = {
              rows: data.rows,
              columns: data.columns,
              numeric_columns: data.numeric_columns || [],
              categorical_columns: data.categorical_columns || [],
              missing_values: data.missing_values || {},
              sample_rows: data.sample_rows || []
            };
            saveItem("datasetInfo", updated);
            return updated;
          });

          // Sync targetColumn if present on backend
          if (data.target_column) {
            setTargetColumnState((prev) => {
              const target = prev || data.target_column;
              saveItem("targetColumn", target);
              return target;
            });
          }

          // Sync trainedModel if present on backend
          if (data.trained_model) {
            setTrainedModelState((prev) => {
              const model = prev || data.trained_model;
              saveItem("trainedModel", model);
              return model;
            });
          }
        }
      })
      .catch(() => {});
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
