const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

export const getApiBaseUrl = () => API_BASE;
export const getDownloadModelUrl = () => `${API_BASE}/download-model`;

/**
 * Check backend connection status
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    return { status: "offline", error: err.message };
  }
}

/**
 * Upload CSV dataset to backend
 */
export async function uploadDataset(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload-dataset`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Dataset upload failed");
  }
  return data;
}

/**
 * Set target column for machine learning
 */
export async function setTargetColumn(target) {
  const response = await fetch(`${API_BASE}/set-target`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to set target column");
  }
  return data;
}

/**
 * Clean dataset automatically
 */
export async function cleanDataset() {
  const response = await fetch(`${API_BASE}/clean-data`, {
    method: "POST",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Dataset cleaning failed");
  }
  return data;
}

/**
 * Fetch numeric and categorical column lists for EDA
 */
export async function getNumericColumns() {
  const res = await fetch(`${API_BASE}/eda/numeric-columns`);
  return await res.json();
}

export async function getCategoricalColumns() {
  const res = await fetch(`${API_BASE}/eda/categorical-columns`);
  return await res.json();
}

/**
 * Generate EDA Charts
 */
export async function generateHistogram(column) {
  const res = await fetch(`${API_BASE}/eda/histogram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate histogram");
  return data;
}

export async function generateBoxplot(column) {
  const res = await fetch(`${API_BASE}/eda/boxplot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate boxplot");
  return data;
}

export async function generateCountplot(column) {
  const res = await fetch(`${API_BASE}/eda/countplot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate countplot");
  return data;
}

export async function generateHeatmap() {
  const res = await fetch(`${API_BASE}/eda/heatmap`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate heatmap");
  return data;
}

/**
 * Split dataset into train and test
 */
export async function splitDataset(target, test_size = 0.2) {
  const res = await fetch(`${API_BASE}/split`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target,
      test_size,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Split failed");
  return data;
}

/**
 * Recommend ML Algorithms
 */
export async function getModelRecommendations(target) {
  const res = await fetch(`${API_BASE}/recommend_models?target=${encodeURIComponent(target)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch model recommendations");
  return data;
}

/**
 * Train models automatically
 */
export async function trainModel(target) {
  const res = await fetch(`${API_BASE}/train_models`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Model training failed");
  return data;
}

/**
 * Calculate feature importances
 */
export async function getFeatureImportance(target) {
  const res = await fetch(`${API_BASE}/feature_importance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to calculate feature importance");
  return data;
}

/**
 * Evaluate trained model performance
 */
export async function evaluateModel() {
  const res = await fetch(`${API_BASE}/evaluate_model`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Model evaluation failed");
  return data;
}

/**
 * Get feature metadata for prediction form
 */
export async function getFeatures() {
  const res = await fetch(`${API_BASE}/get_features`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load features");
  return data;
}

/**
 * Run real-time prediction
 */
export async function predictData(formData) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Prediction request failed");
  return data;
}