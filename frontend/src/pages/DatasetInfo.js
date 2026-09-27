import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { setTargetColumn as setTargetAPI } from "../api";
import { AppContext } from "../context/AppContext";

function DatasetInfo() {
  const { datasetInfo, targetColumn, setTargetColumn } = useContext(AppContext);
  const [target, setTarget] = useState(targetColumn || "");
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const safeRender = (value) => {
    try {
      if (value === null || value === undefined) return "—";
      if (typeof value === "object") return JSON.stringify(value);
      return value.toString();
    } catch {
      return "—";
    }
  };

  if (!datasetInfo) {
    return (
      <div className="main">
        <div className="card">
          <h2 className="page-title">📊 Dataset Overview</h2>
          <p style={{ color: "#d97706" }}>
            No dataset loaded in memory. Please upload a CSV dataset first.
          </p>
          <button
            className="btn"
            onClick={() => navigate("/")}
            style={{ marginTop: "15px" }}
          >
            📂 Go to Upload Page
          </button>
        </div>
      </div>
    );
  }

  const handleTarget = async () => {
    if (!target) {
      alert("Please select a target column from the dropdown.");
      return;
    }

    try {
      setLoading(true);
      const res = await setTargetAPI(target);
      setStatusMsg(res.message || `Target column set to '${target}'`);
      setTargetColumn(target);
    } catch (error) {
      console.error("Error setting target:", error);
      alert("Failed to set target column on backend.");
    } finally {
      setLoading(false);
    }
  };

  const allColumns = [
    ...(datasetInfo.numeric_columns || []),
    ...(datasetInfo.categorical_columns || []),
  ];

  return (
    <div className="main">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="page-title">📊 Dataset Overview</h2>
          <p className="page-subtitle">
            Explore schema, dimensions, missing value patterns, and feature distributions
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn" style={{ background: "#8b5cf6" }} onClick={() => navigate("/ai-report")}>
            🧠 AI Intelligence Report
          </button>
          <button className="btn" onClick={() => navigate("/clean")}>
            🧹 Go to Cleaning →
          </button>
        </div>
      </div>

      {/* TARGET SELECTION CARD */}
      <div className="card" style={{ borderLeft: "5px solid #4CAF50" }}>
        <h3>🎯 Target Feature (Supervised ML Target)</h3>
        <p className="page-subtitle">
          Select the column you want the machine learning algorithms to predict
        </p>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="input"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            style={{ minWidth: "250px", marginTop: 0 }}
          >
            <option value="">-- Choose Target Feature --</option>
            {allColumns.map((col) => (
              <option key={col} value={col}>
                {col} {datasetInfo.numeric_columns?.includes(col) ? "(Numeric)" : "(Categorical)"}
              </option>
            ))}
          </select>

          <button className="btn" onClick={handleTarget} disabled={loading || !target}>
            {loading ? "Setting Target..." : "Confirm Target Column"}
          </button>

          {targetColumn && (
            <span style={{ background: "#dcfce7", color: "#166534", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold" }}>
              Active Target: {targetColumn}
            </span>
          )}
        </div>

        {statusMsg && (
          <p style={{ marginTop: "10px", color: "#16a34a", fontSize: "14px" }}>
            ✅ {statusMsg}
          </p>
        )}
      </div>

      {/* SUMMARY METRICS */}
      <div className="grid grid-3">
        <div className="card">
          <h4>Total Rows</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "#4CAF50" }}>
            {safeRender(datasetInfo.rows?.toLocaleString())}
          </p>
        </div>

        <div className="card">
          <h4>Total Columns</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "#0284c7" }}>
            {safeRender(datasetInfo.columns)}
          </p>
        </div>

        <div className="card">
          <h4>Missing Values</h4>
          <div style={{ maxHeight: "100px", overflowY: "auto", fontSize: "13px" }}>
            {datasetInfo.missing_values &&
            Object.values(datasetInfo.missing_values).some((v) => v > 0) ? (
              Object.entries(datasetInfo.missing_values)
                .filter(([_, val]) => val > 0)
                .map(([col, val]) => (
                  <div key={col} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{col}:</span>
                    <strong style={{ color: "#ef4444" }}>{val}</strong>
                  </div>
                ))
            ) : (
              <p style={{ color: "#16a34a", fontWeight: "bold" }}>No missing values detected</p>
            )}
          </div>
        </div>
      </div>

      {/* SAMPLE DATA */}
      <div className="card">
        <h3>🧾 Sample Records (First 5 Rows)</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                {datasetInfo.sample_rows?.length > 0 &&
                  Object.keys(datasetInfo.sample_rows[0]).map((col) => (
                    <th key={col}>{col}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {datasetInfo.sample_rows?.map((row, i) => (
                <tr key={i}>
                  {Object.keys(row).map((key, j) => (
                    <td key={j}>{safeRender(row[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NUMERIC FEATURES */}
      <div className="card">
        <h3>📈 Numerical Features Summary</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Mean</th>
                <th>Std Dev</th>
                <th>Min</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {datasetInfo.numeric_summary &&
                Object.entries(datasetInfo.numeric_summary).map(([col, val]) => (
                  <tr key={col}>
                    <td><strong>{col}</strong></td>
                    <td>{safeRender(val?.mean)}</td>
                    <td>{safeRender(val?.std)}</td>
                    <td>{safeRender(val?.min)}</td>
                    <td>{safeRender(val?.max)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CATEGORICAL FEATURES */}
      <div className="card">
        <h3>📊 Categorical Features Summary</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Unique Classes</th>
                <th>Dominant Class (Mode)</th>
              </tr>
            </thead>
            <tbody>
              {datasetInfo.categorical_summary &&
                Object.entries(datasetInfo.categorical_summary).map(([col, val]) => (
                  <tr key={col}>
                    <td><strong>{col}</strong></td>
                    <td>{safeRender(val?.unique)}</td>
                    <td>{safeRender(val?.top)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DatasetInfo;