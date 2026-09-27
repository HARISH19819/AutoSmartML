# 🚀 AutoSmartML: Automated Machine Learning Studio

AutoSmartML is an end-to-end, production-ready Automated Machine Learning (AutoML) platform with intelligent exploratory data analysis (EDA), automated data preprocessing, multi-algorithm model training, performance evaluation, interactive live inference, and Google Gemini AI insights.

---

## ✨ Features

- **📂 Seamless CSV Dataset Ingestion**: Automatic parsing, type detection, and statistical profiling.
- **🧹 Automated Data Preprocessing**:
  - Duplicate detection and removal.
  - Type-safe missing value imputation (median for numerical, mode for categorical).
  - One-hot categorical encoding.
- **📈 Exploratory Data Analysis (EDA)**:
  - High-resolution distribution plots with KDE histograms.
  - Outlier detection with interquartile range (IQR) boxplots.
  - Categorical frequency distribution charts.
  - Pairwise Pearson correlation heatmaps.
- **🧠 Gemini AI Intelligence**:
  - Executive dataset summaries and quality health checks.
  - Data preprocessing and cleaning recommendations.
  - Visual chart interpretations powered by Google Gemini.
- **✂️ Partitioning & Model Benchmarking**:
  - Stratified train-test dataset splitting with customizable ratios.
  - Multi-model evaluation across classification (Logistic Regression, Decision Trees, Random Forests) and regression (Linear Regression, Decision Tree Regressor, Random Forest Regressor).
- **🔥 Feature Importance**:
  - Gini impurity and variance reduction feature attribution ranking.
- **📉 Comprehensive Diagnostics**:
  - Generalization error and fit scores across train and validation sets.
  - Confusion matrix with actual class mapping.
  - Binary classification ROC curves and AUC scores.
- **🔮 Real-Time Interactive Inference**:
  - Dynamic input form generation matching trained feature schemas.
  - Live prediction with automated preprocessor transformations.
- **📦 Model Deployment & Export**:
  - Downloadable serialized `.joblib` model bundles containing model weights, feature transformers, and imputers.

---

## 🏗️ Project Architecture

```
AutoSmartML/
├── .gitignore                     # Git hygiene & security rules (secrets, venv, caches)
├── README.md                      # Project documentation
├── backend/
│   ├── .env.example               # Template for backend environment variables
│   ├── app.py                     # Main Flask REST API application
│   ├── requirements.txt           # Python dependencies
│   ├── test_suite.py              # Automated endpoint test suite
│   ├── ai/
│   │   └── gemini_client.py       # Safe Google Gemini client with heuristic fallbacks
│   ├── services/
│   │   ├── ai_service.py          # AI & statistical data science heuristics
│   │   ├── cleaning_service.py    # Automated preprocessing & imputation
│   │   ├── data_service.py        # Dataset ingestion & state management
│   │   ├── eda_service.py         # Matplotlib & Seaborn visualization engine
│   │   ├── model_service.py       # Model training, split, evaluation & joblib persistence
│   │   └── prediction_service.py  # Live inference pipeline
│   ├── storage/                   # Local storage for datasets, models, and images
│   └── utils/                     # Encoding & styling utility modules
└── frontend/
    ├── .env.example               # Template for frontend environment variables
    ├── package.json               # React application configuration
    ├── public/                    # HTML shell & static assets
    └── src/
        ├── api.js                 # API service layer with configurable base URL
        ├── App.js                 # Main routing component
        ├── context/
        │   └── AppContext.js      # Global state provider
        ├── layout/
        │   ├── MainLayout.js      # Application layout shell
        │   └── Sidebar.js         # Navigation sidebar with real-time status badges
        ├── pages/
        │   ├── UploadDataset.js   # Dataset upload & initial analysis
        │   ├── DatasetInfo.js     # Data summary & target feature selection
        │   ├── AIReport.js        # Gemini AI executive intelligence report
        │   ├── CleanDataset.js    # Automated data cleaning & preview
        │   ├── EDA.js             # Visual exploratory analysis
        │   ├── TrainSplit.js      # Train-test split partitioner
        │   ├── TrainModel.js      # AutoML multi-model benchmark & leaderboard
        │   ├── FeatureImportance.js# Feature attribution rankings
        │   ├── ModelEvaluation.js # Performance diagnostics, confusion matrix & ROC
        │   ├── Predict.js         # Interactive live prediction
        │   └── DownloadModel.js   # Model export bundle & Python usage guide
        └── styles/
            ├── global.css         # Modern design system & token definitions
            └── main.css           # Layout & navigation styling
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and insert your Google Gemini API Key:
# GEMINI_API_KEY=your_actual_key_here

# Run automated tests
python test_suite.py

# Start Flask development server
python app.py
```
The backend server runs on `http://127.0.0.1:5000`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```
The frontend application will open at `http://localhost:3000`.

---

## 🔒 Security & Best Practices

- **Zero Secret Leaks**: All API keys and environment variables are strictly managed through `.env` and excluded from source control via `.gitignore`.
- **Upload Sanitization**: Uploaded files are strictly filtered for `.csv` format and sanitized via `secure_filename`.
- **Safe Fallbacks**: If the Gemini API key is not configured or exceeds quota, the platform automatically switches to built-in data science heuristic insights without disruption.
- **Resource Management**: Generated plots and models are tracked in clean storage directories with automatic memory cleanup.

---

## 📜 Using Exported Models in Python

```python
import joblib
import pandas as pd

# Load exported bundle
bundle = joblib.load("best_model.joblib")
model = bundle["model"]
feature_columns = bundle["feature_columns"]
imputer = bundle["imputer"]

# Inference data
raw_input = {"age": 30, "salary": 65000, "department": "IT"}
df = pd.DataFrame([raw_input])
df_encoded = pd.get_dummies(df)

for col in feature_columns:
    if col not in df_encoded:
        df_encoded[col] = 0.0

df_aligned = df_encoded[feature_columns]
df_imputed = imputer.transform(df_aligned)

prediction = model.predict(df_imputed)
print("Prediction Result:", prediction[0])
```

---

## 📄 License
This project is open-source under the MIT License.
