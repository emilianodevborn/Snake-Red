import React, { useEffect, useMemo, useRef, useState } from "react";
import obstacle from "../assets/obstacle.png";
import snakeBody from "../assets/snake-body.png";
import snakeHead from "../assets/snake-head.png";
import snakeTail from "../assets/snake-tail.png";
import { updateGameState } from "../game/GameLogic";
import {
  AVAILABLE_COLORS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type Coordinate,
  DIFFICULTY_LEVELS,
  GameState,
  GRID_SIZE,
  type Player,
} from "../game/GameTypes";
import { generateFood } from "../game/generateFood";
import { getConstrainedTransform, getMessageText } from "../game/utils";

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
import GameControls from "./GameControls";

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

const headImage = new Image();
headImage.src = snakeHead;

const bodyImage = new Image();
bodyImage.src = snakeBody;

const tailImage = new Image();
tailImage.src = snakeTail;

const obstable = new Image();
obstable.src = obstacle;

const GameView: React.FC<GameViewProps> = ({
  role,
  socket,
  players,
  localPlayerId,
  difficulty,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    ...initialGameState,
    food: generateFood(2 * players.length),
    scores: players.map((p) => ({ id: p.id, name: p.name, score: 0 })),
    snakes: players.map((player, i) => {
      return {
        id: player.id,
        segments: [{ x: 10 * (i + 1), y: 10 }],
        direction: { x: 0, y: i % 2 ? 1 : -1 },
        color: !!player.colorIndex
          ? AVAILABLE_COLORS[player.colorIndex]
          : "green",
      };
    }),
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
    if (role !== "host") return;

    const updateGame = async () => {
      // 1. Actualiza el estado normal del juego
      const newState = updateGameState({
        prevState: gameState,
        difficulty,
        role,
        localPlayerId,
      });

      // 2. Filtra los bots (suponiendo que players contiene los jugadores con isBot)
      const bots = players.filter((p: any) => p.isBot);

      // 3. Para cada serpiente, si es bot, actualiza su dirección de forma asíncrona
      const updatedSnakesPromises = newState.snakes.map(async (snake) => {
        if (bots.some(bot => bot.id === snake.id)) {
          const bot = bots.find(bot => bot.id === snake.id)
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
      updateGame();
    }, DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS]);
    return () => clearInterval(interval);
  }, [role, socket, gameState, players]);

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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [role]);

  // Manejo de teclado para el cliente
  useEffect(() => {
    if (role !== "client") return;
    const handleKeyDown = (e: KeyboardEvent) => {
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        let img = bodyImage;

        if (index === 0) img = headImage;
        else if (index === snake.segments.length - 1) img = tailImage;

        ctx.drawImage(
          img,
          segment.x * GRID_SIZE,
          segment.y * GRID_SIZE,
          GRID_SIZE,
          GRID_SIZE
        );
      });
    });
    // Show food
    gameState.food.forEach(({ coordinates, sprite }) => {
      ctx.drawImage(
        sprite,
        coordinates.x * GRID_SIZE,
        coordinates.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
    });
    // Show obstacles

    gameState.obstacles.forEach((obstacle) => {
      ctx.drawImage(
        obstable,
        obstacle.x * GRID_SIZE,
        obstacle.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
    });
  }, [gameState]);

  return (
    <div style={wrapperStyles}>
      <AnimatePresence>
        {gameState.isGameOver && (
          <GameOver
            onTryAgain={() =>
              setGameState({
                ...initialGameState,
                scores: players.map((p) => ({
                  id: p.id,
                  name: p.name,
                  score: 0,
                })),
                food: generateFood(2 * players.length),
                snakes: players.map((player, i) => {
                  const isHorizontal = Math.random() < 0.5;
                  const direction = isHorizontal
                    ? { x: Math.random() < 0.5 ? 1 : -1, y: 0 }
                    : { x: 0, y: Math.random() < 0.5 ? 1 : -1 };

                  return {
                    id: player.id,
                    segments: [{ x: (i + 1) * 2, y: (i + 1) * 2 }],
                    direction,
                    color: !!player.colorIndex
                      ? AVAILABLE_COLORS[player.colorIndex]
                      : "green",
                  };
                }),
              })
            }
          />
        )}
      </AnimatePresence>
      <div style={boardStyles}>
        <div className="flex flex-col justify-between">
          <div style={controlsStyles}>
            {gameState.scores
              .sort((a, b) => b.score - a.score)
              .map((score) => (
                <b key={score.id}>
                  {score.name} - {score.score}
                </b>
              ))}
          </div>
        </div>
        <div style={canvasContainerStyles}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              ...canvasStyles,
              transform: (() => {
                const transform = getConstrainedTransform(snakePosition);
                return `translate(${transform.x}px, ${transform.y}px)`;
              })(),
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GameView;
