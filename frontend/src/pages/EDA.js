import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import {
  getNumericColumns,
  getCategoricalColumns,
  generateHistogram,
  generateBoxplot,
  generateCountplot,
  generateHeatmap,
  getApiBaseUrl
} from "../api";

function EDA() {
  const { edaData, setEdaData } = useContext(AppContext);

  const [numericCols, setNumericCols] = useState([]);
  const [categoricalCols, setCategoricalCols] = useState([]);

  const [selectedNum, setSelectedNum] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timestamp, setTimestamp] = useState(Date.now());

  const safeRender = (val) => {
    if (!val) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return val;
  };

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    try {
      const numData = await getNumericColumns();
      const catData = await getCategoricalColumns();

      setNumericCols(numData.columns || []);
      setCategoricalCols(catData.columns || []);

      if (numData.columns && numData.columns.length > 0) {
        setSelectedNum(numData.columns[0]);
      }
      if (catData.columns && catData.columns.length > 0) {
        setSelectedCat(catData.columns[0]);
      }
    } catch (err) {
      console.error("Failed to fetch columns:", err);
      setError("Failed to load columns. Please upload a dataset first.");
    }
  };

  const updateEDA = (data) => {
    setEdaData({
      chart: data.chart,
      aiInsight: data.ai_insight,
    });
    setTimestamp(Date.now());
  };

  const handleHistogram = async () => {
    if (!selectedNum) return alert("Please select a numeric column.");
    setLoading(true);
    setError("");
    try {
      const data = await generateHistogram(selectedNum);
      updateEDA(data);
    } catch (err) {
      setError(err.message || "Failed to generate histogram");
    } finally {
      setLoading(false);
    }
  };

  const handleBoxplot = async () => {
    if (!selectedNum) return alert("Please select a numeric column.");
    setLoading(true);
    setError("");
    try {
      const data = await generateBoxplot(selectedNum);
      updateEDA(data);
    } catch (err) {
      setError(err.message || "Failed to generate boxplot");
    } finally {
      setLoading(false);
    }
  };

  const handleCountplot = async () => {
    if (!selectedCat) return alert("Please select a categorical column.");
    setLoading(true);
    setError("");
    try {
      const data = await generateCountplot(selectedCat);
      updateEDA(data);
    } catch (err) {
      setError(err.message || "Failed to generate countplot");
    } finally {
      setLoading(false);
    }
  };

  const handleHeatmap = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await generateHeatmap();
      updateEDA(data);
    } catch (err) {
      setError(err.message || "Failed to generate correlation heatmap");
    } finally {
      setLoading(false);
    }
  };

  const chart = edaData?.chart;
  const aiInsight = edaData?.aiInsight;

  return (
    <div className="main">
      <h2 className="page-title">📈 Exploratory Data Analysis (EDA)</h2>
      <p className="page-subtitle">
        Interactive visualization with automated distribution and outlier analysis
      </p>

      {error && (
        <div className="card" style={{ background: "#fef2f2", color: "#dc2626" }}>
          ❌ {error}
        </div>
      )}

      {/* CONTROLS */}
      <div className="grid grid-2">
        {/* NUMERIC */}
        <div className="card">
          <h3>📈 Numerical Feature Analysis</h3>
          <p className="page-subtitle">Examine distributions, skewness, and outliers</p>

          <select
            className="input"
            value={selectedNum}
            onChange={(e) => setSelectedNum(e.target.value)}
          >
            <option value="">-- Choose Numeric Column --</option>
            {numericCols.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
            <button className="btn" onClick={handleHistogram} disabled={loading || !selectedNum}>
              📊 Histogram & KDE
            </button>

            <button
              className="btn"
              onClick={handleBoxplot}
              disabled={loading || !selectedNum}
              style={{ background: "#0284c7" }}
            >
              📦 Boxplot (Outliers)
            </button>
          </div>
        </div>

        {/* CATEGORICAL */}
        <div className="card">
          <h3>📊 Categorical Feature Analysis</h3>
          <p className="page-subtitle">Analyze frequency distributions and category balances</p>

          <select
            className="input"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">-- Choose Categorical Column --</option>
            {categoricalCols.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          <div style={{ marginTop: "15px" }}>
            <button
              className="btn"
              onClick={handleCountplot}
              disabled={loading || !selectedCat}
            >
              📊 Category Frequency Plot
            </button>
          </div>
        </div>
      </div>

      {/* HEATMAP CARD */}
      <div className="card">
        <h3>🔥 Multicollinearity & Correlation Analysis</h3>
        <p className="page-subtitle">
          Compute pairwise Pearson correlation matrix across all numeric features and target
        </p>

        <button className="btn" onClick={handleHeatmap} disabled={loading} style={{ background: "#8b5cf6" }}>
          🔥 Generate Correlation Heatmap
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "30px" }}>
          <p style={{ fontSize: "16px", color: "#475569" }}>⏳ Generating high-resolution chart and statistical insights...</p>
        </div>
      )}

      {/* RESULT DISPLAY */}
      {chart && (
        <div className="card">
          <h3>📉 Visualization Output</h3>

          <div style={{ textAlign: "center", margin: "15px 0" }}>
            <img
              src={`${getApiBaseUrl()}/${chart}?t=${timestamp}`}
              alt="EDA Chart"
              style={{
                width: "100%",
                maxWidth: "750px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "1px solid #e2e8f0"
              }}
            />
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              borderLeft: "4px solid #4CAF50"
            }}
          >
            <h4 style={{ color: "#166534", marginBottom: "6px" }}>💡 Statistical & AI Insights</h4>
            <p style={{ color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
              {safeRender(aiInsight)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EDA;