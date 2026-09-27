import unittest
import io
import json
import os
import pandas as pd
from app import app, set_dataframe, set_raw_dataframe

class AutoSmartMLBackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        cls.client = app.test_client()

        # Create a small synthetic dataset for testing
        data = {
            "age": [25, 30, 35, 40, 28, 45, 50, 23, 38, 42, None, 33],
            "salary": [50000, 60000, 75000, 90000, 55000, 110000, 130000, 48000, 80000, 95000, 70000, 65000],
            "department": ["IT", "HR", "IT", "Finance", "HR", "Finance", "IT", "HR", "Finance", "IT", "HR", "Finance"],
            "purchased": ["No", "Yes", "No", "Yes", "No", "Yes", "Yes", "No", "Yes", "Yes", "No", "Yes"]
        }
        cls.test_csv_bytes = pd.DataFrame(data).to_csv(index=False).encode("utf-8")

    def test_01_health_and_home(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "online")

        res_h = self.client.get("/health")
        self.assertEqual(res_h.status_code, 200)

    def test_02_upload_dataset(self):
        res = self.client.post(
            "/upload-dataset",
            data={"file": (io.BytesIO(self.test_csv_bytes), "test_data.csv")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("rows", data)
        self.assertEqual(data["rows"], 12)
        self.assertEqual(data["columns"], 4)

    def test_03_dataset_info(self):
        res = self.client.get("/dataset-info")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("summary", data)
        self.assertIn("ai_insights", data)

    def test_04_set_target(self):
        res = self.client.post(
            "/set-target",
            json={"target": "purchased"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["target"], "purchased")

    def test_05_clean_data(self):
        res = self.client.post("/clean-data")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("report", data)
        self.assertIn("missing_values_filled", data["report"])

    def test_06_eda_endpoints(self):
        res_num = self.client.get("/eda/numeric-columns")
        self.assertEqual(res_num.status_code, 200)
        num_cols = res_num.get_json()["columns"]
        self.assertIn("age", num_cols)

        res_hist = self.client.post("/eda/histogram", json={"column": "age"})
        self.assertEqual(res_hist.status_code, 200)
        self.assertIn("chart", res_hist.get_json())

        res_box = self.client.post("/eda/boxplot", json={"column": "age"})
        self.assertEqual(res_box.status_code, 200)

        res_count = self.client.post("/eda/countplot", json={"column": "department"})
        self.assertEqual(res_count.status_code, 200)

        res_heat = self.client.get("/eda/heatmap")
        self.assertEqual(res_heat.status_code, 200)

    def test_07_train_test_split(self):
        res = self.client.post("/split", json={"target": "purchased", "test_size": 0.25})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("train_rows", data)
        self.assertIn("test_rows", data)

    def test_08_recommend_models(self):
        res = self.client.get("/recommend_models?target=purchased")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("recommended_models", data)

    def test_09_train_models(self):
        res = self.client.post("/train_models", json={"target": "purchased"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("best_model", data)
        self.assertIn("scores", data)

    def test_10_feature_importance(self):
        res = self.client.post("/feature_importance", json={"target": "purchased"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIsInstance(data, dict)

    def test_11_evaluate_model(self):
        res = self.client.get("/evaluate_model")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("metrics", data)
        self.assertIn("train", data["metrics"])

    def test_12_predict(self):
        res = self.client.post("/predict", json={"age": 30, "salary": 65000, "department": "IT"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("prediction", data)

    def test_13_download_model(self):
        res = self.client.get("/download-model")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.headers.get("Content-Disposition", "").startswith("attachment"))

if __name__ == "__main__":
    unittest.main()
