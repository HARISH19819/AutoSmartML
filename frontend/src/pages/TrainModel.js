import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trainModel, getDownloadModelUrl } from "../api";
import { AppContext } from "../context/AppContext";

function TrainModel() {
  const { targetColumn, trainedModel, setTrainedModel } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const safeRender = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return val.toString();
  };

  const handleTraining = async () => {
    if (!targetColumn) {
      setError("Please set a target column in the Dataset Overview or Split page first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await trainModel(targetColumn);
      if (res.error) {
        throw new Error(res.error);
      }
      setTrainedModel(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Model training failed.");
    } finally {
      setLoading(false);
    }
  };

  const result = trainedModel;

  return (
    <div className="main">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="page-title">🤖 AutoML Model Training</h2>
          <p className="page-subtitle">
            Automatically benchmark multiple scikit-learn models and select the optimal pipeline
          </p>
        </div>

        {result && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button className="btn" style={{ background: "#8b5cf6" }} onClick={() => navigate("/feature")}>
              🔥 Feature Importance →
            </button>
            <button className="btn" style={{ background: "#0284c7" }} onClick={() => navigate("/evaluation")}>
              📉 Model Evaluation →
            </button>
            <button className="btn" onClick={() => window.open(getDownloadModelUrl(), "_blank")}>
              📦 Download .joblib
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="card" style={{ background: "#fef2f2", color: "#dc2626" }}>
          ❌ {error}
        </div>
      )}

      {/* TRAINING CONTROL */}
      <div className="card">
        <h3>Training Execution Control</h3>
        <p className="page-subtitle">
          Target column: <strong>{targetColumn || <span style={{ color: "#ef4444" }}>Not Configured</span>}</strong>
        </p>

        <button
          className="btn"
          onClick={handleTraining}
          disabled={loading || !targetColumn}
          style={{ fontSize: "16px", padding: "12px 24px" }}
        >
          {loading ? "⏳ Training & Benchmarking Models..." : "🚀 Train All AutoML Models"}
        </button>
      </div>

      {/* LOADING INDICATOR */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "35px" }}>
          <p style={{ fontSize: "16px", color: "#475569" }}>
            🤖 Fitting Linear/Logistic Regression, Decision Trees, and Random Forests with Cross-Validation...
          </p>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {result && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3>🏆 Leaderboard & Benchmark Scores</h3>
            <span
              style={{
                background: result.problem_type === "classification" ? "#ede9fe" : "#e0f2fe",
                color: result.problem_type === "classification" ? "#6d28d9" : "#0369a1",
                padding: "6px 14px",
                borderRadius: "20px",
                fontWeight: "bold",
                fontSize: "13px",
                textTransform: "uppercase"
              }}
            >
              Task: {result.problem_type || "AutoML"}
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Primary Metric ({result.problem_type === "classification" ? "Accuracy" : "R² Score"})</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.scores &&
                  Object.entries(result.scores).map(([model, score]) => {
                    const isBest = model === result.best_model;
                    return (
                      <tr
                        key={model}
                        style={{
                          background: isBest ? "#f0fdf4" : "transparent",
                          fontWeight: isBest ? "bold" : "normal"
                        }}
                      >
                        <td>
                          {isBest && "⭐ "}
                          {model}
                        </td>
                        <td style={{ color: isBest ? "#16a34a" : "inherit" }}>
                          {typeof score === "number" ? score.toFixed(4) : safeRender(score)}
                        </td>
                        <td>
                          {isBest ? (
                            <span style={{ color: "#16a34a", background: "#dcfce7", padding: "4px 8px", borderRadius: "4px" }}>
                              Best Model
                            </span>
                          ) : (
                            <span style={{ color: "#64748b" }}>Evaluated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* BEST MODEL HIGHLIGHT */}
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px"
            }}
          >
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#166534", fontWeight: "bold" }}>
                Selected Champion Architecture
              </span>
              <h3 style={{ color: "#15803d", margin: "4px 0" }}>
                🏆 {safeRender(result.best_model)}
              </h3>
              <p style={{ color: "#166534", margin: 0 }}>
                Score: <strong>{result.best_score !== undefined ? result.best_score : "Optimal"}</strong>
              </p>
            </div>

            <button
              className="btn"
              onClick={() => navigate("/evaluation")}
              style={{ background: "#15803d" }}
            >
              Analyze Metrics & Matrix →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainModel;