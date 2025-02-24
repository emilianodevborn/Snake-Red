// src/App.tsx
import React, { useState, useEffect } from "react";
import StartScreen from "./StartScreen";
import WaitingRoom from "./WaitingRoom";
import LoadingView from "./LoadingView";
import GameView from "./components/GameView";

export enum GamePhase {
  START = "start",
  LOBBY = "lobby",
  LOADING = "loading",
  GAME = "game",
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.START);
  const [role, setRole] = useState<"host" | "client" | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("https://4712-190-210-239-237.ngrok-free.app");
    setSocket(ws);
    ws.onopen = () =>
      console.log("Conectado al servidor de señalización (App.tsx)");
    return () => ws.close();
  }, []);

  return (
    <div>
      {phase === GamePhase.START && (
        <StartScreen
          onSelectHost={() => {
            setRole("host");
            setPhase(GamePhase.LOBBY);
          }}
          onSelectClient={() => {
            setRole("client");
            setPhase(GamePhase.LOBBY);
          }}
        />
      )}

      {phase === GamePhase.LOBBY && role && socket && (
        <WaitingRoom
          onStartGame={() => setPhase(GamePhase.LOADING)}
          setRole={setRole}
          isHost={role === "host"}
          socket={socket}
        />
      )}

      {phase === GamePhase.LOADING && role && socket && (
        <LoadingView socket={socket} onReady={() => setPhase(GamePhase.GAME)} />
      )}

      {phase === GamePhase.GAME && socket && (
        <GameView role={role} socket={socket} />
      )}
    </div>
  );
};

export default App;
