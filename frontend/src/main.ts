// frontend/src/main.ts

import "./styles/variables.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/canvas.css";
import "./styles/ui.css";
import "./styles/theme.css";

import {
  initCanvas,
  startRenderLoop,
  stopRenderLoop,
  updateCursor,
  addCursor,
  removeCursor,
  clearAllCursors,
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

// Initialize player ID
const playerId = localStorage.getItem("playerId") || crypto.randomUUID();
localStorage.setItem("playerId", playerId);

// Current room
let currentRoom: string | null = null;

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
          username: JSON.parse(localStorage.getItem("username") || '""'),
          x: 0,
          y: 0,
        },
      },
    }),
  );
});

// Checks for existing username in local storage, shows modal if not found, otherwise shows homepage.
if (localStorage.getItem("username")) {
  usernameModal.hidden = true;
  homepage.hidden = false;
} else {
  usernameModal.hidden = false;

  usernameButton.addEventListener("click", () => {
    const username = usernameField.value;
    if (username && username.length >= 3 && username.length <= 16) {
      localStorage.setItem("username", JSON.stringify(username));
      usernameField.value = "";
      usernameModal.hidden = true;
      homepage.hidden = false;
    }
  });
}

ws.addEventListener("open", () => {
  console.log(`Connected to WebSocket server at wss://${location.host}/ws`);
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
                  username: JSON.parse(
                    localStorage.getItem("username") || '""',
                  ),
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
      homepage.hidden = true;
      const roomView = document.getElementById("room-view") as HTMLDivElement;
      roomView.hidden = false;
      currentRoom = data.room.name;

      // Initialize canvas and start render loop
      initCanvas();
      startRenderLoop();

      // Update room info display
      const roomNameElement = document.getElementById("room-name") as HTMLDivElement;
      const roomPlayersElement = document.getElementById("room-players") as HTMLDivElement;
      const currentUsernameElement = document.getElementById("current-username") as HTMLDivElement;
      
      roomNameElement.textContent = data.room.name;
      roomPlayersElement.textContent = `${data.room.players.length} player${data.room.players.length !== 1 ? 's' : ''}`;
      currentUsernameElement.textContent = JSON.parse(localStorage.getItem("username") || '""');

      // Add existing players to cursor tracking
      for (const player of data.room.players) {
        if (player.id !== playerId) {
          addCursor(player.id, player.username);
        }
      }

      // Back button handler
      const backButton = document.getElementById("back-button") as HTMLButtonElement;
      backButton.onclick = () => {
        ws.send(JSON.stringify({
          type: "LEAVE_ROOM",
          payload: {
            roomName: currentRoom,
            playerId,
          },
        }));
      };

      roomView.addEventListener("mousemove", (event) => {
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

      addCursor(data.payload.playerId, data.payload.username);
      updateCursor(data.payload.playerId, data.payload.x, data.payload.y);
      break;
    }
    case "LEAVE_ROOM": {
      removeCursor(data.payload.player.id);
      
      if (data.payload.player.id === playerId) {
        // Current user left the room
        stopRenderLoop();
        const roomView = document.getElementById("room-view") as HTMLDivElement;
        roomView.hidden = true;
        homepage.hidden = false;
        ws.send(JSON.stringify({ type: "GET_ROOMS" }));
      }
      break;
    }
  }
});
