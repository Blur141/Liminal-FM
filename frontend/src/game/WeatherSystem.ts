import * as Phaser from 'phaser';

export type WeatherState = 'clear' | 'light-rain' | 'heavy-rain';

export class WeatherSystem {
  private scene: Phaser.Scene;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private state: WeatherState = 'clear';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createTextures();
    this.applyFromClock();
  }

  private createTextures() {
    if (!this.scene.textures.exists('rain-drop')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xaaddff, 1);
      g.fillRect(0, 0, 1, 6);
      g.generateTexture('rain-drop', 1, 6);
      g.destroy();
    }
  }

  // Synchronized across all players: weather changes every 5 minutes
  private applyFromClock() {
    const slot = Math.floor(Date.now() / (5 * 60 * 1000));
    const pick = slot % 4; // 0=heavy, 1=light, 2=clear, 3=clear
    if (pick === 0) this.set('heavy-rain');
    else if (pick === 1) this.set('light-rain');
    else this.set('clear');
  }

  set(state: WeatherState) {
    this.stop();
    this.state = state;
    if (state === 'clear') return;

    const w = this.scene.scale.width;
    const heavy = state === 'heavy-rain';

    this.emitter = this.scene.add.particles(w / 2, -8, 'rain-drop', {
      x: { min: -w / 2 - 60, max: w / 2 + 60 },
      speedX: { min: 35, max: 70 },
      speedY: { min: heavy ? 450 : 260, max: heavy ? 720 : 420 },
      alpha: { start: heavy ? 0.6 : 0.35, end: 0 },
      scale: { min: 0.5, max: heavy ? 1.6 : 1.1 },
      lifespan: { min: 600, max: 1000 },
      frequency: heavy ? 2 : 7,
      quantity: heavy ? 5 : 2,
      blendMode: 'ADD',
    });
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(800);
  }

  stop() {
    if (this.emitter) {
      this.emitter.destroy();
      this.emitter = null;
    }
    this.state = 'clear';
  }

  getState(): WeatherState { return this.state; }
  isRaining(): boolean { return this.state !== 'clear'; }

  destroy() { this.stop(); }
}
