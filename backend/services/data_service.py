import os
import pandas as pd
import numpy as np

global_df = None
RAW_DF = None


class DataService:
    def analyze_dataset(self, filepath):
        global RAW_DF, global_df

        if not os.path.exists(filepath):
            return {"error": "Dataset file not found"}

        try:
            df = pd.read_csv(filepath)
        except Exception as e:
            return {"error": f"Failed to read dataset: {str(e)}"}

        if df.empty:
            return {"error": "Uploaded CSV file is empty"}

        RAW_DF = df.copy()
        global_df = df.copy()

        rows, cols = df.shape

        numeric_columns = df.select_dtypes(
            include=["int64", "float64", "int32", "float32", "number"]
        ).columns.tolist()

        categorical_columns = df.select_dtypes(
            include=["object", "category", "bool"]
        ).columns.tolist()

        missing_values = {col: int(df[col].isnull().sum()) for col in df.columns}

        numeric_summary = {}
        for col in numeric_columns:
            series = pd.to_numeric(df[col], errors="coerce").dropna()
            if not series.empty:
                std_val = series.std()
                numeric_summary[col] = {
                    "mean": round(float(series.mean()), 4),
                    "std": 0.0 if pd.isna(std_val) else round(float(std_val), 4),
                    "min": round(float(series.min()), 4),
                    "max": round(float(series.max()), 4),
                }
            else:
                numeric_summary[col] = {"mean": 0.0, "std": 0.0, "min": 0.0, "max": 0.0}

        categorical_summary = {}
        for col in categorical_columns:
            mode_series = df[col].dropna().mode()
            top_val = str(mode_series.iloc[0]) if not mode_series.empty else "N/A"
            categorical_summary[col] = {
                "unique": int(df[col].nunique()),
                "top": top_val
            }

        # Safe sample serialization (replace NaN with None/null)
        sample_df = df.head(5).copy()
        sample_rows = sample_df.replace({np.nan: None}).to_dict(orient="records")

        return {
            "rows": rows,
            "columns": cols,
            "numeric_columns": numeric_columns,
            "categorical_columns": categorical_columns,
            "missing_values": missing_values,
            "numeric_summary": numeric_summary,
            "categorical_summary": categorical_summary,
            "sample_rows": sample_rows
        }


# -----------------------------
# GLOBAL STATE HELPERS
# -----------------------------

def set_dataframe(df):
    global global_df
    global_df = df.copy() if df is not None else None


def get_dataframe():
    global global_df
    return global_df


def set_raw_dataframe(df):
    global RAW_DF
    RAW_DF = df.copy() if df is not None else None


def get_raw_dataframe():
    global RAW_DF
    return RAW_DF


def reset_data():
    global global_df, RAW_DF
    global_df = None
    RAW_DF = None