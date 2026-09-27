import numpy as np
import pandas as pd
from ai.gemini_client import generate_gemini_content


# -----------------------------
# DATASET OVERVIEW AI
# -----------------------------

def dataset_overview_ai(summary):
    prompt = f"""
You are a professional data scientist.
Analyze this dataset summary and give actionable insights.

Dataset summary:
{summary}

Provide concise:
1. Key data patterns
2. Feature distributions and possible correlations
3. Data quality / missing value issues
4. Recommended ML models
"""
    ai_response = generate_gemini_content(prompt)
    if ai_response:
        return ai_response

    # Heuristic fallback
    try:
        rows = summary.get("rows", 0)
        cols = summary.get("columns", 0)
        num_cols = len(summary.get("numeric_columns", []))
        cat_cols = len(summary.get("categorical_columns", []))

        insights = [
            f"Dataset contains {rows:,} rows and {cols} columns.",
            f"Features detected: {num_cols} numerical and {cat_cols} categorical.",
        ]

        missing = summary.get("missing_values", {})
        missing_cols = [k for k, v in missing.items() if v > 0]
        if missing_cols:
            insights.append(f"Missing values detected in: {', '.join(missing_cols)}.")
        else:
            insights.append("No missing values detected. Clean data distribution.")

        insights.append(
            "Recommended approaches: Tree-based ensembles (Random Forest, Gradient Boosting) for mixed tabular data."
        )
        return "\n".join(insights)
    except Exception:
        return "Dataset summary loaded successfully. Ready for preprocessing and analysis."


# -----------------------------
# CLEANING AI
# -----------------------------

def cleaning_ai(summary):
    prompt = f"""
You are an expert data scientist.
Analyze the dataset cleaning summary and give recommendations.

Cleaning summary:
{summary}

Provide:
1. Impact of removed duplicates
2. Imputation strategy review
3. Categorical encoding observations
"""
    ai_response = generate_gemini_content(prompt)
    if ai_response:
        return ai_response

    # Heuristic fallback
    try:
        missing = summary.get("missing_values", {})
        missing_cols = [k for k, v in missing.items() if v > 0]

        insights = []
        if missing_cols:
            insights.append(f"Missing values handled in: {', '.join(missing_cols)}.")
        else:
            insights.append("Dataset features are complete with no remaining null values.")

        insights.append(
            "Categorical features converted to numerical representations. Data is normalized and ready for model training."
        )
        return "\n".join(insights)
    except Exception:
        return "Dataset successfully cleaned and preprocessed for modeling."


# -------------------------------------------------------
# HISTOGRAM ANALYSIS
# -------------------------------------------------------

def histogram_analysis(df, column):
    if df is None or column not in df.columns:
        return ""

    values = pd.to_numeric(df[column], errors="coerce").dropna()
    if values.empty:
        return f"Column '{column}' contains no numeric values."

    skewness = values.skew()
    q90 = values.quantile(0.9)

    insights = []
    if skewness > 1:
        insights.append("Distribution is strongly right-skewed with potential high outliers.")
    elif skewness > 0.5:
        insights.append("Distribution is moderately right-skewed.")
    elif skewness < -1:
        insights.append("Distribution is strongly left-skewed with potential low outliers.")
    elif skewness < -0.5:
        insights.append("Distribution is moderately left-skewed.")
    else:
        insights.append("Distribution is approximately symmetric and normally distributed.")

    insights.append(f"90% of the observations fall below {round(float(q90), 2)}.")
    return " ".join(insights)


# -------------------------------------------------------
# BOXPLOT ANALYSIS
# -------------------------------------------------------

def boxplot_analysis(df, column):
    if df is None or column not in df.columns:
        return ""

    values = pd.to_numeric(df[column], errors="coerce").dropna()
    if values.empty:
        return f"Column '{column}' contains no numeric values."

    median = values.median()
    q1 = values.quantile(0.25)
    q3 = values.quantile(0.75)
    iqr = q3 - q1

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    outliers = values[(values < lower) | (values > upper)]

    insights = [f"Median value is {round(float(median), 2)} with IQR of {round(float(iqr), 2)}."]

    total_len = len(values)
    if len(outliers) == 0:
        insights.append("No statistical outliers detected by IQR standard.")
    elif len(outliers) < total_len * 0.05:
        insights.append(f"Detected {len(outliers)} outlier(s) ({round(len(outliers)/total_len*100, 1)}% of data).")
    else:
        insights.append(f"High number of outliers detected: {len(outliers)} records ({round(len(outliers)/total_len*100, 1)}%). Consider robust scaling.")

    return " ".join(insights)


