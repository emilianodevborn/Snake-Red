// src/game/generateFood.ts
import {
  Coordinate,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
} from "./GameTypes";

export const generateFood = (quantity?: number): Coordinate[] => {
  const foods = [];
  for (let i = 0; i < (quantity || 1); i++) {
    const x = Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE));
    const y = Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE));
    foods.push({ x, y });
  }
  return foods;
};
