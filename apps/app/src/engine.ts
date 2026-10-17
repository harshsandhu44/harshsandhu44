// Your car's engine, synthesised: two sawtooth notes (the firing frequency and half of it)
// through a lowpass. Revs climb through each gear from about 7,000 to 12,000 rpm, and a V6 fires
// three times a revolution. Only made from a click, so browsers allow the sound.
export function createEngine() {
  const ctx = new AudioContext();
  const out = ctx.createGain();
  out.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  filter.connect(out).connect(ctx.destination);
  const notes = [1, 0.5].map((f) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.connect(filter);
    o.start();
    return { o, f };
  });
  return {
    // Speed as a share of top speed, throttle 0 to 1.
    set(speed: number, throttle: number) {
      const inGear = (Math.min(Math.max(speed, 0), 1) * 8) % 1;
      const hz = ((7000 + 5000 * inGear) / 60) * 3;
      const t = ctx.currentTime;
      for (const { o, f } of notes) o.frequency.setTargetAtTime(hz * f, t, 0.03);
      out.gain.setTargetAtTime(0.03 + 0.07 * throttle, t, 0.05);
    },
    stop() {
      void ctx.close();
    },
  };
}
export type Engine = ReturnType<typeof createEngine>;