# -------------------------------------------------------
# COUNTPLOT ANALYSIS
# -------------------------------------------------------

def countplot_analysis(df, column):
    if df is None or column not in df.columns:
        return ""

    counts = df[column].dropna().value_counts()
    if counts.empty:
        return f"Column '{column}' is empty."

    unique = len(counts)
    highest = counts.idxmax()
    highest_val = counts.max()
    lowest = counts.idxmin()
    lowest_val = counts.min()

    insights = [
        f"Feature '{column}' contains {unique} unique categories.",
        f"Dominant category is '{highest}' with {highest_val} occurrences ({round(highest_val / len(df) * 100, 1)}%).",
        f"Minority category is '{lowest}' with {lowest_val} occurrences."
    ]

    return " ".join(insights)


# -------------------------------------------------------
# HEATMAP ANALYSIS
# -------------------------------------------------------

def heatmap_analysis(df, target=None):
    if df is None or df.empty:
        return ""

    df_encoded = df.copy()
    for col in df_encoded.select_dtypes(include=["object", "category"]).columns:
        df_encoded[col] = df_encoded[col].astype("category").cat.codes

    # Filter numeric only
    num_df = df_encoded.select_dtypes(include=["number"])
    if num_df.shape[1] < 2:
        return "Not enough numeric features for correlation analysis."

    corr = num_df.corr()
    insights = []
    strong_corr = []

    for i, col1 in enumerate(corr.columns):
        for j, col2 in enumerate(corr.columns):
            if i < j:
                value = corr.loc[col1, col2]
                if abs(value) > 0.65:
                    strong_corr.append((col1, col2, value))

    if strong_corr:
        col1, col2, value = strong_corr[0]
        direction = "positive" if value > 0 else "negative"
        insights.append(f"Strongest feature relationship: '{col1}' and '{col2}' show {direction} correlation ({round(float(value), 2)}).")
    else:
        insights.append("Features exhibit moderate to low multicollinearity, which is favorable for modeling.")

    if target and target in corr.columns:
        target_corr = corr[target].drop(target).dropna()
        if not target_corr.empty:
            important = target_corr.abs().idxmax()
            imp_val = target_corr.loc[important]
            insights.append(f"Feature most correlated with target '{target}' is '{important}' (r = {round(float(imp_val), 2)}).")

    return " ".join(insights)


# -----------------------------
# EDA CHART AI
# -----------------------------

def eda_chart_ai(chart_type, column, df=None, target=None):
    statistical_insight = ""
    try:
        if chart_type == "histogram":
            statistical_insight = histogram_analysis(df, column)
        elif chart_type == "boxplot":
            statistical_insight = boxplot_analysis(df, column)
        elif chart_type == "countplot":
            statistical_insight = countplot_analysis(df, column)
        elif chart_type == "heatmap":
            statistical_insight = heatmap_analysis(df, target)
    except Exception as e:
        statistical_insight = f"Statistical summary generated for {chart_type}."

    prompt = f"""
You are an expert data scientist.
Chart type: {chart_type}
Column / Subject: {column}

Statistical observations:
{statistical_insight}

Explain what these observations mean for machine learning feature engineering in 2-3 sentences.
"""
    ai_response = generate_gemini_content(prompt)
    if ai_response:
        return ai_response

    return statistical_insight if statistical_insight else f"EDA visualization created for {column}."


# -----------------------------
# RECOMMEND ALGORITHMS
# -----------------------------

def recommend_algorithms(summary, target_column):
    categorical_cols = summary.get("categorical_columns", [])
    target_type = "classification" if target_column in categorical_cols else "regression"

    if target_type == "regression":
        algorithms = [
            "Linear Regression",
            "Random Forest Regressor",
            "Gradient Boosting Regressor",
            "Decision Tree Regressor"
        ]
    else:
        algorithms = [
            "Logistic Regression",
            "Random Forest Classifier",
            "Gradient Boosting Classifier",
            "Decision Tree Classifier"
        ]

    return {
        "target_type": target_type,
        "recommended_models": algorithms
    }