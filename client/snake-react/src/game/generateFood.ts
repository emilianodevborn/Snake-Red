// src/game/generateFood.ts
import { Coordinate, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from "./GameTypes";

export const generateFood = (): Coordinate => ({
    x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
    y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
});
