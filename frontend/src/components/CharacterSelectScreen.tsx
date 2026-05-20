'use client';

import { useState } from 'react';

export interface CharacterDef {
  id: string;
  name: string;
  tagline: string;
  color: string;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'assassin',      name: 'Assassin',      tagline: 'shadow walker',   color: '#c780ff' },
  { id: 'aztec-leader',  name: 'Aztec Leader',  tagline: 'ancient signal',  color: '#e8a24a' },
  { id: 'maya-leader',   name: 'Maya Leader',   tagline: 'jungle frequency', color: '#80ffb0' },
  { id: 'nordic-leader', name: 'Nordic Leader', tagline: 'frost broadcast',  color: '#80d4ff' },
  { id: 'robber',        name: 'Robber',        tagline: 'pirate waves',     color: '#ff9580' },
  { id: 'thug',          name: 'Thug',          tagline: 'underground bass', color: '#ff6b9d' },
];

interface Props {
  onSelect: (characterId: string) => void;
}

export default function CharacterSelectScreen({ onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  function confirm(id: string) {
    setSelected(id);
    setTimeout(() => onSelect(id), 320);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a14] overflow-auto py-8">
      {/* CRT scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-[9999]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        }} />

      {/* Header */}
      <div className="text-center mb-8 px-4">
        <div className="font-pixel text-[9px] text-white/25 tracking-[0.4em] mb-3">LIMINAL FM</div>
        <h1 className="font-pixel text-white text-[13px] leading-loose mb-2"
          style={{ textShadow: '0 0 24px rgba(199,128,255,0.6)' }}>
          CHOOSE YOUR WANDERER
        </h1>
        <p className="font-mono text-[11px] text-white/30">select a character to enter the world</p>
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-6 max-w-2xl w-full">
        {CHARACTERS.map(char => {
          const isHovered  = hovered  === char.id;
          const isSelected = selected === char.id;

          return (
            <button
              key={char.id}
              onMouseEnter={() => setHovered(char.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => confirm(char.id)}
              className="relative flex flex-col items-center rounded-xl transition-all duration-200 overflow-hidden"
              style={{
                minHeight: 0,
                minWidth: 0,
                padding: 0,
                background: isHovered || isSelected
                  ? `linear-gradient(160deg, ${char.color}18, ${char.color}08)`
                  : 'rgba(13,13,26,0.9)',
                border: `1px solid ${isHovered || isSelected ? char.color + '50' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isHovered || isSelected
                  ? `0 0 24px ${char.color}20, inset 0 0 16px ${char.color}08`
                  : 'none',
                transform: isHovered ? 'translateY(-2px)' : 'none',
              }}
            >
              {/* Preview image container */}
              <div className="w-full aspect-square relative overflow-hidden"
                style={{ background: `radial-gradient(circle, ${char.color}10 0%, transparent 70%)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/characters/${char.id}/Front - Idle/Front - Idle_000.png`}
                  alt={char.name}
                  className="w-full h-full object-contain transition-transform duration-200"
                  style={{
                    imageRendering: 'pixelated',
                    filter: isSelected ? `drop-shadow(0 0 8px ${char.color})` : undefined,
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  }}
                  draggable={false}
                />

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: `${char.color}22` }}>
                    <div className="font-pixel text-[8px] text-white px-2 py-1 rounded"
                      style={{ background: char.color + 'cc' }}>
                      SELECTED
                    </div>
                  </div>
                )}

                {/* Glow dot */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: char.color,
                    boxShadow: `0 0 6px ${char.color}`,
                    opacity: isHovered || isSelected ? 1 : 0.35,
                  }} />
              </div>

              {/* Info */}
              <div className="w-full px-3 py-2.5 text-left">
                <div className="font-pixel text-[8px] mb-0.5"
                  style={{ color: isHovered || isSelected ? char.color : 'rgba(255,255,255,0.75)' }}>
                  {char.name.toUpperCase()}
                </div>
                <div className="font-mono text-[9px] text-white/30">{char.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className="font-mono text-[9px] text-white/18 mt-8 tracking-widest">
        CLICK TO SELECT · ENTER TO CONFIRM
      </p>
    </div>
  );
}
