import React, { useState, useRef, useEffect } from 'react';

export const AmbientSound: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const startSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate 5 seconds of soft brown/pink noise (coastal rain/surf buffer)
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter: integration of white noise
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 1.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Lowpass filter to simulate gentle rain against glass / coastal breeze
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      // Smooth fade-in
      gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 1.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();

      gainNodeRef.current = gain;
      setIsPlaying(true);
    } catch (e) {
      console.warn('Web Audio not allowed or unsupported', e);
    }
  };

  const stopSound = () => {
    if (audioCtxRef.current && gainNodeRef.current) {
      const ctx = audioCtxRef.current;
      const gain = gainNodeRef.current;
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      setTimeout(() => {
        setIsPlaying(false);
      }, 850);
    } else {
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopSound();
    } else {
      startSound();
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={`font-mono-meta text-[10px] tracking-[0.16em] px-2.5 py-1 border transition-all duration-200 flex items-center gap-1.5 ${
        isPlaying
          ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-sm'
          : 'text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text)] hover:text-[var(--text)]'
      }`}
      aria-label={isPlaying ? 'Mute coastal rain sound' : 'Play coastal rain atmosphere'}
      title="Synthesized ambient coastal rain"
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-[var(--text)] opacity-40'}`} />
      <span>RAIN TONE: {isPlaying ? 'ON' : 'OFF'}</span>
    </button>
  );
};
