import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { getApiBaseUrl } from "../api";

function AIReport() {
  const { datasetInfo, setDatasetInfo } = useContext(AppContext);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchAIReport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiBaseUrl()}/dataset-info`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch AI insights");
      }
      setReport(data);
      if (!datasetInfo && data.summary) {
        setDatasetInfo({
          rows: data.summary.rows,
          columns: data.summary.columns,
          numeric_columns: data.summary.numeric_columns || [],
          categorical_columns: data.summary.categorical_columns || [],
          missing_values: data.summary.missing_values || {},
          sample_rows: []
        });
      }
    } catch (err) {
      setError(err.message || "Failed to contact AI service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIReport();
  }, []);

  return (
    <div className="main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="page-title">🧠 Gemini AI Dataset Intelligence</h2>
          <p className="page-subtitle">
            Deep automated exploratory analysis and data science recommendations powered by Google Gemini
          </p>
        </div>
        <button className="btn" onClick={() => navigate("/clean")}>
          🧹 Go to Data Cleaning →
        </button>
      </div>

      <div className="card" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn" onClick={fetchAIReport} disabled={loading}>
          {loading ? "⏳ Analyzing with Gemini AI..." : "🔄 Refresh AI Insights"}
        </button>
      </div>

      {error && (
        <div className="card" style={{ background: "#fef2f2", color: "#991b1b", borderLeft: "4px solid #ef4444" }}>
          <p>❌ {error}</p>
          <button className="btn" onClick={() => navigate("/")} style={{ marginTop: "10px" }}>
            📂 Upload a Dataset
          </button>
        </div>
      )}

      {loading && !report && (
        <div className="card" style={{ textAlign: "center", padding: "35px" }}>
          <p>⏳ Synthesizing statistical distributions and generating AI executive summary...</p>
        </div>
      )}

      {report && (
        <>
          <div className="card">
            <h3>🤖 Executive Data Scientist Summary</h3>
            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.7",
                color: "#1e293b",
                fontSize: "15px",
                background: "#f8fafc",
                padding: "20px",
                borderRadius: "8px",
                borderLeft: "4px solid #4CAF50",
                marginTop: "12px",
              }}
            >
              {report.ai_insights || "No insights generated."}
            </div>
          </div>

          {report.summary && (
            <div className="grid grid-3">
              <div className="card">
                <h4>Total Records</h4>
                <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4CAF50" }}>
                  {report.summary.rows?.toLocaleString()}
                </p>
              </div>
              <div className="card">
                <h4>Features Detected</h4>
                <p style={{ fontSize: "24px", fontWeight: "bold", color: "#0284c7" }}>
                  {report.summary.columns}
                </p>
              </div>
              <div className="card">
                <h4>Numerical Features</h4>
                <p style={{ fontSize: "24px", fontWeight: "bold", color: "#8b5cf6" }}>
                  {report.summary.numeric_columns?.length || 0}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AIReport;
