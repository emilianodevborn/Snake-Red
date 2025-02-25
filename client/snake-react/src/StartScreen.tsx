// src/StartScreen.tsx
import React, { useState } from "react";

import GameInputs from "./components/GameInputs";
import GameButtons from "./components/GameButtons";
import Separator from "./components/Separator";

interface StartScreenProps {
    onSelectClient: () => void;
    onSelectHost: () => void;
    setName: (name: string) => void;
    name: string;
    setClientId: (clientId: string) => void;
    clientId: string;
}

const StartScreen: React.FC<StartScreenProps> = ({ onSelectClient, onSelectHost, setName, name, setClientId, clientId }) => {
    const isJoinButtonDisabled = clientId.trim() === "" || name.trim() === "";
    const isCreateButtonDisabled = name.trim() === "";

    return (
        <div style={{
            backgroundColor: '#F7F6DF',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            gap: '40px'
        }}>
            <div style={{
                fontSize: '78px',
                fontWeight: 'bold',
                color: '#000'
            }}>Snake Multiplayer</div>
            <div style={{
                fontSize: '40px',
                fontWeight: 'bold',
                color: 'red',
            }}>How to play?</div>
            <GameInputs label="Name" value={name} onChange={setName} placeholder="Player" />
            <Separator />
            <div style={{
                display: 'flex',
                width: '100%',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
            }}>
                <GameInputs label="Enter game id" value={clientId} onChange={setClientId} placeholder="Game id" />
                <GameButtons width="20%" onClick={onSelectClient} color={isJoinButtonDisabled ? 'gray' : 'black'} text="Join game" disabled={isJoinButtonDisabled} />
            </div>
            <Separator label="Or" />
            <GameButtons width="20%" onClick={onSelectHost} color={isCreateButtonDisabled ? 'gray' : 'black'} text="Create game" disabled={isCreateButtonDisabled} />
        </div>
    );
};

export default StartScreen;
