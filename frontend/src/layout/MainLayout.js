import React from "react";
import Sidebar from "./Sidebar";
import "../styles/main.css";

function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

export default MainLayout;