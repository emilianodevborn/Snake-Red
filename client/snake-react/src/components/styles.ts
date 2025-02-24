import type { CSSProperties } from "react";

export const wrapperStyles: CSSProperties = {
  backgroundColor: "oklch(0.21 0.034 264.665)",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  flexDirection: "column",
  color: "oklch(0.872 0.01 258.338)",
  height: "100vh",
  overflow: "hidden",
};

export const canvasStyles: CSSProperties = {
  border: "1px solid white",
  borderRadius: "6px",
};

export const boardStyles: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-around",
  width: "100%",
  padding: "24px",
};

export const controlsStyles: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "24px",
};
