// frontend/src/main.ts

import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/canvas.css';
import './styles/ui.css';
import './styles/theme.css';

import {
  initCanvas,
  startRenderLoop,
  stopRenderLoop,
  addCursor,
  updateCursor,
  removeCursor,
  clearAllCursors,
  getCursorData,
} from "./cursors";

// Initialize WebSocket connection
const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${protocol}//${location.host}/ws`);

// Username modal elements
const usernameModal = document.getElementById(
  "username-modal",
) as HTMLDivElement;
const usernameField = document.getElementById("username") as HTMLInputElement;
const usernameButton = document.getElementById(
  "submit-username",
) as HTMLButtonElement;

// Homepage element
const homepage = document.getElementById("homepage") as HTMLDivElement;

// Room list element
const roomList = document.getElementById("rooms-list") as HTMLUListElement;

// Create Room button
const createRoomButton = document.getElementById(
  "create-room",
) as HTMLButtonElement;

// Room view elements
const roomView = document.getElementById("room-view") as HTMLDivElement;
const backButton = document.getElementById("back-to-home") as HTMLButtonElement;
const infoRoomName = document.getElementById("info-room-name") as HTMLSpanElement;
const infoPlayerCount = document.getElementById("info-player-count") as HTMLSpanElement;
const infoUsername = document.getElementById("info-username") as HTMLSpanElement;

// Initialize player ID
const playerId = localStorage.getItem("playerId") || crypto.randomUUID();
localStorage.setItem("playerId", playerId);

// Current room
let currentRoom: string | null = null;
let currentUsername: string = JSON.parse(localStorage.getItem("username") || '""');

function updateRoomInfo(roomName: string, playerCount: number) {
  if (infoRoomName) infoRoomName.textContent = roomName;
  if (infoPlayerCount) infoPlayerCount.textContent = playerCount.toString();
  if (infoUsername) infoUsername.textContent = currentUsername;
}

// Add click handler for Create Room
createRoomButton.addEventListener("click", () => {
  const roomName = prompt("Enter a room name:");
  if (!roomName || roomName.trim().length < 3) return;
  ws.send(
    JSON.stringify({
      type: "JOIN_ROOM",
      payload: {
        roomName: roomName.trim(),
        player: {
          id: playerId,
          username: currentUsername,
          x: 0,
          y: 0,
        },
      },
    }),
  );
});

// Back to home handler
backButton.addEventListener("click", () => {
  // In a real app, we might send a LEAVE_ROOM message
  // For now, we'll just reload or hide the room view
  roomView.hidden = true;
  homepage.hidden = false;
  currentRoom = null;
  stopRenderLoop();
  clearAllCursors();
  // We should also probably tell the server, but current server only handles close
  // Let's just disconnect and reconnect to keep it simple and consistent with server logic
  // ws.close(); 
  // Actually, better to just let it be for now or refresh.
  location.reload(); 
});

// Checks for existing username in local storage, shows modal if not found, otherwise shows homepage.
if (currentUsername) {
  usernameModal.hidden = true;
  homepage.hidden = false;
} else {
  usernameModal.hidden = false;

  usernameButton.addEventListener("click", () => {
    const username = usernameField.value;
    if (username && username.length >= 3 && username.length <= 16) {
      currentUsername = username;
      localStorage.setItem("username", JSON.stringify(username));
      usernameField.value = "";
      usernameModal.hidden = true;
      homepage.hidden = false;
    }
  });
}

ws.addEventListener("open", () => {
  console.log(`Connected to WebSocket server`);
  ws.send(JSON.stringify({ type: "GET_ROOMS" }));
});

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case "ROOMS_LIST":
      roomList.innerHTML = "";
      for (const room of data.rooms) {
        const roomItem = document.createElement("li");
        roomItem.textContent = room.name;
        roomItem.addEventListener("click", () => {
          ws.send(
            JSON.stringify({
              type: "JOIN_ROOM",
              payload: {
                roomName: room.name,
                player: {
                  id: playerId,
                  username: currentUsername,
                  x: 0,
                  y: 0,
                },
              },
            }),
          );
        });
        roomList.appendChild(roomItem);
      }
      break;
    case "ROOM_JOINED": {
      clearAllCursors();
      initCanvas();
      startRenderLoop();
      
      homepage.hidden = true;
      roomView.hidden = false;
      currentRoom = data.room.name;
      
      // Initial players
      data.room.players.forEach((p: any) => {
        if (p.id !== playerId) {
          addCursor(p.id, p.username);
        }
      });
      
      updateRoomInfo(data.room.name, data.room.playerCount);

      roomView.addEventListener("mousemove", (event) => {
        if (!currentRoom) return;
        ws.send(
          JSON.stringify({
            type: "CURSOR_UPDATE",
            payload: {
              roomName: currentRoom,
              playerId,
              x: event.clientX,
              y: event.clientY,
            },
          }),
        );
      });
      break;
    }
    case "CURSOR_UPDATE": {
      if (data.payload.playerId === playerId) break;
      if (!currentRoom) break;

      const beforeSize = getCursorData().size;
      addCursor(data.payload.playerId, data.payload.username);
      const afterSize = getCursorData().size;
      
      if (beforeSize !== afterSize) {
        if (infoPlayerCount) infoPlayerCount.textContent = (afterSize + 1).toString();
      }
      
      updateCursor(data.payload.playerId, data.payload.x, data.payload.y);
      break;
    }
    case "LEAVE_ROOM": {
      if (data.payload.player.id === playerId) {
        stopRenderLoop();
      } else {
        removeCursor(data.payload.player.id);
        const count = getCursorData().size + 1;
        if (infoPlayerCount) infoPlayerCount.textContent = count.toString();
      }
      break;
    }
  }
});
