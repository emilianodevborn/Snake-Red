// server.js
const WebSocket = require("ws");
const {v4: uuidv4} = require("uuid");

const rooms = {};

const MAX_PLAYERS = 10;

const wss = new WebSocket.Server({port: 8080}, () => {
  console.log("Servidor de señalización escuchando en el puerto 8080");
});

wss.on("connection", (ws) => {
  // Asigna un ID único a cada conexión
  ws.playerId = uuidv4();
  console.log(`Nuevo cliente conectado con ID: ${ws.playerId}`);
  
  // Propiedades para sala, rol y nombre del jugador
  ws.roomId = null;
  ws.isHost = false;
  ws.playerName = "";
  
  ws.on("message", (message) => {
    console.log("Mensaje recibido en el servidor:", message);
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error("Error parseando mensaje:", err);
      return;
    }
    
    switch (data.type) {
      // Caso: crear una nueva sala (host)
      case "createRoom":
        ws.playerName = data.name || "Host";
        ws.playerColorIndex = 0;
        // Genera un ID de sala
        const newRoomId = generateRoomId();
        rooms[newRoomId] = {
          host: ws,
          clients: [],
          usedColorIndices: [0]
        };
        ws.roomId = newRoomId;
        ws.isHost = true;
        console.log(
          `Sala creada con ID: ${newRoomId} por ${ws.playerName} (ID: ${ws.playerId})`
        );
        
        // Envía al host la confirmación con su playerId
        ws.send(
          JSON.stringify({
            type: "roomCreated",
            roomId: newRoomId,
            name: ws.playerName,
            playerId: ws.playerId,
            colorIndex: ws.playerColorIndex
          })
        );
        break;
      
      // Caso: unirse a sala existente (cliente)
      case "joinRoom":
        const {roomId} = data;
        if (!rooms[roomId]) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Sala no existe",
            })
          );
          return;
        }
        ws.roomId = roomId;
        ws.isHost = false;
        ws.playerName = data.name || "Cliente";
        const room = rooms[roomId];
        // Buscar el primer índice disponible
        let availableIndex = null;
        for (let i = 0; i < MAX_PLAYERS; i++) {
          if (!room.usedColorIndices.includes(i)) {
            availableIndex = i;
            break;
          }
        }
        if (availableIndex === null) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Límite de jugadores alcanzado (no hay colores disponibles)'
          }));
          return;
        }
        ws.playerColorIndex = availableIndex;
        room.usedColorIndices.push(availableIndex);
        room.clients.push(ws);
        console.log(
          `Cliente ${ws.playerName} (ID: ${ws.playerId}) se unió a la sala: ${roomId}`
        );
        ws.send(
          JSON.stringify({
              type: "playerConnected",
              playerName: ws.playerName,
              playerId: ws.playerId,
          })
        );
        // Enviamos lista de jugadores actualizada a la sala
        broadcastPlayerList(roomId, data.name);
        break;
      
      case "addBot":
        // Verifica que el emisor sea el host
        if (ws.isHost && ws.roomId && rooms[ws.roomId]) {
          const room = rooms[ws.roomId];
          // Buscar el primer índice disponible
          let availableIndex = null;
          for (let i = 0; i < MAX_PLAYERS; i++) {
            if (!room.usedColorIndices.includes(i)) {
              availableIndex = i;
              break;
            }
          }
          if (availableIndex === null) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Límite de jugadores alcanzado (no hay colores disponibles)'
            }));
            return;
          }
          room.usedColorIndices.push(availableIndex);
          // Crea un objeto "falso" con forma de WebSocket
          // para representarlo en la lista de jugadores
          const botWS = {
            roomId: ws.roomId,
            isHost: false,
            playerId: uuidv4(),         // ID único para el bot
            playerName: data.botName || 'Bot',
            isBot: true,
            botDifficulty: data.botDifficulty || 'easy',
            playerColorIndex: availableIndex,
            readyState: WebSocket.OPEN, // Para simular que está "conectado"
            // Definimos una función send vacía, o un simple console.log
            send: (msg) => {
              console.log(`(BOT FAKE WS) ignoring send: ${msg}`);
            }
          };
          
          // Lo agregamos a la lista de clientes de la sala
          room.clients.push(botWS);
          
          console.log(`Bot agregado: ${botWS.playerName} (ID: ${botWS.playerId}) en sala ${ws.roomId}`);
          
          // Reenviamos la lista de jugadores actualizada
          broadcastPlayerList(ws.roomId, botWS.playerName, false);
        }
        break;

      case 'changeColor':
        if (!ws.roomId || !rooms[ws.roomId]) return;
        const roomForChange = rooms[ws.roomId];
        // Remover el índice anterior
        const oldColorIndex = roomForChange.clients.find(client => client.playerId === data.playerId)?.colorIndex
        roomForChange.usedColorIndices = roomForChange.usedColorIndices.filter(c => c !== oldColorIndex);
        ws.playerColorIndex = data.newColorIndex;
        roomForChange.usedColorIndices.push(data.newColorIndex);
        console.log(`Jugador ${ws.playerId} cambió a ColorIndex ${data.newColorIndex}`);
        broadcastPlayerList(ws.roomId);
        break;

      // Caso: startGame (host)
      case "startGame":
        if (ws.isHost && ws.roomId && rooms[ws.roomId]) {
          console.log(
            `Host ${ws.playerName} (ID: ${ws.playerId}) inicia juego en sala: ${ws.roomId}`
          );
          broadcastInRoom(ws.roomId, {type: "startGame"});
        }
        break;
      
      // Mensajes de señalización WebRTC
      case "offer":
      case "answer":
      case "candidate":
        handleWebRTCSignaling(ws, data);
        break;
      
      case "gameState":
        if (ws.roomId && rooms[ws.roomId]) {
          broadcastInRoom(ws.roomId, data);
        }
        break;
      
      case "input":
        if (!ws.isHost && ws.roomId && rooms[ws.roomId]) {
          const room = rooms[ws.roomId];
          if (room.host && room.host.readyState === WebSocket.OPEN) {
            room.host.send(message);
            console.log(
              `Reenviando input de ${ws.playerName} (ID: ${ws.playerId}) al host`
            );
          }
        }
        break;
      
      default:
        console.log(`Tipo de mensaje no manejado: ${data.type}`);
        break;
    }
  });
  
  ws.on("close", () => {
    console.log(`Cliente ${ws.playerName} (ID: ${ws.playerId}) desconectado`);
    if (ws.roomId && rooms[ws.roomId]) {
      if (ws.isHost) {
        console.log(
          `Host ${ws.playerName} (ID: ${ws.playerId}) se desconectó, cerrando sala: ${ws.roomId}`
        );
        rooms[ws.roomId].clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({type: "roomClosed"}));
          }
        });
        delete rooms[ws.roomId];
      } else {
        rooms[ws.roomId].clients = rooms[ws.roomId].clients.filter(
          (c) => c !== ws
        );
        broadcastPlayerList(ws.roomId, ws.playerName, true);
      }
    }
  });
});

