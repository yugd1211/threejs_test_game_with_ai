export class Sound {
  enabled = true;
  private context?: AudioContext;
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  play(kind: string) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const notes: Record<string, number[]> = {
      jump: [360, 500],
      crystal: [740, 990],
      checkpoint: [440, 660, 880],
      fall: [220, 130],
      complete: [523, 659, 784, 1047],
      start: [440, 660],
    };
    const melody = notes[kind];
    if (!melody) return;
    const ctx = this.context;
    melody.forEach((hz, i) => {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.08;
      oscillator.type = 'sine';
      oscillator.frequency.value = hz;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });
  }
}
