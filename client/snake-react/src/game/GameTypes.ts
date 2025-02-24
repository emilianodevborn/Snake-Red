// src/game/GameTypes.ts
export type Coordinate = { x: number; y: number };

export interface Snake {
    id: string;
    segments: Coordinate[];
    direction: Coordinate;
    color: string;
}

export interface GameState {
    snakes: Snake[];
    food: Coordinate[];
    gameOver: boolean;
}

// Constantes del juego
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;
