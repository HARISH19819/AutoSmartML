import React from "react";

function Button({ children, onClick, disabled, className = "", variant = "primary", style = {}, type = "button" }) {
  const variantClass = variant === "secondary" ? "btn-secondary" : "btn";
  return (
    <button
      type={type}
      className={`${variantClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

export default Button;
