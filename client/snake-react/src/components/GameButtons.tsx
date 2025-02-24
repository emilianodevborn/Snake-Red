type GameButtonsProps = {
    onClick: () => void;
    text: string;
    color?: string;
    disabled?: boolean;
    width?: string;
}

const GameButtons = ({ onClick, text, color = 'black', disabled = false, width = '100%' }: GameButtonsProps) => {
    return (
      <button
        style={{
          backgroundColor: color,
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          width,
        }}
        onClick={onClick}
        disabled={disabled}
      >
        {text}
      </button>
    )
}

export default GameButtons;