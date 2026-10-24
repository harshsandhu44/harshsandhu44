// The race in sound, all synthesised with Web Audio, so there are no files to load or license:
// your 2.4 litre V8 (F1's of 2006–13, 18,000 rpm) with pops on the lift and the downshifts, the
// cars around you, the crowd at the grandstands, the pit lane's limiter, guns and jack, the tyres
// at the limit, kerbs and grass, and the radio's pip. Only made from a click, so browsers allow it.
// ponytail: oscillators and filtered noise by ear; the knobs are the constants and filter values.
import { TOP } from "./track.ts";

// Volumes by group, 0 to 1.
export type Mix = Record<"engine" | "cars" | "crowd" | "pit" | "tyres" | "radio", number>;
export const MIX: Mix = { engine: 1, cars: 0.8, crowd: 0.7, pit: 1, tyres: 0.7, radio: 0.8 };

// Each of the eight gears (track.ts gear) runs from REV_LO to REV_HI, flat out at the top of
// eighth; stopped, it idles.
const REV_LO = 10500;
const REV_HI = 18000;
const IDLE = 4500;
export const rpm = (v: number) => {
  if (Math.abs(v) < 1) return IDLE;
  const f = Math.min(1, Math.abs(v) / TOP) * 8;
  return REV_LO + (REV_HI - REV_LO) * (f >= 8 ? 1 : f % 1);
};
// A V8 fires four times a revolution.
const fire = (r: number) => (r / 60) * 4;

// What's heard this frame. `cars` are the nearest others: how far, how fast they're closing (m/s,
// for the Doppler) and where, -1 left to 1 right.
export type Heard = {
  rpm: number;
  gear: number;
  load: number;
  limiter: boolean;
  slide: number;
  kerb: number;
  grass: number;
  crowd: number;
  cars: { dist: number; closing: number; pan: number; rpm: number }[];
};

