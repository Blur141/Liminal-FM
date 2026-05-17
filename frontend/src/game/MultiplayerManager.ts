import { io, Socket } from 'socket.io-client';

export interface RemotePlayer {
  id: string;
  username: string;
  x: number;
  y: number;
  direction: string;
  currentStation: string | null;
  color: string;
  targetX?: number;
  targetY?: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  color: string;
  message: string;
  timestamp: number;
}

export interface StationMessage {
  id: string;
  stationId: string;
  username: string;
  color: string;
  text: string;
  timestamp: number;
}

export interface WorldInitData {
  playerId: string;
  players: RemotePlayer[];
  playerColor: string;
  spawnX: number;
  spawnY: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export class MultiplayerManager {
  private socket: Socket;
  private playerId = '';
  private lastSent = 0;

  onWorldInit?: (data: WorldInitData) => void;
  onPlayerJoined?: (player: RemotePlayer) => void;
  onPlayerMoved?: (data: Partial<RemotePlayer> & { id: string }) => void;
  onPlayerLeft?: (id: string) => void;
  onPlayerRenamed?: (data: { id: string; username: string }) => void;
  onChatMessage?: (msg: ChatMessage) => void;
  onPlayerEmote?: (data: { id: string; emote: string }) => void;
  onMessageNew?: (msg: StationMessage) => void;

  constructor() {
    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('world:init', (data: WorldInitData) => {
      this.playerId = data.playerId;
      this.onWorldInit?.(data);
    });
    this.socket.on('player:joined',   (p: RemotePlayer) => this.onPlayerJoined?.(p));
    this.socket.on('player:moved',    (d: Partial<RemotePlayer> & { id: string }) => this.onPlayerMoved?.(d));
    this.socket.on('player:left',     (id: string) => this.onPlayerLeft?.(id));
    this.socket.on('player:renamed',  (d: { id: string; username: string }) => this.onPlayerRenamed?.(d));
    this.socket.on('chat:message',    (msg: ChatMessage) => this.onChatMessage?.(msg));
    this.socket.on('player:emote',    (d: { id: string; emote: string }) => this.onPlayerEmote?.(d));
    this.socket.on('message:new',     (msg: StationMessage) => this.onMessageNew?.(msg));
  }

  sendPosition(x: number, y: number, direction: string, currentStation: string | null) {
    const now = Date.now();
    if (now - this.lastSent < 50) return;
    this.lastSent = now;
    this.socket.emit('player:update', { x, y, direction, currentStation });
  }

  setUsername(username: string) {
    this.socket.emit('player:setName', username);
  }

  sendChat(message: string) {
    this.socket.emit('chat:message', message);
  }

  sendEmote(emote: string) {
    this.socket.emit('emote', emote);
  }

  postMessage(stationId: string, text: string) {
    this.socket.emit('message:post', { stationId, text });
  }

  async fetchMessages(stationId: string): Promise<StationMessage[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/messages/${stationId}`);
      return (await res.json()) as StationMessage[];
    } catch {
      return [];
    }
  }

  get id() { return this.playerId; }
  get connected() { return this.socket.connected; }

  destroy() { this.socket.disconnect(); }
}
