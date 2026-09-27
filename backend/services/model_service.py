import os
import joblib
import numpy as np
import pandas as pd
from pandas.api.types import is_numeric_dtype

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    r2_score,
    mean_squared_error,
    mean_absolute_error,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_curve,
    auc
)

from services.data_service import get_dataframe

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "storage", "models")
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "best_model.joblib")

# GLOBAL STORAGE
SPLIT_DATA = {}
BEST_MODEL_OBJECT = None
BEST_MODEL_NAME = None
PROBLEM_TYPE = None
FEATURE_COLUMNS = None
IMPUTER = None


def get_best_model_path():
    if os.path.exists(MODEL_SAVE_PATH):
        return MODEL_SAVE_PATH
    return None


def perform_train_test_split(df, target_column, test_size=0.2):
    global SPLIT_DATA, FEATURE_COLUMNS, IMPUTER

    if df is None or df.empty:
        raise ValueError("Dataset is empty. Please upload a dataset first.")

    if not target_column or target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' does not exist in dataset.")

    # Remove rows where target is NaN
    working_df = df.dropna(subset=[target_column]).copy()
    if working_df.empty:
        raise ValueError("All rows have missing target column values.")

    X = working_df.drop(columns=[target_column])
    y = working_df[target_column]

    # Convert categorical -> numeric via dummy variables
    X = pd.get_dummies(X, drop_first=False)
    FEATURE_COLUMNS = X.columns.tolist()

    # Fill missing values in features
    IMPUTER = SimpleImputer(strategy="mean")
    X_imputed = IMPUTER.fit_transform(X)
    X = pd.DataFrame(X_imputed, columns=FEATURE_COLUMNS)

    # Train / Test split
    test_size_clamped = min(max(float(test_size), 0.05), 0.5)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size_clamped, random_state=42
    )

    SPLIT_DATA = {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train.reset_index(drop=True),
        "y_test": y_test.reset_index(drop=True),
        "target": target_column,
        "test_size": test_size_clamped
    }

    return {
        "train_rows": int(X_train.shape[0]),
        "test_rows": int(X_test.shape[0]),
        "features": int(X_train.shape[1]),
        "target": target_column,
        "test_size": test_size_clamped
    }


def train_models(target_column=None):
    global SPLIT_DATA, BEST_MODEL_OBJECT, BEST_MODEL_NAME, PROBLEM_TYPE, FEATURE_COLUMNS, IMPUTER

    if not SPLIT_DATA or "X_train" not in SPLIT_DATA:
        # If train-test split hasn't been run yet, run it with default 0.2
        df = get_dataframe()
        if df is None:
            return {"error": "Please upload a dataset first."}
        if not target_column:
            return {"error": "Target column is required."}
        perform_train_test_split(df, target_column, 0.2)

    X_train = SPLIT_DATA["X_train"]
    X_test = SPLIT_DATA["X_test"]
    y_train = SPLIT_DATA["y_train"].copy()
    y_test = SPLIT_DATA["y_test"].copy()

    # Safe target null filling
    if is_numeric_dtype(y_train):
        mean_val = y_train.mean()
        y_train = y_train.fillna(0 if pd.isna(mean_val) else mean_val)
        y_test = y_test.fillna(0 if pd.isna(mean_val) else mean_val)
    else:
        mode_val = y_train.mode()
        fill_val = mode_val.iloc[0] if not mode_val.empty else "Unknown"
        y_train = y_train.fillna(fill_val)
        y_test = y_test.fillna(fill_val)

    # Problem type detection
    if (not is_numeric_dtype(y_train)) or (y_train.nunique() <= 10):
        PROBLEM_TYPE = "classification"
        # Convert classification target to clean strings to prevent mixed types
        y_train = y_train.astype(str)
        y_test = y_test.astype(str)
    else:
        PROBLEM_TYPE = "regression"
        y_train = pd.to_numeric(y_train, errors="coerce").fillna(0)
        y_test = pd.to_numeric(y_test, errors="coerce").fillna(0)

    # Re-store cleaned target
    SPLIT_DATA["y_train"] = y_train
    SPLIT_DATA["y_test"] = y_test

    if PROBLEM_TYPE == "classification":
        models = {
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
            "Decision Tree": DecisionTreeClassifier(random_state=42),
            "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42)
        }
    else:
        models = {
            "Linear Regression": LinearRegression(),
            "Decision Tree": DecisionTreeRegressor(random_state=42),
            "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42)
        }

    scores = {}
    best_score = -float("inf")
    best_name = ""
    best_obj = None

    for name, model in models.items():
        try:
            model.fit(X_train, y_train)
            preds = model.predict(X_test)

            if PROBLEM_TYPE == "classification":
                score = float(accuracy_score(y_test, preds))
            else:
                score = float(r2_score(y_test, preds))

            scores[name] = round(score, 4)

            if score > best_score:
                best_score = score
                best_obj = model
                best_name = name

        except Exception as e:
            scores[name] = "Error"

    BEST_MODEL_OBJECT = best_obj
    BEST_MODEL_NAME = best_name

    # Save best model to disk for persistence and download
    if best_obj is not None:
        bundle = {
            "model": best_obj,
            "model_name": best_name,
            "problem_type": PROBLEM_TYPE,
            "feature_columns": FEATURE_COLUMNS,
            "imputer": IMPUTER,
            "scores": scores,
            "best_score": best_score
        }
        joblib.dump(bundle, MODEL_SAVE_PATH)

    return {
        "problem_type": PROBLEM_TYPE,
        "scores": scores,
        "best_model": best_name,
        "best_score": round(best_score, 4) if best_score != -float("inf") else 0.0
    }


