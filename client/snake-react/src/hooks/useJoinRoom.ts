const useJoinRoom = (socket: WebSocket | null, playerName: string, roomId: string) => {
  const joinRoom = () => {
    if (socket && playerName.trim() !== "" && roomId.trim() !== "") {
        const joinMessage = {
            type: "joinRoom",
            roomId,
            name: playerName,
        };
        socket.send(JSON.stringify(joinMessage));
    }
};

  return { joinRoom };
};

export default useJoinRoom;
