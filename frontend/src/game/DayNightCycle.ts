export type TimePeriod = 'midnight' | 'dawn' | 'morning' | 'day' | 'afternoon' | 'dusk' | 'evening' | 'night';

export interface TimeInfo {
  hour: number;
  period: TimePeriod;
  label: string;
  overlayColor: number;
  overlayAlpha: number;
  // True during the midnight window when the hidden club is open
  isMidnight: boolean;
}

export class DayNightCycle {
  getTimeInfo(): TimeInfo {
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    const isMidnight = now.getHours() >= 22 || now.getHours() < 5;

    // Each period returns an overlay color (multiply over world) and alpha
    if (h >= 0 && h < 2) {
      return { hour: h, period: 'midnight', label: '🌑 Midnight', overlayColor: 0x020210, overlayAlpha: 0.68, isMidnight };
    }
    if (h >= 2 && h < 5) {
      return { hour: h, period: 'midnight', label: '🌑 Deep Night', overlayColor: 0x030318, overlayAlpha: 0.72, isMidnight };
    }
    if (h >= 5 && h < 7) {
      const t = (h - 5) / 2;
      return { hour: h, period: 'dawn', label: '🌅 Dawn', overlayColor: 0x180828, overlayAlpha: 0.55 - t * 0.3, isMidnight };
    }
    if (h >= 7 && h < 9) {
      const t = (h - 7) / 2;
      return { hour: h, period: 'morning', label: '🌤️ Morning', overlayColor: 0x200a08, overlayAlpha: 0.2 - t * 0.2, isMidnight };
    }
    if (h >= 9 && h < 16) {
      return { hour: h, period: 'day', label: '', overlayColor: 0x000000, overlayAlpha: 0, isMidnight };
    }
    if (h >= 16 && h < 18) {
      const t = (h - 16) / 2;
      return { hour: h, period: 'afternoon', label: '🌇 Afternoon', overlayColor: 0x200808, overlayAlpha: t * 0.18, isMidnight };
    }
    if (h >= 18 && h < 20) {
      const t = (h - 18) / 2;
      return { hour: h, period: 'dusk', label: '🌆 Dusk', overlayColor: 0x280808, overlayAlpha: 0.18 + t * 0.18, isMidnight };
    }
    if (h >= 20 && h < 22) {
      const t = (h - 20) / 2;
      return { hour: h, period: 'evening', label: '🌃 Evening', overlayColor: 0x080820, overlayAlpha: 0.35 + t * 0.15, isMidnight };
    }
    // 22–24
    return { hour: h, period: 'night', label: '🌙 Night', overlayColor: 0x04041a, overlayAlpha: 0.52, isMidnight };
  }
}
