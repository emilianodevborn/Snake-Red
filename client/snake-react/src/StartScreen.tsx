// src/StartScreen.tsx
import React from "react";

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

  return (
    <div className="bg-[#F7F6DF] w-screen h-screen flex flex-col justify-center items-center gap-10 text-white">
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
