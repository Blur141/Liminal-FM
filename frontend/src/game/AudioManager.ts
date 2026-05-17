import { STATIONS, Station } from './constants';

interface TrackState {
  audio: HTMLAudioElement;
  targetVolume: number;
  currentVolume: number;
  loaded: boolean;
}

export class AudioManager {
  private tracks = new Map<string, TrackState>();
  private masterVolume = 1;
  private muted = false;
  private activeStationId: string | null = null;
  private discoveredIds = new Set<string>();

  onStationDiscovered?: (station: Station) => void;

  init() {
    for (const station of STATIONS) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'none';
      audio.volume = 0;
      this.tracks.set(station.id, { audio, targetVolume: 0, currentVolume: 0, loaded: false });
    }
  }

  private isStationActive(station: Station): boolean {
    if (!station.nightOnly) return true;
    const h = new Date().getHours();
    return h >= 22 || h < 5;
  }

  update(playerX: number, playerY: number) {
    let closestId: string | null = null;
    let closestDist = Infinity;

    for (const station of STATIONS) {
      const track = this.tracks.get(station.id)!;

      if (this.muted || !this.isStationActive(station)) {
        track.targetVolume = 0;
        continue;
      }

      const dx = playerX - station.x;
      const dy = playerY - station.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const raw = Math.max(0, 1 - dist / station.zoneRadius);
      const vol = raw * raw; // quadratic falloff

      track.targetVolume = vol;

      if (vol > 0 && dist < closestDist) {
        closestDist = dist;
        closestId = station.id;
      }

      // Fire discovery event for hidden stations on first entry
      if (vol > 0 && station.hidden && !this.discoveredIds.has(station.id)) {
        this.discoveredIds.add(station.id);
        this.onStationDiscovered?.(station);
      }
    }

    this.activeStationId = closestId;

    // Smooth volume lerp + auto-play
    this.tracks.forEach((track, id) => {
      const diff = track.targetVolume - track.currentVolume;
      track.currentVolume += diff * 0.05;

      if (track.currentVolume > 0.01) this.ensurePlaying(id, track);

      const vol = Math.min(1, track.currentVolume * this.masterVolume);
      if (Math.abs(track.audio.volume - vol) > 0.001) {
        track.audio.volume = vol;
      }
    });
  }

  private ensurePlaying(id: string, track: TrackState) {
    if (!track.loaded) {
      const station = STATIONS.find((s) => s.id === id);
      if (!station) return;
      track.audio.src = station.stream;
      track.loaded = true;
      track.audio.play().catch(() => { track.loaded = false; });
    } else if (track.audio.paused) {
      track.audio.play().catch(() => {});
    }
  }

  getActiveStation(): Station | null {
    if (!this.activeStationId) return null;
    return STATIONS.find((s) => s.id === this.activeStationId) ?? null;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.tracks.forEach((t) => { t.audio.volume = 0; });
  }

  setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  destroy() {
    this.tracks.forEach((t) => { t.audio.pause(); t.audio.src = ''; });
    this.tracks.clear();
  }
}
