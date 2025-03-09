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
  "#FFB6C1", // LightPink
  "#98FB98", // PaleGreen
  "#F4A460", // SandyBrown
  "#FF6347", // Tomato
  "#000000", // Black
  "#7B68EE", // MediumSlateBlue
  "#FFFFFF", // White
  "#FF1493", // DeepPink
  "#F0E68C", // Khaki
  "#4682B4", // SteelBlue
] as const;

export const SHADOW_COLORS = [
  "#F48FA6", // Sombra para LightPink
  "#90EE90", // Sombra para PaleGreen
  "#E2A76F", // Sombra para SandyBrown
  "#FF7F50", // Sombra para Tomato
  "#444444", // Sombra para Black
  "#6A5ACD", // Sombra para MediumSlateBlue
  "#E0E0E0", // Sombra para White
  "#FF69B4", // Sombra para DeepPink
  "#D2B48C", // Sombra para Khaki
  "#5F9EA0", // Sombra para SteelBlue
] as const;

export const DIFFICULTY_LEVELS = {
  "1": 6,
  "2": 4,
  "3": 2.5,
} as const;

export const BOT_NAMES = [
  "Bot-tanic",
  "MultiLegs-Mike",
  "Centi-Bot",
  "Leggy-McBot",
  "Bot-of-Many-Legs",
];
