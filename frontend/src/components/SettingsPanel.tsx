'use client';

import { useEffect, useRef } from 'react';

interface Props {
  volume: number;
  zoom: number;
  onVolumeChange: (v: number) => void;
  onZoomChange: (z: number) => void;
  onClose: () => void;
}

const ZOOM_LEVELS = [{ label: '1×', value: 1 }, { label: '1.5×', value: 1.5 }, { label: '2×', value: 2 }];

export default function SettingsPanel({ volume, zoom, onVolumeChange, onZoomChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-12 right-4 z-30 fade-in w-56"
      style={{
        background: 'rgba(8,8,18,0.94)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8,
        padding: '14px 16px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="font-pixel text-[9px] text-white/40 tracking-widest mb-4">SETTINGS</div>

      {/* Volume */}
      <div className="mb-4">
        <div className="font-mono text-[10px] text-white/50 mb-2 flex justify-between">
          <span>Volume</span>
          <span className="text-white/30">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full h-1 rounded appearance-none cursor-pointer"
          style={{ accentColor: '#c780ff' }}
        />
      </div>

      {/* Zoom */}
      <div className="mb-4">
        <div className="font-mono text-[10px] text-white/50 mb-2">Camera Zoom</div>
        <div className="flex gap-2">
          {ZOOM_LEVELS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onZoomChange(value)}
              className="flex-1 py-1 font-mono text-[10px] rounded transition-all"
              style={{
                background: zoom === value ? 'rgba(199,128,255,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${zoom === value ? '#c780ff44' : 'rgba(255,255,255,0.06)'}`,
                color: zoom === value ? '#c780ff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5 pt-3">
        <div className="font-mono text-[9px] text-white/20 leading-relaxed">
          <div>WASD / arrows — move</div>
          <div>Z — emote picker</div>
          <div>F — station message board</div>
          <div>Enter — open chat</div>
        </div>
      </div>
    </div>
  );
}
