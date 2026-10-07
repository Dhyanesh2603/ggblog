import React, { useEffect, useRef } from 'react';

interface ScrollProgressProps {
  visible?: boolean;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({ visible = true }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if browser does not support CSS animation-timeline: scroll()
    if (typeof window !== 'undefined' && barRef.current) {
      const supportsScrollTimeline =
        typeof CSS !== 'undefined' &&
        CSS.supports &&
        CSS.supports('animation-timeline', 'scroll()');

      if (!supportsScrollTimeline) {
        const handleScroll = () => {
          if (!barRef.current) return;
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          if (scrollable <= 0) {
            barRef.current.style.transform = 'scaleX(0)';
            return;
          }
          const scrolled = window.scrollY;
          const ratio = Math.min(1, Math.max(0, scrolled / scrollable));
          barRef.current.style.transform = `scaleX(${ratio})`;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
      }
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      id="reading-progress"
      aria-hidden="true"
      className="scroll-progress-bar fixed top-0 left-0 right-0 h-[1.5px] z-50 pointer-events-none"
      style={{
        backgroundColor: 'var(--text)',
        opacity: 0.85,
        transformOrigin: '0 50%',
        willChange: 'transform'
      }}
    />
  );
};
