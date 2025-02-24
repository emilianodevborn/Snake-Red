type GameButtonsProps = {
    onClick: () => void;
    text: string;
    color?: string;
    disabled?: boolean;
}

const GameButtons = ({ onClick, text, color = 'black', disabled = false }: GameButtonsProps) => {
    return (
      <button
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          width: '20%',
        }}
        onClick={onClick}
        disabled={disabled}
      >
        {text}
      </button>
    )
}

export default GameButtons;