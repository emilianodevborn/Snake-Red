import joystickIcon from "../assets/joystick.svg";
import React from "react";

const GameControls = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      color: 'black',
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "12px",
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'red'
      }}>
        <img src={joystickIcon} alt="Joystick" style={{width: "30px", height: "30px"}}/>
        <span style={{fontSize: "2rem", fontWeight: 700, color: "#d43f3f"}}>Game Controls</span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: "center",
        justifyContent: "center",
        flexDirection: 'column',
        gap: '10px',
        fontSize: '18px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: "center",
          gap: '10px',
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: '100%',
        }}>
          <span style={{fontWeight: 'bold'}}>UP:</span>
          <span>W or ↑</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: "center",
          gap: '10px',
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: '100%',
        }}>
          <span style={{fontWeight: 'bold'}}>DOWN:</span>
          <span>S or ↓</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: "center",
          gap: '10px',
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: '100%',
        }}>
          <span style={{fontWeight: 'bold'}}>LEFT:</span>
          <span>A or ←</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: "center",
          gap: '10px',
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: '100%',
        }}>
          <span style={{fontWeight: 'bold'}}>RIGHT:</span>
          <span>D or →</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: "center",
          gap: '10px',
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: '100%',
        }}>
          <span style={{fontWeight: 'bold'}}>PAUSE:</span>
          <span>SPACE BAR</span>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
