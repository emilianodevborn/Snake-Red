interface SeparatorProps {
  color?: string;
  label?: string
}

const Separator: React.FC<SeparatorProps> = ({ color = 'gray', label }) => {
  return (
    <div 
      style={{
        height: '1px',
        width: '50%',
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
      }}
    >
      {label && (
        <span style={{
          backgroundColor: '#F7F6DF',
          color: color,
          padding: '8px',
          borderRadius: '50px',
          zIndex: 1,
          position: 'absolute',
        }}>
          {label}
        </span>
      )}
    </div>
  );
};

export default Separator; 