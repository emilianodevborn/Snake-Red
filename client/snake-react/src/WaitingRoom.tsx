import React, { useEffect, useState } from "react";
import GameButtons from "./components/GameButtons";
import { BOT_NAMES, Player } from "./game/GameTypes";
import { AVAILABLE_COLORS } from "./game/GameTypes";
import { assignBotName } from "./game/utils";
import { toast } from "react-toastify";

interface WaitingRoomProps {
  onStartGame: () => void;
  isHost: boolean;
  socket: WebSocket | null;
  players: Player[];
  localPlayerId: string;
  onDifficultyChange: (difficulty: string) => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  onStartGame,
  isHost,
  socket,
  players,
  localPlayerId,
  onDifficultyChange,
}) => {
  const [roomId, setRoomId] = useState<string>("");
  const [openColorPicker, setOpenColorPicker] = useState<boolean>(false);
  const [botDifficulty, setBotDifficulty] = useState<string>("easy");
  const bots = players.filter((p: any) => p.isBot);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "startGame":
            onStartGame();
            return;
          case "roomCreated":
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

  const handleColorSelect = (playerId: string, newColorIndex: number) => {
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "changeColor",
          roomId,
          playerId,
          newColorIndex,
        })
      );
      setOpenColorPicker(false);
    }
  };

  const startGame = () => {
    if (socket) {
      const startGameMessage = { type: "startGame" };
      socket.send(JSON.stringify(startGameMessage));
    }
  };

  const addBot = () => {
    if (socket && isHost) {
      if (bots.length < 4) {
        const addBotMessage = {
          type: "addBot",
          botName: assignBotName(bots, botDifficulty),
          botDifficulty: botDifficulty,
        };
        socket.send(JSON.stringify(addBotMessage));
      } else {
        toast.warn("You can only add 4 bots");
      }
    }
  };

  return (
    <div
      style={{
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      <div
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: "red",
          textTransform: "uppercase",
        }}
      >
        Waiting for other players...
      </div>
      {roomId && (
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#000",
            flexDirection: "row",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          Room ID:
          <div style={{ color: "green" }}>{roomId}</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              const button = document.activeElement as HTMLButtonElement;
              const originalText = button.textContent;
              button.textContent = "Copied!";
              button.style.backgroundColor = "#4CAF50";
              button.style.color = "white";

              setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = "white";
                button.style.color = "black";
              }, 1000);
            }}
            style={{
              backgroundColor: "white",
              border: "1px solid black",
              borderRadius: "5px",
              padding: "2px 8px",
              cursor: "pointer",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              marginLeft: "5px",
              transition: "all 0.2s ease",
              transform: "scale(1)",
            }}
            onMouseDown={(e) => {
              const button = e.currentTarget;
              button.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              const button = e.currentTarget;
              button.style.transform = "scale(1)";
            }}
            onMouseLeave={(e) => {
              const button = e.currentTarget;
              button.style.transform = "scale(1)";
            }}
          >
            Copy
          </button>
        </div>
      )}
      <div
        style={{
          fontSize: "14px",
          fontWeight: "bold",
          color: "black",
          flexDirection: "column",
          display: "flex",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          width: "100%",
          justifyContent: "center",
          padding: "10px",
          gap: "10px",
          borderRadius: "10px",
        }}
      >
        Players:
        {players.map((player) => (
          <div
            key={player.id}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              padding: "10px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: AVAILABLE_COLORS[player.colorIndex || 0],
              }}
            >
              {player.name}
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  backgroundColor: AVAILABLE_COLORS[player.colorIndex || 0],
                  width: "15px",
                  height: "15px",
                  borderRadius: "50%",
                  cursor:
                    player.id === localPlayerId ? "pointer" : "not-allowed",
                  border: "1px solid black",
                }}
                onClick={() =>
                  player.id === localPlayerId &&
                  setOpenColorPicker(!openColorPicker)
                }
              />
              {openColorPicker && player.id === localPlayerId && (
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "0",
                    backgroundColor: "white",
                    padding: "5px",
                    borderRadius: "5px",
                    border: "1px solid black",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "5px",
                    width: "100px",
                    zIndex: 1000,
                    justifyContent: "center",
                  }}
                >
                  {AVAILABLE_COLORS.map((color, index) => {
                    const isAlreadyUsed = players.some(
                      (p) => p.colorIndex === index
                    );
                    const isPlayerColor = player.colorIndex === index;
                    const isDisabled = isAlreadyUsed && !isPlayerColor;

                    return (
                      <div
                        key={color}
                        style={{
                          position: "relative",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: color,
                            width: "15px",
                            height: "15px",
                            borderRadius: "50%",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            border: "1px solid black",
                            opacity: isDisabled ? 0.5 : 1,
                          }}
                          onClick={() =>
                            !isDisabled && handleColorSelect(player.id, index)
                          }
                        />
                        {isDisabled && (
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              color: "red",
                              fontSize: "14px",
                              fontWeight: "bold",
                              pointerEvents: "none",
                            }}
                          >
                            ✕
                          </div>
                        )}
                        {isPlayerColor && (
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                              pointerEvents: "none",
                              textShadow: "0px 0px 2px black",
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {isHost && (
        <>
          <fieldset style={{ width: "100%", border: 0 }}>
            <legend>Choose the difficulty</legend>
            <select
              style={{ width: "100%", padding: "6px", marginTop: "6px" }}
              onChange={(e) => onDifficultyChange(e.target.value)}
              defaultValue="2"
            >
              <option value="1">Let's take it easy</option>
              <option value="2">I'm ready for a challenge</option>
              <option value="3">Bring it on!</option>
            </select>
          </fieldset>
          <fieldset style={{ width: "100%", border: 0 }}>
            <legend>Choose BOT difficulty</legend>
            <select
              style={{ width: "100%", padding: "6px", marginTop: "6px" }}
              onChange={(e) => setBotDifficulty(e.target.value)}
              defaultValue="easy"
            >
              <option value="easy">Easy</option>
              <option value="hard">Hard</option>
            </select>
          </fieldset>

          <GameButtons onClick={addBot} text="Add bot" />
          <GameButtons onClick={startGame} text="Start game" />
        </>
      )}
    </div>
  );
};

export default WaitingRoom;
