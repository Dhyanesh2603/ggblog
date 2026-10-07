import React, { useEffect, useRef, useState } from 'react';
import { useReading } from '../context/ReadingContext';

interface Particle {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  tilt: number;
}

export const AmbientCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useReading();
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Check user's motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsEnabled(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !isEnabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create 45 subtle coastal mist/rain particles
    const particleCount = Math.min(50, Math.floor(width / 30));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 12 + 6,
        speed: Math.random() * 0.8 + 0.4,
        opacity: Math.random() * 0.14 + 0.04,
        tilt: Math.random() * 1.5 - 0.75
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Particle stroke color based on theme
      const strokeColor =
        theme === 'dark'
          ? 'rgba(230, 230, 230, '
          : theme === 'paper'
          ? 'rgba(70, 60, 50, '
          : 'rgba(20, 20, 20, ';

      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.strokeStyle = `${strokeColor}${p.opacity})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.length);
        ctx.stroke();

        // Update position: gentle drift down and slight diagonal
        p.y += p.speed;
        p.x += p.tilt * 0.4;

        // Wrap around boundaries
        if (p.y > height) {
          p.y = -p.length;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, isEnabled]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
      style={{ opacity: 0.85 }}
    />
  );
};
