import React from "react";
import { AVAILABLE_COLORS } from "../game/GameTypes";

interface Props {
  className?: string;
  color: (typeof AVAILABLE_COLORS)[number];
  onClick?: () => void;
}

const ColorPicker = ({
  color = AVAILABLE_COLORS[0],
  className,
  onClick,
}: Props) => {
  return (
    <span className={`relative flex size-4 ${className}`} onClick={onClick}>
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75`}
        style={{ backgroundColor: color }}
      />
      <span
        className={`relative inline-flex size-4 rounded-full `}
        style={{ backgroundColor: color }}
      />
    </span>
  );
};

export default ColorPicker;
