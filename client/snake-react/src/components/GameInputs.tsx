type GameInputsProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

const GameInputs = ({
  label,
  value,
  onChange,
  placeholder,
}: GameInputsProps) => {
  return (
    <div className="flex flec-col gap-1 w-[20%] justify-between">
      <div className="text-[#000] font-bold text-2xl">{label}</div>
      <input
        type="text"
        className="input rounded-[5px] py-1 px-3 bg-[#F7F6DF] border border-black"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default GameInputs;
