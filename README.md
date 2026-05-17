```
██╗     ██╗███╗   ███╗██╗███╗   ██╗ █████╗ ██╗         ███████╗███╗   ███╗
██║     ██║████╗ ████║██║████╗  ██║██╔══██╗██║         ██╔════╝████╗ ████║
██║     ██║██╔████╔██║██║██╔██╗ ██║███████║██║         █████╗  ██╔████╔██║
██║     ██║██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║         ██╔══╝  ██║╚██╔╝██║
███████╗██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗    ██║     ██║ ╚═╝ ██║
╚══════╝╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝     ╚═╝
```

<div align="center">

**An interactive internet radio world. Walk through a living pixel-art city and let the music find you.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Phaser](https://img.shields.io/badge/Phaser-3.60-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PC9zdmc+)](https://phaser.io)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-white?logo=socket.io)](https://socket.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)

[**Play now →**](#) · [Report a bug](../../issues) · [Request a feature](../../issues)

</div>

---

## What is this?

Liminal FM is a browser-based multiplayer world where you walk through a procedurally-rendered pixel-art city and discover live internet radio stations by entering buildings. The radio fades in as you approach, fades out as you leave. Other players wander the same streets in real time.

No accounts. No feeds. No ads. Just music and the feeling of being somewhere.

---

## Features

### World
- **2400 × 1800 pixel city** — nine distinct districts rendered entirely in Phaser's Graphics API (no sprites needed)
- **Live day/night cycle** — eight lighting periods driven by your local clock; the world darkens, windows glow amber, lamp posts shimmer
- **Synchronized weather** — rain shifts every five minutes globally; all players experience the same weather simultaneously
- **Animated details** — blinking windows, neon signs, lamp halos, lamp flickering

### Audio
- **8 live radio streams** — all SomaFM, zero ads, diverse genres
- **Proximity fade** — quadratic volume falloff based on your distance from each station's broadcast zone
- **Hidden pirate station** — unmarked on the map; you'll know it when you find it
- **Night-only station** — The Midnight Hour only broadcasts 22:00–05:00 local time; the ruins district transforms at midnight

### Social
- **Real-time multiplayer** — see other players move and chat live via Socket.IO
- **Emote system** — 15 emotes that float above your character with animation
- **Message boards** — leave notes at any station; messages persist for everyone in the same session
- **Ghost players** — disconnected players fade out gracefully over 8 seconds instead of popping out

### Mobile
- **Virtual joystick** — auto-renders on touch devices; thumb-friendly 80px stick
- **Bottom sheet panels** — emote picker, settings, and message board slide up from the bottom on mobile
- **Safe area aware** — respects iOS notch and home indicator via `env(safe-area-inset-*)`
- **No zoom lock** — canvas is `touch-action: none`; UI buttons are `manipulation`

---

## The World

```
┌─────────────────────────────────────────────────────────────────┐
│                          LIMINAL FM                             │
│  2400 × 1800  ·  nine districts  ·  eight stations             │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ JAZZ     │    │  RAIN        │    │  NEON        │          │
│  │ QUARTER  │    │  DISTRICT    │    │  DISTRICT    │          │
│  │ ♪ Lush   │    │ ♪ DroneZone  │    │ ♪ GrooveSalad│          │
│  └──────────┘    └──────────────┘    └──────────────┘          │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ LO-FI    │    │   CENTRAL    │    │  DESERT      │          │
│  │ BOROUGH  │    │    PLAZA     │    │  OUTPOST     │          │
│  │♪ SonicUni│    │  [spawn pt]  │    │ ♪ SecretAgent│          │
│  └──────────┘    └──────────────┘    └──────────────┘          │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  ???     │    │  VAPORWAVE   │    │  RUINS       │          │
│  │  PIRATE  │    │    MALL      │    │  DISTRICT    │          │
│  │ ♪ hidden │    │ ♪ SuburbsGoa │    │♪ [midnight]  │          │
│  └──────────┘    └──────────────┘    └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Radio Stations

| Station | Building | Genre | Stream | Notes |
|---------|----------|-------|--------|-------|
| Jazz Café | Café (NW) | Indie & Chill | SomaFM / Lush | |
| Rain Station | Tower (N) | Deep Space Drone | SomaFM / Drone Zone | |
| Neon District | Club (NE) | Ambient Electronic | SomaFM / Groove Salad | |
| Lo-Fi Lounge | Apartment (W) | Jazz Fusion | SomaFM / Sonic Universe | |
| Desert Radio | Dome (E) | Spy Jazz | SomaFM / Secret Agent | |
| Vaporwave Mall | Mall (S) | Psychedelic Trance | SomaFM / Suburbs of Goa | |
| ??? Pirate Radio | Shack (SW) | Electronic | SomaFM / Beat Blender | Hidden — no map marker |
| The Midnight Hour | Ruins (SE) | Jazz & Blues | SomaFM / Ill Street Blues | Night only (22:00–05:00) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
git clone https://github.com/your-username/liminal-fm.git
cd liminal-fm

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Run locally

```bash
# Terminal 1 — backend (port 3001)
cd backend
npm run dev

# Terminal 2 — frontend (port 3000)
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend connects to `http://localhost:3001` by default. To change this, set:

```bash
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

---

## Controls

### Keyboard

| Key | Action |
|-----|--------|
| `W A S D` / `↑ ↓ ← →` | Move |
| `Z` | Open emote picker |
| `F` | Open message board (when near a station) |
| `Enter` | Open chat |
| `Escape` | Close any open panel |
| `M` | Toggle mute |

### Mouse / Touch

| Action | Effect |
|--------|--------|
| Click minimap | Teleport camera (not player) |
| Tap 📋 button | Open message board |
| Virtual joystick (touch) | Move player |
| Tap emote button | Open emote picker |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend framework | Next.js 14 (App Router) | Routing, SSR shell, Vercel deployment |
| Game engine | Phaser 3.60 | Canvas rendering, physics, input |
| Multiplayer | Socket.IO 4 | Real-time position sync, chat, emotes |
| Styling | Tailwind CSS 3 | HUD layout, panels, responsive design |
| Audio | HTML5 Audio API | Stream playback with volume lerp |
| Backend | Node.js + Express | WebSocket server, message persistence |
| Language | TypeScript 5 | End-to-end type safety |

---

## Project Structure

```
liminal-fm/
├── backend/
│   ├── src/
│   │   └── index.ts          # Express + Socket.IO server
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx    # Root layout, viewport meta, fonts
    │   │   ├── page.tsx      # Landing page
    │   │   └── game/
    │   │       └── page.tsx  # Game page (loads GameCanvas)
    │   ├── components/
    │   │   ├── GameCanvas.tsx      # Main HUD shell + Phaser bootstrap
    │   │   ├── EmotePicker.tsx     # Emote grid (bottom sheet / popup)
    │   │   ├── MessageBoard.tsx    # Station message board panel
    │   │   └── SettingsPanel.tsx   # Volume, zoom, key reference
    │   └── game/
    │       ├── constants.ts        # Station definitions, world constants
    │       ├── AudioManager.ts     # Stream control, proximity volume
    │       ├── MultiplayerManager.ts  # Socket.IO client wrapper
    │       ├── WeatherSystem.ts    # Synchronized rain particles
    │       ├── DayNightCycle.ts    # Time periods, overlay colors
    │       └── scenes/
    │           └── MainScene.ts    # Phaser scene: world, players, input
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## Architecture Notes

### Phaser + Next.js SSR
Phaser requires a browser environment. `GameCanvas` is loaded with `dynamic(() => import(...), { ssr: false })` and initialises Phaser via `await import('phaser')` inside a `useEffect`. This prevents any server-side execution.

### Scene ↔ React communication
The Phaser scene exposes typed callback properties (`onStationChanged`, `onChatMessage`, etc.) that React sets before passing the scene to `new Phaser.Game(...)`. React calls public scene methods (`sendChat`, `setVolume`, `setZoom`) for the reverse direction.

### Proximity audio
Each frame, `AudioManager.update(playerX, playerY)` calculates distance to every station's broadcast centre. Volume uses quadratic falloff: `vol = (1 - dist/radius)²`. This gives a smooth natural curve — loud at the centre, silent at the edge.

### Weather sync
All clients compute `Math.floor(Date.now() / 300000) % 4` independently. Because everyone uses the same epoch, they always get the same weather index without any server coordination.

### Ghost players
When a disconnect event arrives, the player container is not removed immediately. Its alpha tweens from `0.6` to `0` over 8 seconds. This prevents jarring pops when someone briefly drops connection.

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set environment variable in Vercel dashboard:

```
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

### Backend → Railway

1. Create a new Railway project and connect the `backend/` directory.
2. Railway auto-detects Node.js; set the start command:
   ```
   npm run start
   ```
3. Add environment variable:
   ```
   PORT=3001
   ```
4. Copy the Railway deployment URL and set it in Vercel as `NEXT_PUBLIC_BACKEND_URL`.

---

## Roadmap

### Phase 1 — Core World ✅
- [x] Procedural pixel-art city (9 districts)
- [x] WASD player movement
- [x] Real-time multiplayer via Socket.IO
- [x] 6 public radio zones with proximity audio

### Phase 2 — Atmosphere ✅
- [x] Day/night cycle (8 time periods)
- [x] Synchronized rain weather system
- [x] Animated windows, neon signs, lamp flicker
- [x] Night overlay with smooth transitions

### Phase 3 — Social & Secrets ✅
- [x] Emote system (15 emotes with floating animation)
- [x] Station message boards
- [x] Ghost player disconnect effect
- [x] Hidden pirate radio station
- [x] Midnight-only station (The Midnight Hour)

### Phase 4 — Mobile & Polish ✅
- [x] Virtual joystick for touch devices
- [x] Responsive HUD (bottom sheets on mobile)
- [x] Safe area support (iOS notch / home bar)
- [x] Adaptive camera zoom by screen size

### Phase 5 — Future 🔲
- [ ] Persistent message boards (PostgreSQL / Supabase)
- [ ] Username persistence (localStorage)
- [ ] Player count heatmap overlay
- [ ] Additional districts and stations
- [ ] Custom station URLs (user-submitted streams)
- [ ] Ambient sound layers per district (rain SFX, crowd murmur)

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-idea`)
3. Commit your changes
4. Open a pull request

---

## Credits

- **Radio streams** — [SomaFM](https://somafm.com) — listener-supported, commercial-free
- **Fonts** — [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) · [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono)
- **Inspiration** — every late-night drive with the radio on and no destination

---

## License

MIT — do whatever you want, just don't sell it back to SomaFM.

---

<div align="center">

*Made with static electricity and SomaFM.*

</div>
