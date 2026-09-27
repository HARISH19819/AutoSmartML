import pandas as pd
import numpy as np
from services.data_service import set_dataframe


def clean_dataset(df, target=None):
    """
    Cleans dataset automatically.

    Steps:
    1. Remove duplicate rows
    2. Fill missing values safely (median for numeric, mode for categorical)
    3. Encode categorical columns (except target)
    4. Synchronize cleaned data to global state
    5. Generate clean report
    """
    if df is None or df.empty:
        raise ValueError("No dataset provided to clean")

    df = df.copy()
    report = {}

    # -------------------------
    # 1. Remove duplicates
    # -------------------------
    before_rows = df.shape[0]
    df = df.drop_duplicates()
    after_rows = df.shape[0]
    report["duplicates_removed"] = int(before_rows - after_rows)

    # -------------------------
    # 2. Fill missing values
    # -------------------------
    missing_filled = {}

    for col in df.columns:
        missing_count = int(df[col].isnull().sum())
        if missing_count > 0:
            if pd.api.types.is_numeric_dtype(df[col]):
                median_val = df[col].median()
                fill_val = 0 if pd.isna(median_val) else median_val
                df[col] = df[col].fillna(fill_val)
            else:
                mode_series = df[col].dropna().mode()
                fill_val = mode_series.iloc[0] if not mode_series.empty else "Unknown"
                df[col] = df[col].fillna(fill_val)

            missing_filled[col] = missing_count

    report["missing_values_filled"] = missing_filled

    # -------------------------
    # 3. Encode categorical columns
    # -------------------------
    encoded_columns = []
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns

    for col in categorical_cols:
        if col != target:
            # Handle categorical encoding safely
            df[col] = df[col].astype("category").cat.codes
            encoded_columns.append(col)

    report["encoded_columns"] = encoded_columns

    # -------------------------
    # 4. Synchronize global state
    # -------------------------
    set_dataframe(df)

    # -------------------------
    # 5. Clean dataset sample
    # -------------------------
    sample_df = df.head(5).copy()
    report["clean_sample"] = sample_df.replace({np.nan: None}).to_dict(orient="records")

    return df, report