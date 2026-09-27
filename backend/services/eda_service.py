import os
import re
import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(BASE_DIR, "storage", "images")
os.makedirs(IMAGE_DIR, exist_ok=True)


def _safe_filename(col_name, suffix):
    clean = re.sub(r"[^a-zA-Z0-9_\-]", "_", str(col_name))
    return f"{clean}_{suffix}.png"


def get_numeric_columns(df):
    if df is None or df.empty:
        return []
    return df.select_dtypes(include=["int64", "float64", "number"]).columns.tolist()


def get_categorical_columns(df):
    if df is None or df.empty:
        return []
    return df.select_dtypes(include=["object", "category", "bool"]).columns.tolist()


# HISTOGRAM
def generate_histogram(df, column):
    if df is None or column not in df.columns:
        raise ValueError(f"Column '{column}' not found in dataset")

    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    fig, ax = plt.subplots(figsize=(8, 5))

    series = pd.to_numeric(df[column], errors="coerce").dropna()
    if series.empty:
        ax.text(0.5, 0.5, "No numeric data available", ha="center", va="center")
    else:
        sns.histplot(series, kde=True, color="#4CAF50", ax=ax)

    ax.set_title(f"Distribution of {column}", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel(column, fontsize=11)
    ax.set_ylabel("Frequency", fontsize=11)
    plt.tight_layout()

    filename = _safe_filename(column, "hist")
    abs_path = os.path.join(IMAGE_DIR, filename)
    plt.savefig(abs_path, dpi=120)
    plt.close("all")

    return f"storage/images/{filename}"


# BOXPLOT
def generate_boxplot(df, column):
    if df is None or column not in df.columns:
        raise ValueError(f"Column '{column}' not found in dataset")

    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    fig, ax = plt.subplots(figsize=(8, 4))

    series = pd.to_numeric(df[column], errors="coerce").dropna()
    if series.empty:
        ax.text(0.5, 0.5, "No numeric data available", ha="center", va="center")
    else:
        sns.boxplot(x=series, color="#81C784", ax=ax)

    ax.set_title(f"Boxplot: {column} Outlier Detection", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel(column, fontsize=11)
    plt.tight_layout()

    filename = _safe_filename(column, "box")
    abs_path = os.path.join(IMAGE_DIR, filename)
    plt.savefig(abs_path, dpi=120)
    plt.close("all")

    return f"storage/images/{filename}"


# COUNTPLOT
def generate_countplot(df, column):
    if df is None or column not in df.columns:
        raise ValueError(f"Column '{column}' not found in dataset")

    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    fig, ax = plt.subplots(figsize=(8, 5))

    series = df[column].dropna().astype(str)
    # Limit to top 15 categories if too many
    if series.nunique() > 15:
        top_cats = series.value_counts().head(15).index
        plot_series = series[series.isin(top_cats)]
    else:
        plot_series = series

    sns.countplot(
        x=plot_series,
        hue=plot_series,
        palette="viridis",
        ax=ax,
        order=plot_series.value_counts().index,
        legend=False
    )
    ax.set_title(f"Frequency Count: {column}", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel(column, fontsize=11)
    ax.set_ylabel("Count", fontsize=11)
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    filename = _safe_filename(column, "count")
    abs_path = os.path.join(IMAGE_DIR, filename)
    plt.savefig(abs_path, dpi=120)
    plt.close("all")

    return f"storage/images/{filename}"


# HEATMAP
def generate_heatmap(df, target=None):
    if df is None or df.empty:
        raise ValueError("Dataset is empty")

    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    df_encoded = df.copy()

    for col in df_encoded.select_dtypes(include=["object", "category"]).columns:
        df_encoded[col] = df_encoded[col].astype("category").cat.codes

    if target and target in df_encoded.columns:
        cols = [c for c in df_encoded.columns if c != target] + [target]
        df_encoded = df_encoded[cols]

    numeric_df = df_encoded.select_dtypes(include=["number"])
    corr = numeric_df.corr()

    # Limit to max 20 columns for legible visualization
    if corr.shape[1] > 20:
        if target and target in corr.columns:
            top_corr = corr[target].abs().sort_values(ascending=False).head(20).index
            corr = corr.loc[top_corr, top_corr]
        else:
            corr = corr.iloc[:20, :20]

    fig, ax = plt.subplots(figsize=(max(8, len(corr.columns) * 0.7), max(6, len(corr.columns) * 0.6)))
    sns.heatmap(
        corr,
        annot=len(corr.columns) <= 12,
        cmap="coolwarm",
        fmt=".2f",
        linewidths=0.5,
        ax=ax,
        cbar_kws={"shrink": 0.8}
    )

    ax.set_title("Feature Correlation Heatmap", fontsize=14, fontweight="bold", pad=15)
    plt.xticks(rotation=45, ha="right")
    plt.yticks(rotation=0)
    plt.tight_layout()

    filename = "correlation_heatmap.png"
    abs_path = os.path.join(IMAGE_DIR, filename)
    plt.savefig(abs_path, dpi=120)
    plt.close("all")

    return f"storage/images/{filename}"


# DATASET SUMMARY
def create_dataset_summary(df):
    if df is None or df.empty:
        return {
            "rows": 0,
            "columns": 0,
            "numeric_columns": [],
            "categorical_columns": [],
            "missing_values": {}
        }

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "numeric_columns": list(df.select_dtypes(include=["number"]).columns),
        "categorical_columns": list(df.select_dtypes(include=["object", "category", "bool"]).columns),
        "missing_values": {col: int(df[col].isnull().sum()) for col in df.columns}
    }
