import os
import matplotlib
matplotlib.use("Agg")

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd

from services.data_service import (
    DataService,
    get_dataframe,
    set_dataframe,
    get_raw_dataframe,
    set_raw_dataframe
)
from services.cleaning_service import clean_dataset
from services.eda_service import (
    get_numeric_columns,
    get_categorical_columns,
    generate_histogram,
    generate_boxplot,
    generate_countplot,
    generate_heatmap,
    create_dataset_summary
)
from services.ai_service import (
    dataset_overview_ai,
    cleaning_ai,
    eda_chart_ai,
    recommend_algorithms
)
from services.model_service import (
    perform_train_test_split,
    train_models,
    get_feature_importance,
    evaluate_model,
    MODEL_DIR,
    MODEL_SAVE_PATH
)
from services.prediction_service import make_prediction

# -----------------------------
# APP CONFIGURATION
# -----------------------------

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "storage", "datasets")
IMAGE_DIR = os.path.join(BASE_DIR, "storage", "images")
MODEL_DIRECTORY = os.path.join(BASE_DIR, "storage", "models")

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(MODEL_DIRECTORY, exist_ok=True)

TARGET_COLUMN = None
data_service = DataService()


# -----------------------------
# ROOT & HEALTH CHECK
# -----------------------------

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "service": "AutoSmartML Backend",
        "version": "1.0.0"
    })


@app.route("/health")
def health():
    return jsonify({"status": "healthy"}), 200


# -----------------------------
# UPLOAD DATASET
# -----------------------------

@app.route("/upload-dataset", methods=["POST"])
def upload_dataset():
    global TARGET_COLUMN

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Please select a CSV file."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    filename = secure_filename(file.filename)
    if not filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported."}), 400

    filepath = os.path.join(DATASET_DIR, filename)
    try:
        file.save(filepath)
    except Exception as e:
        return jsonify({"error": f"Failed to save file: {str(e)}"}), 500

    analysis = data_service.analyze_dataset(filepath)
    if "error" in analysis:
        return jsonify(analysis), 400

    try:
        df = pd.read_csv(filepath)
        set_dataframe(df)
        set_raw_dataframe(df)
        TARGET_COLUMN = None
    except Exception as e:
        return jsonify({"error": f"Failed to parse CSV: {str(e)}"}), 400

    return jsonify(analysis)


# -----------------------------
# DATASET INFO + AI
# -----------------------------

@app.route("/dataset-info")
def dataset_info():
    df = get_dataframe()
    if df is None or df.empty:
        return jsonify({"error": "No dataset uploaded yet. Please upload a dataset first."}), 400

    summary = create_dataset_summary(df)
    ai_insights = dataset_overview_ai(summary)

    return jsonify({
        "summary": summary,
        "ai_insights": ai_insights
    })


# -----------------------------
# SET TARGET COLUMN
# -----------------------------

@app.route("/set-target", methods=["POST"])
def set_target():
    global TARGET_COLUMN

    data = request.get_json(silent=True) or {}
    target = data.get("target", "").strip()

    if not target:
        return jsonify({"error": "Target column cannot be empty"}), 400

    df = get_dataframe()
    if df is not None and target not in df.columns:
        return jsonify({"error": f"Column '{target}' not found in dataset"}), 400

    TARGET_COLUMN = target
    return jsonify({
        "message": f"Target column set to '{TARGET_COLUMN}' successfully",
        "target": TARGET_COLUMN
    })


# -----------------------------
# CLEAN DATA
# -----------------------------

@app.route("/clean-data", methods=["POST"])
def clean_data():
    global TARGET_COLUMN

    df = get_dataframe()
    if df is None or df.empty:
        return jsonify({"error": "No dataset loaded. Upload a dataset first."}), 400

    try:
        cleaned_df, report = clean_dataset(df, TARGET_COLUMN)
        set_dataframe(cleaned_df)
        summary = create_dataset_summary(cleaned_df)
        ai_insights = cleaning_ai(summary)

        return jsonify({
            "message": "Dataset cleaned successfully",
            "report": report,
            "ai_insights": ai_insights
        })
    except Exception as e:
        return jsonify({"error": f"Cleaning failed: {str(e)}"}), 500


# -----------------------------
# EDA ROUTES
# -----------------------------

@app.route("/eda/numeric-columns")
def eda_numeric_columns():
    df = get_dataframe()
    cols = get_numeric_columns(df)
    return jsonify({"columns": cols})


@app.route("/eda/categorical-columns")
def eda_categorical_columns():
    df = get_dataframe()
    cols = get_categorical_columns(df)
    return jsonify({"columns": cols})


@app.route("/eda/histogram", methods=["POST"])
def eda_histogram():
    df = get_dataframe()
    if df is None:
        return jsonify({"error": "No dataset loaded"}), 400

    data = request.get_json(silent=True) or {}
    column = data.get("column")
    if not column:
        return jsonify({"error": "Column is required"}), 400

    try:
        chart_path = generate_histogram(df, column)
        ai_insight = eda_chart_ai("histogram", column, df)
        return jsonify({"chart": chart_path, "ai_insight": ai_insight})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/eda/boxplot", methods=["POST"])
