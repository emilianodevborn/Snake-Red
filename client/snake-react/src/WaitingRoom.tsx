import React, { useState, useEffect } from "react";

interface Player {
  id: string;
  name: string;
}

interface WaitingRoomProps {
  onStartGame: () => void;
  setRole: (role: "host" | "client") => void;
  isHost: boolean;
  socket: WebSocket;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  onStartGame,
  isHost,
  socket,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [inputRoomId, setInputRoomId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [isJoined, setIsJoined] = useState<boolean>(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "roomCreated" && isHost) {
          setRoomId(data.roomId);
          setPlayers([{ id: data.playerId, name: data.name }]);
        } else if (data.type === "playerList") {
          setPlayers(data.players);
        } else if (data.type === "startGame") {
          onStartGame();
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

  const createRoom = () => {
    if (socket && playerName.trim() !== "") {
      const createMessage = {
        type: "createRoom",
        name: playerName,
      };
      socket.send(JSON.stringify(createMessage));
      setIsJoined(true);
    }
  };

  const joinRoom = () => {
    if (socket && playerName.trim() !== "" && inputRoomId.trim() !== "") {
      const joinMessage = {
        type: "joinRoom",
        roomId: inputRoomId,
        name: playerName,
      };
      socket.send(JSON.stringify(joinMessage));
      setIsJoined(true);
    }
  };

  const startGame = () => {
    if (socket) {
      const startGameMessage = { type: "startGame" };
      socket.send(JSON.stringify(startGameMessage));
      console.log("Mensaje startGame enviado al servidor");
    }
  };

  return (
    <div>
      <h2>Sala de Espera</h2>
      {!isJoined ? (
        <div>
          <label>
            Ingresa tu nombre:
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </label>
          {isHost ? (
            <button onClick={createRoom}>Crear Sala</button>
          ) : (
            <>
              <label>
                Ingresa el código de sala:
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                />
              </label>
              <button onClick={joinRoom}>Unirse a Sala</button>
            </>
          )}
        </div>
      ) : (
        <div>
          <p>
            Bienvenido, {playerName}. {isHost ? `Sala ID: ${roomId}` : ""}
          </p>
          <h3>Jugadores conectados:</h3>
          <ul>
            {players.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
          {isHost && (
            <div>
              <button onClick={startGame}>Iniciar Juego</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
