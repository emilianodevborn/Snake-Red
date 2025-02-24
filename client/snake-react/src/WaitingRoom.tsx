import React, { useState, useEffect } from "react";

import GameButtons from "./components/GameButtons";
interface Player {
  id: string;
  name: string;
}

interface WaitingRoomProps {
    onStartGame: () => void;
    isHost: boolean;
    playerName: string;
    socket: WebSocket | null;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ onStartGame, isHost, playerName, socket }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [roomId, setRoomId] = useState<string>("");

    useEffect(() => {
        if (!socket) return;
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case "startGame":
                        onStartGame();
                        return;
                    case "playerList":
                        setPlayers(data.players);
                        setRoomId(data.roomId);
                        return;
                    case "roomCreated":
                        setPlayers([{ id: data.playerId, name: playerName }]);
                        setRoomId(data.roomId);
                        return;
                    default:
                        return;
                }
            } catch (err) {
                console.error("Error parseando mensaje:", err);
            }
        };

        socket.addEventListener("message", handleMessage);
        return () => {
            socket.removeEventListener("message", handleMessage);
        };
    }, [socket, onStartGame, isHost]);

    const startGame = () => {
        if (socket) {
            const startGameMessage = { type: "startGame" };
            socket.send(JSON.stringify(startGameMessage));
        }
    };

    return (
        <div style={{
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            gap: '15px'
        }}>
            <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'red',
                textTransform: 'uppercase',
            }}>Waiting for start...</div>
            {roomId && (
                <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#000',
                    flexDirection: 'row',
                    display: 'flex',
                }}>Room ID:<div style={{ color: 'green' }}>{roomId}</div></div>
            )}
            <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'red',
                flexDirection: 'row',
                display: 'flex',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                width: '100%',
                justifyContent: 'center',
                padding: '10px',
            }}>Players:</div>
            {players.map((player) => (
                <div key={player.id}>{player.name}</div>
            ))}
            {isHost && (
                <GameButtons onClick={startGame} text="Iniciar Juego" />
            )}
        </div>
    )
};

export default WaitingRoom;
