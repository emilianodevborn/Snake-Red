import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  GameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  AVAILABLE_COLORS,
  type Player,
  type Coordinate,
} from "../game/GameTypes";
import { generateFood } from "../game/generateFood";
import { updateGameState } from "../game/GameLogic";
import { getConstrainedTransform, getMessageText } from "../game/utils";
import snakeHead from "../assets/snake-head.png";
import snakeBody from "../assets/snake-body.png";
import snakeTail from "../assets/snake-tail.png";
import obstacle from "../assets/obstacle.png";

import {
  boardStyles,
  canvasContainerStyles,
  canvasStyles,
  controlsStyles,
  wrapperStyles,
} from "./styles";
import { generateRandomFoodSprite } from "../game/generateRandomFoodSprite";

interface GameViewProps {
  role: "host" | "client" | null;
  socket: WebSocket;
  players: Player[];
  localPlayerId: string;
}

const initialGameState = {
  snakes: [],
  obstacles: [],
  consumedFood: 0,
  gameOver: false,
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    ...initialGameState,
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
    const interval = setInterval(() => {
      setGameState((prevState) => {
        const newState = updateGameState(prevState);
        socket.send(JSON.stringify({ type: "gameState", state: newState }));
        return newState;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [role, socket]);

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
    // ctx.fillStyle = "red";
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

    // ctx.fillStyle = "gray"; // Color para los obstáculos
    gameState.obstacles.forEach((obstacle) => {
      ctx.drawImage(
        obstable,
        obstacle.x * GRID_SIZE,
        obstacle.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
    });
    if (gameState.gameOver) {
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";
      ctx.fillText("Game Over", CANVAS_WIDTH / 2 - 70, CANVAS_HEIGHT / 2);
    }
  }, [gameState]);

  return (
    <div style={wrapperStyles}>
      <div style={boardStyles}>
        <div style={controlsStyles}>
          <div>Controls</div>
          <div>
            <div>Up (W or ArrowUp)</div>
            <div>Down (S or ArrowDown)</div>
            <div>Left (A or ArrowLeft)</div>
            <div>Right (D or ArrowRight)</div>
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
