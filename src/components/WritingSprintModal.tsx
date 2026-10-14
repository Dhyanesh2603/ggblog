import React, { useState, useEffect, useRef } from 'react';

interface WritingSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWordCount: number;
}

export const WritingSprintModal: React.FC<WritingSprintModalProps> = ({
  isOpen,
  onClose,
  currentWordCount
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [startWordCount, setStartWordCount] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);

  // Set duration when preset chosen
  const selectPreset = (mins: number) => {
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
  };

  const startSprint = () => {
    if (!isRunning) {
      if (startWordCount === null) {
        setStartWordCount(currentWordCount);
      }
      setIsRunning(true);
    }
  };

  const pauseSprint = () => {
    setIsRunning(false);
  };

  const resetSprint = () => {
    setIsRunning(false);
    setSecondsRemaining(selectedMinutes * 60);
    setStartWordCount(null);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            // Play gentle bell sound
            try {
              const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 1.3);
              }
            } catch {}
            alert('🔔 Writing Sprint Complete! Take a breath and review your words.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const wordsWritten = startWordCount !== null ? Math.max(0, currentWordCount - startWordCount) : 0;
  const wordsPerMinute = isRunning && startWordCount !== null && (selectedMinutes * 60 - secondsRemaining) > 30
    ? Math.round((wordsWritten / ((selectedMinutes * 60 - secondsRemaining) / 60)))
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Writing Sprint"
    >
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] p-6 sm:p-8 shadow-2xl z-10 space-y-6 text-center">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-3 text-left">
          <div>
            <div className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              ※ Uninterrupted Flow State
            </div>
            <h2 className="font-editorial-title text-2xl text-[var(--text)]">
              Writing Sprint & Pacing
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-meta text-xs tracking-wider px-2 py-1 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
          >
            [×]
          </button>
        </div>

        {/* Presets */}
        <div className="flex items-center justify-center gap-2 font-mono-meta text-xs">
          {[15, 25, 45, 60].map((m) => (
            <button
              key={m}
              type="button"
              disabled={isRunning}
              onClick={() => selectPreset(m)}
              className={`px-3 py-1.5 border transition-colors cursor-pointer disabled:opacity-50 ${
                selectedMinutes === m && !isRunning
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)]'
              }`}
            >
              {m} MIN
            </button>
          ))}
        </div>

        {/* Countdown Digits */}
        <div className="py-2">
          <div className="font-mono text-6xl sm:text-7xl tracking-tighter font-light text-[var(--text)]">
            {timeFormatted}
          </div>
          <p className="font-editorial-body text-xs italic text-[var(--text-muted)] mt-2">
            {isRunning ? 'Writing sprint in progress. Keep fingers moving.' : 'Select a interval and begin your sprint.'}
          </p>
        </div>

        {/* Words Sprint Stats */}
        <div className="grid grid-cols-2 gap-3 p-3 border border-[var(--border)] bg-[var(--paper-tint)]/30 font-mono-meta text-xs text-left">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">
              WORDS THIS SPRINT
            </span>
            <span className="text-base font-semibold text-[var(--text)]">
              +{wordsWritten} words
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">
              PACING RATE
            </span>
            <span className="text-base font-semibold text-[var(--text)]">
              {wordsPerMinute ? `${wordsPerMinute} wpm` : '—'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={startSprint}
              className="font-mono-meta text-xs tracking-wider px-6 py-2.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              {secondsRemaining < selectedMinutes * 60 ? 'RESUME SPRINT' : 'BEGIN SPRINT →'}
            </button>
          ) : (
            <button
              type="button"
              onClick={pauseSprint}
              className="font-mono-meta text-xs tracking-wider px-6 py-2.5 border border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
            >
              PAUSE
            </button>
          )}

          <button
            type="button"
            onClick={resetSprint}
            className="font-mono-meta text-xs tracking-wider px-4 py-2.5 border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>
    </div>
  );
};
