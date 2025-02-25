// src/components/GameView.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  GameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  type Player,
} from "../game/GameTypes";
import { generateFood } from "../game/generateFood";
import { updateGameState } from "../game/GameLogic";
import { getMessageText } from "../game/utils";
import snakeHead from "../assets/snake-head.png";
import snakeBody from "../assets/snake-body.png";
import snakeTail from "../assets/snake-tail.png";
import food from "../assets/food.png";
import obstacle from "../assets/obstacle.png";
import {
  boardStyles,
  canvasContainerStyles,
  controlsStyles,
  wrapperStyles,
} from "./styles";

interface GameViewProps {
  role: "host" | "client" | null;
  socket: WebSocket;
  players: Player[];
}

const initialGameState: GameState = {
  snakes: [
    {
      id: "host",
      segments: [{ x: 5, y: 5 }],
      direction: { x: 1, y: 0 },
      color: "green",
    },
    {
      id: "client1",
      segments: [{ x: 10, y: 5 }],
      direction: { x: 1, y: 0 },
      color: "blue",
    },
  ],
  food: [generateFood(), generateFood(), generateFood()],
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

const foodImage = new Image();
foodImage.src = food;

const obstable = new Image();
obstable.src = obstacle;

const GameView: React.FC<GameViewProps> = ({ role, socket, players }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Para el host: enviar actualizaciones periódicas del estado
  useEffect(() => {
    if (role !== "host") return;
    const interval = setInterval(() => {
      setGameState((prevState) => {
        const newState = updateGameState(prevState);
        console.log("Host envía estado actualizado:", newState);
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
          console.log("Cliente recibe estado:", data.state);
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
          if (snake.id === "host") {
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
            console.log("Host cambia dirección a:", newDir);
            return { ...snake, direction: newDir };
          }
          return snake;
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
        const message = { type: "input", id: "client1", direction: newDir };
        console.log("Cliente envía input:", message);
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
    gameState.food.forEach((food) => {
      ctx.drawImage(
        foodImage,
        food.x * GRID_SIZE,
        food.y * GRID_SIZE,
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
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={canvasContainerStyles}
        />
      </div>
    </div>
  );
};

export default GameView;
