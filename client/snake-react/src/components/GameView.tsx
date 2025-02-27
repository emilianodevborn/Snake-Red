import React, { useEffect, useMemo, useRef, useState } from "react";
import obstacle from "../assets/skul.svg";
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

import { updateGameState } from "../game/GameLogic";
import {
  AVAILABLE_COLORS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type Coordinate,
  DIFFICULTY_LEVELS,
  GameState,
  GRID_SIZE,
  type Player, Snake,
} from "../game/GameTypes";
import { generateFood } from "../game/generateFood";
import {generateSnakeSegments, getConstrainedTransform, getMessageText} from "../game/utils";

import { computeBotState, getBotMove, mapActionToDirection } from "./bot";
import {
  boardStyles,
  canvasContainerStyles,
  canvasStyles,
  controlsStyles,
  wrapperStyles,
} from "./styles";
import { GameOver } from "./GameOver";
import { AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import GameControls from "./GameControls";
import Modal from "./Modal";

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

  const hasHumanPlayers = players.filter(p => !p.isBot && p.id !== localPlayerId).length > 0;
  const baseX = Math.floor((CANVAS_WIDTH / GRID_SIZE) / (players.length + 1));
  const separationX = Math.floor((CANVAS_WIDTH / GRID_SIZE) / (players.length + 1));
  const headY = Math.floor((CANVAS_HEIGHT / GRID_SIZE) / 2);
  const snakeLength = 3;
  const snakes: Snake[] = players.map((player, index) => {
    const direction: Coordinate = index % 2 === 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
    const head: Coordinate = {
      x: baseX + index * separationX,
      y: headY,
    };
    const segments = generateSnakeSegments(head, snakeLength, direction);
    return {
      id: player.id,
      segments,
      direction,
      color: !!player.colorIndex
        ? AVAILABLE_COLORS[player.colorIndex]
        : "green",
      speedFactor: 10,
    };
  });

  const [gameState, setGameState] = useState<GameState>({
    ...initialGameState,
    food: generateFood(100, snakes),
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
    }, 10);
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
      if (e.code === 'Space' && !hasHumanPlayers) {
        e.preventDefault(); // Prevenir scroll
        setIsPaused(prev => !prev);
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

    gameState.snakes.forEach((snake) => {
      snake.segments.forEach((segment, index) => {
        let img: HTMLImageElement;
        if (index === 0) {
          if (segment.direction.x === -1) {
            img = faceLeftImage
            ctx.drawImage(
              img,
              (segment.x * GRID_SIZE) - 0.4 * GRID_SIZE,
              (segment.y * GRID_SIZE) - 0.25 * GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 1.5
            );
          } else if (segment.direction.x === 1) {
            img = faceRightImage
            ctx.drawImage(
              img,
              (segment.x * GRID_SIZE) - 0.1 * GRID_SIZE,
              (segment.y * GRID_SIZE) - 0.25 * GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 1.5
            );
          } else if (segment.direction.y === -1) {
            img = faceUpImage
            ctx.drawImage(
              img,
              (segment.x * GRID_SIZE) - 0.3 * GRID_SIZE,
              (segment.y * GRID_SIZE) - 0.4 * GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 1.5
            );
          } else {
            img = faceDownImage
            ctx.drawImage(
              img,
              (segment.x * GRID_SIZE) - 0.2 * GRID_SIZE,
              (segment.y * GRID_SIZE) - 0.15 * GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 1.5
            );
          }
        } else {
          if (segment.direction.x === -1) {
            img = bodyLeftImage
            ctx.drawImage(
              img,
              (segment.x * GRID_SIZE) - 0.25 * GRID_SIZE,
              (segment.y * GRID_SIZE) - GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 3
            );
          } else if (segment.direction.x === 1) {
            img = bodyRightImage
            ctx.drawImage(
              img,
              (segment.x * GRID_SIZE) - 0.25 * GRID_SIZE,
              (segment.y * GRID_SIZE) - GRID_SIZE,
              GRID_SIZE * 1.5,
              GRID_SIZE * 3
            );
          } else if (segment.direction.y === -1) {
            img = bodyUpImage
            ctx.drawImage(
              img,
              (segment.x * GRID_SIZE) - GRID_SIZE,
              (segment.y * GRID_SIZE) - 0.25 * GRID_SIZE,
              GRID_SIZE * 3,
              GRID_SIZE * 1.5
            );
          } else {
            img = bodyDownImage
            ctx.drawImage(
              img,
              (segment.x * GRID_SIZE) - GRID_SIZE,
              (segment.y * GRID_SIZE) - 0.25 * GRID_SIZE,
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
      switch(sprite) {
        case 'lemon':
          img = lemonFood
          break;
        case 'orange':
          img = orangeFood
          break;
        case 'apple':
          img = appleFood
          break;
        case 'cherry':
          img = cherryFood
          break;
        case 'mushroom':
          img = mushroomFood
          break;
        case 'strawberry':
          img = strawberryFood
          break;
        default:
          img = watermelonFood
          break;

      }
      ctx.drawImage(
        img,
        (coordinates.x * GRID_SIZE) - (0.25 * GRID_SIZE),
        (coordinates.y * GRID_SIZE) - (0.25 * GRID_SIZE),
        GRID_SIZE * 1.5,
        GRID_SIZE * 1.5
      );
    });

    // Show obstacles
    gameState.obstacles.forEach((obstacle) => {
      ctx.drawImage(
        obstable,
        (obstacle.x * GRID_SIZE) - (0.25 * GRID_SIZE),
        (obstacle.y * GRID_SIZE) - (0.25 * GRID_SIZE),
        GRID_SIZE * 1.5,
        GRID_SIZE * 1.5
      );
    });
  }, [gameState]);

  return (
    <div style={wrapperStyles}>
      <AnimatePresence>
        {gameState.isGameOver && !gameState.isMultiplayer && (
          <GameOver
            onTryAgain={() =>
              setGameState({
                ...initialGameState,
                scores: players.map((p) => ({
                  id: p.id,
                  name: p.name,
                  score: 0,
                })),
                food: generateFood(10, snakes),
                snakes: players.map((player, index) => {
                  const direction: Coordinate = index % 2 === 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
                  const head: Coordinate = {
                    x: baseX + index * separationX,
                    y: headY,
                  };
                  const segments = generateSnakeSegments(head, snakeLength, direction);
                  return {
                    id: player.id,
                    segments,
                    direction,
                    color: !!player.colorIndex
                      ? AVAILABLE_COLORS[player.colorIndex]
                      : "green",
                    speedFactor: 5,
                  };
                }),
              })
            }
          />
        )}
      </AnimatePresence>
      <div style={boardStyles}>
        <div className="flex flex-col justify-between">
          <div className="flex justify-between items-center" style={controlsStyles}>
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
        <div style={canvasContainerStyles}>
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
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '20px',
              borderRadius: '10px',
              zIndex: 1000,
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              PAUSED
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={showControls} onClose={() => {
        setShowControls(false);
        setIsPaused(false);
      }}>
        <GameControls />
      </Modal>
    </div>
  );
};

export default GameView;
