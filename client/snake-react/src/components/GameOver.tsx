import { motion } from "framer-motion";

type GameOverProps = {
  onTryAgain: () => void;
};

export const GameOver = ({ onTryAgain }: GameOverProps) => {
  return (
    <motion.div
      className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-blue-500 z-[9]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="text-6xl text-white">Game Over</div>
        <button
          className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-300 cursor-pointer transition-all duration-300"
          onClick={onTryAgain}
        >
          Try again
        </button>
      </div>
    </motion.div>
  );
};
