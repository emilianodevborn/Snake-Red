// src/game/GameTypes.ts
export type Coordinate = { x: number; y: number };

export interface Food {
  coordinates: Coordinate;
  sprite: HTMLImageElement;
}

export interface Snake {
  id: string;
  segments: Coordinate[];
  direction: Coordinate;
  color: (typeof AVAILABLE_COLORS)[number];
  newHead?: Coordinate;
  isBot?: boolean;
}

export interface GameState {
  snakes: Snake[];
  food: Food[];
  obstacles: Coordinate[];
  consumedFood: number;
  isGameOver: boolean;
  isMultiplayer: boolean;
}

export type Player = {
  id: string;
  name: string;
  colorIndex?: number;
};

// Constantes del juego
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
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

export const DIFFICULTY_LEVELS = {
  "1": 150,
  "2": 100,
  "3": 50,
} as const;
