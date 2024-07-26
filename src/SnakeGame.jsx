import { useState, useEffect, useCallback, useRef } from "react";
import { Pause, Play } from "lucide-react";

const ROWS = 20;
const COLS = 20;
const CELL_SIZE = 25; // Increased cell size for better visibility

const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 100;
const MIN_SPEED = 40;

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isPaused, setIsPaused] = useState(false);

  const lastRenderTimeRef = useRef(0);
  const requestIdRef = useRef(null);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    setFood(newFood);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(false);
    generateFood();
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const wrapPosition = (pos, max) => {
    if (pos < 0) return max - 1;
    if (pos >= max) return 0;
    return pos;
  };

  const moveSnake = useCallback(
    (timestamp) => {
      if (gameOver || isPaused) return;

      const secondsSinceLastRender =
        (timestamp - lastRenderTimeRef.current) / 1000;
      if (secondsSinceLastRender < speed / 1000) {
        requestIdRef.current = requestAnimationFrame(moveSnake);
        return;
      }

      lastRenderTimeRef.current = timestamp;

      setSnake((prevSnake) => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };
        head.x = wrapPosition(head.x + direction.x, COLS);
        head.y = wrapPosition(head.y + direction.y, ROWS);

        if (
          newSnake.some(
            (segment) => segment.x === head.x && segment.y === head.y
          )
        ) {
          setGameOver(true);
          return prevSnake;
        }

        newSnake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
          setScore((prevScore) => prevScore + 1);
          generateFood();
          setSpeed((prevSpeed) => Math.max(prevSpeed - 2, MIN_SPEED));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });

      requestIdRef.current = requestAnimationFrame(moveSnake);
    },
    [direction, food, gameOver, isPaused, generateFood, speed]
  );

  useEffect(() => {
    const handleKeyPress = (e) => {
      e.preventDefault();
      switch (e.key) {
        case "ArrowUp":
          setDirection((prev) => (prev.y !== 1 ? { x: 0, y: -1 } : prev));
          break;
        case "ArrowDown":
          setDirection((prev) => (prev.y !== -1 ? { x: 0, y: 1 } : prev));
          break;
        case "ArrowLeft":
          setDirection((prev) => (prev.x !== 1 ? { x: -1, y: 0 } : prev));
          break;
        case "ArrowRight":
          setDirection((prev) => (prev.x !== -1 ? { x: 1, y: 0 } : prev));
          break;
        case " ":
          togglePause();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    requestIdRef.current = requestAnimationFrame(moveSnake);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      cancelAnimationFrame(requestIdRef.current);
    };
  }, [moveSnake]);

  const renderGrid = () => {
    const grid = [];
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        grid.push(
          <div
            key={`${i}-${j}`}
            className="absolute border border-gray-100"
            style={{
              left: j * CELL_SIZE,
              top: i * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        );
      }
    }
    return grid;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <h1 className="text-5xl font-bold mb-6 text-white">Snake Game</h1>
      <div className="mb-4 flex items-center space-x-6">
        <div className="text-2xl font-semibold text-white">Score: {score}</div>
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition-colors duration-200 flex items-center"
          onClick={togglePause}
        >
          {isPaused ? <Play size={24} /> : <Pause size={24} />}
          <span className="ml-2">{isPaused ? "Resume" : "Pause"}</span>
        </button>
      </div>
      <div
        className="relative bg-gradient-to-br from-green-200 to-green-300 rounded-lg shadow-lg overflow-hidden"
        style={{
          width: COLS * CELL_SIZE,
          height: ROWS * CELL_SIZE,
        }}
      >
        {renderGrid()}
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-gradient-to-br from-blue-500 to-blue-600"
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
              zIndex: 10,
            }}
          />
        ))}
        <div
          className="absolute rounded-full bg-gradient-to-br from-red-500 to-red-600"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE - 1,
            height: CELL_SIZE - 1,
            zIndex: 20,
          }}
        />
        {isPaused && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="text-white text-5xl font-bold">PAUSED</div>
          </div>
        )}
      </div>
      {gameOver && (
        <div className="mt-6 text-2xl font-bold text-white bg-red-500 px-4 py-2 rounded-full">
          Game Over!
        </div>
      )}
      <button
        className="mt-6 px-6 py-3 bg-blue-500 text-white text-xl font-semibold rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-colors duration-200"
        onClick={resetGame}
      >
        {gameOver ? "Play Again" : "Reset Game"}
      </button>
      <div className="mt-6 text-center text-white">
        <p>Use arrow keys to control the snake</p>
        <p>Press spacebar or the Pause button to pause/resume</p>
        <p>Snake can move through walls!</p>
      </div>
    </div>
  );
};

export default SnakeGame;