// Funciones Auxiliares

// Envía la lista de jugadores (con ID y nombre) a la sala
function broadcastPlayerList(roomId, newPlayerName, disconnected = false) {
  const room = rooms[roomId];
  if (!room) return;
  
  const players = [];
  if (room.host) {
    players.push({
      id: room.host.playerId,
      name: room.host.playerName,
      colorIndex: room.host.playerColorIndex,
      isBot: room.host.isBot || false
    });
  }
  room.clients.forEach((client) => {
    players.push({
      id: client.playerId,
      name: client.playerName,
      colorIndex: client.playerColorIndex,
      isBot: client.isBot || false
    });
  });
  
  
  const msg = JSON.stringify({
    type: "playerList",
    players,
    roomId: roomId,
    newPlayerName: newPlayerName || '',
    disconnected: disconnected,
    showToast: !!newPlayerName
  });
  
  if (room.host && room.host.readyState === WebSocket.OPEN) {
    room.host.send(msg);
  }
  room.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(msg);
    }
  });
}

// Envía un mensaje JSON a todos en la sala
function broadcastInRoom(roomId, obj) {
  const room = rooms[roomId];
  if (!room) return;
  const message = JSON.stringify(obj);
  
  if (room.host && room.host.readyState === WebSocket.OPEN) {
    room.host.send(message);
  }
  room.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Manejo de señalización WebRTC
function handleWebRTCSignaling(ws, data) {
  const roomId = ws.roomId;
  if (!roomId || !rooms[roomId]) return;
  const room = rooms[roomId];
  
  if (ws.isHost) {
    room.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  } else {
    if (room.host && room.host.readyState === WebSocket.OPEN) {
      room.host.send(JSON.stringify(data));
    }
  }
}

function generateRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
