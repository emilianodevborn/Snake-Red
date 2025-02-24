// src/game/GameLogic.ts
import { GameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, Coordinate, Snake } from "./GameTypes";
import { generateFood } from "./generateFood";
import {generateObstacle} from "./generateObstacle";
import eatSoundFile from '../assets/eat-sound.mp3';

export const updateGameState = (prevState: GameState): GameState => {
    if (prevState.gameOver) return prevState;

    const maxX = CANVAS_WIDTH / GRID_SIZE - 1;
    const maxY = CANVAS_HEIGHT / GRID_SIZE - 1;

    // Paso 1: calcular la nueva cabeza para cada serpiente (clampeada)
    const snakesWithNewHead = prevState.snakes.map((snake) => {
        const head = snake.segments[0];
        let calcX = head.x + snake.direction.x;
        let calcY = head.y + snake.direction.y;
        const newHead: Coordinate = {
            x: Math.max(0, Math.min(calcX, maxX)),
            y: Math.max(0, Math.min(calcY, maxY)),
        };
        return { ...snake, newHead };
    });

    // Paso 2: self-collision
    const deadSnakeIds = new Set<string>();
    snakesWithNewHead.forEach((snake) => {
        const { newHead, segments, id } = snake;
        if (segments.slice(1).some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            console.warn(`Snake ${id} se colisionó consigo misma.`);
            deadSnakeIds.add(id);
        }
    });

    // Paso 3: colisiones entre serpientes
    for (let i = 0; i < snakesWithNewHead.length; i++) {
        for (let j = 0; j < snakesWithNewHead.length; j++) {
            if (i === j) continue;
            const snakeA = snakesWithNewHead[i];
            const snakeB = snakesWithNewHead[j];
            snakeB.segments.forEach((seg, index) => {
                if (snakeA.newHead.x === seg.x && snakeA.newHead.y === seg.y) {
                    if (index === 0) {
                        // Choque de cabezas: ambos mueren.
                        deadSnakeIds.add(snakeA.id);
                        deadSnakeIds.add(snakeB.id);
                    } else {
                        deadSnakeIds.add(snakeA.id);
                    }
                }
            });
        }
    }

    // Paso 4: actualizar serpientes y dropear 50% de los segmentos ganados
    let newFoodArray = prevState.food.slice();
    let newObstacles = [...prevState.obstacles];
    let newConsumedFood = prevState.consumedFood;
    const eatSound = new Audio(eatSoundFile);

    const updatedSnakes: Snake[] = snakesWithNewHead.map((snake) => {
        if (deadSnakeIds.has(snake.id)) {
            const consumed = snake.segments.length - 1;
            const dropCount = Math.floor(consumed / 2);
            const drops = snake.segments.slice(-dropCount);
            newFoodArray = newFoodArray.concat(drops);
            return null; // La serpiente muere
        } else {
            let ateFood = false;
            if (newFoodArray.some(f => f.x === snake.newHead.x && f.y === snake.newHead.y)) {
                ateFood = true;
                eatSound.play();
                newFoodArray = newFoodArray.filter(f => !(f.x === snake.newHead.x && f.y === snake.newHead.y));
                newFoodArray.push(generateFood());
                newConsumedFood += 1;
            }
            // Cada 2 comidas consumidas, generamos un obstáculo
            if (ateFood && newConsumedFood % 2 === 0) {
                const obstacle = generateObstacle();
                newObstacles.push(obstacle);
                console.log("Generado obstáculo en:", obstacle);
            }
            const newSegments = ateFood
                ? [snake.newHead, ...snake.segments]
                : [snake.newHead, ...snake.segments.slice(0, -1)];
            return { ...snake, segments: newSegments };
        }
    }).filter(snake => snake !== null) as Snake[];

    // Paso 5: Game over si la serpiente del host ya no existe
    let gameOver: boolean = prevState.gameOver;
    if (!updatedSnakes.some(s => s.id === "host")) {
        gameOver = true;
    }

    return {
        snakes: updatedSnakes,
        food: newFoodArray,
        obstacles: newObstacles,
        consumedFood: newConsumedFood,
        gameOver,
    };
};
