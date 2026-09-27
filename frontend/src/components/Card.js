import React from "react";

function Card({ children, title, subtitle, className = "", style = {} }) {
  return (
    <div className={`card ${className}`.trim()} style={style}>
      {title && <h3 style={{ marginBottom: subtitle ? "6px" : "15px" }}>{title}</h3>}
      {subtitle && <p className="page-subtitle" style={{ marginBottom: "15px" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

export default Card;
