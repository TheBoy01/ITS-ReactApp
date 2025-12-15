import React from "react";

export default function Input({ label, type = "text", value, onChange, name, placeholder, ...rest }) {
  return (
    <label className="block">
      {label && <span className="text-sm font-medium text-gray-700 mb-1 block">{label}</span>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        {...rest}
      />
    </label>
  );
}
