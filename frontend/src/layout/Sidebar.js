import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "../context/AppContext";

function Sidebar() {
  const { datasetInfo, targetColumn, trainedModel } = useContext(AppContext);

  return (
    <div className="sidebar">
      <div style={{ marginBottom: "25px", borderBottom: "1px solid #334155", paddingBottom: "15px" }}>
        <h2 style={{ fontSize: "20px", color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          🚀 AutoSmartML
        </h2>
        <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
          Automated Machine Learning Studio
        </span>
      </div>

      {/* Dataset & Model Status Badges */}
      <div style={{ marginBottom: "20px", fontSize: "12px", background: "#0f172a", padding: "10px", borderRadius: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ color: "#94a3b8" }}>Dataset:</span>
          <span style={{ color: datasetInfo ? "#4ade80" : "#ef4444", fontWeight: "bold" }}>
            {datasetInfo ? `${datasetInfo.rows} rows` : "None"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ color: "#94a3b8" }}>Target:</span>
          <span style={{ color: targetColumn ? "#38bdf8" : "#94a3b8", fontWeight: "bold", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {targetColumn || "Unset"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#94a3b8" }}>Model:</span>
          <span style={{ color: trainedModel ? "#a855f7" : "#94a3b8", fontWeight: "bold" }}>
            {trainedModel ? trainedModel.best_model : "Untrained"}
          </span>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          📂 Upload Dataset
        </NavLink>

        <NavLink
          to="/dataset"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          📊 Dataset Overview
        </NavLink>

        <NavLink
          to="/ai-report"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          🧠 AI Intelligence
        </NavLink>

        <NavLink
          to="/clean"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          🧹 Data Cleaning
        </NavLink>

        <NavLink
          to="/eda"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          📈 EDA Charts
        </NavLink>

        <NavLink
          to="/split"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          ✂️ Train-Test Split
        </NavLink>

        <NavLink
          to="/train"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          🤖 Model Training
        </NavLink>

        <NavLink
          to="/feature"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          🔥 Feature Importance
        </NavLink>

        <NavLink
          to="/evaluation"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          📉 Model Evaluation
        </NavLink>

        <NavLink
          to="/predict"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          🔮 Live Predict
        </NavLink>

        <NavLink
          to="/download"
          className={({ isActive }) =>
            isActive ? "sidebar-item active" : "sidebar-item"
          }
        >
          📦 Download Model
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;