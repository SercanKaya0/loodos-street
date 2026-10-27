/* Bug ambulansının kısık sesli sireni (Web Audio, dosya yok). Tarayıcılar sesi ancak ilk dokunuştan sonra açar;
   o ana kadar sessiz kalır. Ses kurulamazsa her çağrı sessizce geçer. */
const VOLUME = .035;

export function createSiren(enabled = true) {
  let ctx = null, gain = null, level = 0, sent = -1;

  function ensure() {
    if (ctx || !enabled) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      // İki tonlu "dii-daa": kare dalga LFO ana tonu 610 ↔ 910 Hz arasında oynatır
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 760;
      const lfo = ctx.createOscillator();
      lfo.type = "square";
      lfo.frequency.value = 1.1;
      const depth = ctx.createGain();
      depth.gain.value = 150;
      lfo.connect(depth).connect(osc.frequency);
      const soft = ctx.createBiquadFilter();
      soft.type = "lowpass";
      soft.frequency.value = 1600;
      gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(soft).connect(gain).connect(ctx.destination);
      osc.start();
      lfo.start();
    } catch {
      ctx = null;
    }
  }
  function apply() {
    if (!ctx) return;
    const target = enabled && !document.hidden ? Math.min(1, level) * VOLUME : 0;
    if (Math.abs(target - sent) < .0005) return;
    sent = target;
    gain.gain.setTargetAtTime(target, ctx.currentTime, .25);
  }
  const unlock = () => { ensure(); if (ctx?.state === "suspended") ctx.resume().catch(() => {}); apply(); };
  addEventListener("pointerdown", unlock, true);
  addEventListener("keydown", unlock, true);
  document.addEventListener("visibilitychange", apply);

  return {
    set(v) { level = v; apply(); },
    setEnabled(on) { enabled = on; if (on) unlock(); apply(); },
    get enabled() { return enabled; },
  };
}
