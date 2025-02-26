// src/bot.ts

import {loadModel, predict} from './model';
import {CANVAS_HEIGHT, CANVAS_WIDTH, Coordinate, GameState, GRID_SIZE, Snake} from "../game/GameTypes";

let boy_easy = loadModel('easy');
let boy_hard = loadModel('hard');

export async function getBotAction(state: number[], difficulty: string): Promise<number[]> {
    // 'state' debe ser un array de números con las características del juego (ej. 11 elementos)
    const session = await (difficulty === 'easy' ? boy_easy : boy_hard);

    const prediction = await predict(session, state);
    // Suponiendo que la acción es el índice con el valor máximo
    const arr = Array.from(prediction);
    const move = arr.indexOf(Math.max(...arr));
    const finalMove = [0, 0, 0];
    finalMove[move] = 1;
    return finalMove;
}

// Suponiendo que GameState contiene la información necesaria para calcular estos inputs
// y que tienes funciones auxiliares para detectar obstáculos y determinar la posición de la comida.
// Aquí definimos una función que construye el vector de entrada:
export function computeBotState(gameState: any, snake: Snake): number[] {
    // Ejemplo: la entrada es un array de 11 valores (0 o 1)
    // Estos valores podrían ser:
    // 0: Obstáculo en frente (1 si sí, 0 si no)
    // 1: Obstáculo a la derecha
    // 2: Obstáculo a la izquierda
    // 3-6: Dirección actual (uno de ellos en 1, los demás 0): izquierda, derecha, arriba, abajo
    // 7-10: Ubicación de la comida (1 en la posición correspondiente): comida izquierda, derecha, arriba, abajo

    // Por ejemplo, supongamos que tienes funciones:
    // isObstacle(direction, gameState, snakeHead)
    // getFoodDirection(gameState, snakeHead): retorna un objeto con { left, right, up, down } (booleanos)

    const snakeHead = snake?.segments[0];
    if (!snakeHead) return Array(11).fill(0);

    const obstacleFront = isObstacle("front", gameState, snakeHead, snake.direction, snake.id) ? 1 : 0;
    const obstacleRight = isObstacle("right", gameState, snakeHead, snake.direction, snake.id) ? 1 : 0;
    const obstacleLeft  = isObstacle("left",  gameState, snakeHead, snake.direction, snake.id) ? 1 : 0;

    // Supongamos que en el estado global, tienes la dirección actual del bot
    // Para este ejemplo, vamos a suponer que el bot es el jugador "client1"
    const dir = snake ? snake.direction : { x: 0, y: 0 };
    const dirLeft = dir.x === -1 ? 1 : 0;
    const dirRight = dir.x === 1 ? 1 : 0;
    const dirUp = dir.y === -1 ? 1 : 0;
    const dirDown = dir.y === 1 ? 1 : 0;

    const foodDir = getFoodDirection(gameState, snakeHead); // { left, right, up, down } booleans

    // Armar vector de entrada (11 elementos)
    const stateVector = [
        obstacleFront,
        obstacleRight,
        obstacleLeft,
        dirLeft,
        dirRight,
        dirUp,
        dirDown,
        foodDir.left ? 1 : 0,
        foodDir.right ? 1 : 0,
        foodDir.up ? 1 : 0,
        foodDir.down ? 1 : 0,
    ];
    console.log('VECTOR', stateVector);
    return stateVector;
}

// Función para obtener la acción del bot usando el modelo ONNX
export async function getBotMove(state: any, difficulty: string = 'easy'): Promise<number[]> {
     // getBotAction está definido en model.ts
    return await getBotAction(state, difficulty); // Array, por ejemplo, [0, 1, 0]
}

