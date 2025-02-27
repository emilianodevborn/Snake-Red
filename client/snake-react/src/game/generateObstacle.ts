// src/game/generateObstacle.ts
import {Coordinate, Food, Snake} from "./GameTypes";
import {isValidPosition} from "./utils";

export const generateObstacle = (
  head: Coordinate,
  snakeLength: number,
  obstacles: any[],
  foods: Food[],
  snakes: Snake[],
): Coordinate => {
    const blockSize: number = 1
    let perc: number;

    if (snakeLength >= 3 && snakeLength <= 4) {
        perc = 1.0;
    } else if (snakeLength >= 5 && snakeLength <= 6) {
        perc = 0.7;
    } else if (snakeLength >= 7 && snakeLength <= 8) {
        perc = 0.5;
    } else if (snakeLength >= 9 && snakeLength <= 10) {
        perc = 0.3;
    } else if (snakeLength >= 11 && snakeLength <= 12) {
        perc = 0.1;
    } else if (snakeLength >= 13 && snakeLength <= 14) {
        perc = 0.05;
    } else{
        perc = 0.02;
    }

    // La distancia máxima en cualquiera de los ejes es 99 (100 - blockSize)
    const maxDistance = 100 - blockSize;
    const maxAttempts = 10;
    let obstacle: Coordinate | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Usamos la misma lógica para calcular el desplazamiento en x e y basado en la posición de la cabeza.
        // Calculamos para el eje x:
        const maxDx = head.x < 50 ? (100 - blockSize - head.x) : head.x;
        const dx = Math.floor(perc * maxDx);
        // Para el eje y:
        const maxDy = head.y < 50 ? (100 - blockSize - head.y) : head.y;
        const dy = Math.floor(perc * maxDy);

        // Determinamos la nueva posición:
        // Si la cabeza está en la mitad izquierda, desplazamos hacia la derecha; si está en la mitad derecha, hacia la izquierda.
        const candidateX = head.x < 50 ? head.x + dx : head.x - dx;
        const candidateY = head.y < 50 ? head.y + dy : head.y - dy;

        // Clampeamos para asegurarnos de que estén en el rango [0, 99]
        const obstacleX = Math.max(0, Math.min(candidateX, 100 - blockSize));
        const obstacleY = Math.max(0, Math.min(candidateY, 100 - blockSize));
        const candidate: Coordinate = { x: obstacleX, y: obstacleY };

        // Verificar si la posición es válida
        const existingFoodCoordinates: Coordinate[] = foods
          ? foods.map(food => food.coordinates)
          : [];

        if (isValidPosition(candidate, snakes, obstacles, existingFoodCoordinates, head)) {
            obstacle = candidate;
            break;
        }
        // Si no es válida, reducimos ligeramente el porcentaje para buscar una posición un poco más cercana
        perc *= 0.9;
    }

    // Si después de los intentos no se encuentra una posición válida, forzamos el valor clamped
    if (!obstacle) {
        const maxDx = head.x < 50 ? (100 - blockSize - head.x) : head.x;
        const dx = Math.floor(perc * maxDx);
        const maxDy = head.y < 50 ? (100 - blockSize - head.y) : head.y;
        const dy = Math.floor(perc * maxDy);
        const candidateX = head.x < 50 ? head.x + dx : head.x - dx;
        const candidateY = head.y < 50 ? head.y + dy : head.y - dy;
        obstacle = {
            x: Math.max(0, Math.min(candidateX, 100 - blockSize)),
            y: Math.max(0, Math.min(candidateY, 100 - blockSize)),
        };
    }

    return obstacle;
};