import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { getDownloadModelUrl } from "../api";

function DownloadModel() {
  const { trainedModel, targetColumn } = useContext(AppContext);

  const handleDownload = () => {
    window.open(getDownloadModelUrl(), "_blank");
  };

  return (
    <div className="main">
      <h2 className="page-title">📦 Download Trained Model</h2>
      <p className="page-subtitle">
        Export your trained AutoML model bundle for production deployment
      </p>

      <div className="card">
        <h3>Model Deployment Bundle</h3>
        <p style={{ color: "#555", marginBottom: "20px" }}>
          The exported file contains the optimized scikit-learn model, feature column encoders,
          and preprocessing transformers in serialized <code>.joblib</code> format.
        </p>

        {trainedModel && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ color: "#166534", marginBottom: "8px" }}>✅ Model Ready for Export</h4>
            <p><strong>Selected Algorithm:</strong> {trainedModel.best_model || "Trained Ensemble"}</p>
            <p><strong>Target Feature:</strong> {targetColumn || "Configured Target"}</p>
            <p><strong>Problem Type:</strong> {trainedModel.problem_type || "ML Pipeline"}</p>
            {trainedModel.best_score !== undefined && (
              <p><strong>Validation Score:</strong> {trainedModel.best_score}</p>
            )}
          </div>
        )}

        <button
          className="btn"
          onClick={handleDownload}
          style={{ fontSize: "16px", padding: "12px 24px" }}
        >
          ⬇️ Download Model (best_model.joblib)
        </button>
      </div>

      <div className="card">
        <h3>Python Inference Example</h3>
        <p className="page-subtitle">Load and execute predictions with your exported model:</p>
        <pre
          style={{
            background: "#1e293b",
            color: "#e2e8f0",
            padding: "18px",
            borderRadius: "8px",
            overflowX: "auto",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
{`import joblib
import pandas as pd

# 1. Load the exported AutoML model bundle
bundle = joblib.load("best_model.joblib")
model = bundle["model"]
feature_columns = bundle["feature_columns"]
imputer = bundle["imputer"]

# 2. Prepare incoming inference data
raw_input = {
    # Provide your feature key-value pairs here
}

df = pd.DataFrame([raw_input])
df_encoded = pd.get_dummies(df)

# Align columns with training features
for col in feature_columns:
    if col not in df_encoded:
        df_encoded[col] = 0.0

df_aligned = df_encoded[feature_columns]
df_imputed = imputer.transform(df_aligned)

# 3. Generate prediction
prediction = model.predict(df_imputed)
print("Prediction:", prediction[0])`}
        </pre>
      </div>
    </div>
  );
}

export default DownloadModel;
