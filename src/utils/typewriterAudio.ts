// Web Audio API Typewriter Sound Synthesizer
// Completely client-side, offline, zero external audio asset dependencies.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a short, tactile mechanical key strike sound.
 */
export function playTypewriterKeySound(key?: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Different frequency profile for special keys
    const isEnter = key === 'Enter';
    const isSpace = key === ' ' || key === 'Spacebar';

    // 1. Noise Burst (the physical hammer striking paper)
    const bufferSize = ctx.sampleRate * 0.04; // 40ms burst
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isEnter ? 1200 : isSpace ? 800 : 1800, now);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isEnter ? 0.08 : 0.035));

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.08);

    // 2. Resonant metallic plink (typebar mechanism resonance)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    const baseFreq = isEnter ? 240 : isSpace ? 320 : 440 + (Math.random() * 80 - 40);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.04);

    oscGain.gain.setValueAtTime(0.04, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);

    // 3. Subtle bell chime for Enter key (carriage return)
    if (isEnter) {
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(2600, now + 0.02);
      bellGain.gain.setValueAtTime(0.06, now + 0.02);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      bell.connect(bellGain);
      bellGain.connect(ctx.destination);

      bell.start(now + 0.02);
      bell.stop(now + 0.4);
    }
  } catch {
    // Audio contexts might be blocked until user gesture, safely ignore
  }
}
