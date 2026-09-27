import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { getApiBaseUrl } from "../api";

function AIReport() {
  const { datasetInfo } = useContext(AppContext);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    } catch (err) {
      setError(err.message || "Failed to contact AI service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (datasetInfo) {
      fetchAIReport();
    }
  }, [datasetInfo]);

  return (
    <div className="main">
      <h2 className="page-title">🧠 Gemini AI Dataset Intelligence</h2>
      <p className="page-subtitle">
        Deep automated exploratory analysis and data science recommendations powered by Google Gemini
      </p>

      {!datasetInfo && (
        <div className="card">
          <p style={{ color: "#d97706", fontWeight: "500" }}>
            ⚠️ No dataset loaded. Please upload a CSV dataset to generate AI insights.
          </p>
        </div>
      )}

      {datasetInfo && (
        <div className="card">
          <button className="btn" onClick={fetchAIReport} disabled={loading}>
            {loading ? "⏳ Analyzing with Gemini AI..." : "🔄 Refresh AI Insights"}
          </button>
        </div>
      )}

      {error && (
        <div className="card" style={{ background: "#fef2f2", color: "#991b1b" }}>
          <p>{error}</p>
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
