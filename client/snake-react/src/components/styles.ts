import type { CSSProperties } from "react";

export const wrapperStyles: CSSProperties = {
  backgroundColor: "oklch(0.21 0.034 264.665)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  color: "oklch(0.872 0.01 258.338)",
  height: "100vh",
  overflow: "hidden",
  width: "100%",
};

export const canvasContainerStyles: CSSProperties = {
  border: "1px solid white",
  borderRadius: "6px",
  overflow: "hidden",
  position: "relative",
  flexShrink: 0,
};
export const headerStyles: CSSProperties = {
  height: "200px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#fff", // color de fondo del header
  color: "#fff",
}

export const containerStyles: CSSProperties = {
  width: "200vw",
  height: "100vh",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#fff", // ejemplo de fondo
};

export const columnsContainerStyles: CSSProperties = {
  display: "flex",
  height: "600px",
  width: "1400px", // 100px (izquierda) + 800px (centro) + 100px (derecha)
  border: "1px solid white",
  borderRadius: "20px",
  overflow: "hidden",
  margin: "0 auto", // Centrado horizontalmente en la pantalla
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.25)",
};
export const leftColumnStyles: CSSProperties = {
  width: "300px",
  backgroundColor: "#F7FAF6",
  padding: "16px",
};

/**
 * Columna central: ancho fijo de 800px.
 */
export const centerColumnStyles: CSSProperties = {
  width: "800px",
  height: "600px",
  position: "relative", // para posicionar el canvas de forma absoluta dentro
  overflow: "hidden",
  backgroundColor: "#ddd", // o el color de fondo deseado
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/**
 * Columna derecha: flexible, se muestra solo si hay suficiente ancho.
 */
export const rightColumnStyles: CSSProperties = {
  width: "300px",
  backgroundColor: "#F7FAF6",
  padding: "16px",
  // Se podría ajustar más con media queries para ocultarla si es necesario.
};


export const canvasStyles: CSSProperties = {
  position: "absolute",
  backgroundImage: `url('/background.jpg')`,
};

export const rankingListStyles: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px", // espacio vertical entre filas
};

export const rankingItemStyles: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#fff",
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontWeight: 500,
};

export const rankingPositionStyles: CSSProperties = {
  marginRight: "8px",
};

export const rankingNameStyles: CSSProperties = {
  flex: 1, // para que ocupe todo el espacio restante
  marginRight: "8px",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const rankingScoreStyles: CSSProperties = {
  fontWeight: 700,
  color: "#555",
};

export const rankingItemFirstPlaceStyles: CSSProperties = {
  fontWeight: 'bold',
  fontSize: "1.2rem",
  color: "#C60280", // por ejemplo, un rojo o el color que quieras para el primero
};

export const rankingItemLocalStyles: CSSProperties = {
  border: "3px solid #4CAF50", // borde más grueso para el jugador local
  borderRadius: "4px",
};

export const rankingHeaderStyles: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  marginBottom: "12px",
};

export const rankingHeaderIconStyles: CSSProperties = {
  width: "30px",
  height: "30px",
};

export const rankingHeaderTextStyles: CSSProperties = {
  fontSize: "2rem",
  fontWeight: 700,
  color: "#d43f3f", // o el color que desees
};