// src/StartScreen.tsx
import React, { useEffect, useRef, useState } from "react";

import GameInputs from "./components/GameInputs";
import GameButtons from "./components/GameButtons";
import Separator from "./components/Separator";
import backgroundMusic from "./assets/background-sound.mp3";

interface StartScreenProps {
  onSelectClient: () => void;
  onSelectHost: () => void;
  setName: (name: string) => void;
  name: string;
  setClientId: (clientId: string) => void;
  clientId: string;
}

const StartScreen: React.FC<StartScreenProps> = ({
  onSelectClient,
  onSelectHost,
  setName,
  name,
  setClientId,
  clientId,
}) => {
  const isJoinButtonDisabled = clientId.trim() === "" || name.trim() === "";
  const isCreateButtonDisabled = name.trim() === "";

  const [audio] = useState(new Audio(backgroundMusic));
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSound = () => {
    if (isPlaying) {
      audio.pause(); // Pause the audio
    } else {
      audio.loop = true;
      audio
        .play()
        .catch((error) => console.error("Audio playback failed:", error));
    }
    setIsPlaying(!isPlaying); // Toggle state
  };

  return (
    <div className="bg-[#F7F6DF] w-screen h-screen flex flex-col justify-center items-center gap-10 text-white">
      <button className="absolute right-2 top-2" onClick={toggleSound}>
        {isPlaying ? "🔇 Turn Off Sound" : "🔊 Play Sound"}
      </button>
      <div className="text-6xl font-bold text-black">Snake Multiplayer</div>
      <div className="text-4xl font-bold text-red-500">How to play?</div>
      <GameInputs
        label="Name"
        value={name}
        onChange={setName}
        placeholder="Player"
      />
      <Separator />
      <div className="flex w-full flex-col justify-center items-center gap-3">
        <GameInputs
          label="Enter game id"
          value={clientId}
          onChange={setClientId}
          placeholder="Game id"
        />
        <GameButtons
          width="20%"
          onClick={onSelectClient}
          color={isJoinButtonDisabled ? "gray" : "black"}
          text="Join game"
          disabled={isJoinButtonDisabled}
        />
      </div>
      <Separator label="Or" />
      <GameButtons
        width="20%"
        onClick={onSelectHost}
        color={isCreateButtonDisabled ? "gray" : "black"}
        text="Create game"
        disabled={isCreateButtonDisabled}
      />
    </div>
  );
};

export default StartScreen;
