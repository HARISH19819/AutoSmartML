import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { splitDataset, setTargetColumn as setTargetAPI, getNumericColumns, getCategoricalColumns } from "../api";
import { AppContext } from "../context/AppContext";

function TrainSplit() {
  const { datasetInfo, targetColumn, setTargetColumn, splitData, setSplitData } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localTarget, setLocalTarget] = useState(targetColumn || "");
  const [availableColumns, setAvailableColumns] = useState([]);
  const navigate = useNavigate();

  const safeRender = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return val.toString();
  };

  useEffect(() => {
    if (targetColumn) {
      setLocalTarget(targetColumn);
    }
  }, [targetColumn]);

  useEffect(() => {
    if (datasetInfo) {
      setAvailableColumns([
        ...(datasetInfo.numeric_columns || []),
        ...(datasetInfo.categorical_columns || []),
      ]);
    } else {
      Promise.all([getNumericColumns(), getCategoricalColumns()])
        .then(([num, cat]) => {
          setAvailableColumns([...(num.columns || []), ...(cat.columns || [])]);
        })
        .catch(() => {});
    }
  }, [datasetInfo]);

  const handleSplit = async (size) => {
    const targetToUse = targetColumn || localTarget;

    if (!targetToUse) {
      setError("Please select and confirm a target column before performing the train-test split.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await setTargetAPI(targetToUse);
      setTargetColumn(targetToUse);

      const res = await splitDataset(targetToUse, size);
      setSplitData(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Split operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const result = splitData;

  return (
    <div className="main">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="page-title">✂️ Train-Test Split</h2>
          <p className="page-subtitle">
            Partition your preprocessed dataset into training and validation sets for model training
          </p>
        </div>
        {result && (
          <button className="btn" onClick={() => navigate("/train")}>
            🤖 Proceed to Model Training →
          </button>
        )}
      </div>

      {error && (
        <div className="card" style={{ background: "#fef2f2", color: "#dc2626" }}>
          ❌ {error}
        </div>
      )}

      {/* TARGET SELECTION IF NOT SET */}
      <div className="card" style={{ borderLeft: targetColumn ? "5px solid #10b981" : "5px solid #f59e0b" }}>
        <h3>🎯 Target Feature Configuration</h3>
        <p className="page-subtitle">
          {targetColumn
            ? `Active Supervised Target: ${targetColumn}`
            : "Select the target column you want to predict:"}
        </p>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="input"
            value={localTarget}
            onChange={(e) => setLocalTarget(e.target.value)}
            style={{ marginTop: 0, minWidth: "240px" }}
          >
            <option value="">-- Choose Target Feature --</option>
            {availableColumns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          <button
            className="btn"
            onClick={async () => {
              if (localTarget) {
                try {
                  await setTargetAPI(localTarget);
                  setTargetColumn(localTarget);
                  setError("");
                } catch (e) {
                  setError("Failed to save target column.");
                }
              }
            }}
            disabled={!localTarget || localTarget === targetColumn}
          >
            {localTarget === targetColumn ? "✓ Target Saved" : "Save Target"}
          </button>
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="card">
        <h3>Choose Partition Ratio</h3>
        <p className="page-subtitle">
          Stratified partitioning for target: <strong>{targetColumn || localTarget || "Not Specified"}</strong>
        </p>

        <div className="grid grid-3">
          <button
            className="btn"
            onClick={() => handleSplit(0.3)}
            disabled={loading || (!targetColumn && !localTarget)}
          >
            📊 70% Train / 30% Test
          </button>

          <button
            className="btn"
            onClick={() => handleSplit(0.2)}
            disabled={loading || (!targetColumn && !localTarget)}
            style={{ background: "#0284c7" }}
          >
            📊 80% Train / 20% Test (Recommended)
          </button>

          <button
            className="btn"
            onClick={() => handleSplit(0.1)}
            disabled={loading || (!targetColumn && !localTarget)}
            style={{ background: "#8b5cf6" }}
          >
            📊 90% Train / 10% Test
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "25px" }}>
          <p>⏳ Splitting dataset and generating stratified partitions...</p>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="card">
          <h3>📊 Split Verification</h3>

          <div className="grid grid-3">
            <div className="card">
              <h4>Training Samples</h4>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: "#4CAF50" }}>
                {safeRender(result.train_rows?.toLocaleString())}
              </p>
            </div>

            <div className="card">
              <h4>Testing Samples</h4>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: "#0284c7" }}>
                {safeRender(result.test_rows?.toLocaleString())}
              </p>
            </div>

            <div className="card">
              <h4>Engineered Features</h4>
              <p style={{ fontSize: "28px", fontWeight: "bold", color: "#8b5cf6" }}>
                {safeRender(result.features)}
              </p>
            </div>
          </div>

          <div style={{ marginTop: "20px", padding: "14px", background: "#f8fafc", borderRadius: "8px" }}>
            <p>🎯 <b>Target Feature:</b> {safeRender(result.target || targetColumn)}</p>
            <p style={{ marginTop: "6px" }}>
              📐 <b>Partition Distribution:</b>{" "}
              {result.test_size
                ? `${Math.round((1 - result.test_size) * 100)}% Train / ${Math.round(result.test_size * 100)}% Test`
                : "Standard Split"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainSplit;
