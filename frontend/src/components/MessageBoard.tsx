'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Station } from '@/game/constants';
import { StationMessage } from '@/game/MultiplayerManager';

interface Props {
  station: Station;
  onClose: () => void;
  onPost: (stationId: string, text: string) => void;
  onFetch: (stationId: string) => Promise<StationMessage[]>;
  liveMessages: StationMessage[]; // pushed from socket
}

export default function MessageBoard({ station, onClose, onPost, onFetch, liveMessages }: Props) {
  const [messages, setMessages] = useState<StationMessage[]>([]);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch existing messages on open
  useEffect(() => {
    onFetch(station.id).then(setMessages);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [station.id, onFetch]);

  // Merge in live socket messages
  useEffect(() => {
    const relevant = liveMessages.filter(m => m.stationId === station.id);
    if (relevant.length === 0) return;
    setMessages(prev => {
      const ids = new Set(prev.map(m => m.id));
      const novel = relevant.filter(m => !ids.has(m.id));
      return novel.length ? [novel[novel.length - 1], ...prev] : prev;
    });
  }, [liveMessages, station.id]);

  // Scroll to top on new message
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [messages.length]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handlePost = useCallback(() => {
    const text = input.trim();
    if (!text || posting) return;
    setPosting(true);
    onPost(station.id, text);
    setInput('');
    setPosting(false);
  }, [input, posting, onPost, station.id]);

  const fmt = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center pb-16 pointer-events-none"
    >
      <div
        ref={panelRef}
        className="pointer-events-auto fade-in w-full max-w-md mx-4"
        style={{
          background: 'rgba(8,8,20,0.95)',
          border: `1px solid ${station.accentHex}30`,
          borderRadius: 10,
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 30px ${station.accentHex}18`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: station.accentHex + '20' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: station.accentHex, boxShadow: `0 0 6px ${station.accentHex}` }} />
            <span className="font-pixel text-[9px]" style={{ color: station.accentHex }}>{station.name.toUpperCase()}</span>
            <span className="font-mono text-[10px] text-white/25">message board</span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors px-2"
          >
            [esc] close
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} className="chat-log overflow-y-auto px-4 py-3 space-y-2" style={{ maxHeight: 200 }}>
          {messages.length === 0 && (
            <p className="font-mono text-[10px] text-white/20 text-center py-4">
              no messages yet — be the first to leave a note
            </p>
          )}
          {messages.map(m => (
            <div key={m.id} className="fade-in">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-mono text-[10px] font-bold" style={{ color: m.color }}>{m.username}</span>
                <span className="font-mono text-[9px] text-white/20">{fmt(m.timestamp)}</span>
              </div>
              <p className="font-mono text-[11px] text-white/60 leading-relaxed pl-1">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Input */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-t"
          style={{ borderColor: station.accentHex + '20' }}
        >
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
            placeholder={`leave a note at ${station.name}...`}
            maxLength={140}
            className="flex-1 bg-transparent font-mono text-xs text-white/70 placeholder-white/15 focus:outline-none"
            autoComplete="off"
          />
          <span className="font-mono text-[9px] text-white/15">{input.length}/140</span>
          <button
            onClick={handlePost}
            disabled={!input.trim()}
            className="font-mono text-[10px] px-3 py-1 rounded transition-all"
            style={{
              background: input.trim() ? station.accentHex + '30' : 'transparent',
              color: input.trim() ? station.accentHex : 'rgba(255,255,255,0.2)',
              border: `1px solid ${input.trim() ? station.accentHex + '40' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            post
          </button>
        </div>
      </div>
    </div>
  );
}
