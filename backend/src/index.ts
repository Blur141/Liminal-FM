import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

const ORIGINS = [
  'http://localhost:3000',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

const io = new Server(httpServer, {
  cors: { origin: ORIGINS, methods: ['GET', 'POST'], credentials: true },
});

app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json());

// ── Types ──────────────────────────────────────────────────────────────
interface Player {
  id: string;
  username: string;
  x: number;
  y: number;
  direction: string;
  currentStation: string | null;
  color: string;
}

interface StationMessage {
  id: string;
  stationId: string;
  username: string;
  color: string;
  text: string;
  timestamp: number;
}

// ── In-memory state ───────────────────────────────────────────────────
const players = new Map<string, Player>();
const stationMessages = new Map<string, StationMessage[]>();

const PLAYER_COLORS = [
  '#ff6b9d', '#c780ff', '#80d4ff', '#80ffb0',
  '#ffcc80', '#ff9580', '#80ffff', '#a8ff80',
  '#ff80c8', '#80c8ff', '#ffb380', '#b3ff80',
  '#d580ff', '#80ffd5', '#ffaa80', '#aaffee',
];
let colorIndex = 0;

const MAX_MSGS_PER_STATION = 25;
const VALID_EMOTES = new Set([
  '👋', '💃', '😴', '❤️', '🎵', '👻', '🎸',
  '✨', '🌧️', '🎷', '🕺', '🤘', '😎', '🎹', '🫀',
]);

// ── HTTP routes ───────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', players: players.size });
});

app.get('/messages/:stationId', (req, res) => {
  const msgs = stationMessages.get(req.params.stationId) ?? [];
  res.json(msgs);
});

// ── Socket.IO ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const color = PLAYER_COLORS[colorIndex++ % PLAYER_COLORS.length];

  const player: Player = {
    id: socket.id,
    username: 'Wanderer',
    x: 1200 + (Math.random() - 0.5) * 80,
    y: 900 + (Math.random() - 0.5) * 80,
    direction: 'down',
    currentStation: null,
    color,
  };
  players.set(socket.id, player);

  // Send full world state to newly connected player
  socket.emit('world:init', {
    playerId: socket.id,
    players: Array.from(players.values()),
    playerColor: color,
    spawnX: player.x,
    spawnY: player.y,
  });

  // Announce arrival to everyone else
  socket.broadcast.emit('player:joined', player);

  // ── Player movement ──────────────────────────────────────────────
  socket.on('player:update', (data: Partial<Player>) => {
    const p = players.get(socket.id);
    if (!p) return;
    if (typeof data.x === 'number') p.x = data.x;
    if (typeof data.y === 'number') p.y = data.y;
    if (typeof data.direction === 'string') p.direction = data.direction;
    if (data.currentStation !== undefined) p.currentStation = data.currentStation;
    if (typeof data.username === 'string') p.username = data.username.slice(0, 24);
    socket.broadcast.emit('player:moved', {
      id: socket.id,
      x: p.x, y: p.y,
      direction: p.direction,
      currentStation: p.currentStation,
      username: p.username,
    });
  });

  // ── Name change ──────────────────────────────────────────────────
  socket.on('player:setName', (username: unknown) => {
    const p = players.get(socket.id);
    if (!p || typeof username !== 'string') return;
    p.username = username.trim().slice(0, 24) || 'Wanderer';
    io.emit('player:renamed', { id: socket.id, username: p.username });
  });

  // ── Chat ─────────────────────────────────────────────────────────
  socket.on('chat:message', (message: unknown) => {
    const p = players.get(socket.id);
    if (!p || typeof message !== 'string' || !message.trim()) return;
    io.emit('chat:message', {
      id: socket.id,
      username: p.username,
      color: p.color,
      message: message.trim().slice(0, 200),
      timestamp: Date.now(),
    });
  });

  // ── Emotes ───────────────────────────────────────────────────────
  socket.on('emote', (emote: unknown) => {
    const p = players.get(socket.id);
    if (!p || typeof emote !== 'string' || !VALID_EMOTES.has(emote)) return;
    io.emit('player:emote', { id: socket.id, emote });
  });

  // ── Station message board ─────────────────────────────────────────
  socket.on('message:post', (data: unknown) => {
    const p = players.get(socket.id);
    if (!p) return;
    const d = data as { stationId?: unknown; text?: unknown };
    if (typeof d.stationId !== 'string' || typeof d.text !== 'string') return;
    const text = d.text.trim().slice(0, 140);
    if (!text) return;

    const msgs = stationMessages.get(d.stationId) ?? [];
    const msg: StationMessage = {
      id: Math.random().toString(36).slice(2, 9),
      stationId: d.stationId,
      username: p.username,
      color: p.color,
      text,
      timestamp: Date.now(),
    };
    msgs.unshift(msg);
    if (msgs.length > MAX_MSGS_PER_STATION) msgs.pop();
    stationMessages.set(d.stationId, msgs);
    io.emit('message:new', msg);
  });

  // ── Disconnect ───────────────────────────────────────────────────
  socket.on('disconnect', () => {
    players.delete(socket.id);
    io.emit('player:left', socket.id);
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => console.log(`🎙️  Liminal FM server on port ${PORT}`));
