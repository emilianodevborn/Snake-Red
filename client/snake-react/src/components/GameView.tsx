import React, { useEffect, useMemo, useRef, useState } from "react";
import obstacle from "../assets/stone.svg";
import faceDown from "../assets/face-down.svg";
import faceUp from "../assets/face-up.svg";
import faceLeft from "../assets/face-left.svg";
import faceRight from "../assets/face-right.svg";
import bodyUp from "../assets/body-down.svg";
import bodyDown from "../assets/body-up.svg";
import bodyRight from "../assets/body-left.svg";
import bodyLeft from "../assets/body-right.svg";
import orange from "../assets/orange.svg";
import lemon from "../assets/lemon.svg";
import apple from "../assets/apple.svg";
import cherry from "../assets/cherry.svg";
import mushroom from "../assets/mushroom.svg";
import strawberry from "../assets/strawberry.svg";
import watermelon from "../assets/watermelon.svg";
import goldenApple from "../assets/golden-apple.png";

import { updateGameState } from "../game/GameLogic";
import {
  AVAILABLE_COLORS,
  CANVAS_CONTAINER_HEIGHT,
  CANVAS_CONTAINER_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type Coordinate,
  DIFFICULTY_LEVELS,
  GameState,
  GRID_SIZE,
  type Player,
  Snake,
} from "../game/GameTypes";
import { generateFood } from "../game/generateFood";
import {
  generateSnakeSegments,
  getConstrainedTransform,
  getMessageText,
} from "../game/utils";

import { AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import { computeBotState, getBotMove, mapActionToDirection } from "./bot";
import GameControls from "./GameControls";
import { GameOver } from "./GameOver";
import Modal from "./Modal";
import {
  boardStyles,
  canvasContainerStyles,
  canvasStyles,
  controlsStyles,
  wrapperStyles,
} from "./styles";

const createColoredImage = (
  svgUrl: string,
  color: string
): Promise<HTMLImageElement> => {
  return fetch(svgUrl)
    .then((response) => response.text())
    .then((svgText) => {
      // Remove # if present and add opacity for shadow effect
      const shadowColor = color + "4D"; // 4D in hex = 30% opacity

      // Replace both fill colors
      const coloredSvg = svgText.replace(
        /<(circle|path)[^>]*fill="[^"]*"[^>]*>/g,
        (match) => {
          if (match.includes("circle")) {
            return match.replace(/fill="[^"]*"/, `fill="${color}"`);
          } else if (match.includes("path")) {
            return match.replace(/fill="[^"]*"/, `fill="${shadowColor}"`);
          }
          return match;
        }
      );

      // Convert SVG to data URL
      const blob = new Blob([coloredSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      // Create and return image
      const img = new Image();
      img.src = url;
      return new Promise<HTMLImageElement>((resolve) => {
        img.onload = () => {
          resolve(img);
          URL.revokeObjectURL(url);
        };
      });
    });
};

// Create an image cache
const imageCache: Record<string, Record<string, HTMLImageElement>> = {
  bodyUp: {},
  bodyDown: {},
  bodyLeft: {},
  bodyRight: {},
  faceUp: {},
  faceDown: {},
  faceLeft: {},
  faceRight: {},
};

// Function to get or create a colored image
const getColoredImage = async (
  type: keyof typeof imageCache,
  color: string,
  svgUrl: string
): Promise<HTMLImageElement> => {
  if (!imageCache[type][color]) {
    imageCache[type][color] = await createColoredImage(svgUrl, color);
  }
  return imageCache[type][color];
};

interface GameViewProps {
  role: "host" | "client" | null;
  socket: WebSocket;
  players: Player[];
  localPlayerId: string;
  difficulty: string;
}

const initialGameState = {
  snakes: [],
  obstacles: [],
  consumedFood: 0,
  isGameOver: false,
  isMultiplayer: false,
};

const faceUpImage = new Image();
faceUpImage.src = faceUp;

const faceDownImage = new Image();
faceDownImage.src = faceDown;

const faceRightImage = new Image();
faceRightImage.src = faceRight;

const faceLeftImage = new Image();
faceLeftImage.src = faceLeft;

const bodyUpImage = new Image();
bodyUpImage.src = bodyUp;

const bodyDownImage = new Image();
bodyDownImage.src = bodyDown;

const bodyRightImage = new Image();
bodyRightImage.src = bodyRight;

const bodyLeftImage = new Image();
bodyLeftImage.src = bodyLeft;

const obstable = new Image();
obstable.src = obstacle;

const orangeFood = new Image();
orangeFood.src = orange;

const lemonFood = new Image();
lemonFood.src = lemon;

const appleFood = new Image();
appleFood.src = apple;

const cherryFood = new Image();
cherryFood.src = cherry;

const mushroomFood = new Image();
mushroomFood.src = mushroom;

const strawberryFood = new Image();
strawberryFood.src = strawberry;

const watermelonFood = new Image();
watermelonFood.src = watermelon;

const goldenAppleFood = new Image();
goldenAppleFood.src = goldenApple;

const GameView: React.FC<GameViewProps> = ({
  role,
  socket,
  players,
  localPlayerId,
  difficulty,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const tickCounterRef = useRef(0);

  const hasHumanPlayers =
    players.filter((p) => !p.isBot && p.id !== localPlayerId).length > 0;

  const isSinglePlayer = players.filter((p) => !p.isBot).length === 1;
  const baseX = Math.floor(CANVAS_WIDTH / GRID_SIZE / (players.length + 1));
  const separationX = Math.floor(
    CANVAS_WIDTH / GRID_SIZE / (players.length + 1)
  );
  const headY = Math.floor(CANVAS_HEIGHT / GRID_SIZE / 2);
  const snakeLength = 3;
  const snakes: Snake[] = players.map((player, index) => {
    const direction: Coordinate =
      index % 2 === 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
    const head: Coordinate = {
      x: baseX + index * separationX,
      y: headY,
    };
    const segments = generateSnakeSegments(head, snakeLength, direction);
    return {
      id: player.id,
      segments,
      direction,
      color: AVAILABLE_COLORS[player.colorIndex!],
      speedFactor:
        DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS],
    };
  });

  const [gameState, setGameState] = useState<GameState>({
    ...initialGameState,
    food: generateFood(20, snakes, difficulty),
    scores: players.map((p) => ({ id: p.id, name: p.name, score: 0 })),
    snakes: snakes,
  });

  const snakePosition: Coordinate = useMemo(() => {
    const currentPlayer = gameState.snakes.find(
      (snake) => snake.id === localPlayerId
    );

    return (
      currentPlayer?.newHead || currentPlayer?.segments[0] || { x: 0, y: 0 }
    );
  }, [gameState]);

  // Para el host: enviar actualizaciones periódicas del estado
  useEffect(() => {
    if (role !== "host" || isPaused) return;

    const updateGame = async (tickCount: number) => {
      // 1. Actualiza el estado normal del juego
      const newState = updateGameState({
        prevState: gameState,
        difficulty,
        role,
        localPlayerId,
        tickCount,
      });

      // 2. Filtra los bots (suponiendo que players contiene los jugadores con isBot)
      const bots = players.filter((p: any) => p.isBot);

      // 3. Para cada serpiente, si es bot, actualiza su dirección de forma asíncrona
      const updatedSnakesPromises = newState.snakes.map(async (snake) => {
        if (bots.some((bot) => bot.id === snake.id)) {
          const bot = bots.find((bot) => bot.id === snake.id);
          const botState = computeBotState(newState, snake);
          try {
            const action = await getBotMove(botState, bot?.botDifficulty);
            const newDirection = mapActionToDirection(snake.direction, action);
            return { ...snake, direction: newDirection };
          } catch (err) {
            console.error("Error en la IA del bot:", err);
            return snake;
          }
        } else {
          return snake;
        }
      });

      const updatedSnakes = await Promise.all(updatedSnakesPromises);

      const finalState: GameState = {
        ...newState,
        snakes: updatedSnakes,
      };

      socket.send(JSON.stringify({ type: "gameState", state: finalState }));
      setGameState(finalState);
    };

    const interval = setInterval(() => {
      tickCounterRef.current += 1;
      const newTick = tickCounterRef.current;
      updateGame(newTick);
    }, 20);
    return () => clearInterval(interval);
  }, [role, socket, gameState, players, isPaused]);

  // Para el cliente: recibir actualizaciones del estado
  useEffect(() => {
    if (role === "host") return;
    const handleGameState = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "gameState") {
          setGameState(data.state);
        }
      } catch (err) {
        console.error("Error parseando gameState:", err);
      }
    };
    socket.addEventListener("message", handleGameState);
    return () => socket.removeEventListener("message", handleGameState);
  }, [role, socket]);

  // En el host: escuchar inputs enviados por clientes
  useEffect(() => {
    if (role !== "host") return;
    const handleInput = (event: MessageEvent) => {
      getMessageText(event.data)
        .then((text) => {
          const data = JSON.parse(text);
          if (data.type === "input") {
            // Actualiza la dirección de la serpiente correspondiente (por ejemplo, la del cliente)
            setGameState((prevState) => {
              const updatedSnakes = prevState.snakes.map((snake) => {
                if (snake.id === data.id) {
                  return { ...snake, direction: data.direction };
                }
                return snake;
              });
              return { ...prevState, snakes: updatedSnakes };
            });
          }
        })
        .catch((err) => {
          console.error("Error procesando el mensaje:", err);
        });
    };
    socket.addEventListener("message", handleInput);
    return () => socket.removeEventListener("message", handleInput);
  }, [role, socket]);

  // Manejo de teclado para el host (localmente, para cambiar su propia dirección)
  useEffect(() => {
    if (role !== "host") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Manejo de la pausa con la barra espaciadora
      if (e.code === "Space" && !hasHumanPlayers) {
        e.preventDefault(); // Prevenir scroll
        setIsPaused((prev) => !prev);
        return;
      }

      // Si el juego está pausado, no procesar otros inputs
      if (isPaused) return;

      setGameState((prevState) => {
        const updatedSnakes = prevState.snakes.map((snake) => {
          if (snake.id !== localPlayerId) {
            return snake;
          }

          let newDir = snake.direction;
          switch (e.key) {
            case "ArrowUp":
            case "w":
            case "W":
              if (snake.direction.y !== 1) newDir = { x: 0, y: -1 };
              break;
            case "ArrowDown":
            case "s":
            case "S":
              if (snake.direction.y !== -1) newDir = { x: 0, y: 1 };
              break;
            case "ArrowLeft":
            case "a":
            case "A":
              if (snake.direction.x !== 1) newDir = { x: -1, y: 0 };
              break;
            case "ArrowRight":
            case "d":
            case "D":
              if (snake.direction.x !== -1) newDir = { x: 1, y: 0 };
              break;
            default:
              break;
          }

          return { ...snake, direction: newDir };
        });

        return { ...prevState, snakes: updatedSnakes };
      });
    };

    const debouncedHandleKeyDown = debounce(handleKeyDown, 50);

    window.addEventListener("keydown", debouncedHandleKeyDown);
    return () => window.removeEventListener("keydown", debouncedHandleKeyDown);
  }, [role]);

  // Manejo de teclado para el cliente
  useEffect(() => {
    if (role !== "client") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el juego está pausado, no procesar inputs
      if (isPaused) return;

      let newDir = null;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newDir = { x: 0, y: -1 };
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newDir = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newDir = { x: -1, y: 0 };
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newDir = { x: 1, y: 0 };
          break;
        default:
          break;
      }

      if (newDir) {
        const message = { type: "input", id: localPlayerId, direction: newDir };
        socket.send(JSON.stringify(message));
      }
    };

    const debouncedHandleKeyDown = debounce(handleKeyDown, 50);

    window.addEventListener("keydown", debouncedHandleKeyDown);
    return () => window.removeEventListener("keydown", debouncedHandleKeyDown);
  }, [role, socket]);

  // Dibujo del canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    gameState.snakes.forEach(async (snake) => {
      const snakeColor = snake.color;

      // Get or create colored images for this snake
      const [
        coloredFaceUp,
        coloredFaceDown,
        coloredFaceLeft,
        coloredFaceRight,
        coloredBodyUp,
        coloredBodyDown,
        coloredBodyLeft,
        coloredBodyRight,
      ] = await Promise.all([
        getColoredImage("faceUp", snakeColor, faceUp),
        getColoredImage("faceDown", snakeColor, faceDown),
        getColoredImage("faceLeft", snakeColor, faceLeft),
        getColoredImage("faceRight", snakeColor, faceRight),
        getColoredImage("bodyUp", snakeColor, bodyUp),
        getColoredImage("bodyDown", snakeColor, bodyDown),
        getColoredImage("bodyLeft", snakeColor, bodyLeft),
        getColoredImage("bodyRight", snakeColor, bodyRight),
      ]);

      snake.segments.forEach((segment, index) => {
        let img: HTMLImageElement;
        if (index === 0) {
          if (segment.direction.x === -1) {
            img = coloredFaceLeft;
            ctx.drawImage(
              img,
              segment.x * GRID_SIZE - 0.4 * GRID_SIZE,
              segment.y * GRID_SIZE - 0.25 * GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 1.5
            );
          } else if (segment.direction.x === 1) {
            img = coloredFaceRight;
            ctx.drawImage(
              img,
              segment.x * GRID_SIZE - 0.1 * GRID_SIZE,
              segment.y * GRID_SIZE - 0.25 * GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 1.5
            );
          } else if (segment.direction.y === -1) {
            img = coloredFaceUp;
            ctx.drawImage(
              img,
              segment.x * GRID_SIZE - 0.3 * GRID_SIZE,
              segment.y * GRID_SIZE - 0.4 * GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 1.5
            );
          } else {
            img = coloredFaceDown;
            ctx.drawImage(
              img,
              segment.x * GRID_SIZE - 0.2 * GRID_SIZE,
              segment.y * GRID_SIZE - 0.15 * GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 1.5
            );
          }
        } else {
          if (segment.direction.x === -1) {
            img = coloredBodyLeft;
            ctx.drawImage(
              img,
              segment.x * GRID_SIZE - 0.25 * GRID_SIZE,
              segment.y * GRID_SIZE - GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 3
            );
          } else if (segment.direction.x === 1) {
            img = coloredBodyRight;
            ctx.drawImage(
              img,
              segment.x * GRID_SIZE - 0.25 * GRID_SIZE,
              segment.y * GRID_SIZE - GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 3
            );
          } else if (segment.direction.y === -1) {
            img = coloredBodyUp;
            ctx.drawImage(
              img,
              segment.x * GRID_SIZE - GRID_SIZE,
              segment.y * GRID_SIZE - 0.25 * GRID_SIZE,
              GRID_SIZE * 3,
              GRID_SIZE * 1.5
            );
          } else {
            img = coloredBodyDown;
            ctx.drawImage(
              img,
              segment.x * GRID_SIZE - GRID_SIZE,
              segment.y * GRID_SIZE - 0.25 * GRID_SIZE,
              GRID_SIZE * 3,
              GRID_SIZE * 1.5
            );
          }
        }
      });
    });

    // Show food
    gameState.food.forEach(({ coordinates, sprite }) => {
      let img: HTMLImageElement;
      switch (sprite) {
        case "lemon":
          img = lemonFood;
          break;
        case "orange":
          img = orangeFood;
          break;
        case "apple":
          img = appleFood;
          break;
        case "cherry":
          img = cherryFood;
          break;
        case "mushroom":
          img = mushroomFood;
          break;
        case "strawberry":
          img = strawberryFood;
          break;
        case "goldenApple":
          img = goldenAppleFood;
          break;
        default:
          img = watermelonFood;
          break;
      }
      ctx.drawImage(
        img,
        coordinates.x * GRID_SIZE - 0.25 * GRID_SIZE,
        coordinates.y * GRID_SIZE - 0.25 * GRID_SIZE,
        GRID_SIZE * 1.5,
        GRID_SIZE * 1.5
      );
    });

    // Show obstacles
    gameState.obstacles.forEach((obstacle) => {
      ctx.drawImage(
        obstable,
        obstacle.x * GRID_SIZE - 0.25 * GRID_SIZE,
        obstacle.y * GRID_SIZE - 0.25 * GRID_SIZE,
        GRID_SIZE * 1.5,
        GRID_SIZE * 1.5
      );
    });
  }, [gameState]);

  return (
    <div style={wrapperStyles}>
      <AnimatePresence>
        {gameState.isGameOver && (
          <GameOver
            isSinglePlayer={isSinglePlayer}
            onTryAgain={() =>
              setGameState({
                ...initialGameState,
                scores: players.map((p) => ({
                  id: p.id,
                  name: p.name,
                  score: 0,
                })),
                food: generateFood(20, snakes, difficulty),
                snakes: players.map((player, index) => {
                  const direction: Coordinate =
                    index % 2 === 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
                  const head: Coordinate = {
                    x: baseX + index * separationX,
                    y: headY,
                  };
                  const segments = generateSnakeSegments(
                    head,
                    snakeLength,
                    direction
                  );
                  return {
                    id: player.id,
                    segments,
                    direction,
                    color: AVAILABLE_COLORS[player.colorIndex!],
                    speedFactor:
                      DIFFICULTY_LEVELS[
                        difficulty as keyof typeof DIFFICULTY_LEVELS
                      ],
                  };
                }),
              })
            }
          />
        )}
      </AnimatePresence>
      <div style={boardStyles}>
        <div className="flex flex-col justify-between">
          <div
            className="flex justify-between items-center"
            style={controlsStyles}
          >
            <div>
              {gameState.scores
                .sort((a, b) => b.score - a.score)
                .map((score) => (
                  <b key={score.id}>
                    {score.name} - {score.score}
                  </b>
                ))}
            </div>
            <button
              onClick={() => {
                if (!hasHumanPlayers) {
                  setIsPaused(true);
                }
                setShowControls(true);
              }}
              className="bg-white px-4 py-2 rounded-lg border border-black hover:bg-gray-100 transition-all duration-200"
            >
              🎮 Controls
            </button>
          </div>
        </div>
        <div
          style={{
            ...canvasContainerStyles,
            width: CANVAS_CONTAINER_WIDTH,
            height: CANVAS_CONTAINER_HEIGHT,
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              ...canvasStyles,
              opacity: isPaused ? 0.5 : 1,
              transform: (() => {
                const transform = getConstrainedTransform(snakePosition);
                return `translate(${transform.x}px, ${transform.y}px)`;
              })(),
            }}
          />
          {isPaused && !hasHumanPlayers && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                padding: "20px",
                borderRadius: "10px",
                zIndex: 1000,
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              PAUSED
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={showControls}
        onClose={() => {
          setShowControls(false);
          setIsPaused(false);
        }}
      >
        <GameControls />
      </Modal>
    </div>
  );
};

export default GameView;
