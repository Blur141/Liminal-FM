import * as Phaser from 'phaser';
import {
  WORLD_WIDTH, WORLD_HEIGHT, PLAYER_SPEED, SPAWN_X, SPAWN_Y,
  STATIONS, COLORS, MESSAGE_BOARD_RADIUS, Station,
} from '../constants';
import { AudioManager } from '../AudioManager';
import { MultiplayerManager, RemotePlayer, ChatMessage, StationMessage } from '../MultiplayerManager';
import { WeatherSystem } from '../WeatherSystem';
import { DayNightCycle, TimeInfo } from '../DayNightCycle';

// ── Types ─────────────────────────────────────────────────────────────
type OtherPlayerSprite = {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  nametag: Phaser.GameObjects.Text;
  data: RemotePlayer;
};

// ── Helpers ───────────────────────────────────────────────────────────
function hexDarken(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >> 8)  & 0xff) * factor);
  const b = Math.floor((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

// ── Scene ─────────────────────────────────────────────────────────────
export class MainScene extends Phaser.Scene {
  // Core systems
  private audio = new AudioManager();
  private multiplayer!: MultiplayerManager;
  private weather!: WeatherSystem;
  private dayNight = new DayNightCycle();

  // Player
  private playerContainer!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Arc;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  // Mobile joystick
  private joyBase?: Phaser.GameObjects.Arc;
  private joyStick?: Phaser.GameObjects.Arc;
  private joyActive = false;
  private joyOrigin = { x: 0, y: 0 };
  private joyVector = { x: 0, y: 0 };

  // World
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private windowLights: Array<{ rect: Phaser.GameObjects.Rectangle; baseAlpha: number }> = [];
  private midnightBuildingLights: Phaser.GameObjects.Rectangle[] = [];
  private lastTimeInfo!: TimeInfo;

  // Remote players
  private otherPlayers = new Map<string, OtherPlayerSprite>();

  // State
  private playerColor = '#c780ff';
  private playerUsername = 'Wanderer';
  private currentStation: Station | null = null;
  private nearStation: Station | null = null;
  private lastDirection = 'down';
  private lastPosSent = { x: 0, y: 0 };

  // Public config (set by React before scene starts)
  username?: string;

  // Callbacks → React
  onStationChanged?: (s: Station | null) => void;
  onNearStationChanged?: (s: Station | null) => void;
  onChatMessage?: (msg: ChatMessage) => void;
  onPlayersUpdate?: (count: number) => void;
  onTimeChanged?: (info: TimeInfo) => void;
  onWeatherChanged?: (state: string) => void;
  onEmotePickerRequest?: () => void;
  onMessageBoardOpen?: (station: Station) => void;
  onStationDiscovered?: (station: Station) => void;
  onMessageNew?: (msg: StationMessage) => void;

  constructor() { super({ key: 'MainScene' }); }

  // ── Lifecycle ───────────────────────────────────────────────────────
  create() {
    this.cameras.main.setBackgroundColor(COLORS.ground);

    this.buildWorld();
    this.createPlayer();
    this.setupInput();
    this.setupCamera();
    this.audio.init();
    this.audio.onStationDiscovered = (s) => this.onStationDiscovered?.(s);
    this.setupMultiplayer();
    this.setupWindowFlicker();
    this.setupNightOverlay();
    this.setupMobileControls();

    // Weather (after scene is fully created so texture generation works)
    this.weather = new WeatherSystem(this);
    this.onWeatherChanged?.(this.weather.getState());

    // Day/night initial apply
    this.applyDayNight();
    // Update every real minute
    this.time.addEvent({ delay: 60_000, loop: true, callback: () => this.applyDayNight() });
  }

  update() {
    this.handleMovement();
    this.interpolateOtherPlayers();
    this.detectNearStation();
    this.audio.update(this.playerContainer.x, this.playerContainer.y);

    const active = this.audio.getActiveStation();
    if (active?.id !== this.currentStation?.id) {
      this.currentStation = active ?? null;
      this.onStationChanged?.(this.currentStation);
    }

    this.multiplayer?.sendPosition(
      this.playerContainer.x,
      this.playerContainer.y,
      this.lastDirection,
      this.currentStation?.id ?? null,
    );
  }

  // ── World builder ───────────────────────────────────────────────────
  private buildWorld() {
    const g = this.add.graphics();

    // Ground
    g.fillStyle(COLORS.ground);
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Main road grid
    g.fillStyle(COLORS.road);
    g.fillRect(780, 0, 56, WORLD_HEIGHT);
    g.fillRect(1564, 0, 56, WORLD_HEIGHT);
    g.fillRect(0, 580, WORLD_WIDTH, 56);
    g.fillRect(0, 1164, WORLD_WIDTH, 56);

    // Sidewalks
    g.fillStyle(COLORS.sidewalk);
    [756, 836, 1540, 1620].forEach(x => g.fillRect(x, 0, 24, WORLD_HEIGHT));
    [556, 636, 1140, 1220].forEach(y => g.fillRect(0, y, WORLD_WIDTH, 24));

    // ── Block fills ──────────────────────────────────────────────────
    // Give each block a slightly distinct tint
    const blocks: [number, number, number, number, number][] = [
      [0,    0,    780, 580,  0x111120], // TL - Jazz
      [836,  0,    728, 580,  0x0d1118], // TC - Rain
      [1620, 0,    780, 580,  0x120d18], // TR - Neon
      [0,    636,  780, 528,  0x0d1118], // ML - LoFi
      [836,  636,  728, 528,  0x0e0e1a], // MC - Plaza
      [1620, 636,  780, 528,  0x131008], // MR - Desert
      [0,    1220, 780, 580,  0x080c08], // BL - Ruins/Pirate
      [836,  1220, 728, 580,  0x110a16], // BC - Vaporwave
      [1620, 1220, 780, 580,  0x080810], // BR - Ruins/Midnight
    ];
    blocks.forEach(([x, y, w, h, c]) => { g.fillStyle(c); g.fillRect(x, y, w, h); });

    // ── Plaza ────────────────────────────────────────────────────────
    g.fillStyle(COLORS.plaza);
    g.fillRect(854, 664, 380, 380);
    g.fillStyle(COLORS.plazaAccent);
    for (let px = 854; px < 1234; px += 40)
      for (let py = 664; py < 1044; py += 40)
        g.fillRect(px + 2, py + 2, 36, 36);

    // Fountain
    g.fillStyle(0x1a2a4a); g.fillCircle(SPAWN_X, SPAWN_Y, 50);
    g.fillStyle(0x2a4a8a); g.fillCircle(SPAWN_X, SPAWN_Y, 34);
    g.fillStyle(0x4a8acc); g.fillCircle(SPAWN_X, SPAWN_Y, 18);
    g.fillStyle(0xaaccff); g.fillCircle(SPAWN_X, SPAWN_Y, 7);

    // ── Internet ruins (BL + BR bottom strip) ────────────────────────
    this.drawRuins(g);

    // ── Zone glows ───────────────────────────────────────────────────
    for (const station of STATIONS) this.drawZoneGlow(g, station);

    // ── Buildings ────────────────────────────────────────────────────
    for (const station of STATIONS) this.drawBuilding(station);

    // ── Decorations ──────────────────────────────────────────────────
    this.drawDecor(g);
  }

  private drawRuins(g: Phaser.GameObjects.Graphics) {
    // BL ruins — overgrown area around pirate station
    const ruinRects: [number, number, number, number][] = [
      [100, 1260, 120, 80],  [280, 1280, 80, 100],
      [160, 1380, 100, 60],  [60,  1450, 90,  80],
      [500, 1300, 110, 70],  [620, 1420, 80,  100],
      [120, 1620, 140, 80],  [400, 1560, 100, 90],
    ];
    ruinRects.forEach(([x, y, w, h]) => {
      g.fillStyle(COLORS.ruins);      g.fillRect(x, y, w, h);
      g.fillStyle(COLORS.ruinsWall);  g.fillRect(x, y, w, 8);
      g.fillStyle(0x0a1008, 0.5);     g.fillRect(x + 6, y + 6, 16, 12);
    });

    // BR ruins — Internet ruins zone
    const brRuins: [number, number, number, number][] = [
      [1680, 1270, 100, 70],  [1820, 1290, 90, 110],
      [1700, 1400, 120, 80],  [1900, 1370, 80, 60],
      [2100, 1280, 110, 90],  [2260, 1320, 80, 60],
      [2050, 1430, 90,  70],  [2200, 1500, 120, 80],
    ];
    brRuins.forEach(([x, y, w, h]) => {
      g.fillStyle(COLORS.ruins);      g.fillRect(x, y, w, h);
      g.fillStyle(COLORS.ruinsWall);  g.fillRect(x, y, w, 8);
      // Dead screen
      g.fillStyle(0x020310); g.fillRect(x + 10, y + 12, 28, 20);
      g.lineStyle(1, 0x222244, 0.4);  g.strokeRect(x + 10, y + 12, 28, 20);
    });

    // CRT screen details
    const screens: [number, number][] = [
      [1690, 1282], [1840, 1303], [2110, 1294], [2270, 1334],
    ];
    screens.forEach(([sx, sy]) => {
      g.fillStyle(0x002244, 0.6); g.fillRect(sx, sy, 28, 20);
      g.fillStyle(0x0044aa, 0.2); g.fillRect(sx + 2, sy + 2, 10, 6);
    });
  }

  private drawZoneGlow(g: Phaser.GameObjects.Graphics, station: Station) {
    if (station.nightOnly) return; // Drawn separately in night overlay logic
    const steps = 6;
    for (let i = steps; i >= 1; i--) {
      const r = station.zoneRadius * (i / steps);
      const a = 0.06 * (1 - i / (steps + 1));
      g.fillStyle(station.color, a);
      g.fillCircle(station.x, station.y, r);
    }
    g.lineStyle(1, station.color, 0.12);
    g.strokeCircle(station.x, station.y, station.zoneRadius);
  }

  private drawBuilding(station: Station) {
    const g = this.add.graphics();
    const { x, y, width, height, color } = station;
    const bx = x - width / 2;
    const by = y - height / 2;
    const dark = hexDarken(color, 0.18);

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRect(bx + 8, by + 10, width, height);

    // Body
    g.fillStyle(dark, 1);
    g.fillRect(bx, by, width, height);

    // Roof strip
    g.fillStyle(hexDarken(color, 0.12), 1);
    g.fillRect(bx, by, width, 14);

    // Windows
    this.drawWindowGrid(g, bx, by, width, height, color, station.id);

    // Building-type extras
    if (station.buildingType === 'tower') this.drawTower(g, x, by, color);
    if (station.buildingType === 'dome') this.drawDome(g, x, by, width, color);
    if (station.buildingType === 'mall') this.drawMallFacade(g, bx, by, width, height, color);
    if (station.buildingType === 'shack') this.drawShack(g, bx, by, width, height, color);
    if (station.buildingType === 'ruins') this.drawRuinBuilding(g, bx, by, width, height, color);

    // Door
    const dw = 22, dh = 32;
    g.fillStyle(0x000000, 0.8);
    g.fillRect(x - dw / 2, by + height - dh, dw, dh);
    g.fillStyle(color, 0.25);
    g.fillRect(x - dw / 2 + 2, by + height - dh + 2, dw - 4, dh - 2);

    // Door light spill
    g.fillStyle(color, 0.05);
    g.fillTriangle(x - 40, by + height + 50, x + 40, by + height + 50, x, by + height - dh);

    // Labels — skip for hidden stations
    if (!station.hidden && !station.nightOnly) {
      this.add.text(x, by - 20, station.name.toUpperCase(), {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: station.accentHex,
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
      }).setOrigin(0.5, 1).setDepth(6);

      this.add.text(x, by + height + 14, station.desc, {
        fontFamily: '"Share Tech Mono"',
        fontSize: '11px',
        color: station.accentHex + '88',
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(6);
    }

    // Live indicator
    if (!station.hidden && !station.nightOnly) {
      const dot = this.add.arc(x + 80, by - 12, 4, 0, 360, false, 0xff4444);
      dot.setDepth(7);
      this.tweens.add({ targets: dot, alpha: { from: 1, to: 0.15 }, duration: 900, yoyo: true, repeat: -1 });
    }

    // Midnight club gets night-only labels stored for toggling
    if (station.nightOnly) this.buildMidnightClubLights(station);
  }

  private drawWindowGrid(
    g: Phaser.GameObjects.Graphics,
    bx: number, by: number, w: number, h: number,
    color: number, stationId: string,
  ) {
    const cols = Math.floor(w / 28);
    const rows = Math.floor(h / 28);
    const ww = 14, wh = 12;
    const xpad = (w - cols * 28 + (28 - ww)) / 2;
    const ypad = 20;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const wx = bx + xpad + c * 28;
        const wy = by + ypad + r * 28;
        const lit = Math.random() > 0.28;
        if (lit) {
          g.fillStyle(color, 0.55);
          g.fillRect(wx, wy, ww, wh);
          g.fillStyle(0xffffff, 0.12);
          g.fillRect(wx + 1, wy + 1, 4, 3);

          // Occasional animated windows
          if (Math.random() < 0.2) {
            const rect = this.add.rectangle(wx + ww / 2, wy + wh / 2, ww, wh, color, 0.55);
            rect.setDepth(4);
            const baseAlpha = 0.35 + Math.random() * 0.35;
            this.windowLights.push({ rect, baseAlpha });
          }
        } else {
          g.fillStyle(0x000000, 0.4);
          g.fillRect(wx, wy, ww, wh);
        }
      }
    }
  }

  private drawTower(g: Phaser.GameObjects.Graphics, cx: number, topY: number, color: number) {
    g.fillStyle(hexDarken(color, 0.2));
    g.fillRect(cx - 16, topY - 85, 32, 85);
    g.fillStyle(color, 0.8);
    g.fillTriangle(cx, topY - 118, cx - 14, topY - 85, cx + 14, topY - 85);
    g.lineStyle(2, color, 0.9);
    g.lineBetween(cx, topY - 118, cx, topY - 140);
    const dot = this.add.arc(cx, topY - 142, 3, 0, 360, false, 0xff4444);
    this.tweens.add({ targets: dot, alpha: { from: 1, to: 0.1 }, duration: 600, yoyo: true, repeat: -1 });
  }

  private drawDome(g: Phaser.GameObjects.Graphics, cx: number, topY: number, w: number, color: number) {
    g.fillStyle(hexDarken(color, 0.15), 0.8);
    g.fillEllipse(cx, topY, w * 0.7, 52);
    g.fillStyle(color, 0.18);
    g.fillEllipse(cx, topY, w * 0.45, 36);
  }

  private drawMallFacade(g: Phaser.GameObjects.Graphics, bx: number, by: number, w: number, h: number, color: number) {
    g.fillStyle(color, 0.1);
    g.fillRect(bx + 20, by + 20, w - 40, h - 40);
    g.fillStyle(color, 0.28);
    g.fillRect(bx - 10, by - 8, w + 20, 16);
    for (let i = 0; i <= 3; i++) {
      g.fillStyle(hexDarken(color, 0.12));
      g.fillRect(bx + i * (w / 3) - 4, by, 8, h);
    }
  }

  private drawShack(g: Phaser.GameObjects.Graphics, bx: number, by: number, w: number, h: number, color: number) {
    // Intentionally rough/abandoned look
    g.fillStyle(0x1a1010, 1);
    g.fillRect(bx, by, w, h);
    g.lineStyle(1, 0x3a2020, 0.6);
    g.strokeRect(bx, by, w, h);
    // Patchy boards
    g.fillStyle(0x2a1818, 1);
    g.fillRect(bx, by + 10, w, 8);
    g.fillRect(bx, by + h - 20, w, 8);
    // Small red antenna
    g.lineStyle(2, color, 0.7);
    g.lineBetween(bx + w / 2, by, bx + w / 2, by - 28);
    g.fillStyle(color, 0.8);
    g.fillCircle(bx + w / 2, by - 30, 3);
  }

  private drawRuinBuilding(g: Phaser.GameObjects.Graphics, bx: number, by: number, w: number, h: number, color: number) {
    // Dark, closed-looking building — lit up at night via midnightBuildingLights
    g.fillStyle(0x080818, 1);
    g.fillRect(bx, by, w, h);
    g.fillStyle(0x0a0a20, 0.8);
    g.fillRect(bx, by, w, 10);
    // Boarded windows (dark during day)
    const cols = Math.floor(w / 30);
    const rows = Math.floor(h / 30);
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) {
        const wx = bx + 8 + c * 30;
        const wy = by + 18 + r * 30;
        g.fillStyle(0x050510, 1);
        g.fillRect(wx, wy, 16, 14);
        g.lineStyle(1, 0x1a1a30, 0.5);
        g.strokeRect(wx, wy, 16, 14);
        // Keep a ref so we can light them at night
        const winRect = this.add.rectangle(wx + 8, wy + 7, 16, 14, color, 0);
        winRect.setDepth(4);
        this.midnightBuildingLights.push(winRect);
      }
  }

  private buildMidnightClubLights(station: Station) {
    const { x, y, width, height, color, accentHex } = station;
    const bx = x - width / 2;
    const by = y - height / 2;

    // Store sign + neon objects for night-toggle
    const sign = this.add.text(x, by - 22, station.name.toUpperCase(), {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: accentHex,
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 1).setDepth(6).setAlpha(0);

    const desc = this.add.text(x, by + height + 14, station.desc, {
      fontFamily: '"Share Tech Mono"',
      fontSize: '11px',
      color: accentHex + '88',
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(6).setAlpha(0);

    const dot = this.add.arc(x + 80, by - 12, 4, 0, 360, false, 0xff4444).setAlpha(0).setDepth(7);

    // Zone glow (hidden during day)
    const glowG = this.add.graphics().setAlpha(0).setDepth(2);
    const steps = 6;
    for (let i = steps; i >= 1; i--) {
      const r = station.zoneRadius * (i / steps);
      const a = 0.08 * (1 - i / (steps + 1));
      glowG.fillStyle(station.color, a);
      glowG.fillCircle(station.x, station.y, r);
    }
    glowG.lineStyle(1, station.color, 0.15);
    glowG.strokeCircle(station.x, station.y, station.zoneRadius);

    // Apply current night state on creation
    const isNight = this.dayNight.getTimeInfo().isMidnight;
    const alpha = isNight ? 1 : 0;
    sign.setAlpha(alpha); desc.setAlpha(alpha); dot.setAlpha(alpha); glowG.setAlpha(alpha);
    this.midnightBuildingLights.forEach(w => w.setAlpha(isNight ? 0.5 : 0));

    if (isNight) {
      this.tweens.add({ targets: dot, alpha: { from: 1, to: 0.15 }, duration: 900, yoyo: true, repeat: -1 });
    }

    // Track so applyDayNight can toggle them
    (this as unknown as Record<string, unknown>)._midnightObjects = [sign, desc, dot, glowG];
  }

  private drawDecor(g: Phaser.GameObjects.Graphics) {
    const trees: [number, number][] = [
      [640, 140], [700, 360], [580, 500], [140, 320], [460, 200],
      [1000, 140], [1380, 140], [1500, 360],
      [1750, 140], [2000, 500], [2200, 460], [2300, 180],
      [140, 660], [640, 760], [580, 1000], [140, 1000],
      [1750, 700], [2100, 760], [2300, 1000], [1900, 1100],
      // BL dense trees (hiding the pirate station)
      [200, 1300], [80, 1380], [300, 1360], [480, 1430],
      [200, 1450], [90, 1520], [560, 1350], [620, 1480],
      [150, 1580], [420, 1550], [520, 1620], [680, 1560],
      // BC
      [900, 1280], [1060, 1350], [1450, 1290], [1580, 1380],
      // BR trees (around ruins)
      [1680, 1290], [1760, 1400], [2000, 1260], [2180, 1350],
      [2320, 1280], [2380, 1450], [2280, 1560], [2100, 1620],
    ];

    trees.forEach(([tx, ty]) => {
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(tx, ty + 18, 24, 9);
      g.fillStyle(COLORS.treeTrunk);
      g.fillRect(tx - 3, ty - 4, 6, 22);
      g.fillStyle(0x0a2010, 0.9);  g.fillCircle(tx, ty - 14, 18);
      g.fillStyle(0x0f3018, 1);    g.fillCircle(tx, ty - 18, 14);
      g.fillStyle(0x164020, 1);    g.fillCircle(tx, ty - 23, 9);
    });

    const lamps: [number, number][] = [
      [760, 100], [760, 300], [760, 500],
      [1640, 100], [1640, 300], [1640, 500],
      [760, 700], [760, 900], [760, 1100],
      [1640, 700], [1640, 900], [1640, 1100],
      [200, 558], [500, 558], [900, 558], [1100, 558], [1500, 558], [1800, 558], [2200, 558],
      [200, 1142], [500, 1142], [900, 1142], [1100, 1142], [1500, 1142], [1800, 1142], [2200, 1142],
    ];

    lamps.forEach(([lx, ly]) => {
      g.fillStyle(COLORS.lampPost);
      g.fillRect(lx - 2, ly - 2, 4, 30);
      g.fillRect(lx - 10, ly - 4, 20, 4);
      g.fillStyle(COLORS.lampLight, 0.85);
      g.fillCircle(lx - 8, ly - 4, 4);
      g.fillCircle(lx + 8, ly - 4, 4);
      g.fillStyle(0xffffaa, 0.04);
      g.fillCircle(lx, ly, 44);
    });

    // Plaza benches
    g.fillStyle(0x3a3a5a);
    [[990, 650], [1050, 1040], [1380, 660], [1350, 1040]].forEach(([bx, bby]) => {
      g.fillRect(bx, bby, 52, 12);
      g.fillStyle(0x4a4a6a); g.fillRect(bx, bby + 4, 52, 4);
    });
  }

  // ── Player ──────────────────────────────────────────────────────────
  private createPlayer() {
    const glow  = this.add.arc(0, 0, 16, 0, 360, false, 0xffffff, 0.07);
    const shadow= this.add.arc(2, 4, 9,  0, 360, false, 0x000000, 0.35);
    const body  = this.add.arc(0, 0, 9,  0, 360, false, 0xc780ff);
    const inner = this.add.arc(0, 0, 4,  0, 360, false, 0xffffff, 0.4);
    const name  = this.add.text(0, -24, this.username ?? 'Wanderer', {
      fontFamily: '"Share Tech Mono"', fontSize: '10px',
      color: '#c780ff', stroke: '#000000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5, 1);

    this.playerContainer = this.add.container(SPAWN_X, SPAWN_Y, [glow, shadow, body, inner, name]);
    this.playerContainer.setDepth(10);
    this.playerBody = body;

    this.tweens.add({
      targets: glow,
      scaleX: { from: 1, to: 1.6 }, scaleY: { from: 1, to: 1.6 },
      alpha: { from: 0.07, to: 0 },
      duration: 1800, yoyo: true, repeat: -1,
    });
  }

  // ── Input ───────────────────────────────────────────────────────────
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.keyboard!.on('keydown-Z', () => this.onEmotePickerRequest?.());
    this.input.keyboard!.on('keydown-F', () => {
      if (this.nearStation) this.onMessageBoardOpen?.(this.nearStation);
    });
  }

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.playerContainer, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);
  }

  // ── Night overlay ───────────────────────────────────────────────────
  private setupNightOverlay() {
    this.nightOverlay = this.add.rectangle(0, 0, 20000, 20000, 0x04041a, 0)
      .setScrollFactor(0)
      .setOrigin(0, 0)
      .setDepth(998);
  }

  private applyDayNight() {
    const info = this.dayNight.getTimeInfo();
    this.lastTimeInfo = info;
    this.tweens.add({
      targets: this.nightOverlay,
      alpha: info.overlayAlpha,
      duration: 4000,
      ease: 'Sine.easeInOut',
    });
    this.nightOverlay.setFillStyle(info.overlayColor, info.overlayAlpha);
    this.onTimeChanged?.(info);

    // Toggle midnight club visibility
    const midObj = (this as unknown as Record<string, unknown>)._midnightObjects as (Phaser.GameObjects.GameObject & { setAlpha(a: number): void })[] | undefined;
    if (midObj) {
      midObj.forEach(o => this.tweens.add({ targets: o, alpha: info.isMidnight ? 1 : 0, duration: 3000 }));
    }
    this.midnightBuildingLights.forEach(w =>
      this.tweens.add({ targets: w, alpha: info.isMidnight ? 0.55 : 0, duration: 3000 })
    );

    // Rain overlay tint when raining at night
    if (this.weather?.isRaining() && info.overlayAlpha > 0.2) {
      this.nightOverlay.setFillStyle(0x040820, info.overlayAlpha + 0.06);
    }
  }

  // ── Window flicker ──────────────────────────────────────────────────
  private setupWindowFlicker() {
    this.windowLights.forEach(({ rect, baseAlpha }) => {
      this.time.addEvent({
        delay: 3000 + Math.random() * 9000,
        loop: true,
        callback: () => {
          this.tweens.add({
            targets: rect,
            alpha: { from: rect.alpha, to: baseAlpha * (0.3 + Math.random() * 0.7) },
            duration: 100 + Math.random() * 200,
            yoyo: true,
          });
        },
      });
    });
  }

  // ── Mobile joystick ─────────────────────────────────────────────────
  private setupMobileControls() {
    if (!this.sys.game.device.input.touch) return;

    const R = 52;
    const jx = 90, jy = this.scale.height - 90;

    const base = this.add.arc(jx, jy, R, 0, 360, false, 0xffffff, 0.08);
    base.setStrokeStyle(1.5, 0xffffff, 0.25).setScrollFactor(0).setDepth(900);

    const stick = this.add.arc(jx, jy, 22, 0, 360, false, 0xffffff, 0.4);
    stick.setScrollFactor(0).setDepth(901);

    this.joyBase  = base;
    this.joyStick = stick;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.x > this.scale.width / 2) return;
      this.joyActive = true;
      this.joyOrigin = { x: p.x, y: p.y };
      base.setPosition(p.x, p.y);
      stick.setPosition(p.x, p.y);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.joyActive || !p.isDown) return;
      const dx = p.x - this.joyOrigin.x;
      const dy = p.y - this.joyOrigin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        const clamp = Math.min(dist, R);
        stick.setPosition(this.joyOrigin.x + nx * clamp, this.joyOrigin.y + ny * clamp);
        this.joyVector = { x: nx * Math.min(1, dist / R), y: ny * Math.min(1, dist / R) };
      }
    });

    this.input.on('pointerup', () => {
      if (!this.joyActive) return;
      this.joyActive = false;
      this.joyVector = { x: 0, y: 0 };
      stick.setPosition(base.x, base.y);
    });
  }

  // ── Multiplayer ─────────────────────────────────────────────────────
  private setupMultiplayer() {
    this.multiplayer = new MultiplayerManager();
    if (this.username) this.multiplayer.setUsername(this.username);

    this.multiplayer.onWorldInit = (data) => {
      this.playerColor = data.playerColor;
      const colorInt = parseInt(data.playerColor.replace('#', ''), 16);
      this.playerBody.setFillStyle(colorInt);
      (this.playerContainer.list[4] as Phaser.GameObjects.Text).setColor(data.playerColor);
      this.playerContainer.setPosition(data.spawnX, data.spawnY);
      data.players.filter(p => p.id !== data.playerId).forEach(p => this.addRemotePlayer(p));
      this.onPlayersUpdate?.(this.otherPlayers.size + 1);
    };

    this.multiplayer.onPlayerJoined = (player) => {
      this.addRemotePlayer(player);
      this.onPlayersUpdate?.(this.otherPlayers.size + 1);
    };

    this.multiplayer.onPlayerMoved = (data) => {
      const s = this.otherPlayers.get(data.id);
      if (!s) return;
      if (data.x !== undefined) s.data.targetX = data.x;
      if (data.y !== undefined) s.data.targetY = data.y;
      if (data.direction) s.data.direction = data.direction;
      if (data.username) { s.data.username = data.username; s.nametag.setText(data.username); }
    };

    this.multiplayer.onPlayerLeft = (id) => {
      this.ghostRemotePlayer(id);
      this.onPlayersUpdate?.(this.otherPlayers.size + 1);
    };

    this.multiplayer.onPlayerRenamed = (d) => {
      const s = this.otherPlayers.get(d.id);
      if (s) s.nametag.setText(d.username);
    };

    this.multiplayer.onChatMessage = (msg) => {
      this.showChatBubble(msg);
      this.onChatMessage?.(msg);
    };

    this.multiplayer.onPlayerEmote = (d) => {
      this.showEmoteAnim(d.id === this.multiplayer.id ? this.playerContainer : this.otherPlayers.get(d.id)?.container ?? null, d.emote);
    };

    this.multiplayer.onMessageNew = (msg) => this.onMessageNew?.(msg);
  }

  private addRemotePlayer(player: RemotePlayer) {
    if (this.otherPlayers.has(player.id)) return;
    const c = parseInt(player.color.replace('#', ''), 16);
    const shadow = this.add.arc(2, 4, 7, 0, 360, false, 0x000000, 0.3);
    const body   = this.add.arc(0, 0, 8, 0, 360, false, c);
    const inner  = this.add.arc(0, 0, 3, 0, 360, false, 0xffffff, 0.35);
    const name   = this.add.text(0, -20, player.username, {
      fontFamily: '"Share Tech Mono"', fontSize: '9px',
      color: player.color, stroke: '#000000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5, 1);

    const container = this.add.container(player.x, player.y, [shadow, body, inner, name]).setDepth(9);
    this.otherPlayers.set(player.id, {
      container, body, nametag: name,
      data: { ...player, targetX: player.x, targetY: player.y },
    });
  }

  private ghostRemotePlayer(id: string) {
    const sprite = this.otherPlayers.get(id);
    if (!sprite) return;
    this.otherPlayers.delete(id);

    sprite.nametag.setText('...was here');
    sprite.body.setFillStyle(0x666688);

    this.tweens.add({
      targets: sprite.container,
      alpha: { from: 0.6, to: 0 },
      duration: 8000,
      ease: 'Power2',
      onComplete: () => sprite.container.destroy(true),
    });
  }

  private showChatBubble(msg: ChatMessage) {
    const isMe = msg.id === this.multiplayer?.id;
    const container = isMe
      ? this.playerContainer
      : (this.otherPlayers.get(msg.id)?.container ?? null);
    if (!container) return;

    const bubble = this.add.text(0, -42, msg.message, {
      fontFamily: '"Share Tech Mono"', fontSize: '9px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
      backgroundColor: msg.color + '44', padding: { x: 5, y: 3 },
      align: 'center',
    }).setOrigin(0.5, 1);

    container.add(bubble);
    this.tweens.add({
      targets: bubble,
      alpha: { from: 1, to: 0 }, y: { from: -42, to: -65 },
      duration: 3500, delay: 1500,
      onComplete: () => bubble.destroy(),
    });
  }

  private showEmoteAnim(container: Phaser.GameObjects.Container | null, emote: string) {
    if (!container) return;
    const txt = this.add.text(0, -54, emote, {
      fontSize: '22px', align: 'center',
    }).setOrigin(0.5, 1);
    container.add(txt);
    this.tweens.add({
      targets: txt,
      y: { from: -54, to: -80 },
      alpha: { from: 1, to: 0 },
      duration: 2200,
      ease: 'Sine.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  // ── Update loop ─────────────────────────────────────────────────────
  private handleMovement() {
    const speed = PLAYER_SPEED;
    const delta = this.game.loop.delta / 1000;

    let vx = 0, vy = 0;

    if (this.joyActive) {
      vx = this.joyVector.x * speed;
      vy = this.joyVector.y * speed;
    } else {
      if (this.cursors.left.isDown  || this.wasd['A']?.isDown) vx = -speed;
      else if (this.cursors.right.isDown || this.wasd['D']?.isDown) vx = speed;
      if (this.cursors.up.isDown    || this.wasd['W']?.isDown) vy = -speed;
      else if (this.cursors.down.isDown  || this.wasd['S']?.isDown) vy = speed;
    }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    const nx = Phaser.Math.Clamp(this.playerContainer.x + vx * delta, 10, WORLD_WIDTH - 10);
    const ny = Phaser.Math.Clamp(this.playerContainer.y + vy * delta, 10, WORLD_HEIGHT - 10);
    this.playerContainer.setPosition(nx, ny);

    if (vx < 0) this.lastDirection = 'left';
    else if (vx > 0) this.lastDirection = 'right';
    else if (vy < 0) this.lastDirection = 'up';
    else if (vy > 0) this.lastDirection = 'down';
  }

  private interpolateOtherPlayers() {
    this.otherPlayers.forEach((sprite) => {
      const tx = sprite.data.targetX ?? sprite.data.x;
      const ty = sprite.data.targetY ?? sprite.data.y;
      const cx = sprite.container.x + (tx - sprite.container.x) * 0.2;
      const cy = sprite.container.y + (ty - sprite.container.y) * 0.2;
      sprite.container.setPosition(cx, cy);
    });
  }

  private detectNearStation() {
    const px = this.playerContainer.x;
    const py = this.playerContainer.y;
    let closest: Station | null = null;
    let closestDist = Infinity;

    for (const station of STATIONS) {
      const dx = px - station.x, dy = py - station.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MESSAGE_BOARD_RADIUS && dist < closestDist) {
        closestDist = dist;
        closest = station;
      }
    }

    if (closest?.id !== this.nearStation?.id) {
      this.nearStation = closest;
      this.onNearStationChanged?.(closest);
    }
  }

  // ── Public API (called from React) ──────────────────────────────────
  sendChat(message: string) { this.multiplayer?.sendChat(message); }

  sendEmote(emote: string) {
    this.multiplayer?.sendEmote(emote);
    this.showEmoteAnim(this.playerContainer, emote);
  }

  setMuted(muted: boolean) { this.audio.setMuted(muted); }
  setVolume(vol: number) { this.audio.setMasterVolume(vol); }
  setZoom(zoom: number) { this.cameras.main.setZoom(zoom); }
  setUsername(name: string) {
    this.playerUsername = name;
    const tag = this.playerContainer.list[4] as Phaser.GameObjects.Text;
    if (tag) tag.setText(name);
    this.multiplayer?.setUsername(name);
  }

  postMessage(stationId: string, text: string) { this.multiplayer?.postMessage(stationId, text); }
  fetchMessages(stationId: string) { return this.multiplayer?.fetchMessages(stationId) ?? Promise.resolve([]); }

  destroy() {
    this.audio.destroy();
    this.multiplayer?.destroy();
    this.weather?.destroy();
  }
}
