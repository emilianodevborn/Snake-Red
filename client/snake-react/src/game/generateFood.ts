// src/game/generateFood.ts
import {CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, Food, Coordinate, Snake} from "./GameTypes";
import { generateRandomFoodSprite } from "./generateRandomFoodSprite";
import {isValidPosition} from "./utils";

export const generateFood = (
  quantity: number = 1,
  snakes: Snake[],
  obstacles?: Coordinate[],
  existingFoods?: Food[],
  head?: Coordinate,
): Food[] => {
  const w: number = CANVAS_WIDTH / GRID_SIZE
  const h: number = CANVAS_HEIGHT / GRID_SIZE
  const blockSize = 1
  const foods: Food[] = [];
  const maxAttempts = 10;
  // Extraer las coordenadas de las comidas ya existentes (si las hay)
  const existingFoodCoordinates: Coordinate[] = existingFoods
    ? existingFoods.map(food => food.coordinates)
    : [];

  // Definir la cabeza a usar: si se pasa "head", se usa; sino, se toma la cabeza del primer snake.
  const snakeHead: Coordinate = head !== undefined
    ? head
    : (snakes.length > 0 ? snakes[0].segments[0] : { x: 0, y: 0 });

  for (let i = 0; i < quantity; i++) {
    let candidate: Food | null = null;
    let attempts = 0;
    let x: number, y: number;
    while (!candidate && attempts < maxAttempts) {
      // Genera coordenadas aleatorias en la grilla (0 a w-1 y 0 a h-1)
      x = Math.floor(Math.random() * w);
      y = Math.floor(Math.random() * h);
      const coordinates: Coordinate = { x, y };

      // Si la posición es válida (no se superpone con obstáculos, comida existente o con cualquier segmento de alguna snake)
      if (isValidPosition(coordinates, snakes, obstacles, existingFoodCoordinates, head)) {
        candidate = { coordinates, sprite: generateRandomFoodSprite() };
      }
      attempts++;
    }
    // Si no se encontró una posición válida, usar una lógica de fallback:
    if (!candidate) {
      // Usamos la cabeza de la serpiente (snakeHead) para calcular la posición.
      const perc = Math.random() * (1.0 - 0.9) + 0.9; // entre 90% y 100%
      const maxDx = snakeHead.x < w / 2 ? (w - blockSize - snakeHead.x) : snakeHead.x;
      const dx = Math.floor(perc * maxDx);
      const maxDy = snakeHead.y < h / 2 ? (h - blockSize - snakeHead.y) : snakeHead.y;
      const dy = Math.floor(perc * maxDy);

      const candidateX = snakeHead.x < w / 2 ? snakeHead.x + dx : snakeHead.x - dx;
      const candidateY = snakeHead.y < h / 2 ? snakeHead.y + dy : snakeHead.y - dy;

      const finalX = Math.max(0, Math.min(candidateX, w - blockSize));
      const finalY = Math.max(0, Math.min(candidateY, h - blockSize));

      candidate = { coordinates: { x: finalX, y: finalY }, sprite: generateRandomFoodSprite() };
    }
    foods.push(candidate);
    // Agregar la posición generada para evitar duplicados en el mismo llamado
    existingFoodCoordinates.push(candidate.coordinates);
  }

  return foods;
};