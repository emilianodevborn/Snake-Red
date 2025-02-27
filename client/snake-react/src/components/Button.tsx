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
      className={`p-4 rounded-3xl transition duration-200 border-none w-full ${
        variant === "primary"
          ? "bg-[#C60280] text-white hover:bg-[#C60280]/75"
          : "bg-white text-[#C60280] hover:bg-white/75"
      } ${disabled ? "opacity-50 cursor-not-allowed hover:bg-opacity-50" : ""}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
