export interface Player {
    id: string;
    username: string;
    x: number;
    y: number;
}

export interface Room {
    name: string;
    playerCount: number;
    maxPlayers: number;
    players: Player[];
}

export type WebSocketMessage =
    | { type: 'GET_ROOMS' }
    | { type: 'JOIN_ROOM'; payload: { roomName: string; player: Player } }
    | { type: 'LEAVE_ROOM'; payload: { roomName: string; player: Player } }
    | { type: 'CURSOR_UPDATE'; payload: { roomName: string; playerId: string; x: number; y: number } }