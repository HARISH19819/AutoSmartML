import pandas as pd


def encode_categorical_columns(df, target=None):
    """
    Encode categorical columns in dataframe to numeric categories.
    Leaves the target column untouched if specified.
    """
    df_copy = df.copy()
    encoded = []
    categorical_cols = df_copy.select_dtypes(include=["object", "category"]).columns

    for col in categorical_cols:
        if col != target:
            df_copy[col] = df_copy[col].astype("category").cat.codes
            encoded.append(col)

    return df_copy, encoded
