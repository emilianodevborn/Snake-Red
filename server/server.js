// server.js
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

// Estructura de datos para salas
// rooms = {
//   roomId1: {
//     host: WebSocket | null,
//     clients: [ WebSocket, WebSocket, ... ]
//   },
//   ...
// }
const rooms = {};

const wss = new WebSocket.Server({ port: 8080 }, () => {
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
        // Genera un ID de sala
        const newRoomId = generateRoomId();
        rooms[newRoomId] = {
          host: ws,
          clients: [],
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
          })
        );
        break;

      // Caso: unirse a sala existente (cliente)
      case "joinRoom":
        const { roomId } = data;
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
        rooms[roomId].clients.push(ws);
        console.log(
          `Cliente ${ws.playerName} (ID: ${ws.playerId}) se unió a la sala: ${roomId}`
        );

        // Enviamos lista de jugadores actualizada a la sala
        broadcastPlayerList(roomId);
        break;

      // Caso: startGame (host)
      case "startGame":
        if (ws.isHost && ws.roomId && rooms[ws.roomId]) {
          console.log(
            `Host ${ws.playerName} (ID: ${ws.playerId}) inicia juego en sala: ${ws.roomId}`
          );
          broadcastInRoom(ws.roomId, { type: "startGame" });
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
            client.send(JSON.stringify({ type: "roomClosed" }));
            client.close();
          }
        });
        delete rooms[ws.roomId];
      } else {
        rooms[ws.roomId].clients = rooms[ws.roomId].clients.filter(
          (c) => c !== ws
        );
        broadcastPlayerList(ws.roomId);
      }
    }
  });
});

// Funciones Auxiliares

// Envía la lista de jugadores (con ID y nombre) a la sala
function broadcastPlayerList(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const players = [];
  if (room.host) {
    players.push({ id: room.host.playerId, name: room.host.playerName });
  }
  room.clients.forEach((client) => {
    players.push({ id: client.playerId, name: client.playerName });
  });

  const msg = JSON.stringify({
    type: "playerList",
    players,
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
