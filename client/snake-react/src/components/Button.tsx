import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={`p-4 rounded-3xl transition duration-200 border-none w-full font-bold shadow-lg cursor-pointer ${
        variant === "primary"
          ? "bg-[#C60280] text-white hover:bg-[#C60280]/80"
          : "bg-white text-[#C60280] hover:bg-white/80"
      } ${
        disabled
          ? "bg-gray-400 cursor-not-allowed text-gray-700 hover:bg-gray-400 "
          : ""
      }`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
