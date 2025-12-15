import React from "react";

export default function Button({ children, onClick, type = "button", className = "", ...rest }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center px-6 py-3 rounded-full text-white bg-teal-700 hover:bg-teal-800 focus:outline-none ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
