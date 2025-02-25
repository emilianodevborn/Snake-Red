// src/App.tsx
import React, { useState, useEffect } from "react";
import StartScreen from "./StartScreen";
import WaitingRoom from "./WaitingRoom";
import LoadingView from "./LoadingView";
import GameView from "./components/GameView";
import Modal from "./components/Modal";
import useCreateRoom from "./hooks/useCreateRoom";
import useJoinRoom from "./hooks/useJoinRoom";

import { Player } from "./game/GameTypes";
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
  const [name, setName] = useState<string>("");
  const { isJoined, createRoom } = useCreateRoom(socket, name);
  const [clientId, setClientId] = useState("");
  const { joinRoom } = useJoinRoom(socket, name, clientId);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const ws = new WebSocket("https://4712-190-210-239-237.ngrok-free.app");
    setSocket(ws);
    ws.onopen = () =>
      console.log("Conectado al servidor de señalización (App.tsx)");
    return () => ws.close();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "roomCreated") {
          setPlayers([{ id: data.playerId, name: data.name }]);
        }

        if (data.type === "playerList") {
          setPlayers(data.players);
        }
      } catch (err) {
        console.error("Error parseando mensaje:", err);
      }
    };

    socket?.addEventListener("message", handleMessage);
    return () => {
      socket?.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  return (
    <div>
      {phase === GamePhase.START && (
        <StartScreen
          setName={setName}
          setClientId={setClientId}
          clientId={clientId}
          name={name}
          onSelectHost={() => {
            createRoom();
            setRole("host");
            setPhase(GamePhase.LOBBY);
          }}
          onSelectClient={() => {
            joinRoom();
            setRole("client");
            setPhase(GamePhase.LOBBY);
          }}
        />
      )}

      <Modal
        isOpen={phase === GamePhase.LOBBY}
        onClose={() => setPhase(GamePhase.START)}
      >
        {role && socket && (
          <WaitingRoom
            onStartGame={() => setPhase(GamePhase.LOADING)}
            isHost={role === "host"}
            socket={socket}
            players={players}
          />
        )}
      </Modal>

      <Modal
        isOpen={phase === GamePhase.LOADING}
        onClose={() => setPhase(GamePhase.LOBBY)}
      >
        {role && socket && (
          <LoadingView
            socket={socket}
            onReady={() => setPhase(GamePhase.GAME)}
          />
        )}
      </Modal>

      {phase === GamePhase.GAME && socket && (
        <GameView role={role} socket={socket} players={players} />
      )}
    </div>
  );
};

export default App;
