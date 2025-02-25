// src/game/GameTypes.ts
export type Coordinate = { x: number; y: number };

export interface Snake {
  id: string;
  segments: Coordinate[];
  direction: Coordinate;
  color: (typeof AVAILABLE_COLORS)[number];
  newHead?: Coordinate;
}

export interface GameState {
  snakes: Snake[];
  food: Coordinate[];
  obstacles: Coordinate[];
  consumedFood: number;
  gameOver: boolean;
}

export type Player = {
  id: string;
  name: string;
  colorIndex?: number;
};

// Constantes del juego
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;

export const AVAILABLE_COLORS = [
  "green",
  "blue",
  "red",
  "yellow",
  "purple",
  "orange",
  "pink",
  "brown",
  "gray",
  "black",
] as const;
