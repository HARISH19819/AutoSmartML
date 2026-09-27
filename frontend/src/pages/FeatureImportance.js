import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFeatureImportance } from "../api";
import { AppContext } from "../context/AppContext";

function FeatureImportance() {
  const {
    targetColumn,
    featureImportance,
    setFeatureImportance,
  } = useContext(AppContext);

  const [showTop10, setShowTop10] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const safeRender = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return val.toString();
  };

  const handleClick = async () => {
    if (!targetColumn) {
      setError("Please select a target column first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getFeatureImportance(targetColumn);
      if (res.error) {
        throw new Error(res.error);
      }
      setFeatureImportance(res);
    } catch (err) {
      console.error("Error fetching feature importance:", err);
      setError(err.message || "Failed to calculate feature importance.");
    } finally {
      setLoading(false);
    }
  };

  const importance = featureImportance;

  let sortedData = [];
  if (importance) {
    sortedData = Object.entries(importance).sort((a, b) => b[1] - a[1]);
    if (showTop10) {
      sortedData = sortedData.slice(0, 10);
    }
  }

  const maxValue = sortedData.length > 0 ? (sortedData[0][1] || 1) : 1;

  return (
    <div className="main">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="page-title">🔥 Feature Importance</h2>
          <p className="page-subtitle">
            Identify the most predictive features driving your machine learning model decisions
          </p>
        </div>
        <button className="btn" onClick={() => navigate("/evaluation")}>
          📉 Go to Model Evaluation →
        </button>
      </div>

      {error && (
        <div className="card" style={{ background: "#fef2f2", color: "#dc2626" }}>
          ❌ {error}
        </div>
      )}

      {/* CONTROL */}
      <div className="card">
        <h3>Feature Importance Computation</h3>
        <p className="page-subtitle">
          Target column: <strong>{targetColumn || <span style={{ color: "#ef4444" }}>Not Configured</span>}</strong>
        </p>

        <button className="btn" onClick={handleClick} disabled={loading || !targetColumn}>
          {loading ? "⏳ Computing Random Forest Gini Importance..." : "🚀 Compute Feature Importance"}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "30px" }}>
          <p>⏳ Training ensemble model to measure feature contributions...</p>
        </div>
      )}

      {/* RESULT */}
      {importance && (
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px"
            }}
          >
            <h3>📈 Feature Importance Ranking ({showTop10 ? "Top 10" : "All Features"})</h3>

            <button
              className="btn"
              onClick={() => setShowTop10(!showTop10)}
              style={{ background: "#0284c7" }}
            >
              {showTop10 ? "Show All Features" : "Show Top 10 Only"}
            </button>
          </div>

          <p style={{ marginBottom: "15px", color: "#64748b" }}>
            🎯 Target Feature: <strong>{safeRender(targetColumn)}</strong>
          </p>

          <div>
            {sortedData.length > 0 ? (
              sortedData.map(([feature, value]) => {
                const percentage = ((value / maxValue) * 100).toFixed(1);
                const scoreDisplay = typeof value === "number" ? value.toFixed(4) : value;

                return (
                  <div
                    key={feature}
                    style={{
                      marginBottom: "14px",
                      padding: "12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      background: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        fontSize: "14px"
                      }}
                    >
                      <strong style={{ color: "#1e293b" }}>{feature}</strong>
                      <span style={{ color: "#475569", fontWeight: "bold" }}>
                        Score: {scoreDisplay} ({percentage}%)
                      </span>
                    </div>

                    <div
                      style={{
                        height: "22px",
                        width: "100%",
                        background: "#e2e8f0",
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          background: "linear-gradient(90deg, #10b981, #34d399)",
                          borderRadius: "6px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No feature importance data computed.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FeatureImportance;