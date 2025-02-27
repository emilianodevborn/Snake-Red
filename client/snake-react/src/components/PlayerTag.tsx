import { AVAILABLE_COLORS } from "../game/GameTypes";

interface PlayerTagProps {
  name: string;
  color: (typeof AVAILABLE_COLORS)[number];
  className?: string;
  onClick: () => void;
}

const PlayerTag = ({ color, name, onClick, className }: PlayerTagProps) => {
  const bgColor = `bg-[${color}]-200`;
  return (
    <div
      className={`flex w-full max-w-40 px-4 py-2 justify-between items-center gap-2 border-2 border-gray-800 rounded-2xl bg-white opacity-60 ${className} `}
      style={{ border: `2px solid ${color}` }}
      onClick={onClick}
    >
      <span className="truncate">{name}</span>

      <span className={`relative flex size-4`}>
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full border border-solid border-black opacity-75`}
          style={{ backgroundColor: color }}
        />
        <span
          className={`relative inline-flex size-4 rounded-full border border-solid border-black `}
          style={{ backgroundColor: color }}
        />
      </span>
    </div>
  );
};

export default PlayerTag;
