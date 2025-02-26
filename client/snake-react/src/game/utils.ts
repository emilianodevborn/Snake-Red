import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_SIZE,
  type Coordinate, BOT_NAMES,
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
  const maxTranslateX = CANVAS_WIDTH - 800; // container width
  const maxTranslateY = CANVAS_HEIGHT - 600; // container height

  // Calculate desired translation
  const desiredX = -position.x * GRID_SIZE + 400;
  const desiredY = -position.y * GRID_SIZE + 300;

  // Constrain the translation values
  const constrainedX = Math.min(0, Math.max(-maxTranslateX, desiredX));
  const constrainedY = Math.min(0, Math.max(-maxTranslateY, desiredY));

  return { x: constrainedX, y: constrainedY };
}

export const assignBotName = (bots: any[], botDifficulty: string) => {
  const usedNames = bots?.map(bot => bot.name.split(" ")[0]);
  const unusedNames = BOT_NAMES.filter(name => !usedNames.includes(name));
  if (unusedNames.length === 0) {
    return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  }
  return `${unusedNames[0]} (${botDifficulty})`;
}
