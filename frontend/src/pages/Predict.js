import React, { useEffect, useState } from "react";
import { getFeatures, predictData } from "../api";

function Predict() {
  const [features, setFeatures] = useState([]);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingFeatures, setFetchingFeatures] = useState(true);
  const [error, setError] = useState("");

  const safeRender = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return val.toString();
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setFetchingFeatures(true);
    setError("");
    try {
      const res = await getFeatures();
      if (res.error) {
        setError(res.error);
      } else {
        setFeatures(res);
        // Initialize default empty values
        const initialForm = {};
        res.forEach((f) => {
          if (f.type === "categorical" && f.options && f.options.length > 0) {
            initialForm[f.name] = f.options[0];
          } else {
            initialForm[f.name] = "";
          }
        });
        setFormData(initialForm);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load feature schema. Please upload a dataset and train a model first.");
    } finally {
      setFetchingFeatures(false);
    }
  };

  const handleChange = (name, value, type) => {
    let finalValue = value;
    if (type === "numeric") {
      finalValue = value === "" ? "" : Number(value);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleFillSample = () => {
    const sampleForm = {};
    features.forEach((f) => {
      if (f.type === "numeric") {
        sampleForm[f.name] = 10;
      } else if (f.options && f.options.length > 0) {
        sampleForm[f.name] = f.options[0];
      }
    });
    setFormData(sampleForm);
  };

  const handlePredict = async () => {
    const cleanedInput = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== "" && formData[key] !== null && formData[key] !== undefined) {
        cleanedInput[key] = formData[key];
      }
    });

    if (Object.keys(cleanedInput).length === 0) {
      setError("Please provide at least one feature value to predict.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await predictData(cleanedInput);
      if (res.error) {
        throw new Error(res.error);
      }
      setResult(res.prediction);
    } catch (err) {
      console.error(err);
      setError(err.message || "Prediction failed. Ensure a model is trained first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <h2 className="page-title">🔮 Real-Time Model Inference</h2>
      <p className="page-subtitle">
        Input feature values to generate instant predictions through the trained AutoML pipeline
      </p>

      {error && (
        <div className="card" style={{ background: "#fef2f2", color: "#dc2626", borderLeft: "4px solid #ef4444" }}>
          ❌ {error}
        </div>
      )}

      {fetchingFeatures ? (
        <div className="card" style={{ textAlign: "center", padding: "30px" }}>
          <p>⏳ Loading feature schema from dataset...</p>
        </div>
      ) : features.length === 0 ? (
        <div className="card">
          <p style={{ color: "#d97706" }}>
            ⚠️ No features available. Please upload a dataset and train an AutoML model first.
          </p>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
            <h3>📥 Feature Inputs</h3>
            <button
              type="button"
              className="btn"
              onClick={handleFillSample}
              style={{ background: "#64748b", fontSize: "13px", padding: "6px 14px" }}
            >
              🎲 Autofill Sample Values
            </button>
          </div>

          <div className="grid grid-3">
            {features.map((feature) => (
              <div key={feature.name}>
                <label style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b", display: "block" }}>
                  {feature.name}{" "}
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>
                    ({feature.type})
                  </span>
                </label>

                {feature.type === "numeric" ? (
                  <input
                    type="number"
                    className="input"
                    placeholder={`e.g. 0.0`}
                    value={formData[feature.name] !== undefined ? formData[feature.name] : ""}
                    onChange={(e) =>
                      handleChange(feature.name, e.target.value, "numeric")
                    }
                    style={{ width: "100%" }}
                  />
                ) : (
                  <select
                    className="input"
                    value={formData[feature.name] || ""}
                    onChange={(e) =>
                      handleChange(feature.name, e.target.value, "categorical")
                    }
                    style={{ width: "100%" }}
                  >
                    <option value="">-- Choose {feature.name} --</option>
                    {feature.options &&
                      feature.options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          <button
            className="btn"
            onClick={handlePredict}
            disabled={loading}
            style={{ marginTop: "25px", fontSize: "16px", padding: "12px 28px" }}
          >
            {loading ? "⏳ Computing Prediction..." : "🚀 Generate Live Prediction"}
          </button>
        </div>
      )}

      {/* PREDICTION RESULT */}
      {result !== null && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "30px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
          }}
        >
          <span style={{ textTransform: "uppercase", fontSize: "13px", fontWeight: "bold", color: "#166534" }}>
            Model Inference Output
          </span>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#15803d",
              margin: "12px 0 6px 0",
            }}
          >
            🎯 {safeRender(result)}
          </h2>
          <p style={{ color: "#166534", fontSize: "14px" }}>
            Predicted by champion model using aligned preprocessing and categorical imputation
          </p>
        </div>
      )}
    </div>
  );
}

export default Predict;