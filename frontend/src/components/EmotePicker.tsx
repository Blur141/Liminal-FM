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
    const h = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h, { passive: true });
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('touchstart', h);
    };
  }, [onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'z' || e.key === 'Z') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-30 sm:hidden" onClick={onClose} />

      <div
        ref={ref}
        className="
          fixed z-40 slide-up
          inset-x-0 bottom-0 rounded-t-2xl
          sm:absolute sm:inset-auto sm:bottom-14 sm:right-3 sm:rounded-xl
        "
        style={{
          background: 'rgba(8,8,20,0.96)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-white/25 tracking-widest">EMOTE</span>
            <span className="font-mono text-[9px] text-white/15 hidden sm:block">[Z] close</span>
          </div>
          {/* 5-col grid on mobile, same on desktop */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-1">
            {EMOTES.map((e) => (
              <button
                key={e}
                onClick={() => { onSelect(e); onClose(); }}
                className="flex items-center justify-center rounded transition-colors"
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  fontSize: 22,
                  background: 'rgba(255,255,255,0.04)',
                }}
                onMouseEnter={el => (el.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={el => (el.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
