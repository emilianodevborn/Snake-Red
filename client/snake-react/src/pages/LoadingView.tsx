// src/LoadingView.tsx
import React, { useEffect, useState } from "react";

interface LoadingViewProps {
  onReady: () => void;
  socket: WebSocket;
}

const LoadingView: React.FC<LoadingViewProps> = ({ onReady, socket }) => {
  const [status, setStatus] = useState("Esperando que inicie el juego...");

  useEffect(() => {
    let readyCalled = false;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "startGame") {
          console.log("Inicio de juego confirmado por el servidor");
          setStatus("¡Juego iniciado!");
          if (!readyCalled) {
            readyCalled = true;
            onReady();
          }
        }
      } catch (err) {
        console.error("Error parseando mensaje en LoadingView:", err);
      }
    };

    socket.addEventListener("message", handleMessage);

    // Fallback: si después de 2 segundos no se recibe startGame, asumimos que ya inició
    const timeout = setTimeout(() => {
      console.warn("Timeout en LoadingView, asumiendo juego iniciado");
      if (!readyCalled) {
        readyCalled = true;
        onReady();
      }
    }, 2000);

    return () => {
      socket.removeEventListener("message", handleMessage);
      clearTimeout(timeout);
    };
  }, [socket, onReady]);

  return (
    <div>
      <h2>Cargando...</h2>
      <p>{status}</p>
    </div>
  );
};

export default LoadingView;
