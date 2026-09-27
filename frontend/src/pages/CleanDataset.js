import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cleanDataset } from "../api";
import { AppContext } from "../context/AppContext";

function CleanDataset() {
  const { cleanedData, setCleanedData } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const safeRender = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return val.toString();
  };

  const handleClean = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await cleanDataset();
      setCleanedData(res.report);
      if (res.ai_insights) {
        setAiInsights(res.ai_insights);
      }
    } catch (err) {
      console.error("Cleaning failed:", err);
      setError(err.message || "Failed to clean dataset. Please ensure a dataset is uploaded first.");
    } finally {
      setLoading(false);
    }
  };

  const report = cleanedData;

  return (
    <div className="main">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="page-title">🧹 Automated Data Cleaning</h2>
          <p className="page-subtitle">
            Deduplication, robust median/mode imputation, and categorical feature encoding
          </p>
        </div>
        {report && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" style={{ background: "#0284c7" }} onClick={() => navigate("/eda")}>
              📈 View EDA Charts →
            </button>
            <button className="btn" onClick={() => navigate("/split")}>
              ✂️ Proceed to Split →
            </button>
          </div>
        )}
      </div>

      {/* CONTROL CARD */}
      <div className="card">
        <h3>Run Automated Preprocessing</h3>
        <p className="page-subtitle">
          Executes automatic missing value imputation, duplicate removal, and encoding on the active dataset
        </p>

        <button className="btn" onClick={handleClean} disabled={loading}>
          {loading ? "⏳ Cleaning and Imputing..." : "🚀 Run Full Data Cleaning"}
        </button>

        {error && (
          <div style={{ marginTop: "15px", color: "#dc2626", background: "#fef2f2", padding: "12px", borderRadius: "8px" }}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* AI INSIGHTS CARD */}
      {aiInsights && (
        <div className="card" style={{ borderLeft: "5px solid #8b5cf6" }}>
          <h3>🤖 AI Preprocessing Review</h3>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#334155", marginTop: "10px" }}>
            {aiInsights}
          </p>
        </div>
      )}

      {/* REPORT */}
      {report && (
        <div className="card">
          <h3>📋 Cleaning Summary</h3>

          <div className="grid grid-3">
            <div className="card">
              <h4>Duplicates Removed</h4>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4CAF50" }}>
                {safeRender(report.duplicates_removed)}
              </p>
            </div>

            <div className="card">
              <h4>Missing Values Imputed</h4>
              <div style={{ maxHeight: "90px", overflowY: "auto", fontSize: "13px", marginTop: "6px" }}>
                {report.missing_values_filled && Object.keys(report.missing_values_filled).length > 0 ? (
                  Object.entries(report.missing_values_filled).map(([col, count]) => (
                    <div key={col} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{col}:</span>
                      <strong style={{ color: "#0284c7" }}>{count} filled</strong>
                    </div>
                  ))
                ) : (
                  <span style={{ color: "#16a34a" }}>No missing values detected</span>
                )}
              </div>
            </div>

            <div className="card">
              <h4>Encoded Categoricals</h4>
              <p style={{ fontSize: "14px", marginTop: "6px", color: "#475569" }}>
                {report.encoded_columns?.length > 0
                  ? report.encoded_columns.join(", ")
                  : "None (All features numerical)"}
              </p>
            </div>
          </div>

          {/* SAMPLE CLEANED TABLE */}
          <h3 style={{ marginTop: "25px" }}>🧾 Cleaned Dataset Preview (First 5 Rows)</h3>

          {report.clean_sample && report.clean_sample.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    {Object.keys(report.clean_sample[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {report.clean_sample.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j}>{safeRender(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No sample data available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CleanDataset;