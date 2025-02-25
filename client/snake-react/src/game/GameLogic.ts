// src/game/GameLogic.ts
import {
  GameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  Coordinate,
  Snake,
} from "./GameTypes";
import { generateFood } from "./generateFood";
import { generateObstacle } from "./generateObstacle";
import eatSoundFile from "../assets/eat-sound.mp3";
import deathSoundFile from "../assets/death-sound.mp3";

export const updateGameState = (
  prevState: GameState,
  difficulty: string
): GameState => {
  if (prevState.gameOver) return prevState;

  const maxX = CANVAS_WIDTH / GRID_SIZE - 1;
  const maxY = CANVAS_HEIGHT / GRID_SIZE - 1;
  const eatSound = new Audio(eatSoundFile);
  const deathSound = new Audio(deathSoundFile);

  // Paso 1: calcular la nueva cabeza para cada serpiente (clampeada)
  const snakesWithNewHead = prevState.snakes.map((snake) => {
    const head = snake.segments[0];
    let calcX = head.x + snake.direction.x;
    let calcY = head.y + snake.direction.y;
    const newHead: Coordinate = {
      x: Math.max(0, Math.min(calcX, maxX)),
      y: Math.max(0, Math.min(calcY, maxY)),
    };
    return { ...snake, newHead };
  });

  // Paso 2: self-collision
  const deadSnakeIds = new Set<string>();
  snakesWithNewHead.forEach((snake) => {
    const { newHead, segments, id } = snake;
    if (
      segments
        .slice(1)
        .some((seg) => seg.x === newHead.x && seg.y === newHead.y)
    ) {
      console.warn(`Snake ${id} se colisionó consigo misma.`);
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
          }
          deathSound.play();
        }
      });
    }
  }

  // Paso 4: cuando un cienpies colisiona con obstaculos, insertamos el ID correspondiente a
  // el cienpies muerto como un array dentro del array existentex
  snakesWithNewHead.forEach((snake) => {
    const { newHead } = snake;
    if (
      prevState.obstacles.some(
        (obstacle) => obstacle.x === newHead.x && obstacle.y === newHead.y
      )
    ) {
      console.warn(`Snake ${snake.id} se comió un obstáculo.`);
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
        const drops = snake.segments.slice(-dropCount);
        newFoodArray = newFoodArray.concat(drops);
        return null; // La serpiente muere
      } else {
        let ateFood = false;
        if (
          newFoodArray.some(
            (f) => f.x === snake.newHead.x && f.y === snake.newHead.y
          )
        ) {
          ateFood = true;
          eatSound.play();
          newFoodArray = newFoodArray.filter(
            (f) => !(f.x === snake.newHead.x && f.y === snake.newHead.y)
          );
          const foodToBeGeneratedQuantity = prevState.snakes.length;
          newFoodArray = [
            ...newFoodArray,
            ...generateFood(foodToBeGeneratedQuantity),
          ];
          newConsumedFood += foodToBeGeneratedQuantity;
        }
        // Cada 2 comidas consumidas, generamos un obstáculo
        const parsedDifficulty = parseInt(difficulty);
        if (ateFood && newConsumedFood % parsedDifficulty === 0) {
          const obstacle = generateObstacle();
          newObstacles.push(obstacle);
          console.log("Generado obstáculo en:", obstacle);
        }
        const newSegments = ateFood
          ? [snake.newHead, ...snake.segments]
          : [snake.newHead, ...snake.segments.slice(0, -1)];
        return { ...snake, segments: newSegments };
      }
    })
    .filter((snake) => snake !== null) as Snake[];

  // Paso 6:Cuando es game over?
  /*   let gameOver: boolean = prevState.gameOver;
  if (!updatedSnakes.some((s) => s.id === "host")) {
    gameOver = true;
  } */

  return {
    snakes: updatedSnakes,
    food: newFoodArray,
    obstacles: newObstacles,
    consumedFood: newConsumedFood,
    gameOver: false,
  };
};
