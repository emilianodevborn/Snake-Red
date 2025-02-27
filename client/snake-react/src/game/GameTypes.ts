// src/game/GameTypes.ts
export type Coordinate = { x: number; y: number };

export interface Food {
  coordinates: Coordinate;
  sprite: string;
  modifier: number;
}

export interface SnakeSegment {
  x: number;
  y: number;
  direction: { x: number; y: number };
}

export interface Snake {
  id: string;
  segments: SnakeSegment[];
  direction: Coordinate;
  color: (typeof AVAILABLE_COLORS)[number];
  speedFactor: number;
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
  scores: { id: string; name: string; score: number }[];
}

export type Player = {
  id: string;
  name: string;
  colorIndex?: number;
  isBot?: boolean;
  botDifficulty?: string;
};

// Constantes del juego
export const CANVAS_WIDTH = 2000;
export const CANVAS_HEIGHT = 2000;
export const CANVAS_CONTAINER_WIDTH = 800;
export const CANVAS_CONTAINER_HEIGHT = 600;
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
  "1": 12,
  "2": 8,
  "3": 5,
} as const;

export const BOT_NAMES = [
  "Bot-tanic",
  "MultiLegs-Mike",
  "Centi-Bot",
  "Leggy-McBot",
  "Bot-of-Many-Legs",
];
