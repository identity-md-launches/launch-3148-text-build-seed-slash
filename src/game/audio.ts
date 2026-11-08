import type { GameEvent } from './model';

// Gesture-unlocked, synthesized audio: no downloads, looping music or autoplay.
export class GameAudio {
  private context: AudioContext | null = null;
  enabled = true;
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Gameplay remains available when browser audio is unsupported. */ }
  }
  play(event: GameEvent) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const ctx = this.context, now = ctx.currentTime;
    const notes = event === 'combo' ? [660, 830, 990] : event === 'golden' ? [880, 1174] :
      event === 'bomb' ? [100, 65] : event === 'miss' ? [230, 170] : event === 'over' ? [330, 260, 196] : [520 + Math.random() * 220];
    notes.forEach((frequency, i) => {
      const oscillator = ctx.createOscillator(), gain = ctx.createGain();
      oscillator.type = event === 'bomb' ? 'triangle' : 'sine';
      const start = now + i * 0.075;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.75, start + 0.16);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.075, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(start); oscillator.stop(start + 0.2);
    });
  }
  close() { void this.context?.close().catch(() => {}); }
}
