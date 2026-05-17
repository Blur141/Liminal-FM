'use client';

import { useEffect, useRef } from 'react';

interface Props {
  volume: number;
  zoom: number;
  onVolumeChange: (v: number) => void;
  onZoomChange: (z: number) => void;
  onClose: () => void;
}

const ZOOM_LEVELS = [
  { label: '1×', value: 1 },
  { label: '1.5×', value: 1.5 },
  { label: '2×', value: 2 },
];

export default function SettingsPanel({ volume, zoom, onVolumeChange, onZoomChange, onClose }: Props) {
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
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      {/* Backdrop on mobile */}
      <div className="fixed inset-0 z-30 sm:hidden bg-black/40" onClick={onClose} />

      <div
        ref={ref}
        className="
          fixed z-40 slide-up
          inset-x-0 bottom-0 rounded-t-2xl
          sm:absolute sm:inset-auto sm:bottom-auto sm:top-12 sm:right-3 sm:rounded-xl sm:w-56
        "
        style={{
          background: 'rgba(8,8,20,0.96)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 py-3 sm:px-4 sm:py-3">
          <div className="font-pixel text-[9px] text-white/35 tracking-widest mb-5">SETTINGS</div>

          {/* Volume */}
          <div className="mb-5">
            <div className="font-mono text-[11px] text-white/50 mb-3 flex justify-between items-center">
              <span>Volume</span>
              <span className="text-white/30">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0} max={1} step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: '#c780ff' }}
            />
          </div>

          {/* Zoom */}
          <div className="mb-5">
            <div className="font-mono text-[11px] text-white/50 mb-3">Camera Zoom</div>
            <div className="flex gap-2">
              {ZOOM_LEVELS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => onZoomChange(value)}
                  className="flex-1 rounded transition-all"
                  style={{
                    minHeight: 40,
                    background: zoom === value ? 'rgba(199,128,255,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${zoom === value ? '#c780ff44' : 'rgba(255,255,255,0.06)'}`,
                    color: zoom === value ? '#c780ff' : 'rgba(255,255,255,0.35)',
                    fontFamily: '"Share Tech Mono", monospace',
                    fontSize: '11px',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Key reference */}
          <div className="border-t border-white/5 pt-4 hidden sm:block">
            <div className="font-mono text-[9px] text-white/20 leading-loose space-y-0.5">
              <div>WASD / ↑↓←→ — move</div>
              <div>Z — emote picker</div>
              <div>F — message board</div>
              <div>Enter — chat</div>
            </div>
          </div>

          {/* Close button (mobile) */}
          <button
            onClick={onClose}
            className="sm:hidden w-full mt-3 rounded-lg font-mono text-[11px] text-white/40"
            style={{ background: 'rgba(255,255,255,0.04)', minHeight: 44 }}
          >
            close
          </button>
        </div>
      </div>
    </>
  );
}
