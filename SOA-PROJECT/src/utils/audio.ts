// Web Audio API Synthesizer for Collision / Cascade Risk Warning Alert

class SoundAlertController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBeeping: boolean = false;
  private lastBeepTime: number = 0;

  constructor() {
    // Lazy initialize on first interaction
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playWarningChime(severity: 'warning' | 'critical' = 'warning') {
    if (this.isMuted) return;
    const now = Date.now();
    // Throttle so it doesn't blast every 16ms frame
    if (now - this.lastBeepTime < (severity === 'critical' ? 450 : 850)) {
      return;
    }
    this.lastBeepTime = now;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (severity === 'critical') {
        // High-low urgency double beep
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.15); // D5

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.23);
      } else {
        // Single advisory ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  }
}

export const alertSound = new SoundAlertController();
