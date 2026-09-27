import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { evaluateModel, getDownloadModelUrl } from "../api";
import { AppContext } from "../context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area
} from "recharts";

function ModelEvaluation() {
  const { evaluationData, setEvaluationData, trainedModel } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const safeRender = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return val.toString();
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await evaluateModel();
      if (res.error) {
        throw new Error(res.error);
      }
      setEvaluationData(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Model evaluation failed. Please train a model first.");
    } finally {
      setLoading(false);
    }
  };

  const data = evaluationData;

  const rocChartData = data?.roc_curve?.fpr
    ? data.roc_curve.fpr.map((fpr, i) => ({
        fpr: Number(fpr),
        tpr: Number(data.roc_curve.tpr[i]),
      }))
    : [];

  const getColor = (metric, value) => {
    metric = metric.toLowerCase();
    if (
      metric.includes("r2") ||
      metric.includes("accuracy") ||
      metric.includes("precision") ||
      metric.includes("recall") ||
      metric.includes("f1")
    ) {
      return value >= 0.7 ? "#16a34a" : "#dc2626";
    }

    if (
      metric.includes("rmse") ||
      metric.includes("mae") ||
      metric.includes("mape")
    ) {
      return value < 50 ? "#16a34a" : "#dc2626";
    }

    return "#1e293b";
  };

  const errorMetrics = ["rmse", "mae", "mape"];
  const scoreMetrics = ["r2", "adjusted_r2", "accuracy", "precision", "recall", "f1_score", "f1"];

  const errorData = data?.metrics?.train
    ? Object.keys(data.metrics.train)
        .filter((k) => errorMetrics.includes(k.toLowerCase()))
        .map((k) => ({
          name: k.toUpperCase(),
          Train: Number(data.metrics.train[k]) || 0,
          Test: Number(data.metrics.test?.[k]) || 0,
        }))
    : [];

  const scoreData = data?.metrics?.train
    ? Object.keys(data.metrics.train)
        .filter((k) => scoreMetrics.includes(k.toLowerCase()))
        .map((k) => ({
          name: k.toUpperCase(),
          Train: Number(data.metrics.train[k]) || 0,
          Test: Number(data.metrics.test?.[k]) || 0,
        }))
    : [];

  const classes = data?.classes || [];

  return (
    <div className="main">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="page-title">📉 Model Evaluation & Diagnostics</h2>
          <p className="page-subtitle">
            Comprehensive train vs. test generalization diagnostics, confusion matrix, and ROC curves
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn" style={{ background: "#8b5cf6" }} onClick={() => navigate("/predict")}>
            🔮 Live Predict →
          </button>
          <button className="btn" onClick={() => window.open(getDownloadModelUrl(), "_blank")}>
            📦 Export Model (.joblib)
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "#fef2f2", color: "#dc2626" }}>
          ❌ {error}
        </div>
      )}

      {/* EVALUATION CONTROL */}
      <div className="card">
        <h3>Evaluation Control</h3>
        <p className="page-subtitle">
          Diagnose generalization capability and overfitting vs underfitting across training and validation splits
        </p>

        <button className="btn" onClick={handleEvaluate} disabled={loading}>
          {loading ? "⏳ Evaluating Pipeline..." : "📊 Evaluate Best Model"}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "30px" }}>
          <p>⏳ Computing performance metrics, confusion matrices, and ROC curves...</p>
        </div>
      )}

      {/* METRICS TABLE */}
      {data?.metrics && (
        <div className="card">
          <h3>📋 Performance Benchmark Metrics</h3>

          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Evaluation Metric</th>
                  <th>Training Partition</th>
                  <th>Testing Partition (Validation)</th>
                </tr>
              </thead>

              <tbody>
                {Object.keys(data.metrics.train || {}).map((key) => {
                  const trainVal = Number(data.metrics.train[key] || 0);
                  const testVal = Number(data.metrics.test?.[key] || 0);

                  return (
                    <tr key={key}>
                      <td><strong>{key.toUpperCase()}</strong></td>
                      <td style={{ color: getColor(key, trainVal), fontWeight: "bold" }}>
                        {trainVal.toFixed(4)}
                      </td>
                      <td style={{ color: getColor(key, testVal), fontWeight: "bold" }}>
                        {testVal.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ERROR CHART */}
      {errorData.length > 0 && (
        <div className="card">
          <h3>📉 Loss & Error Metrics (Lower is Better)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={errorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => Number(v).toFixed(4)} />
              <Legend />
              <Bar dataKey="Train" fill="#94a3b8" />
              <Bar dataKey="Test" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* SCORE CHART */}
      {scoreData.length > 0 && (
        <div className="card">
          <h3>📈 Accuracy & Fit Scores (Higher is Better)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 1]} />
              <Tooltip formatter={(v) => Number(v).toFixed(4)} />
              <Legend />
              <Bar dataKey="Train" fill="#60a5fa" />
              <Bar dataKey="Test" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* CONFUSION MATRIX */}
      {data?.problem_type === "classification" && data?.confusion_matrix && (
        <div className="card">
          <h3>🧠 Confusion Matrix (Validation Set)</h3>
          <p className="page-subtitle">Actual classes vs. Predicted classes</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${data.confusion_matrix.length + 1}, minmax(80px, 120px))`,
              gap: "8px",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <div style={{ textAlign: "center", padding: "10px", fontWeight: "bold" }}>Actual \ Pred</div>
            {data.confusion_matrix.map((_, i) => (
              <div key={i} style={{ textAlign: "center", padding: "10px", fontWeight: "bold", background: "#f1f5f9", borderRadius: "6px" }}>
                P: {classes[i] !== undefined ? classes[i] : i}
              </div>
            ))}

            {data.confusion_matrix.map((row, i) => (
              <React.Fragment key={i}>
                <div style={{ textAlign: "center", padding: "10px", fontWeight: "bold", background: "#f1f5f9", borderRadius: "6px" }}>
                  A: {classes[i] !== undefined ? classes[i] : i}
                </div>
                {row.map((val, j) => (
                  <div
                    key={j}
                    style={{
                      background: i === j ? "#10b981" : "#ef4444",
                      color: "#fff",
                      padding: "12px",
                      borderRadius: "6px",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {safeRender(val)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ROC CURVE */}
      {rocChartData.length > 0 && (
        <div className="card">
          <h3>📈 ROC Curve (AUC: {safeRender(data.roc_curve?.auc)})</h3>
          <p className="page-subtitle">Receiver Operating Characteristic for Binary Classification</p>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={rocChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="fpr" domain={[0, 1]} label={{ value: "False Positive Rate (FPR)", position: "insideBottom", offset: -5 }} />
              <YAxis domain={[0, 1]} label={{ value: "True Positive Rate (TPR)", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Area type="monotone" dataKey="tpr" fill="#10b981" fillOpacity={0.15} />
              <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line
                type="linear"
                data={[
                  { fpr: 0, tpr: 0 },
                  { fpr: 1, tpr: 1 },
                ]}
                dataKey="tpr"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ModelEvaluation;