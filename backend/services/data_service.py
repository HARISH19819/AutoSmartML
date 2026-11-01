import os
import json
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
DATASET_DIR = os.path.join(STORAGE_DIR, "datasets")
os.makedirs(DATASET_DIR, exist_ok=True)

ACTIVE_DATASET_FILE = os.path.join(DATASET_DIR, "active_dataset.csv")
RAW_DATASET_FILE = os.path.join(DATASET_DIR, "raw_dataset.csv")
STATE_FILE = os.path.join(STORAGE_DIR, "active_state.json")

global_df = None
RAW_DF = None


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_state(state_dict):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state_dict, f, indent=2)
    except Exception:
        pass


def set_active_target(target):
    state = load_state()
    state["target_column"] = target
    save_state(state)


def get_active_target():
    state = load_state()
    return state.get("target_column")


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

        set_raw_dataframe(df)
        set_dataframe(df)

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
# PERSISTENT STATE HELPERS
# -----------------------------

def set_dataframe(df):
    global global_df
    global_df = df.copy() if df is not None else None
    if global_df is not None:
        try:
            global_df.to_csv(ACTIVE_DATASET_FILE, index=False)
        except Exception:
            pass


def get_dataframe():
    global global_df
    if global_df is None:
        if os.path.exists(ACTIVE_DATASET_FILE):
            try:
                global_df = pd.read_csv(ACTIVE_DATASET_FILE)
            except Exception:
                pass
    return global_df


def set_raw_dataframe(df):
    global RAW_DF
    RAW_DF = df.copy() if df is not None else None
    if RAW_DF is not None:
        try:
            RAW_DF.to_csv(RAW_DATASET_FILE, index=False)
        except Exception:
            pass


def get_raw_dataframe():
    global RAW_DF
    if RAW_DF is None:
        if os.path.exists(RAW_DATASET_FILE):
            try:
                RAW_DF = pd.read_csv(RAW_DATASET_FILE)
            except Exception:
                pass
        if RAW_DF is None and os.path.exists(ACTIVE_DATASET_FILE):
            try:
                RAW_DF = pd.read_csv(ACTIVE_DATASET_FILE)
            except Exception:
                pass
    return RAW_DF


def reset_data():
    global global_df, RAW_DF
    global_df = None
    RAW_DF = None
    for f in [ACTIVE_DATASET_FILE, RAW_DATASET_FILE, STATE_FILE]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass
