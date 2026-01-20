import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { Player, Room, WebSocketMessage } from '../../shared/types';

dotenv.config();

const PORT = process.env.PORT;
const server = http.createServer();
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Room>();
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

    if (!room.players.find(p => p.id === player.id) && room.playerCount < room.maxPlayers) {
        room.players.push(player);
    }

    room.playerCount = room.players.length;
    return room;
}

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message.toString()) as WebSocketMessage;

        switch (data.type) {
            case 'GET_ROOMS':
                ws.send(JSON.stringify({ type: 'ROOMS_LIST', rooms: getRooms() }));
                break;
            case 'JOIN_ROOM':
                const room = joinRoom(data.payload.roomName, data.payload.player);
                ws.send(JSON.stringify({ type: 'ROOM_JOINED', room }));
                break;
        };
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});