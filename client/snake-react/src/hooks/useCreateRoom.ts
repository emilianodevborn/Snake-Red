import { useState } from "react";

const useCreateRoom = (socket: WebSocket | null, playerName: string = '') => {
  const [isJoined, setIsJoined] = useState(false);
  
  const createRoom = () => {
    if (socket && playerName.trim() !== "") {
      const createMessage = {
          type: "createRoom",
          name: playerName,
      };
      socket.send(JSON.stringify(createMessage));
      setIsJoined(true);
    }
  };

  return { isJoined, createRoom };
};

export default useCreateRoom;