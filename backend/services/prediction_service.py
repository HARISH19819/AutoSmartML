import os
import joblib
import pandas as pd
import numpy as np

from services.model_service import (
    BEST_MODEL_OBJECT,
    FEATURE_COLUMNS,
    IMPUTER,
    MODEL_SAVE_PATH
)


def make_prediction(input_data):
    """
    Generate prediction from user input data dictionary.
    Handles dummy variable alignment and missing feature imputation.
    """
    from services import model_service

    model = model_service.BEST_MODEL_OBJECT
    feature_cols = model_service.FEATURE_COLUMNS
    imputer = model_service.IMPUTER

    # If not in memory, attempt loading saved bundle
    if (model is None or feature_cols is None or imputer is None) and os.path.exists(MODEL_SAVE_PATH):
        try:
            bundle = joblib.load(MODEL_SAVE_PATH)
            model = bundle.get("model")
            feature_cols = bundle.get("feature_columns")
            imputer = bundle.get("imputer")
            model_service.BEST_MODEL_OBJECT = model
            model_service.FEATURE_COLUMNS = feature_cols
            model_service.IMPUTER = imputer
        except Exception as e:
            raise ValueError(f"Could not load trained model from disk: {e}")

    if model is None or feature_cols is None or imputer is None:
        raise ValueError("Model has not been trained yet. Please train a model first.")

    if not input_data or not isinstance(input_data, dict):
        raise ValueError("Invalid input data: expected a dictionary of feature values.")

    # Create 1-row DataFrame
    df = pd.DataFrame([input_data])

    # Convert categoricals with get_dummies
    df_encoded = pd.get_dummies(df, drop_first=False)

    # Align columns with trained FEATURE_COLUMNS
    for col in feature_cols:
        if col not in df_encoded.columns:
            df_encoded[col] = 0.0

    df_aligned = df_encoded[feature_cols]

    # Impute missing values
    imputed_vals = imputer.transform(df_aligned)
    df_ready = pd.DataFrame(imputed_vals, columns=feature_cols)

    # Make prediction
    raw_pred = model.predict(df_ready)[0]

    # Convert to standard Python type for clean JSON serialization
    if isinstance(raw_pred, (np.integer, int)):
        return int(raw_pred)
    elif isinstance(raw_pred, (np.floating, float)):
        return round(float(raw_pred), 4)
    else:
        return str(raw_pred)