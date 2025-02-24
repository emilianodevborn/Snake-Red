// src/App.tsx
import React, { useState, useEffect } from "react";
import StartScreen from "./StartScreen";
import WaitingRoom from "./WaitingRoom";
import LoadingView from "./LoadingView";
import GameView from "./components/GameView";
import Modal from "./components/Modal";
import useCreateRoom from "./hooks/useCreateRoom";

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
    const [clientId, setClientId] = useState('');

    useEffect(() => {
        const ws = new WebSocket("https://4712-190-210-239-237.ngrok-free.app");
        setSocket(ws);
        ws.onopen = () => console.log("Conectado al servidor de señalización (App.tsx)");
        return () => ws.close();
    }, []);

    return (
        <div>
            {phase === GamePhase.START && (
                <StartScreen
                    setName={setName}
                    setClientId={setClientId}
                    clientId={clientId}
                    name={name}
                onSelectHost={() => {
                    createRoom()
                    setRole("host");
                    setPhase(GamePhase.LOBBY);
                }}
                    onSelectClient={() => {
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
                        setRole={setRole}
                        isHost={role === "host"}
                        playerName={name}
                        isJoined={isJoined}
                        socket={socket}
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
        <GameView role={role} socket={socket} />
      )}
    </div>
  );
};

export default App;
