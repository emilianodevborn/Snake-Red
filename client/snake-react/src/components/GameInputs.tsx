type GameInputsProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const GameInputs = ({ label, value, onChange, placeholder }: GameInputsProps) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      width: '20%'
    }}>
      <div style={{
        fontSize: '16px',
        color: '#000',
        fontWeight: 'bold',
      }}>{label}</div>
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          borderRadius: '5px',
          border: '1px solid #000',
          backgroundColor: '#F7F6DF',
          padding: '5px 10px',
        }}
      />
    </div>
  );
};

export default GameInputs;
