import {
  BOT_NAMES,
  CANVAS_CONTAINER_HEIGHT,
  CANVAS_CONTAINER_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_SIZE,
  Snake,
  SnakeSegment,
  type Coordinate,
} from "./GameTypes";

// src/game/utils.ts
export const getMessageText = (data: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof data === "string") {
      resolve(data);
    } else if (data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error("Error reading Blob"));
      reader.readAsText(data);
    } else {
      resolve(data.toString());
    }
  });
};

export function getConstrainedTransform(position: Coordinate) {
  // Calculate the maximum allowed translation
  const maxTranslateX = CANVAS_WIDTH - CANVAS_CONTAINER_WIDTH; // container width
  const maxTranslateY = CANVAS_HEIGHT - CANVAS_CONTAINER_HEIGHT; // container height

  // Calculate desired translation
  const desiredX = -position.x * GRID_SIZE + 401;
  const desiredY = -position.y * GRID_SIZE + 301;

  // Constrain the translation values
  const constrainedX = Math.min(0, Math.max(-maxTranslateX, desiredX));
  const constrainedY = Math.min(0, Math.max(-maxTranslateY, desiredY));

  return { x: constrainedX, y: constrainedY };
}

export const assignBotName = (bots: any[], botDifficulty: string) => {
  const usedNames = bots?.map((bot) => bot.name.split(" ")[0]);
  const unusedNames = BOT_NAMES.filter((name) => !usedNames.includes(name));
  if (unusedNames.length === 0) {
    return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  }
  return `${unusedNames[0]} (${botDifficulty})`;
};

export function isValidPosition(
  pos: Coordinate,
  snakes: Snake[],
  obstacles?: Coordinate[],
  foods?: Coordinate[],
  head?: Coordinate
): boolean {
  const occupied = new Set<string>();
  head && occupied.add(`${head.x},${head.y}`);
  // Agregar obstáculos
  obstacles &&
    obstacles.forEach((item) => {
      occupied.add(`${item.x},${item.y}`);
    });

  // Agregar comidas
  foods &&
    foods.forEach((item) => {
      occupied.add(`${item.x},${item.y}`);
    });

  // Agregar segmentos de todas las serpientes
  snakes.forEach((snake) => {
    snake.segments.forEach((seg) => {
      occupied.add(`${seg.x},${seg.y}`);
    });
  });

  // Si la posición pos está en el conjunto, no es válida
  return !occupied.has(`${pos.x},${pos.y}`);
}

export function generateSnakeSegments(
  head: Coordinate,
  snakeLength: number,
  direction: Coordinate
): SnakeSegment[] {
  // El cuerpo se extiende en la dirección opuesta al movimiento.
  const opposite = { x: -direction.x, y: -direction.y };
  const segments: SnakeSegment[] = [];
  for (let i = 0; i < snakeLength; i++) {
    segments.push({
      x: head.x + i * opposite.x,
      y: head.y + i * opposite.y,
      direction: { ...direction },
    });
  }
  return segments;
}