def get_feature_importance(target_column):
    df = get_dataframe()
    if df is None:
        raise ValueError("Dataset not loaded. Please upload dataset first.")

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found.")

    working_df = df.dropna(subset=[target_column]).copy()
    X = working_df.drop(columns=[target_column])
    y = working_df[target_column]

    X = pd.get_dummies(X, drop_first=False)
    imputer = SimpleImputer(strategy="mean")
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)

    if (not is_numeric_dtype(y)) or (y.nunique() <= 10):
        model = RandomForestClassifier(n_estimators=50, random_state=42)
        y = y.astype(str)
    else:
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        y = pd.to_numeric(y, errors="coerce").fillna(0)

    model.fit(X_imputed, y)
    importances = model.feature_importances_

    result = {
        col: round(float(importances[i]), 4)
        for i, col in enumerate(X.columns)
    }

    return result


def evaluate_model():
    global SPLIT_DATA, BEST_MODEL_OBJECT, PROBLEM_TYPE

    # Check memory first, then disk
    if BEST_MODEL_OBJECT is None and os.path.exists(MODEL_SAVE_PATH):
        try:
            bundle = joblib.load(MODEL_SAVE_PATH)
            BEST_MODEL_OBJECT = bundle["model"]
            PROBLEM_TYPE = bundle["problem_type"]
        except Exception:
            pass

    if BEST_MODEL_OBJECT is None or not SPLIT_DATA:
        return {"error": "Please train a model first"}

    X_train = SPLIT_DATA["X_train"]
    X_test = SPLIT_DATA["X_test"]
    y_train = SPLIT_DATA["y_train"]
    y_test = SPLIT_DATA["y_test"]

    model = BEST_MODEL_OBJECT
    train_preds = model.predict(X_train)
    test_preds = model.predict(X_test)

    result = {"train": {}, "test": {}}

    # ================= REGRESSION =================
    if PROBLEM_TYPE == "regression":
        def adj_r2(r2, n, p):
            if n - p - 1 > 0:
                return float(1 - ((1 - r2) * (n - 1) / (n - p - 1)))
            return float(r2)

        def safe_mape(y_true, y_pred):
            y_t = np.array(y_true, dtype=float)
            y_p = np.array(y_pred, dtype=float)
            mask = y_t != 0
            if np.sum(mask) == 0:
                return 0.0
            return float(np.mean(np.abs((y_t[mask] - y_p[mask]) / y_t[mask])) * 100)

        p = X_train.shape[1]
        train_r2 = float(r2_score(y_train, train_preds))
        test_r2 = float(r2_score(y_test, test_preds))

        result["train"] = {
            "rmse": round(float(np.sqrt(mean_squared_error(y_train, train_preds))), 4),
            "mae": round(float(mean_absolute_error(y_train, train_preds)), 4),
            "mape": round(safe_mape(y_train, train_preds), 4),
            "r2": round(train_r2, 4),
            "adjusted_r2": round(adj_r2(train_r2, len(y_train), p), 4)
        }

        result["test"] = {
            "rmse": round(float(np.sqrt(mean_squared_error(y_test, test_preds))), 4),
            "mae": round(float(mean_absolute_error(y_test, test_preds)), 4),
            "mape": round(safe_mape(y_test, test_preds), 4),
            "r2": round(test_r2, 4),
            "adjusted_r2": round(adj_r2(test_r2, len(y_test), p), 4)
        }

        return {
            "problem_type": PROBLEM_TYPE,
            "metrics": result
        }

    # ================= CLASSIFICATION =================
    else:
        result["train"] = {
            "accuracy": round(float(accuracy_score(y_train, train_preds)), 4),
            "precision": round(float(precision_score(y_train, train_preds, average="weighted", zero_division=0)), 4),
            "recall": round(float(recall_score(y_train, train_preds, average="weighted", zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_train, train_preds, average="weighted", zero_division=0)), 4)
        }

        result["test"] = {
            "accuracy": round(float(accuracy_score(y_test, test_preds)), 4),
            "precision": round(float(precision_score(y_test, test_preds, average="weighted", zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, test_preds, average="weighted", zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, test_preds, average="weighted", zero_division=0)), 4)
        }

        cm = confusion_matrix(y_test, test_preds)

        # ROC Curve for binary classification
        roc_data = None
        unique_classes = sorted(list(set(y_test)))
        if len(unique_classes) == 2 and hasattr(model, "predict_proba"):
            try:
                # Map to 0 and 1
                pos_label = unique_classes[1]
                probs = model.predict_proba(X_test)[:, 1]
                binary_y = (np.array(y_test) == pos_label).astype(int)

                fpr, tpr, _ = roc_curve(binary_y, probs)
                roc_auc = float(auc(fpr, tpr))

                roc_data = {
                    "fpr": [round(float(x), 4) for x in fpr.tolist()],
                    "tpr": [round(float(x), 4) for x in tpr.tolist()],
                    "auc": round(roc_auc, 4)
                }
            except Exception:
                roc_data = None

        return {
            "problem_type": PROBLEM_TYPE,
            "metrics": result,
            "confusion_matrix": cm.tolist(),
            "classes": [str(c) for c in unique_classes],
            "roc_curve": roc_data
        }
