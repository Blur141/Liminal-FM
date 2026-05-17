export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1800;
export const PLAYER_SPEED = 200;
export const SPAWN_X = 1200;
export const SPAWN_Y = 900;
export const POSITION_SYNC_MS = 50;
export const MESSAGE_BOARD_RADIUS = 130;

export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zoneRadius: number;
  color: number;
  accentHex: string;
  stream: string;
  desc: string;
  buildingType: 'cafe' | 'tower' | 'club' | 'apartment' | 'dome' | 'mall' | 'shack' | 'ruins';
  hidden?: boolean;     // No label until player walks inside zone
  nightOnly?: boolean;  // Only plays 22:00–05:00 local time
}

export const STATIONS: Station[] = [
  // ── Public stations ──────────────────────────────────────────────────
  {
    id: 'jazz-cafe',
    name: 'Jazz Café',
    x: 310, y: 290,
    width: 200, height: 160,
    zoneRadius: 210,
    color: 0xd4a056, accentHex: '#d4a056',
    stream: 'https://ice1.somafm.com/lush-128-mp3',
    desc: 'Lush · Indie & Chill',
    buildingType: 'cafe',
  },
  {
    id: 'rain-station',
    name: 'Rain Station',
    x: 1200, y: 210,
    width: 180, height: 200,
    zoneRadius: 200,
    color: 0x4e9eba, accentHex: '#4e9eba',
    stream: 'https://ice1.somafm.com/dronezone-128-mp3',
    desc: 'Drone Zone · Deep Space',
    buildingType: 'tower',
  },
  {
    id: 'neon-district',
    name: 'Neon District',
    x: 2050, y: 280,
    width: 240, height: 180,
    zoneRadius: 220,
    color: 0xab48d5, accentHex: '#ab48d5',
    stream: 'https://ice1.somafm.com/groovesalad-128-mp3',
    desc: 'Groove Salad · Ambient Electronic',
    buildingType: 'club',
  },
  {
    id: 'lofi-lounge',
    name: 'Lo-Fi Lounge',
    x: 270, y: 900,
    width: 160, height: 260,
    zoneRadius: 200,
    color: 0x5b8fa8, accentHex: '#5b8fa8',
    stream: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    desc: 'Sonic Universe · Jazz Fusion',
    buildingType: 'apartment',
  },
  {
    id: 'desert-radio',
    name: 'Desert Radio',
    x: 2060, y: 890,
    width: 200, height: 180,
    zoneRadius: 210,
    color: 0xe8a24a, accentHex: '#e8a24a',
    stream: 'https://ice1.somafm.com/secretagent-128-mp3',
    desc: 'Secret Agent · Spy Jazz',
    buildingType: 'dome',
  },
  {
    id: 'vaporwave-mall',
    name: 'Vaporwave Mall',
    x: 1200, y: 1490,
    width: 320, height: 200,
    zoneRadius: 240,
    color: 0xe040fb, accentHex: '#e040fb',
    stream: 'https://ice1.somafm.com/suburbsofgoa-128-mp3',
    desc: 'Suburbs of Goa · Psychedelic',
    buildingType: 'mall',
  },

  // ── Hidden pirate station ─────────────────────────────────────────────
  {
    id: 'pirate-radio',
    name: '??? Pirate Radio',
    x: 360, y: 1490,
    width: 100, height: 80,
    zoneRadius: 120,
    color: 0xff4444, accentHex: '#ff4444',
    stream: 'https://ice1.somafm.com/beatblender-128-mp3',
    desc: '🏴‍☠️ Beat Blender · Discovered!',
    buildingType: 'shack',
    hidden: true,
  },

  // ── Midnight-only station ─────────────────────────────────────────────
  {
    id: 'midnight-club',
    name: 'The Midnight Hour',
    x: 1930, y: 1460,
    width: 180, height: 140,
    zoneRadius: 180,
    color: 0x4455ff, accentHex: '#4455ff',
    stream: 'https://ice1.somafm.com/illstreet-128-mp3',
    desc: '🌙 Ill Street Blues · Night Only',
    buildingType: 'ruins',
    nightOnly: true,
  },
];

// World color palette
export const COLORS = {
  ground:       0x0d0d1a,
  road:         0x161626,
  sidewalk:     0x1e1e32,
  plaza:        0x1a1a2e,
  plazaAccent:  0x22223a,
  treeTrunk:    0x4a3010,
  lampPost:     0x8888aa,
  lampLight:    0xffffaa,
  ruins:        0x0a0a12,
  ruinsWall:    0x1a1220,
};

export const EMOTES = ['👋', '💃', '😴', '❤️', '🎵', '👻', '🎸', '✨', '🌧️', '🎷', '🕺', '🤘', '😎', '🎹', '🫀'];
