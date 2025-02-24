// src/StartScreen.tsx
import React from "react";

interface StartScreenProps {
    onSelectHost: () => void;
    onSelectClient: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onSelectHost, onSelectClient }) => {
    return (
        <div>
            <h2>Snake Multiplayer</h2>
            <button onClick={onSelectHost}>Crear Partida (Host)</button>
            <button onClick={onSelectClient}>Unirse a Partida (Cliente)</button>
        </div>
    );
};

export default StartScreen;
