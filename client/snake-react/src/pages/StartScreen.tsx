// src/StartScreen.tsx
import { useState, type FC } from "react";
import GameButtons from "../components/GameButtons";
import GameInputs from "../components/GameInputs";
import Separator from "../components/Separator";
import Modal from "../components/Modal";
import GameControls from "../components/GameControls";
import { Button } from "../components/Button";
import Input from "../components/Input";
import Logo from "../assets/logo.svg";
import Orange from "../assets/orange-with-hands.svg";

interface StartScreenProps {
  onSelectClient: () => void;
  onSelectHost: () => void;
  setName: (name: string) => void;
  name: string;
  setClientId: (clientId: string) => void;
  clientId: string;
}

const StartScreen: FC<StartScreenProps> = ({
  onSelectClient,
  onSelectHost,
  setName,
  name,
  setClientId,
  clientId,
}) => {
  const isJoinButtonDisabled = clientId.trim() === "" || name.trim() === "";
  const isCreateButtonDisabled = name.trim() === "";
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="flex flex-col justify-center items-center w-[480px] gap-16">
      <img src={Logo} alt="Logo Centibite" />
      <div className="w-96 flex flex-col justify-center items-center gap-4 relative">
        {/* <div className="text-6xl font-bold text-black">Snake Multiplayer</div> */}
        {/* <div
        className="text-4xl font-bold text-red-500 hover:underline cursor-pointer transition-all duration-200"
        onClick={() => setShowControls(true)}
      >
        How to play?
      </div> */}
        <Modal isOpen={showControls} onClose={() => setShowControls(false)}>
          <GameControls />
        </Modal>
        <Input
          placeholder="Enter your name"
          className="w-full"
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Enter ID (Optional)"
          className="w-full"
          onChange={(e) => setClientId(e.target.value)}
        />
        <div className="flex flex-col gap-2 w-full">
          <Button disabled={isCreateButtonDisabled} onClick={onSelectHost}>
            CREATE A GAME
          </Button>
          <Button disabled={isJoinButtonDisabled} onClick={onSelectClient}>
            JOIN GAME
          </Button>
        </div>
        <img
          src={Orange}
          alt="Orange With Hands"
          className="hidden size-44 md:flex md:absolute md:right-[-175px] md:bottom-0"
        />
        {/* <GameInputs
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
      /> */}
      </div>
    </div>
  );
};

export default StartScreen;
