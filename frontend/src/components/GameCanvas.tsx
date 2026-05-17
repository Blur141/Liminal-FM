'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Station } from '@/game/constants';
import { ChatMessage, StationMessage } from '@/game/MultiplayerManager';
import { TimeInfo } from '@/game/DayNightCycle';

const EmotePicker   = dynamic(() => import('./EmotePicker'),   { ssr: false });
const SettingsPanel = dynamic(() => import('./SettingsPanel'), { ssr: false });
const MessageBoard  = dynamic(() => import('./MessageBoard'),  { ssr: false });

interface ChatEntry extends ChatMessage { key: string; }

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
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // UI panels
  const [showEmotes, setShowEmotes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [boardStation, setBoardStation] = useState<Station | null>(null);
  const [boardMessages, setBoardMessages] = useState<StationMessage[]>([]);

  // Settings
  const [volume, setVolume] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [muted, setMuted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [username] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('liminal-username') ?? 'Wanderer') : 'Wanderer'
  );

  // ── Phaser init ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    async function initGame() {
      const Phaser = await import('phaser');
      const { MainScene } = await import('@/game/scenes/MainScene');
      if (destroyed || !containerRef.current) return;

      const scene = new MainScene();
      scene.username = username;
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
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#0a0a14',
        pixelArt: true,
        roundPixels: true,
        scene: [scene],
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        render: { antialias: false, pixelArt: true },
      });

      // Sync initial zoom from scene's responsive calc
      setTimeout(() => {
        const defaultZoom = scene.getDefaultZoom?.() ?? 1.5;
        setZoom(defaultZoom);
      }, 200);

      setLoaded(true);
    }

    initGame();
    return () => {
      destroyed = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleChatSubmit = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) return;
    sceneRef.current?.sendChat(msg);
    setChatInput('');
  }, [chatInput]);

  const openChat = useCallback(() => {
    setChatOpen(true);
    // Slight delay so the input renders before focus
    setTimeout(() => chatInputRef.current?.focus(), 80);
  }, []);

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

  // Global keyboard shortcuts (desktop only — mobile uses touch)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!chatOpen) { e.preventDefault(); openChat(); }
        else if (chatInput.trim()) { e.preventDefault(); handleChatSubmit(); }
      }
      if (e.key === 'Escape') {
        setChatOpen(false); setChatInput('');
        setShowEmotes(false); setShowSettings(false); setBoardStation(null);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [chatOpen, chatInput, handleChatSubmit, openChat]);

  const isNight = timeInfo && ['night', 'midnight', 'evening'].includes(timeInfo.period);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a14] select-none">
      {/* Phaser canvas mount */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a14] z-50 gap-4">
          <p className="font-pixel text-purple-400 text-xs tracking-widest animate-pulse">LOADING WORLD…</p>
          <p className="font-mono text-white/20 text-xs tracking-widest">tuning frequencies</p>
        </div>
      )}

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between z-20 pointer-events-none"
        style={{ padding: 'calc(8px + env(safe-area-inset-top, 0px)) 12px 8px' }}
      >
        {/* Left */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-white/40 text-[9px] tracking-widest">LIMINAL FM</span>
          {/* Time label — hide on small screens */}
          {timeInfo?.label && (
            <span className="hidden sm:inline font-mono text-[9px] text-white/22">{timeInfo.label}</span>
          )}
          {weatherState !== 'clear' && (
            <span className="text-sm leading-none">{weatherState === 'heavy-rain' ? '⛈' : '🌧'}</span>
          )}
        </div>

        {/* Center: Now Playing pill */}
        <div className="flex-1 flex justify-center px-2">
          {currentStation ? (
            <div key={currentStation.id} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-black/50 border border-white/5 fade-in max-w-[90%] sm:max-w-none overflow-hidden">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 animate-pulse"
                style={{ backgroundColor: currentStation.accentHex, boxShadow: `0 0 6px ${currentStation.accentHex}` }} />
              <span className="font-pixel text-[7px] sm:text-[9px] tracking-widest truncate" style={{ color: currentStation.accentHex }}>
                {currentStation.name.toUpperCase()}
              </span>
              <span className="hidden md:block font-mono text-[10px] text-white/30 shrink-0">· {currentStation.desc}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/5">
              <span className="w-2 h-2 rounded-full bg-white/15" />
              <span className="font-mono text-[10px] text-white/20 tracking-widest">walk to discover stations</span>
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <span className="hidden sm:block font-mono text-[10px] text-white/25 mr-1">{playerCount} online</span>
          <button
            onClick={toggleMute}
            className="text-base text-white/40 hover:text-white/70 active:scale-90 transition-all"
            style={{ minHeight: 36, minWidth: 36, padding: 4 }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => setShowSettings(v => !v)}
            className="text-base text-white/40 hover:text-white/70 active:scale-90 transition-all"
            style={{ minHeight: 36, minWidth: 36, padding: 4 }}
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          volume={volume}
          zoom={zoom}
          onVolumeChange={handleVolumeChange}
          onZoomChange={handleZoomChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Mini-map (hidden on very small screens) ──────────────────── */}
      <div
        className="absolute z-20 pointer-events-none opacity-55 hover:opacity-85 transition-opacity hidden xs:block"
        style={{ top: 'calc(48px + env(safe-area-inset-top, 0px))', right: 12 }}
      >
        <div className="border border-white/8 bg-black/50 rounded overflow-hidden" style={{ width: 88, height: 68 }}>
          <div className="relative w-full h-full" style={{ background: '#0d0d1a' }}>
            <div className="absolute bg-white/5" style={{ left: '33%', top: 0, bottom: 0, width: 1 }} />
            <div className="absolute bg-white/5" style={{ left: '67%', top: 0, bottom: 0, width: 1 }} />
            <div className="absolute bg-white/5" style={{ top: '33%', left: 0, right: 0, height: 1 }} />
            <div className="absolute bg-white/5" style={{ top: '67%', left: 0, right: 0, height: 1 }} />
            {[
              { x: 13, y: 14, c: '#d4a056', id: 'jazz-cafe' },
              { x: 50, y: 8,  c: '#4e9eba', id: 'rain-station' },
              { x: 87, y: 11, c: '#ab48d5', id: 'neon-district' },
              { x: 11, y: 50, c: '#5b8fa8', id: 'lofi-lounge' },
              { x: 87, y: 50, c: '#e8a24a', id: 'desert-radio' },
              { x: 50, y: 88, c: '#e040fb', id: 'vaporwave-mall' },
              ...(isNight ? [{ x: 87, y: 88, c: '#4455ff', id: 'midnight-club' }] : []),
            ].map(dot => (
              <div key={dot.id} className="absolute rounded-full transition-all duration-500"
                style={{
                  left: `${dot.x}%`, top: `${dot.y}%`, width: 5, height: 5,
                  backgroundColor: currentStation?.id === dot.id ? dot.c : dot.c + '77',
                  boxShadow: currentStation?.id === dot.id ? `0 0 8px ${dot.c}` : 'none',
                  transform: 'translate(-50%,-50%)',
                  transition: 'box-shadow 0.5s, background-color 0.5s',
                }}
              />
            ))}
          </div>
          <div className="absolute bottom-0 inset-x-0 text-center font-pixel text-[5px] text-white/15 pb-0.5">MAP</div>
        </div>
      </div>

      {/* ── Discovery toast ──────────────────────────────────────────── */}
      {discoveredStation && (
        <div className="absolute top-16 inset-x-0 flex justify-center z-30 pointer-events-none fade-in">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border" style={{ borderColor: discoveredStation.accentHex + '50' }}>
            <span>🏴‍☠️</span>
            <span className="font-pixel text-[8px]" style={{ color: discoveredStation.accentHex }}>PIRATE STATION DISCOVERED!</span>
          </div>
        </div>
      )}

      {/* ── Station info (left side, desktop) / bottom pill (mobile) ─── */}
      {currentStation && (
        <>
          {/* Desktop: left side strip */}
          <div className="hidden sm:block absolute left-3 bottom-20 z-20 fade-in pointer-events-none" style={{ borderLeft: `2px solid ${currentStation.accentHex}45` }}>
            <div className="pl-3">
              <div className="font-pixel text-[7px] mb-1" style={{ color: currentStation.accentHex }}>NOW PLAYING</div>
              <div className="font-mono text-[11px] text-white/55">{currentStation.desc}</div>
            </div>
          </div>
        </>
      )}

      {/* ── Near-station hint ────────────────────────────────────────── */}
      {nearStation && !boardStation && (
        <div className="absolute inset-x-0 flex justify-center z-20 pointer-events-auto fade-in"
          style={{ top: 'calc(52px + env(safe-area-inset-top, 0px))' }}>
          <button
            onClick={() => setBoardStation(nearStation)}
            className="flex items-center gap-2 font-mono text-[10px] text-white/40 hover:text-white/70 active:scale-95 transition-all px-3 py-1.5 rounded-full bg-black/40 border border-white/8"
            style={{ minHeight: 36 }}
          >
            <span>📋</span>
            <span className="hidden sm:inline">[F]</span>
            <span>Message Board · {nearStation.name}</span>
          </button>
        </div>
      )}

      {/* ── Chat log ─────────────────────────────────────────────────── */}
      {!boardStation && (
        <div className="absolute z-20 pointer-events-none"
          style={{
            right: 12,
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            width: 'min(288px, calc(100vw - 24px))',
          }}>
          <div className="chat-log max-h-32 sm:max-h-44 overflow-y-auto flex flex-col gap-1 pr-1">
            {chatLog.slice(-10).map(msg => (
              <div key={msg.key} className="fade-in flex items-start gap-1.5">
                <span className="font-mono text-[10px] mt-0.5 shrink-0" style={{ color: msg.color }}>{msg.username}:</span>
                <span className="font-mono text-[10px] text-white/55 break-all">{msg.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ── Emote picker ─────────────────────────────────────────────── */}
      {showEmotes && (
        <EmotePicker
          onSelect={(e) => sceneRef.current?.sendEmote(e)}
          onClose={() => setShowEmotes(false)}
        />
      )}

      {/* ── Message board ────────────────────────────────────────────── */}
      {boardStation && (
        <MessageBoard
          station={boardStation}
          onClose={() => setBoardStation(null)}
          onPost={(id, text) => sceneRef.current?.postMessage(id, text)}
          onFetch={(id) => sceneRef.current?.fetchMessages(id) ?? Promise.resolve([])}
          liveMessages={boardMessages}
        />
      )}

      {/* ── BOTTOM BAR ───────────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 flex items-center gap-2 z-20 bg-gradient-to-t from-black/50 to-transparent"
        style={{
          bottom: 0,
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
          paddingTop: 8,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {/* Keyboard hint — desktop only */}
        <span className="hidden md:block font-mono text-[9px] text-white/15 tracking-widest">WASD · arrows</span>

        <div className="flex-1" />

        {/* Emote button */}
        <button
          onClick={() => setShowEmotes(v => !v)}
          className="font-mono text-[11px] text-white/30 hover:text-white/60 active:scale-90 transition-all rounded-lg border border-white/6 px-3"
          style={{ minHeight: 40 }}
          aria-label="Emotes"
        >
          😊 <span className="hidden sm:inline text-[10px]">[Z]</span>
        </button>

        {/* Chat */}
        {chatOpen ? (
          <div className="flex items-center gap-2 bg-black/75 border border-white/10 rounded-lg px-3 flex-1 max-w-xs sm:max-w-sm">
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleChatSubmit(); }
                if (e.key === 'Escape') { setChatOpen(false); setChatInput(''); }
                e.stopPropagation();
              }}
              placeholder="say something…"
              maxLength={200}
              className="flex-1 bg-transparent font-mono text-white placeholder-white/20 focus:outline-none py-2"
              style={{ fontSize: 14 }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <button
              onClick={handleChatSubmit}
              className="font-mono text-[11px] text-white/40 hover:text-white/70 transition-colors shrink-0"
              style={{ minHeight: 40, minWidth: 44 }}
            >
              send
            </button>
          </div>
        ) : (
          <button
            onClick={openChat}
            className="font-mono text-[11px] text-white/25 hover:text-white/55 active:scale-90 transition-all rounded-lg border border-white/6 px-3"
            style={{ minHeight: 40 }}
            aria-label="Chat"
          >
            💬 <span className="hidden sm:inline text-[10px]">[↵]</span>
          </button>
        )}
      </div>
    </div>
  );
}
