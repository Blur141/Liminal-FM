'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [entering, setEntering] = useState(false);

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    const name = username.trim() || `Wanderer`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('liminal-username', name);
    }
    router.push('/game');
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#0a0a14]">
      {/* Starfield bg */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() > 0.7 ? 2 : 1,
              height: Math.random() > 0.7 ? 2 : 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(100,100,200,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,100,200,1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radio signal rings */}
      <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-purple-500/20"
            style={{
              width: 300 + i * 120,
              height: 300 + i * 120,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: `ripple 3s ease-out ${i * 1}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs tracking-[0.5em] text-purple-400/60 uppercase font-mono">
            tune in · walk around · get lost
          </div>
          <h1
            className="text-5xl md:text-7xl font-pixel text-white leading-tight"
            style={{ textShadow: '0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.2)' }}
          >
            LIMINAL FM
          </h1>
          <p className="text-purple-300/70 font-mono text-sm tracking-widest uppercase">
            a virtual world of radio
          </p>
        </div>

        {/* Station previews */}
        <div className="flex flex-wrap justify-center gap-3 max-w-lg">
          {[
            { name: 'Jazz Café', color: '#d4a056', desc: 'lush & indie' },
            { name: 'Neon District', color: '#ab48d5', desc: 'ambient grooves' },
            { name: 'Lo-Fi Lounge', color: '#5b8fa8', desc: 'sonic universe' },
            { name: 'Desert Radio', color: '#e8a24a', desc: 'secret agent' },
            { name: 'Vaporwave Mall', color: '#ff80ff', desc: 'suburbs of goa' },
            { name: 'Rain Station', color: '#4e9eba', desc: 'drone zone' },
          ].map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/5 bg-white/3"
              style={{ borderColor: s.color + '30' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }} />
              <span className="text-xs font-mono" style={{ color: s.color + 'cc' }}>{s.name}</span>
            </div>
          ))}
        </div>

        {/* Enter form */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input
            type="text"
            placeholder="your name (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
            maxLength={24}
            className="w-full bg-transparent border border-white/10 rounded px-4 py-3 text-sm font-mono text-white/80 placeholder-white/20 focus:outline-none focus:border-purple-500/50 text-center tracking-widest"
            autoComplete="off"
          />
          <button
            onClick={handleEnter}
            disabled={entering}
            className="w-full py-3 px-8 font-pixel text-xs rounded transition-all duration-300"
            style={{
              background: entering ? '#2a2a42' : 'linear-gradient(135deg, #6b21a8, #4f46e5)',
              color: entering ? '#666' : '#fff',
              boxShadow: entering ? 'none' : '0 0 20px rgba(139,92,246,0.4)',
              letterSpacing: '0.1em',
            }}
          >
            {entering ? 'entering...' : 'enter world'}
          </button>
        </div>

        {/* Controls hint */}
        <div className="text-white/20 font-mono text-xs tracking-widest">
          wasd / arrow keys to move · walk near buildings to discover stations
        </div>
      </div>

      {/* Bottom attribution */}
      <div className="absolute bottom-6 text-white/15 font-mono text-xs tracking-widest">
        powered by internet radio · built with love
      </div>
    </main>
  );
}