// Aquí deberías definir o importar las funciones isObstacle y getFoodDirection según la lógica de tu juego.
export function isObstacle(
  relDir: "front" | "right" | "left",
  gameState: GameState,
  head: Coordinate,
  direction: Coordinate,
  currentSnakeId: string,
): boolean {
    // Direcciones en orden horario: derecha, abajo, izquierda, arriba.
    const directions: { name: string; vector: Coordinate }[] = [
        { name: "right", vector: { x: 1, y: 0 } },
        { name: "down", vector: { x: 0, y: 1 } },
        { name: "left", vector: { x: -1, y: 0 } },
        { name: "up", vector: { x: 0, y: -1 } },
    ];

    // Se asume que gameState.direction es la dirección actual relevante.
    const current = direction;
    const currentIdx = directions.findIndex(
      (d) => d.vector.x === current.x && d.vector.y === current.y
    );
    if (currentIdx === -1) {
        console.error("Dirección actual no reconocida:", current);
        return false;
    }

    let targetIdx: number;
    if (relDir === "front") {
        targetIdx = currentIdx;
    } else if (relDir === "right") {
        targetIdx = (currentIdx + 1) % 4;
    } else if (relDir === "left") {
        targetIdx = (currentIdx + 3) % 4;
    } else {
        targetIdx = currentIdx;
    }

    const vec = directions[targetIdx].vector;
    const nextPoint: Coordinate = {
        x: head.x + vec.x,
        y: head.y + vec.y,
    };

    // Verificar límites del área de juego
    if (
      nextPoint.x < 0 ||
      nextPoint.x >= CANVAS_WIDTH/GRID_SIZE ||
      nextPoint.y < 0 ||
      nextPoint.y >= CANVAS_HEIGHT/GRID_SIZE
    ) {
        console.log('LIMITE ',relDir)
        return true;
    }

    // Verificar obstáculos fijos
    if (gameState.obstacles.some(obst => obst.x === nextPoint.x && obst.y === nextPoint.y)) {
        console.log('OBSTACULO')

        return true;
    }

    // Verificar si hay cualquier segmento de cualquier serpiente (incluyendo la propia) en esa celda
    for (const snake of gameState.snakes) {
        for (const seg of snake.segments) {
            if (seg.x === nextPoint.x && seg.y === nextPoint.y) {
                console.log('Serpiente')
                return true;
            }
        }
    }

    return false;
}

function getFoodDirection(gameState: any, head: any): { left: boolean, right: boolean, up: boolean, down: boolean } {
    // Supongamos que gameState.food es un array de objetos con una propiedad "coordinates" que tiene x e y.
    let closestFood = null;
    let minDistance = Infinity;

    for (const foodObj of gameState.food) {
        const food = foodObj.coordinates;
        // Usamos la distancia Manhattan
        const distance = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
        if (distance < minDistance) {
            minDistance = distance;
            closestFood = food;
        }
    }

    if (!closestFood) {
        // Si no hay comida, devolvemos falsos
        return { left: false, right: false, up: false, down: false };
    }

    return {
        left: closestFood.x < head.x,
        right: closestFood.x > head.x,
        up: closestFood.y < head.y,
        down: closestFood.y > head.y,
    };
}

type Direction = { x: number; y: number };

export function mapActionToDirection(current: Direction, action: number[]): Direction {
    // Definimos las direcciones en orden horario
    const directions: Direction[] = [
        { x: 1, y: 0 },  // derecha
        { x: 0, y: 1 },  // abajo
        { x: -1, y: 0 }, // izquierda
        { x: 0, y: -1 }  // arriba
    ];

    // Buscar el índice de la dirección actual
    let idx = directions.findIndex(dir => dir.x === current.x && dir.y === current.y);
    if (idx === -1) {
        // Si no se encuentra, se asume derecha por defecto
        idx = 0;
    }

    if (action[0] === 1) {
        // Seguir recto: no se cambia la dirección
        return current;
    } else if (action[1] === 1) {
        // Girar a la derecha: índice + 1
        return directions[(idx + 1) % 4];
    } else if (action[2] === 1) {
        // Girar a la izquierda: índice - 1, que es lo mismo que (idx + 3) % 4
        return directions[(idx + 3) % 4];
    }

    return current; // fallback
}
