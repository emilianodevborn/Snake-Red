// src/game/generateFood.ts
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, Food } from "./GameTypes";
import { generateRandomFoodSprite } from "./generateRandomFoodSprite";

export const generateFood = (quantity?: number): Food[] => {
  const foods: Food[] = [];
  for (let i = 0; i < (quantity || 1); i++) {
    const x = Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE));
    const y = Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE));

    foods.push({ coordinates: { x, y }, sprite: generateRandomFoodSprite() });
  }
  return foods;
};
