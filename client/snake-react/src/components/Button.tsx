import React, { useRef } from "react";
import keyPressSound from "../assets/key-press-sound.mp3";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  disabled,
  onClick,
  ...props
}) => {
  const buttonEffect = useRef<HTMLAudioElement>(new Audio(keyPressSound));
  const handleClick = () => {
    buttonEffect.current.pause();
    buttonEffect.current.play().then(() => {
      onClick();
    });
  }
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
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