export function createAudio(mix: Mix) {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  const squash = ctx.createDynamicsCompressor();
  master.connect(squash).connect(ctx.destination);
  const groups = Object.fromEntries(
    Object.keys(MIX).map((k) => {
      const g = ctx.createGain();
      g.connect(master);
      return [k, g];
    }),
  ) as Record<keyof Mix, GainNode>;
  const now = () => ctx.currentTime;
  const to = (p: AudioParam, v: number, tc = 0.05) => p.setTargetAtTime(v, now(), tc);

  // Two seconds of white noise, looped wherever it's needed.
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = () => {
    const n = ctx.createBufferSource();
    n.buffer = buf;
    n.loop = true;
    n.start();
    return n;
  };
  const filter = (type: BiquadFilterType, f: number, q = 1) => {
    const b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  };
  const gain = (v = 0) => {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  };
  // Soft clipping, for the exhaust's rasp.
  const shaper = ctx.createWaveShaper();
  shaper.curve = Float32Array.from({ length: 1024 }, (_, i) => Math.tanh(3 * (i / 511.5 - 1)));

  // A V8: the firing note, half of it for the burble, double for the scream and a quarter for
  // the crank, then a low-pass that opens with the revs and the throttle.
  const v8 = (out: AudioNode, harsh: boolean) => {
    const pre = gain(1);
    const tone = filter("lowpass", 2000, 0.8);
    const level = gain();
    if (harsh) pre.connect(shaper).connect(tone);
    else pre.connect(tone);
    tone.connect(level).connect(out);
    const notes = (
      [
        [1, "sawtooth", 0.45],
        [0.5, "square", 0.22],
        [2, "triangle", 0.18],
        [0.25, "sawtooth", 0.12],
      ] as const
    ).map(([f, type, v]) => {
      const o = ctx.createOscillator();
      o.type = type;
      const g = gain(v);
      o.connect(g).connect(pre);
      o.start();
      return { o, f };
    });
    return {
      level,
      set(r: number, load: number, v: number) {
        for (const { o, f } of notes) to(o.frequency, fire(r) * f, 0.02);
        to(tone.frequency, 900 + 2600 * load + 2400 * (r / REV_HI));
        to(level.gain, v);
      },
    };
  };

  // Yours, through the pit limiter: a stutter at 13 Hz while it's on.
  const limiter = gain(1);
  limiter.connect(groups.engine);
  const stutter = ctx.createOscillator();
  stutter.type = "square";
  stutter.frequency.value = 13;
  const depth = gain();
  stutter.connect(depth).connect(limiter.gain);
  stutter.start();
  const mine = v8(limiter, true);
  // The rasp: noise that follows the throttle.
  const rasp = gain();
  const raspBand = filter("bandpass", 1500, 0.7);
  noise().connect(raspBand).connect(rasp).connect(limiter);
  // Pops on the lift and the downshifts: short cracks of noise.
  const pops = gain();
  noise()
    .connect(filter("bandpass", 2200, 1.5))
    .connect(pops)
    .connect(groups.engine);
  const crackle = (n: number, over: number) => {
    const t = now();
    for (let k = 0; k < n; k++) {
      const at = t + Math.random() * over;
      pops.gain.setValueAtTime(0.15 + Math.random() * 0.35, at);
      pops.gain.setTargetAtTime(0, at, 0.006 + Math.random() * 0.01);
    }
  };

  // The cars nearby, each panned to where it is.
  const others = [0, 1, 2].map(() => {
    const pan = ctx.createStereoPanner();
    pan.connect(groups.cars);
    return { pan, voice: v8(pan, false) };
  });

  // The crowd: wide noise in the voice band, swelling for a cheer.
  const crowd = gain();
  noise()
    .connect(filter("bandpass", 650, 0.4))
    .connect(filter("lowpass", 2400))
    .connect(crowd)
    .connect(groups.crowd);
  let cheerTill = 0;

  // The tyres: a squeal at the limit, the kerbs' rumble and the grass.
  const squeal = gain();
  noise()
    .connect(filter("bandpass", 1800, 12))
    .connect(squeal)
    .connect(groups.tyres);
  const kerb = gain();
  const rumble = ctx.createOscillator();
  rumble.type = "square";
  rumble.connect(filter("lowpass", 260)).connect(kerb).connect(groups.tyres);
  rumble.start();
  const grass = gain();
  noise().connect(filter("lowpass", 700)).connect(grass).connect(groups.tyres);

  // A one-off burst of noise through a band, shaped by an envelope; `chop` Hz chatters it.
  const burst = (out: AudioNode, at: number, len: number, f: number, v: number, chop = 0) => {
    const n = ctx.createBufferSource();
    n.buffer = buf;
    const env = gain();
    n.connect(filter("bandpass", f, 2))
      .connect(env)
      .connect(out);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(v, at + 0.01);
    env.gain.setValueAtTime(v, at + len - 0.04);
    env.gain.linearRampToValueAtTime(0, at + len);
    if (chop) {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = chop;
      const g = gain(v * 0.8);
      o.connect(g).connect(env.gain);
      o.start(at);
      o.stop(at + len);
    }
    n.start(at, Math.random());
    n.stop(at + len);
  };
  const tone = (out: AudioNode, at: number, len: number, f: number, v: number, end = f) => {
    const o = ctx.createOscillator();
    const env = gain();
    o.connect(env).connect(out);
    o.frequency.setValueAtTime(f, at);
    o.frequency.exponentialRampToValueAtTime(end, at + len);
    env.gain.setValueAtTime(v, at);
    env.gain.exponentialRampToValueAtTime(0.001, at + len);
    o.start(at);
    o.stop(at + len);
  };

  let set = { ...mix };
  let load = 0;
  let gear = 0;
  const apply = (on: boolean) => {
    for (const k of Object.keys(groups) as (keyof Mix)[]) to(groups[k].gain, on ? set[k] : 0);
  };
  apply(true);

  return {
    mix(m: Mix) {
      set = { ...m };
      apply(true);
    },
    // Each frame; null while paused, which hushes everything that runs on.
    frame(h: Heard | null) {
      apply(!!h);
      if (!h) return;
      const r = h.limiter ? 11000 : h.rpm;
      mine.set(r, h.load, 0.05 + 0.09 * h.load);
      to(raspBand.frequency, fire(r) * 1.5);
      to(rasp.gain, 0.05 * h.load);
      to(depth.gain, h.limiter ? 0.45 : 0);
      // Off the throttle from high revs, it crackles; down a gear off the throttle, a pop or two.
      if (load > 0.6 && h.load < 0.3 && r > 13000) crackle(10, 0.8);
      if (h.gear < gear && h.load < 0.3) crackle(3, 0.15);
      [load, gear] = [h.load, h.gear];
      h.cars.forEach((c, k) => {
        const o = others[k];
        if (!o) return;
        to(o.pan.pan, Math.max(-1, Math.min(1, c.pan)));
        // Doppler: higher closing, lower going away.
        const shift = 343 / (343 - Math.max(-100, Math.min(100, c.closing)));
        o.voice.set(c.rpm * shift, 0.7, 0.07 * Math.min(1, (12 / Math.max(c.dist, 4)) ** 1.4));
      });
      for (const o of others.slice(h.cars.length)) to(o.voice.level.gain, 0);
      const cheer = ctx.currentTime < cheerTill ? 0.5 : 0;
      to(crowd.gain, 0.03 + 0.25 * Math.max(h.crowd, cheer), 0.4);
      to(squeal.gain, 0.12 * Math.min(1, Math.max(0, h.slide)));
      to(rumble.frequency, 15 + 30 * h.kerb);
      to(kerb.gain, h.kerb ? 0.18 : 0, 0.02);
      to(grass.gain, 0.2 * h.grass);
    },
    // The crowd's roar for a few seconds: the start, a place taken.
    cheer() {
      cheerTill = ctx.currentTime + 3;
    },
    // Your stop, `secs` long: the guns off, the guns on, and the jack dropping you on the release.
    stop(secs: number) {
      const t = now() + 0.15;
      const out = groups.pit;
      for (let k = 0; k < 4; k++) burst(out, t + k * 0.03, 0.4, 2600, 0.35, 45);
      for (let k = 0; k < 4; k++) burst(out, t + secs * 0.5 + k * 0.03, 0.45, 2400, 0.35, 50);
      tone(out, t + secs - 0.2, 0.25, 90, 0.6, 40);
      burst(out, t + secs - 0.2, 0.08, 400, 0.3);
    },
    // The engineer keying the radio: a burst of static and the pip.
    radio() {
      const t = now();
      burst(groups.radio, t, 0.12, 1800, 0.12);
      tone(groups.radio, t + 0.1, 0.08, 1250, 0.15);
      tone(groups.radio, t + 0.19, 0.09, 950, 0.15);
    },
    close() {
      void ctx.close();
    },
  };
}
export type Audio = ReturnType<typeof createAudio>;
