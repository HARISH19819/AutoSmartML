import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDataset } from "../api";
import { AppContext } from "../context/AppContext";

function UploadDataset() {
  const { setDatasetInfo, setTargetColumn } = useContext(AppContext);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccess(false);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported. Please select a valid CSV dataset.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const data = await uploadDataset(file);
      setDatasetInfo(data);
      setTargetColumn(null); // Reset target for new dataset
      setSuccess(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <div className="card">
        <h2 className="page-title">📂 Upload Dataset</h2>
        <p className="page-subtitle">
          Upload your CSV dataset to start the AutoSmartML automated intelligence pipeline
        </p>

        {/* Upload Box */}
        <div className="upload-box">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="dataset-upload-input"
            style={{ display: "block", margin: "0 auto" }}
          />

          {file && (
            <div className="file-name" style={{ marginTop: "15px" }}>
              📄 <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "20px" }}>
          <button
            className="btn"
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? "⏳ Uploading & Analyzing..." : "🚀 Upload & Analyze Dataset"}
          </button>

          {success && (
            <button
              className="btn"
              onClick={() => navigate("/dataset")}
              style={{ background: "#0284c7" }}
            >
              📊 Explore Dataset Overview →
            </button>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{ marginTop: "15px", color: "#dc2626", background: "#fef2f2", padding: "12px", borderRadius: "8px" }}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="success" style={{ marginTop: "15px" }}>
            ✅ Dataset uploaded and analyzed successfully! You can now explore statistics or select a target column.
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadDataset;