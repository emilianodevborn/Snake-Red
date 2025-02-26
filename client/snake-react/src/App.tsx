// src/App.tsx
import { useEffect, useState } from "react";
import StartScreen from "./StartScreen";
import WaitingRoom from "./WaitingRoom";
import LoadingView from "./LoadingView";
import GameView from "./components/GameView";
import Modal from "./components/Modal";
import GameControls from "./components/GameControls";
import useCreateRoom from "./hooks/useCreateRoom";
import useJoinRoom from "./hooks/useJoinRoom";
import type { Player } from "./game/GameTypes";
import { getMessageText } from "./game/utils";
import backgroundMusic from "./assets/background-sound.mp3";
import gameMusic from "./assets/game-sound.mp3";
import { toast, ToastContainer } from "react-toastify";

export enum GamePhase {
  START = "start",
  LOBBY = "lobby",
  LOADING = "loading",
  GAME = "game",
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.START);
  const [role, setRole] = useState<"host" | "client" | null>(null);
  const [name, setName] = useState<string>("");
  const [clientId, setClientId] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [difficulty, setDifficulty] = useState<string>("1");
  const { isJoined, createRoom } = useCreateRoom(socket, name);
  const { joinRoom } = useJoinRoom(socket, name, clientId);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const [audio, setAudio] = useState(new Audio());

  const toggleBackgroundSound = () => {
    if (isAudioPlaying) {
      audio.pause();
    } else {
      audio.loop = true;
      audio
        .play()
        .catch((error) => console.error("Audio playback failed:", error));
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  useEffect(() => {
    const ws = new WebSocket("https://4712-190-210-239-237.ngrok-free.app");
    setSocket(ws);
    ws.onopen = (a) => {
      console.log("Conectado al servidor de señalización (App.tsx)", a);
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      getMessageText(event.data)
        .then((text) => {
          const data = JSON.parse(text);
          if (data.type === "roomCreated") {
            setClientId(data.playerId);
            setPlayers([
              {
                id: data.playerId,
                name: data.name,
                colorIndex: data.colorIndex,
              },
            ]);
          }

          if (data.type === "playerList") {
            console.log(data.disconnected);
            if (data.showToast) {
              if (data.disconnected) {
                toast.warn(`${data.newPlayerName} has left the room!`);
              } else {
                toast.info(`${data.newPlayerName} has joined the room!`);
              }
            }
            setPlayers(data.players);
          }

          if (data.type === "playerConnected") {
            setClientId(data.playerId);
          }
        })
        .catch((err) => {
          console.error("Error procesando el mensaje en App.tsx:", err);
        });
    };

    socket?.addEventListener("message", handleMessage);
    return () => {
      socket?.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (phase === GamePhase.START) {
      audio.pause();
      setAudio(new Audio(backgroundMusic));
    } else if (phase === GamePhase.GAME) {
      toast.dismiss();
      audio.pause();
      setAudio(new Audio(gameMusic));
    }
  }, [phase]);

  return (
    <div>
      <div className="absolute right-2 top-2 flex flex-col gap-2">
        <button
          className="bg-white px-4 py-2 rounded-lg border border-black hover:bg-gray-100 transition-all duration-200"
          onClick={toggleBackgroundSound}
        >
          {isAudioPlaying ? "🔇 Turn Off Sound" : "🔊 Play Sound"}
        </button>
        {phase === GamePhase.GAME && (
          <button
            className="bg-white px-4 py-2 rounded-lg border border-black hover:bg-gray-100 transition-all duration-200"
            onClick={() => setShowControls(true)}
          >
            🎮 Game Controls
          </button>
        )}
      </div>

      <Modal isOpen={showControls} onClose={() => setShowControls(false)}>
        <GameControls />
      </Modal>

      {phase === GamePhase.START && (
        <StartScreen
          setName={setName}
          setClientId={setClientId}
          clientId={clientId}
          name={name}
          onSelectHost={() => {
            createRoom();
            setRole("host");
            setPhase(GamePhase.LOBBY);
          }}
          onSelectClient={() => {
            joinRoom();
            setRole("client");
            setPhase(GamePhase.LOBBY);
          }}
        />
      )}

      <Modal
        isOpen={phase === GamePhase.LOBBY}
        onClose={() => setPhase(GamePhase.START)}
      >
        {role && socket && (
          <WaitingRoom
            onStartGame={() => setPhase(GamePhase.LOADING)}
            isHost={role === "host"}
            socket={socket}
            players={players}
            localPlayerId={clientId}
            onDifficultyChange={setDifficulty}
          />
        )}
      </Modal>

      <Modal
        isOpen={phase === GamePhase.LOADING}
        onClose={() => setPhase(GamePhase.LOBBY)}
      >
        {role && socket && (
          <LoadingView
            socket={socket}
            onReady={() => setPhase(GamePhase.GAME)}
          />
        )}
      </Modal>

      {phase === GamePhase.GAME && socket && (
        <GameView
          role={role}
          socket={socket}
          players={players}
          localPlayerId={clientId}
          difficulty={difficulty}
        />
      )}
      <ToastContainer />
    </div>
  );
};

export default App;