def eda_boxplot():
    df = get_dataframe()
    if df is None:
        return jsonify({"error": "No dataset loaded"}), 400

    data = request.get_json(silent=True) or {}
    column = data.get("column")
    if not column:
        return jsonify({"error": "Column is required"}), 400

    try:
        chart_path = generate_boxplot(df, column)
        ai_insight = eda_chart_ai("boxplot", column, df)
        return jsonify({"chart": chart_path, "ai_insight": ai_insight})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/eda/countplot", methods=["POST"])
def eda_countplot():
    df = get_dataframe()
    if df is None:
        return jsonify({"error": "No dataset loaded"}), 400

    data = request.get_json(silent=True) or {}
    column = data.get("column")
    if not column:
        return jsonify({"error": "Column is required"}), 400

    try:
        chart_path = generate_countplot(df, column)
        ai_insight = eda_chart_ai("countplot", column, df)
        return jsonify({"chart": chart_path, "ai_insight": ai_insight})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/eda/heatmap")
def eda_heatmap():
    df = get_dataframe()
    if df is None:
        return jsonify({"error": "No dataset loaded"}), 400

    try:
        chart_path = generate_heatmap(df, TARGET_COLUMN)
        ai_insight = eda_chart_ai("heatmap", "all features", df, TARGET_COLUMN)
        return jsonify({"chart": chart_path, "ai_insight": ai_insight})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# -----------------------------
# TRAIN-TEST SPLIT
# -----------------------------

@app.route("/split", methods=["POST"])
def split():
    global TARGET_COLUMN

    data = request.get_json(silent=True) or {}
    test_size = float(data.get("test_size", 0.2))
    target = data.get("target") or TARGET_COLUMN

    if not target:
        return jsonify({"error": "Target column is required for split"}), 400

    df = get_dataframe()
    if df is None:
        return jsonify({"error": "No dataset loaded"}), 400

    try:
        result = perform_train_test_split(df, target, test_size)
        TARGET_COLUMN = target
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# -----------------------------
# RECOMMEND MODELS
# -----------------------------

@app.route("/recommend_models", methods=["GET"])
def recommend_models_route():
    df = get_dataframe()
    if df is None:
        return jsonify({"error": "No dataset loaded"}), 400

    target = request.args.get("target") or TARGET_COLUMN
    if not target:
        return jsonify({"error": "Target column is required"}), 400

    summary = create_dataset_summary(df)
    result = recommend_algorithms(summary, target)
    return jsonify(result)


# -----------------------------
# TRAIN MODELS
# -----------------------------

@app.route("/train_models", methods=["POST"])
def train_models_route():
    global TARGET_COLUMN

    data = request.get_json(silent=True) or {}
    target = data.get("target") or TARGET_COLUMN

    if not target:
        return jsonify({"error": "Target column is required to train models"}), 400

    try:
        result = train_models(target)
        if "error" in result:
            return jsonify(result), 400
        TARGET_COLUMN = target
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Training failed: {str(e)}"}), 500


# -----------------------------
# FEATURE IMPORTANCE
# -----------------------------

@app.route("/feature_importance", methods=["POST"])
def feature_importance():
    global TARGET_COLUMN

    data = request.get_json(silent=True) or {}
    target = data.get("target") or TARGET_COLUMN

    if not target:
        return jsonify({"error": "Target column not provided"}), 400

    try:
        result = get_feature_importance(target)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# -----------------------------
# EVALUATE MODEL
# -----------------------------

@app.route("/evaluate_model", methods=["POST", "GET"])
def evaluate_model_api():
    try:
        result = evaluate_model()
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Evaluation failed: {str(e)}"}), 500


# -----------------------------
# PREDICT
# -----------------------------

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No input data provided for prediction"}), 400

    try:
        prediction = make_prediction(data)
        return jsonify({"prediction": prediction})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# -----------------------------
# GET FEATURES
# -----------------------------

@app.route("/get_features", methods=["GET"])
def get_features():
    df = get_raw_dataframe() or get_dataframe()
    if df is None:
        return jsonify({"error": "Dataset not loaded. Please upload dataset first."}), 400

    features = []
    for col in df.columns:
        if col == TARGET_COLUMN:
            continue

        unique_vals = df[col].dropna().unique()
        unique_count = len(unique_vals)
        col_type = df[col].dtype

        if col_type == "object" or col_type.name == "category" or unique_count <= 8:
            options = sorted([str(v) for v in unique_vals[:30]])
            features.append({
                "name": col,
                "type": "categorical",
                "options": options
            })
        else:
            features.append({
                "name": col,
                "type": "numeric"
            })

    return jsonify(features)


# -----------------------------
# DOWNLOAD TRAINED MODEL
# -----------------------------

@app.route("/download-model", methods=["GET"])
def download_model():
    if not os.path.exists(MODEL_SAVE_PATH):
        return jsonify({"error": "No trained model found. Please train a model first."}), 404

    return send_from_directory(
        MODEL_DIRECTORY,
        "best_model.joblib",
        as_attachment=True,
        download_name="best_model.joblib"
    )


# -----------------------------
# SERVE IMAGES
# -----------------------------

@app.route("/storage/images/<filename>")
def serve_image(filename):
    safe_name = secure_filename(filename)
    return send_from_directory(IMAGE_DIR, safe_name)


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
