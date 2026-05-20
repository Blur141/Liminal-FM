'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { STATIONS, Station } from '@/game/constants';
import { ChatMessage, StationMessage } from '@/game/MultiplayerManager';
import { TimeInfo } from '@/game/DayNightCycle';

const EmotePicker          = dynamic(() => import('./EmotePicker'),          { ssr: false });
const SettingsPanel        = dynamic(() => import('./SettingsPanel'),        { ssr: false });
const MessageBoard         = dynamic(() => import('./MessageBoard'),         { ssr: false });
const CharacterSelectScreen = dynamic(() => import('./CharacterSelectScreen'), { ssr: false });

interface ChatEntry extends ChatMessage { key: string; }

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'home',     label: 'Home'     },
  { id: 'explore',  label: 'Explore'  },
  { id: 'stations', label: 'Stations' },
  { id: 'events',   label: 'Events'   },
  { id: 'profile',  label: 'Profile'  },
  { id: 'quests',   label: 'Quests',  badge: 'NEW' },
  { id: 'shop',     label: 'Shop'     },
];

function NavIcon({ id }: { id: string }) {
  const svgs: Record<string, React.ReactNode> = {
    home: (
      <path d="M2 7L8 2l6 5v7h-4v-4H6v4H2V7z" fill="currentColor" />
    ),
    explore: (
      <>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.5 5.5l-3 2-2 3 3-2 2-3z" fill="currentColor" />
      </>
    ),
    stations: (
      <>
        <circle cx="8" cy="8" r="2" fill="currentColor" />
        <path d="M5.2 5.2a4 4 0 0 0 0 5.6M10.8 5.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 3a7 7 0 0 0 0 10M13 3a7 7 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    events: (
      <>
        <rect x="2" y="4" width="12" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 2v3M11 2v3M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    profile: (
      <>
        <circle cx="8" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    quests: (
      <path d="M8 1l1.8 3.8 4.2.6-3 3 .7 4.1L8 10.5l-3.7 2 .7-4.2-3-3 4.2-.6L8 1z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    ),
    shop: (
      <>
        <path d="M3 5h10l-1.2 8H4.2L3 5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 5V4a2 2 0 0 1 4 0v1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  };
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      {svgs[id] ?? null}
    </svg>
  );
}

// ── Sidebar station display list ──────────────────────────────────────────────
const SIDEBAR_STATIONS = [
  { id: 'lofi-lounge',   name: 'Lo-fi Cafe',     genre: 'Lo Hip Hop', listeners: 243 },
  { id: 'neon-district', name: 'Neon City',       genre: 'Synthwave',  listeners: 186 },
  { id: 'jazz-cafe',     name: 'Midnight Drive',  genre: 'Chillwave',  listeners: 312 },
  { id: 'rain-station',  name: 'Rainy Streets',   genre: 'Ambient',    listeners: 154 },
];

// ── Audio visualizer bars ─────────────────────────────────────────────────────
function VisualizerBars({ color }: { color: string }) {
  const heights = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.3, 0.75, 0.55, 0.8, 0.45];
  const durations = [0.5, 0.8, 0.6, 0.7, 0.55, 0.9, 0.65, 0.75, 0.5, 0.85, 0.6, 0.7];
  const delays    = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55];
  return (
    <div className="flex items-end gap-px" style={{ height: 16 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: `${h * 100}%`,
            background: color,
            opacity: 0.5 + h * 0.5,
            borderRadius: 1,
            animation: `vizBar ${durations[i]}s ease-in-out ${delays[i]}s infinite alternate`,
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}

// ── Radio icon ────────────────────────────────────────────────────────────────
function RadioWaveIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="3"  y="8"  width="2" height="6" rx="1" fill="#c780ff" />
      <rect x="7"  y="5"  width="2" height="12" rx="1" fill="#c780ff" />
      <rect x="11" y="3"  width="2" height="16" rx="1" fill="#c780ff" opacity="0.9" />
      <rect x="15" y="5"  width="2" height="12" rx="1" fill="#c780ff" />
      <rect x="19" y="8"  width="2" height="6"  rx="1" fill="#c780ff" />
    </svg>
  );
}

// ── Inline SVG helpers ────────────────────────────────────────────────────────
function StationThumb({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={color} opacity="0.7">
      <circle cx="8" cy="8" r="2" />
      <path d="M5.2 5.2a4 4 0 0 0 0 5.6M10.8 5.2a4 4 0 0 1 0 5.6" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Player waveform (bottom bar) ──────────────────────────────────────────────
const WV_H  = [0.3,0.55,0.8,0.45,0.9,0.6,1,0.5,0.75,0.4,0.85,0.65,0.95,0.35,
               0.7,0.5,0.88,0.45,0.72,0.6,0.4,0.8,0.55,0.92,0.38,0.68,0.5,0.82,
               0.45,0.78,0.6,0.95,0.42,0.7,0.55,0.85];
const WV_D  = WV_H.map((_, i) => (0.35 + (i % 7) * 0.08).toFixed(2));
const WV_DL = WV_H.map((_, i) => (i * (0.6 / WV_H.length)).toFixed(3));

function PlayerWaveform({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 32, width: 180 }}>
      {WV_H.map((h, i) => (
        <div key={i} style={{
          width: 3, flex: '0 0 3px',
          height: active ? `${h * 100}%` : '4px',
          background: active
            ? `hsl(${270 + (i / WV_H.length) * 55}, 78%, 72%)`
            : (color + '30'),
          borderRadius: 2,
          opacity: active ? (0.55 + h * 0.45) : 0.3,
          animation: active
            ? `vizBar ${WV_D[i]}s ease-in-out ${WV_DL[i]}s infinite alternate`
            : 'none',
          transformOrigin: 'bottom',
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<import('@/game/scenes/MainScene').MainScene | null>(null);

  // Game state
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [nearStation, setNearStation] = useState<Station | null>(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);
  const [weatherState, setWeatherState] = useState('clear');
  const [discoveredStation, setDiscoveredStation] = useState<Station | null>(null);

  // Chat
  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Panels / overlays
  const [showEmotes, setShowEmotes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [boardStation, setBoardStation] = useState<Station | null>(null);
  const [boardMessages, setBoardMessages] = useState<StationMessage[]>([]);

  // Player prefs
  const [volume, setVolume] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [muted, setMuted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // UI state
  const [activeNav, setActiveNav] = useState('home');
  const [activeTab, setActiveTab] = useState<'chat' | 'nearby'>('chat');

  const [username] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('liminal-username') ?? 'Wanderer') : 'Wanderer'
  );

  const [characterId, setCharacterId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('liminal-character') : null
  );

  // ── Phaser init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !characterId) return;
    let destroyed = false;

    async function initGame() {
      const Phaser = await import('phaser');
      const { MainScene } = await import('@/game/scenes/MainScene');
      if (destroyed || !containerRef.current) return;

      const scene = new MainScene();
      scene.username    = username;
      scene.characterId = characterId!;
      scene.onReady              = () => setLoaded(true);
      scene.onStationChanged     = (s) => setCurrentStation(s);
      scene.onNearStationChanged = (s) => setNearStation(s);
      scene.onPlayersUpdate      = (n) => setPlayerCount(n);
      scene.onTimeChanged        = (info) => setTimeInfo(info);
      scene.onWeatherChanged     = (w) => setWeatherState(w);
      scene.onEmotePickerRequest = () => setShowEmotes(v => !v);
      scene.onMessageBoardOpen   = (s) => setBoardStation(s);
      scene.onStationDiscovered  = (s) => {
        setDiscoveredStation(s);
        setTimeout(() => setDiscoveredStation(null), 5000);
      };
      scene.onMessageNew = (msg) =>
        setBoardMessages(prev => [msg, ...prev.slice(0, 49)]);
      scene.onChatMessage = (msg) =>
        setChatLog(prev => [...prev.slice(-49), { ...msg, key: `${msg.id}-${msg.timestamp}` }]);

      sceneRef.current = scene;

      new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current!,
        width: containerRef.current!.offsetWidth || 800,
        height: containerRef.current!.offsetHeight || 600,
        backgroundColor: '#0a0a14',
        pixelArt: true,
        roundPixels: true,
        scene: [scene],
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        render: { antialias: false, pixelArt: true },
      });

      setTimeout(() => {
        const defaultZoom = scene.getDefaultZoom?.() ?? 1.5;
        setZoom(defaultZoom);
      }, 200);
    }

    initGame();
    return () => {
      destroyed = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);



  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCharacterSelect = useCallback((id: string) => {
    localStorage.setItem('liminal-character', id);
    setCharacterId(id);
  }, []);

  const handleChatSubmit = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) return;
    sceneRef.current?.sendChat(msg);
    setChatInput('');
  }, [chatInput]);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    sceneRef.current?.setVolume(v);
  }, []);

  const handleZoomChange = useCallback((z: number) => {
    setZoom(z);
    sceneRef.current?.setZoom(z);
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    sceneRef.current?.setMuted(next);
  }, [muted]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setChatInput('');
        setShowEmotes(false);
        setShowSettings(false);
        setBoardStation(null);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Derived display values ───────────────────────────────────────────────
  const stationColor  = currentStation?.accentHex ?? '#c780ff';

  const btn0 = { minHeight: 'unset' as const, minWidth: 'unset' as const, padding: 0 };

  // ── Render ───────────────────────────────────────────────────────────────
  if (!characterId) {
    return <CharacterSelectScreen onSelect={handleCharacterSelect} />;
  }

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#0a0a14] overflow-hidden select-none font-mono">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 h-14 flex items-center gap-3 px-4 border-b border-[#2a2a42] bg-[#0d0d1a] z-30">

        {/* Logo */}
        <div className="flex items-center gap-2.5 w-[236px] shrink-0">
          <RadioWaveIcon />
          <div>
            <div className="font-pixel text-white text-[10px] leading-none"
              style={{ textShadow: '0 0 14px rgba(199,128,255,0.55)' }}>
              Liminal FM
            </div>
            <div className="text-white/30 text-[8px] leading-tight mt-0.5 tracking-wide">
              Interactive Radio World
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Listener count */}
        <div className="flex items-center gap-2 px-3">
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" style={{ boxShadow: '0 0 6px #4ade80' }} />
          <span className="font-mono text-[11px] text-white/40">Listener Count</span>
          <span className="font-mono text-[12px] text-white/80 font-bold">{playerCount + 127}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* City */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-white/75 hover:bg-purple-500/20 transition-colors text-[11px]" style={btn0}>
          Liminal City
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l3 3 3-3" /></svg>
        </button>

        {/* Icon row */}
        <div className="flex items-center gap-1">
          {/* Friends */}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-white/40 hover:text-white/75 hover:bg-white/5 transition-all" style={btn0}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="5" r="3" />
              <path d="M1 14c0-2.8 2.2-5 5-5s5 2.2 5 5" />
              <path d="M13 7c1 0 2 .9 2 2s-1 2-2 2M11 14c0-1.7-.8-3.2-2-4.2.5-.5 1.2-.8 2-.8 2 0 3.5 1.8 3.5 4" strokeDasharray="2 1.5" />
            </svg>
          </button>
          {/* Help */}
          <button className="w-9 h-9 flex items-center justify-center rounded-full border border-white/12 text-white/40 hover:text-white/75 hover:border-white/25 transition-all font-mono text-[13px]" style={btn0}>?</button>
          {/* Settings */}
          <button onClick={() => setShowSettings(v => !v)} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/40 hover:text-white/75 hover:bg-white/5 transition-all" style={btn0}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7 2l-.5 1.5A5 5 0 0 0 5 4.3L3.5 4 2 6.6l1.2 1a5 5 0 0 0 0 1.8l-1.2 1L3.5 13l1.5-.35A5 5 0 0 0 6.5 13.5L7 15h2l.5-1.5A5 5 0 0 0 11 12.65L12.5 13l1.5-2.6-1.2-1a5 5 0 0 0 0-1.8l1.2-1L12.5 4l-1.5.35A5 5 0 0 0 9.5 3.5L9 2H7zm1 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
            </svg>
          </button>
          {/* Profile / Change character */}
          <button
            onClick={() => { localStorage.removeItem('liminal-character'); setCharacterId(null); setLoaded(false); }}
            title="Change character"
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/50 hover:border-purple-400 transition-all flex items-center justify-center"
            style={{ ...btn0, background: 'linear-gradient(135deg,#7c3aed,#4338ca)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/characters/${characterId}/Front - Idle/Front - Idle_000.png`} alt="" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
          </button>
        </div>
      </div>

      {/* ── MIDDLE ROW ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
        <div className="w-[240px] shrink-0 flex flex-col border-r border-[#2a2a42] bg-[#0d0d1a] overflow-hidden">

          {/* LIVE / Now Playing */}
          <div className="p-3 border-b border-[#2a2a42]">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="font-pixel text-[8px] text-white/65 tracking-wider">LIVE</span>
              <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 leading-none">
                LIVE NOW
              </span>
            </div>

            {/* Playing card */}
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded shrink-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${stationColor}44, ${stationColor}18)`,
                  border: `1px solid ${stationColor}28`,
                }}>
                <StationThumb color={stationColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/85 truncate leading-tight mb-0.5">
                  {currentStation?.name ?? 'Chillwave Dreams'}
                </div>
                <div className="text-[9px] text-white/35 truncate leading-tight mb-1.5">
                  {currentStation ? currentStation.desc.split('·')[0].trim() : 'Tokyo Nightwalk'}
                </div>
                <VisualizerBars color={stationColor} />
              </div>
            </div>

            <div className="flex items-center gap-1 mt-2">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" className="text-white/25">
                <circle cx="6" cy="6" r="5" />
              </svg>
              <span className="text-[9px] text-white/30">{playerCount + 127} listeners</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-1.5 overflow-y-auto">
            {NAV_ITEMS.map(item => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  style={{
                    background: active ? 'rgba(139,92,246,0.1)' : undefined,
                    borderRight: active ? '2px solid #8b5cf6' : '2px solid transparent',
                    color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  <NavIcon id={item.id} />
                  <span className="text-[12px]">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto font-pixel text-[7px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/25 leading-tight">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Popular Stations */}
          <div className="border-t border-[#2a2a42]">
            <div className="px-4 pt-2.5 pb-1.5">
              <span className="text-[9px] text-white/25 tracking-widest uppercase">Popular Stations</span>
            </div>
            {SIDEBAR_STATIONS.map(s => {
              const st = STATIONS.find(x => x.id === s.id);
              const color = st?.accentHex ?? '#8b5cf6';
              const isActive = currentStation?.id === s.id;
              return (
                <button
                  key={s.id}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/[0.04] transition-colors text-left"
                  style={{ background: isActive ? `${color}10` : undefined }}
                >
                  <div className="w-7 h-7 rounded shrink-0"
                    style={{ background: `linear-gradient(135deg, ${color}38, ${color}16)`, border: `1px solid ${color}28` }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-white/65 truncate">{s.name}</div>
                    <div className="text-[8px] text-white/30 truncate">{s.genre}</div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <span className="text-[9px] text-white/30">{s.listeners}</span>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor" className="text-white/20">
                      <circle cx="6" cy="6" r="4.5" />
                    </svg>
                  </div>
                </button>
              );
            })}

            {/* Create Station */}
            <div className="p-3">
              <button className="w-full py-2 rounded-lg border border-dashed border-purple-500/25 text-purple-400/50 hover:border-purple-500/50 hover:text-purple-400/80 transition-all text-[11px]">
                + Create Station
              </button>
            </div>
          </div>
        </div>

        {/* ── CENTER: GAME WORLD ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Game header */}
          <div className="h-8 shrink-0 flex items-center justify-between px-4 border-b border-[#2a2a42] bg-[#0d0d1a]/90 z-10">
            <div className="flex items-center gap-2">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="text-white/35">
                <path d="M2 3h12v10H2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 6h12" stroke="currentColor" strokeWidth="1" />
              </svg>
              <span className="text-[11px] text-white/55">Liminal City</span>
              <span className="text-[9px] text-white/25">·</span>
              <span className="text-[9px] text-white/25">{playerCount} Online</span>
            </div>
            <div className="flex items-center gap-2">
              {weatherState !== 'clear' && (
                <span className="text-xs">{weatherState === 'heavy-rain' ? '⛈' : '🌧'}</span>
              )}
              {timeInfo?.label && (
                <span className="text-[9px] text-white/22">{timeInfo.label}</span>
              )}
              <button onClick={() => setShowSettings(v => !v)} className="text-white/30 hover:text-white/60 transition-colors" style={btn0}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7 2l-.5 1.5A5 5 0 0 0 5 4.3L3.5 4 2 6.6l1.2 1a5 5 0 0 0 0 1.8l-1.2 1L3.5 13l1.5-.35A5 5 0 0 0 6.5 13.5L7 15h2l.5-1.5A5 5 0 0 0 11 12.65L12.5 13l1.5-2.6-1.2-1a5 5 0 0 0 0-1.8l1.2-1L12.5 4l-1.5.35A5 5 0 0 0 9.5 3.5L9 2H7zm1 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Phaser canvas mount */}
          <div ref={containerRef} className="flex-1 relative overflow-hidden">
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a14] z-50 gap-4">
                <p className="font-pixel text-purple-400 text-xs tracking-widest animate-pulse">LOADING WORLD…</p>
                <p className="text-white/20 text-xs tracking-widest">tuning frequencies</p>
              </div>
            )}

            {/* Discovery toast */}
            {discoveredStation && (
              <div className="absolute top-4 inset-x-0 flex justify-center z-30 pointer-events-none fade-in">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border"
                  style={{ borderColor: discoveredStation.accentHex + '50' }}>
                  <span>🏴‍☠️</span>
                  <span className="font-pixel text-[8px]" style={{ color: discoveredStation.accentHex }}>
                    PIRATE STATION DISCOVERED!
                  </span>
                </div>
              </div>
            )}

            {/* Near-station hint */}
            {nearStation && !boardStation && (
              <div className="absolute top-3 inset-x-0 flex justify-center z-20 pointer-events-auto fade-in">
                <button
                  onClick={() => setBoardStation(nearStation)}
                  className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white/70 active:scale-95 transition-all px-3 py-1.5 rounded-full bg-black/60 border border-white/8"
                  style={{ minHeight: 'unset' }}
                >
                  <span>📋</span>
                  <span>[F] Message Board · {nearStation.name}</span>
                </button>
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div className="h-9 shrink-0 flex items-center justify-center gap-5 border-t border-[#2a2a42] bg-black/50 px-4">
            {[
              { keys: 'W A S D', label: 'Move' },
              { keys: 'E', label: 'Interact' },
              { keys: 'M', label: 'Map' },
              { keys: '/', label: 'Help' },
            ].map(({ keys, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="font-pixel text-[7px] text-white/45">{keys}</span>
                <span className="text-[9px] text-white/22">{label}</span>
              </div>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => setShowEmotes(v => !v)}
              className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-all"
              style={btn0}
            >
              😊 <span className="text-[9px] ml-1">[Z]</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
        <div className="w-[258px] shrink-0 flex flex-col border-l border-[#2a2a42] bg-[#0d0d1a]">

          {/* Tabs */}
          <div className="flex border-b border-[#2a2a42] shrink-0">
            {(['chat', 'nearby'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 font-pixel text-[8px] tracking-widest uppercase transition-colors"
                style={{
                  color: activeTab === tab ? '#a78bfa' : 'rgba(255,255,255,0.22)',
                  borderBottom: activeTab === tab ? '2px solid #8b5cf6' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Channel name */}
          <div className="px-4 py-2 border-b border-[#2a2a42] shrink-0">
            <span className="text-[10px] text-white/28"># liminal-chat</span>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto chat-log px-3 py-2">
            {chatLog.length === 0 ? (
              <div className="pt-8 text-center space-y-1">
                <p className="text-[10px] text-white/18">No messages yet.</p>
                <p className="text-[9px] text-white/12">Say hello! 👋</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatLog.slice(-20).map(msg => {
                  const time = new Date(msg.timestamp || Date.now())
                    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={msg.key} className="fade-in flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-pixel text-[6px] text-white mt-0.5"
                        style={{ background: msg.color + '40', border: `1px solid ${msg.color}35` }}>
                        {msg.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold" style={{ color: msg.color }}>{msg.username}</span>
                          <span className="text-[8px] text-white/18">{time}</span>
                        </div>
                        <p className="text-[10px] text-white/55 break-words leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="px-3 pb-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-[#13131f] border border-[#2a2a42] rounded-lg px-3 py-1.5">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleChatSubmit(); }
                  if (e.key === 'Escape') setChatInput('');
                  e.stopPropagation();
                }}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 bg-transparent text-[11px] text-white/65 placeholder-white/20 focus:outline-none py-1"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              <button onClick={handleChatSubmit} className="text-white/30 hover:text-purple-400 transition-colors" style={btn0}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 8L14 2 11 8l3 6L2 8zm0 0h7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="text-white/30 hover:text-purple-400 transition-colors" style={btn0}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M5 9.5s1 1.5 3 1.5 3-1.5 3-1.5" strokeLinecap="round" />
                  <circle cx="6" cy="7" r="0.8" fill="currentColor" />
                  <circle cx="10" cy="7" r="0.8" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Listeners */}
          <div className="border-t border-[#2a2a42] p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-white/28 tracking-widest uppercase">Active Listeners</span>
              <span className="text-[11px] text-white/45">{playerCount + 127}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: Math.min(playerCount + 5, 10) }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full flex items-center justify-center font-pixel text-[6px] text-white"
                  style={{
                    background: `hsl(${(i * 53 + 210) % 360}, 55%, 38%)`,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {String.fromCharCode(65 + ((i * 7) % 26))}
                </div>
              ))}
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white/40 bg-white/5 border border-white/8">
                +{Math.max(playerCount + 117, 110)}
              </div>
            </div>
          </div>
        </div>

      </div>{/* end MIDDLE ROW */}

      {/* ── BOTTOM PLAYER BAR ───────────────────────────────────────────── */}
      <div className="shrink-0 h-[72px] flex items-center gap-3 px-4 border-t border-[#1a1a2e] bg-[#060610] z-20">

        {/* Left: album art + song info + LIVE badge */}
        <div className="flex items-center gap-3 w-[220px] shrink-0">
          <div className="relative w-11 h-11 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${stationColor}40, ${stationColor}12)`,
              border: `1px solid ${stationColor}30`,
              boxShadow: currentStation ? `0 0 14px ${stationColor}28` : 'none',
            }}>
            <StationThumb color={stationColor} />
            {currentStation && (
              <div className="absolute inset-0 flex items-end justify-center pb-1">
                <VisualizerBars color={stationColor} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] text-white/90 truncate leading-tight font-medium">
                {currentStation?.name ?? 'Liminal FM'}
              </span>
            </div>
            <div className="text-[9px] text-white/35 truncate leading-tight">
              {currentStation ? currentStation.desc.split('·')[0].trim() : 'Select a station to tune in'}
            </div>
            {currentStation && (
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
                  style={{ animation: 'blink 1.4s ease-in-out infinite', boxShadow: '0 0 4px #ef4444' }} />
                <span className="font-pixel text-[6px] text-red-400 tracking-widest">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: heart + prev + waveform + play/pause + next */}
        <div className="flex-1 flex items-center justify-center gap-4">
          {/* Heart */}
          <button className="text-white/20 hover:text-pink-400 transition-colors" style={btn0}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 13.5S2 9.8 2 5.5a3.5 3.5 0 0 1 6-2.45A3.5 3.5 0 0 1 14 5.5C14 9.8 8 13.5 8 13.5z" />
            </svg>
          </button>

          {/* Prev */}
          <button className="text-white/30 hover:text-white/65 transition-colors" style={btn0}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2v12M5 8l8-5v10L5 8z" />
            </svg>
          </button>

          {/* Waveform */}
          <PlayerWaveform active={!!currentStation} color={stationColor} />

          {/* Play/Pause circle */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
            style={{
              background: currentStation
                ? `linear-gradient(135deg, ${stationColor}60, ${stationColor}30)`
                : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${currentStation ? stationColor + '80' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: currentStation ? `0 0 16px ${stationColor}40` : 'none',
            }}
          >
            {currentStation ? (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="white">
                <rect x="2" y="1" width="3.5" height="12" rx="1" />
                <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 14 14" fill="white" opacity="0.6">
                <path d="M3 1.5l10 5.5-10 5.5V1.5z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button className="text-white/30 hover:text-white/65 transition-colors" style={btn0}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13 2v12M11 8L3 3v10l8-5z" />
            </svg>
          </button>
        </div>

        {/* Right: volume + listener count */}
        <div className="flex items-center gap-3 w-[220px] shrink-0 justify-end">
          {/* Mute toggle */}
          <button onClick={toggleMute} className="text-white/28 hover:text-white/60 transition-colors shrink-0" style={btn0}>
            {muted ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 6h2.5L9 2v12L4.5 10H2V6z" fill="currentColor" fillOpacity="0.25" />
                <path d="M12 6l3 4M15 6l-3 4" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 6h2.5L9 2v12L4.5 10H2V6z" fill="currentColor" fillOpacity="0.25" />
                <path d="M11.5 5.5a4 4 0 0 1 0 5" />
              </svg>
            )}
          </button>
          <input
            type="range" min={0} max={1} step={0.01}
            value={muted ? 0 : volume}
            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20"
            style={{ accentColor: stationColor }}
          />

          {/* Divider */}
          <div className="w-px h-5 bg-white/8 shrink-0" />

          {/* Listener count */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/40">
                <circle cx="6" cy="5" r="2.5" />
                <path d="M1 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" />
                <path d="M11.5 3a2.5 2.5 0 0 1 0 4M14 13.5c0-2-1.3-3.5-2.5-4" />
              </svg>
              <span className="font-mono text-[12px] font-bold" style={{ color: stationColor }}>
                {playerCount + 127}
              </span>
            </div>
            <span className="text-[8px] text-white/28 tracking-wide">Listeners</span>
          </div>
        </div>
      </div>

      {/* ── Overlay panels ───────────────────────────────────────────────── */}
      {showSettings && (
        <SettingsPanel
          volume={volume}
          zoom={zoom}
          onVolumeChange={handleVolumeChange}
          onZoomChange={handleZoomChange}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showEmotes && (
        <EmotePicker
          onSelect={e => sceneRef.current?.sendEmote(e)}
          onClose={() => setShowEmotes(false)}
        />
      )}
      {boardStation && (
        <MessageBoard
          station={boardStation}
          onClose={() => setBoardStation(null)}
          onPost={(id, text) => sceneRef.current?.postMessage(id, text)}
          onFetch={id => sceneRef.current?.fetchMessages(id) ?? Promise.resolve([])}
          liveMessages={boardMessages}
        />
      )}
    </div>
  );
}
