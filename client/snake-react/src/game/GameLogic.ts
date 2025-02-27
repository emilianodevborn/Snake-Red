// src/game/GameLogic.ts
import {
  GameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  Coordinate,
  Snake,
  Food,
} from "./GameTypes";
import { generateFood } from "./generateFood";
import { generateObstacle } from "./generateObstacle";
import eatSoundFile from "../assets/eat-sound.mp3";
import deathSoundFile from "../assets/death-sound.mp3";
import { generateRandomFoodSprite } from "./generateRandomFoodSprite";

type UpdateGameStateParams = {
  prevState: GameState;
  difficulty: string;
  role: "host" | "client";
  localPlayerId: string;
  tickCount: number;
};

export const updateGameState = (params: UpdateGameStateParams): GameState => {
  const { prevState, difficulty, role, localPlayerId, tickCount } = params;
  if (prevState.isGameOver) return prevState;
  let updatedScores = prevState.scores;

  const maxX = CANVAS_WIDTH / GRID_SIZE - 1;
  const maxY = CANVAS_HEIGHT / GRID_SIZE - 1;
  const eatSound = new Audio(eatSoundFile);
  const deathSound = new Audio(deathSoundFile);

  // Paso 1: calcular la nueva cabeza para cada serpiente (sin clamping)
  const snakesWithNewHead = prevState.snakes.map((snake) => {
    const head = snake.segments[0];
    if (tickCount % snake.speedFactor === 0) {
      let calcX = head.x + snake.direction.x;
      let calcY = head.y + snake.direction.y;
      const newHead: Coordinate = {
        x: Math.max(0, Math.min(calcX, maxX)),
        y: Math.max(0, Math.min(calcY, maxY)),
      };
      return { ...snake, newHead };
    } else {
      // Si no es momento de mover, la cabeza se mantiene igual
      return { ...snake, newHead: head };
    }
  });

  // Paso 1.5: Validar colisión con la pared
  const deadSnakeIds = new Set<string>();
  snakesWithNewHead.forEach((snake) => {
    const { newHead, id } = snake;
    if (
      newHead.x < 0 ||
      newHead.x > maxX ||
      newHead.y < 0 ||
      newHead.y > maxY
    ) {
      deadSnakeIds.add(id);
    }
  });

  // Paso 2: self-collision
  snakesWithNewHead.forEach((snake) => {
    const { newHead, segments, id } = snake;
    if (
      segments
        .slice(1)
        .some((seg) => seg.x === newHead.x && seg.y === newHead.y)
    ) {
      deadSnakeIds.add(id);
      deathSound.play();
    }
  });

  // Paso 3: colisiones entre serpientes
  for (let i = 0; i < snakesWithNewHead.length; i++) {
    for (let j = 0; j < snakesWithNewHead.length; j++) {
      if (i === j) continue;
      const snakeA = snakesWithNewHead[i];
      const snakeB = snakesWithNewHead[j];
      snakeB.segments.forEach((seg, index) => {
        if (snakeA.newHead.x === seg.x && snakeA.newHead.y === seg.y) {
          if (index === 0) {
            // Choque de cabezas: ambos mueren.
            deadSnakeIds.add(snakeA.id);
            deadSnakeIds.add(snakeB.id);
          } else {
            deadSnakeIds.add(snakeA.id);
            // Add 50 points to the other player
            updatedScores = prevState.scores.map((p) => {
              if (p.id === snakeB.id) {
                return { ...p, score: p.score + 50 };
              }
              return p;
            });
          }
          deathSound.play();
        }
      });
    }
  }

  // Paso 4: Verificar colisiones con obstáculos
  snakesWithNewHead.forEach((snake) => {
    const { newHead } = snake;
    if (
      prevState.obstacles.some(
        (obstacle) => obstacle.x === newHead.x && obstacle.y === newHead.y
      )
    ) {
      deadSnakeIds.add(snake.id);
      deathSound.play();
    }
  });

  // Paso 5: actualizar serpientes y dropear 50% de los segmentos ganados
  let newFoodArray = prevState.food.slice();
  let newObstacles = [...prevState.obstacles];
  let newConsumedFood = prevState.consumedFood;

  const updatedSnakes: Snake[] = snakesWithNewHead
    .map((snake) => {
      if (deadSnakeIds.has(snake.id)) {
        const consumed = snake.segments.length - 1;
        const dropCount = Math.floor(consumed / 2);
        const drops: Food[] = snake.segments.slice(-dropCount).map((seg) => ({
          coordinates: seg,
          sprite: generateRandomFoodSprite(),
        }));
        newFoodArray = [...newFoodArray, ...drops];
        return null; // La serpiente muere
      } else {
        let ateFood = false;
        if (
          newFoodArray.some(
            ({ coordinates: f }) =>
              f.x === snake.newHead.x && f.y === snake.newHead.y
          )
        ) {
          ateFood = true;
          // Add 1 point per food
          updatedScores = prevState.scores.map((p) => {
            if (p.id === snake.id) {
              return { ...p, score: p.score + 1 };
            }
            return p;
          });
          eatSound.play();
          newFoodArray = newFoodArray.filter(
            ({ coordinates: f }) =>
              !(f.x === snake.newHead.x && f.y === snake.newHead.y)
          );

          newFoodArray = [
            ...newFoodArray,
            ...generateFood(
              1,
              snakesWithNewHead,
              newObstacles,
              newFoodArray,
              snake.newHead
            ),
          ];
          newConsumedFood += 1;
        }
        // Cada X comidas consumidas, generamos un obstáculo
        const parsedDifficulty = parseInt(difficulty);
        if (ateFood && newConsumedFood % parsedDifficulty === 0) {
          const obstacle = generateObstacle(
            snake.newHead,
            snake.segments.length,
            newObstacles,
            newFoodArray,
            snakesWithNewHead
          );
          newObstacles.push(obstacle);
        }
        // Actualización de segmentos con dirección almacenada:
        // Solo actualizamos si la snake se movió en este tick.
        let newSegments: { x: number; y: number; direction: Coordinate }[] = [];
        if (tickCount % snake.speedFactor === 0) {
          // Creamos el nuevo segmento de cabeza con la dirección actual.
          const newHeadSegment = {
            ...snake.newHead,
            direction: snake.direction,
          };
          newSegments.push(newHeadSegment);
          // Para cada segmento del cuerpo, desplazamos el arreglo: cada segmento adopta la posición del que estaba delante.
          // Si la snake come, conservamos todos los segmentos; si no, eliminamos el último.
          const body = ateFood ? snake.segments : snake.segments.slice(0, -1);
          newSegments = newSegments.concat(body);
        } else {
          // Si no se movió, se conserva el arreglo actual.
          newSegments = snake.segments;
        }
        return { ...snake, segments: newSegments };
      }
    })
    .filter((snake) => snake !== null) as Snake[];

  /**
   * Paso 6 - Game over logic:
   *
   * - In single player mode, if the host dies (*)
   * - In multiplayer mode, if there is only 1 real player in the board (*)
   *
   * (*) - We consider only real players and discard bots by using the
   * Player property `isBot`.
   * (*) - For a game to be considered multiplayer there must be at least
   * 2 non-bot users in the player list at the beggining of the game.
   */

  /**
   * If multiplayer was true at some point, we just use it,
   * else we check the snakes array. This is to avoid a scenario
   * where multiplayer was true at some point and then it becomes
   * false because a real player died leaving an inconsistent state.
   */
  const isMultiplayer =
    prevState.isMultiplayer ||
    prevState.snakes.filter((snake) => !snake.isBot).length > 1;

  const isGameOver =
    role === "host"
      ? !updatedSnakes.some((s) => s.id === localPlayerId)
      : updatedSnakes.filter((s) => !s.isBot).length <= 1;

  // Step 7 - Determine scores

  /**
   * Score logic:
   *
   * - 1 point per food.
   * - 100 points for each alive player when other player dies.
   * - 50 points for a player that gets crashed by other player.
   */

  /**
   * Add 100 points to non-bot players if other player dies.
   */

  if (deadSnakeIds.size > 0) {
    updatedScores = prevState.scores.map((p) => {
      if (!deadSnakeIds.has(p.id) && updatedSnakes.some((s) => s.id === p.id)) {
        return { ...p, score: p.score + 100 };
      }

      return p;
    });
  }

  return {
    snakes: updatedSnakes,
    food: newFoodArray,
    obstacles: newObstacles,
    consumedFood: newConsumedFood,
    isGameOver,
    isMultiplayer,
    scores: updatedScores,
  };
};
