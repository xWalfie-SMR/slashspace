// frontend/src/main.ts

// Initialize WebSocket connection
const ws = new WebSocket(`ws://${location.host}/ws`);

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
const createRoomButton = document.getElementById("create-room") as HTMLButtonElement;

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
    })
  );
});

// Initialize player ID
const playerId = localStorage.getItem("playerId") || crypto.randomUUID();
localStorage.setItem("playerId", playerId);

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
  console.log(`Connected to WebSocket server at ws://${location.host}/ws`);
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
    case "ROOM_JOINED":
      homepage.hidden = true;
      const roomView = document.getElementById("room-view") as HTMLDivElement;
      roomView.hidden = false;
      break;
  }
});
