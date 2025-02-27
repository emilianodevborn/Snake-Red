import React, { useEffect, useState } from "react";
import GameButtons from "../components/GameButtons";
import { BOT_NAMES, Player } from "../game/GameTypes";
import { AVAILABLE_COLORS } from "../game/GameTypes";
import { assignBotName } from "../game/utils";
import { toast } from "react-toastify";
import Logo from "../assets/logo.svg";
import PlayerTag from "../components/PlayerTag";
import { Button } from "../components/Button";

interface WaitingRoomProps {
  onStartGame: () => void;
  isHost: boolean;
  socket: WebSocket | null;
  players: Player[];
  localPlayerId: string;
  onDifficultyChange: (difficulty: string) => void;
  onBackClick: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  onStartGame,
  isHost,
  socket,
  players,
  localPlayerId,
  onDifficultyChange,
  onBackClick,
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
    <div className="flex flex-col justify-center items-center  gap-4">
      <img src={Logo} alt="Logo Centibite" />
      <span className="font-bold text-3xl">
        {isHost ? "Create a new game" : "Waiting for others players..."}
      </span>
      <div className="flex flex-col justify-center items-center gap-4 relative">
        <div className="text-sm font-bold text-black grid grid-cols-4 items-center justify-center w-full gap-4">
          {players.map((player) => (
            <>
              {/* <div
                className={`text-lg font-bold color-[${
                  AVAILABLE_COLORS[player.colorIndex || 0]
                }]`}
                style={{ color: AVAILABLE_COLORS[player.colorIndex || 0] }}
              >
                {player.name}
              </div> */}
              <PlayerTag
                key={player.id}
                name={player.name}
                color={AVAILABLE_COLORS[player.colorIndex || 0]}
                className={
                  player.id === localPlayerId
                    ? "cursor-pointer"
                    : "cursor-not-allowed"
                }
                onClick={() =>
                  player.id === localPlayerId &&
                  setOpenColorPicker(!openColorPicker)
                }
              />
              {/* <div
                style={{
                  // backgroundColor: AVAILABLE_COLORS[player.colorIndex || 0],
                  cursor:
                    player.id === localPlayerId ? "pointer" : "not-allowed",
                }}
                className={`w-4 h-4 rounded-full opacity-75 ${
                  player.id === localPlayerId ? "animate-spin" : ""
                }`}
                onClick={() =>
                  player.id === localPlayerId &&
                  setOpenColorPicker(!openColorPicker)
                }
              /> */}
              {openColorPicker && player.id === localPlayerId && (
                <div className="absolute top-5 right-0 bg-white p-2 rounded-lg border border-black flex flex-wrap gap-2 w-full z-[1000] justify-center">
                  {AVAILABLE_COLORS.map((color, index) => {
                    const isAlreadyUsed = players.some(
                      (p) => p.colorIndex === index
                    );
                    const isPlayerColor = player.colorIndex === index;
                    const isDisabled = isAlreadyUsed && !isPlayerColor;

                    return (
                      <div
                        key={color}
                        className="relative size-5 flex items-center justify-center"
                      >
                        <div
                          className={`size-4 rounded-full border border-black border-solid ${
                            isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                          } ${isDisabled ? "opacity-50" : "opacity-100"}`}
                          style={{
                            backgroundColor: color,
                          }}
                          onClick={() =>
                            !isDisabled && handleColorSelect(player.id, index)
                          }
                        />
                        {isDisabled && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-xs font-bold pointer-events-none">
                            ✕
                          </div>
                        )}
                        {isPlayerColor && (
                          <div
                            className="absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%] text-white text-xs font-bold pointer-events-none"
                            style={{ textShadow: "0px 0px 2px black" }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ))}
        </div>
        {isHost && (
          <div className="flex flex-col gap-4 w-96">
            <select
              className="p-4 w-full"
              onChange={(e) => onDifficultyChange(e.target.value)}
              defaultValue="2"
            >
              <option value="" disabled selected hidden>
                Game Difficulty Level
              </option>
              <option value="1">Let's take it easy</option>
              <option value="2">I'm ready for a challenge</option>
              <option value="3">Bring it on!</option>
            </select>
            <select
              className="p-4 w-full"
              onChange={(e) => setBotDifficulty(e.target.value)}
              defaultValue="easy"
            >
              <option value="" disabled selected hidden>
                Bot Difficulty Level
              </option>
              <option value="easy">Easy</option>
              <option value="hard">Hard</option>
            </select>

            <Button variant="secondary" onClick={addBot}>
              ADD AI PLAYER
            </Button>
            <Button onClick={startGame}>START GAME</Button>
            <div className="flex justify-between w-full">
              <span
                onClick={() => onBackClick()}
                className="cursor-pointer text-green-800 font-bold"
              >
                {"<- Go Back"}
              </span>
              {roomId && (
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
                  className=""
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
              )}
            </div>
            {/* <GameButtons onClick={addBot} text="Add bot" />
            <GameButtons onClick={startGame} text="Start game" /> */}
          </div>
        )}
      </div>
    </div>
  );
};

// {roomId && (
//   <button
//   onClick={() => {
//     navigator.clipboard.writeText(roomId);
//     const button = document.activeElement as HTMLButtonElement;
//     const originalText = button.textContent;
//     button.textContent = "Copied!";
//     button.style.backgroundColor = "#4CAF50";
//     button.style.color = "white";

//     setTimeout(() => {
//       button.textContent = originalText;
//       button.style.backgroundColor = "white";
//       button.style.color = "black";
//     }, 1000);
//   }}
//   style={{
//     backgroundColor: "white",
//     border: "1px solid black",
//     borderRadius: "5px",
//     padding: "2px 8px",
//     cursor: "pointer",
//     fontSize: "12px",
//     display: "flex",
//     alignItems: "center",
//     marginLeft: "5px",
//     transition: "all 0.2s ease",
//     transform: "scale(1)",
//   }}
//   onMouseDown={(e) => {
//     const button = e.currentTarget;
//     button.style.transform = "scale(0.95)";
//   }}
//   onMouseUp={(e) => {
//     const button = e.currentTarget;
//     button.style.transform = "scale(1)";
//   }}
//   onMouseLeave={(e) => {
//     const button = e.currentTarget;
//     button.style.transform = "scale(1)";
//   }}
// >
//   Copy
// </button>
// )}

export default WaitingRoom;
