const GameControls = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px',
      color: 'black',
      minWidth: '300px'
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'red'
      }}>
        Game Controls
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: '18px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontWeight: 'bold' }}>Up:</span>
          <span>W or ↑</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontWeight: 'bold' }}>Down:</span>
          <span>S or ↓</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontWeight: 'bold' }}>Left:</span>
          <span>A or ←</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontWeight: 'bold' }}>Right:</span>
          <span>D or →</span>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
