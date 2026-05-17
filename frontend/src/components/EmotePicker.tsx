'use client';

import { useEffect, useRef } from 'react';
import { EMOTES } from '@/game/constants';

interface Props {
  onSelect: (emote: string) => void;
  onClose: () => void;
}

export default function EmotePicker({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'z' || e.key === 'Z') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 right-4 z-30 fade-in"
      style={{
        background: 'rgba(10,10,20,0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '8px 6px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="text-center font-mono text-[9px] text-white/25 mb-2 tracking-widest">EMOTE [Z]</div>
      <div className="grid grid-cols-5 gap-1">
        {EMOTES.map((e) => (
          <button
            key={e}
            onClick={() => { onSelect(e); onClose(); }}
            className="w-9 h-9 flex items-center justify-center text-lg rounded transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', fontSize: '20px' }}
            onMouseEnter={(el) => (el.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={(el) => (el.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            title={e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
