import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Optional label prop
  error?: string; // Error message prop
}

const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    // <div className="flex flex-col gap-1 w-full">
    //   {label && <label className="text-sm font-medium">{label}</label>}
    <input
      className={`border p-4 rounded-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-lg ${
        error ? "border-red-500" : "border-gray-300"
      } ${className}`}
      {...props}
    />
    //   {error && <p className="text-red-500 text-xs">{error}</p>}
    // </div>
  );
};

export default Input;
