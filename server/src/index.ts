import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import dotenv from "dotenv";
import { Player, Room, WebSocketMessage } from "../../shared/types";

dotenv.config();

const PORT = process.env.PORT;
const server = http.createServer();
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Room>();
const clientRooms = new Map<
  WebSocket,
  { playerId: string; roomName: string }
>();
const maxPlayers = 10;

function getRooms(): Room[] {
  return Array.from(rooms.values());
}

function joinRoom(roomName: string, player: Player): Room {
  let room = rooms.get(roomName);

  if (!room) {
    room = {
      name: roomName,
      playerCount: 0,
      maxPlayers,
      players: [],
    };
    rooms.set(roomName, room);
  }

  if (
    !room.players.find((p) => p.id === player.id) &&
    room.playerCount < room.maxPlayers
  ) {
    room.players.push(player);
  }

  room.playerCount = room.players.length;
  return room;
}

function broadcastRoomsList() {
  const roomsList = JSON.stringify({ type: "ROOMS_LIST", rooms: getRooms() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(roomsList);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
    const data = JSON.parse(message.toString()) as WebSocketMessage;

    switch (data.type) {
      case "GET_ROOMS": {
        ws.send(JSON.stringify({ type: "ROOMS_LIST", rooms: getRooms() }));
        break;
      }
      case "JOIN_ROOM": {
        const room = joinRoom(data.payload.roomName, data.payload.player);
        clientRooms.set(ws, {
          playerId: data.payload.player.id,
          roomName: data.payload.roomName,
        });
        ws.send(JSON.stringify({ type: "ROOM_JOINED", room }));
        broadcastRoomsList();
        break;
      }
      case "CURSOR_UPDATE": {
        const room = rooms.get(data.payload.roomName);

        if (!room) break;
        // Update player position
        const player = room.players.find((p) => p.id === data.payload.playerId);
        if (!player) break;

        player.x = data.payload.x;
        player.y = data.payload.y;

        // Broadcast cursor update to all clients in the room
        wss.clients.forEach((client) => {
          const clientInfo = clientRooms.get(client);
          console.log("Client info:", clientInfo);
          if (
            client.readyState === WebSocket.OPEN &&
            clientInfo?.roomName === data.payload.roomName
          ) {
            client.send(
              JSON.stringify({
                type: "CURSOR_UPDATE",
                payload: {
                  playerId: data.payload.playerId,
                  username: player.username,
                  x: data.payload.x,
                  y: data.payload.y,
                },
              }),
            );
          }
        });
        break;
      }
    }
  });

  ws.on("close", () => {
    const clientInfo = clientRooms.get(ws);
    if (clientInfo) {
      const room = rooms.get(clientInfo.roomName);
      const player = room?.players.find((p) => p.id === clientInfo.playerId);

      wss.clients.forEach((client) => {
        const info = clientRooms.get(client);
        if (
          client.readyState === WebSocket.OPEN &&
          info?.roomName === clientInfo.roomName
        ) {
          client.send(
            JSON.stringify({
              type: "LEAVE_ROOM",
              payload: {
                roomName: clientInfo.roomName,
                player: player || {
                  id: clientInfo.playerId,
                  username: "",
                  x: 0,
                  y: 0,
                },
              },
            }),
          );
        }
      });

      // Remove player from room
      if (room) {
        room.players = room.players.filter((p) => p.id !== clientInfo.playerId);
        room.playerCount = room.players.length;
      }
      clientRooms.delete(ws);
      broadcastRoomsList();
    }
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});
