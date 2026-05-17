'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Station } from '@/game/constants';
import { StationMessage } from '@/game/MultiplayerManager';

interface Props {
  station: Station;
  onClose: () => void;
  onPost: (stationId: string, text: string) => void;
  onFetch: (stationId: string) => Promise<StationMessage[]>;
  liveMessages: StationMessage[];
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBoard({ station, onClose, onPost, onFetch, liveMessages }: Props) {
  const [messages, setMessages] = useState<StationMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onFetch(station.id).then(setMessages);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [station.id, onFetch]);

  // Merge real-time socket messages
  useEffect(() => {
    const fresh = liveMessages.filter(m => m.stationId === station.id);
    if (!fresh.length) return;
    setMessages(prev => {
      const ids = new Set(prev.map(m => m.id));
      const novel = fresh.filter(m => !ids.has(m.id));
      return novel.length ? [novel[novel.length - 1], ...prev] : prev;
    });
  }, [liveMessages, station.id]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handlePost = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    onPost(station.id, text);
    setInput('');
  }, [input, onPost, station.id]);

  return (
    <>
      {/* Full-screen backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="
          fixed z-50 slide-up
          inset-x-0 bottom-0 rounded-t-2xl
          sm:absolute sm:inset-auto sm:bottom-16 sm:left-1/2 sm:-translate-x-1/2
          sm:rounded-xl sm:w-[420px]
        "
        style={{
          background: 'rgba(6,6,18,0.97)',
          border: `1px solid ${station.accentHex}25`,
          boxShadow: `0 -4px 40px ${station.accentHex}12`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b" style={{ borderColor: station.accentHex + '18' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: station.accentHex, boxShadow: `0 0 6px ${station.accentHex}` }} />
            <span className="font-pixel text-[9px]" style={{ color: station.accentHex }}>{station.name.toUpperCase()}</span>
            <span className="font-mono text-[10px] text-white/25">board</span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[11px] text-white/30 hover:text-white/60 transition-colors px-2"
            style={{ minHeight: 36, minWidth: 36 }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} className="chat-log overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: '40vh' }}>
          {messages.length === 0 ? (
            <p className="font-mono text-[11px] text-white/20 text-center py-6 leading-relaxed">
              no messages yet<br />be the first to leave a note ✦
            </p>
          ) : messages.map(m => (
            <div key={m.id} className="fade-in">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-mono text-[11px] font-bold" style={{ color: m.color }}>{m.username}</span>
                <span className="font-mono text-[9px] text-white/20">{fmt(m.timestamp)}</span>
              </div>
              <p className="font-mono text-[12px] text-white/60 leading-relaxed pl-1">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: station.accentHex + '18' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handlePost(); }
              if (e.key === 'Escape') { e.preventDefault(); onClose(); }
              e.stopPropagation();
            }}
            placeholder={`leave a note at ${station.name}…`}
            maxLength={140}
            className="flex-1 bg-transparent font-mono text-white/70 placeholder-white/15 focus:outline-none"
            style={{ fontSize: 14 }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <span className="font-mono text-[9px] text-white/15 shrink-0">{input.length}/140</span>
          <button
            onClick={handlePost}
            disabled={!input.trim()}
            className="shrink-0 font-mono text-[11px] px-3 py-2 rounded transition-all"
            style={{
              minHeight: 40,
              background: input.trim() ? station.accentHex + '28' : 'transparent',
              color: input.trim() ? station.accentHex : 'rgba(255,255,255,0.2)',
              border: `1px solid ${input.trim() ? station.accentHex + '40' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            post
          </button>
        </div>
      </div>
    </>
  );
}
