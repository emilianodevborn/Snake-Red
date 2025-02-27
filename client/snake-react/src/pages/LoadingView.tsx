// src/LoadingView.tsx
import React, { useEffect, useState } from "react";

interface LoadingViewProps {
  onReady: () => void;
  socket: WebSocket;
}

const LoadingView: React.FC<LoadingViewProps> = ({ onReady, socket }) => {
  const [status, setStatus] = useState("Waiting for game to start...");

  useEffect(() => {
    let readyCalled = false;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "startGame") {
          console.log("Game starting confirmed by the server");
          setStatus("Game started!");
          if (!readyCalled) {
            readyCalled = true;
            onReady();
          }
        }
      } catch (err) {
        console.error("Error happening in the game start:", err);
      }
    };

    socket.addEventListener("message", handleMessage);

    // Fallback: si después de 2 segundos no se recibe startGame, asumimos que ya inició
    const timeout = setTimeout(() => {
      console.warn("Timeout in LoadingView, assuming game started");
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
      <h2>Loading...</h2>
      <p>{status}</p>
    </div>
  );
};

export default LoadingView;
