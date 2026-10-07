import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { NOVEL_META } from '../data/novelData';

export const BookCoverArt: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle max tilt: 5 degrees
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div className="relative group perspective-[1000px] w-full max-w-[340px] sm:max-w-[360px] mx-auto select-none">
      <Link
        to="/novel/chapter-01"
        viewTransition
        className="block focus:outline-none"
        aria-label="Begin reading Chapter 1 of The Last Light"
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative transition-all duration-300 ease-out p-8 sm:p-10 bg-[var(--paper-tint)] border border-[var(--border)] shadow-lg hover:shadow-2xl active:scale-[0.985] flex flex-col justify-between aspect-[1/1.42] overflow-hidden rounded-[2px] cursor-pointer"
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(${isHovered ? '-6px' : '0px'})`,
            boxShadow: isHovered
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px var(--border)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--border)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Subtle Spine Crease Highlight on left */}
          <div
            className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Blind debossed inner frame */}
          <div
            className="absolute inset-3 border border-[var(--border)] pointer-events-none opacity-60"
            aria-hidden="true"
          />

          {/* Top Folio Header */}
          <div className="relative z-10 flex items-center justify-between text-[10px] font-mono-meta tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--border-faint)] pb-3">
            <span>FOLIO NO. 01</span>
            <span>※ {NOVEL_META.year}</span>
          </div>

          {/* Cover Typographic Heart */}
          <div className="relative z-10 my-auto py-8 text-center space-y-4">
            <span className="font-mono-meta text-[9.5px] tracking-[0.24em] text-[var(--text-faint)] block uppercase">
              A Serialized Novel
            </span>

            <h2 className="font-editorial-title text-4xl sm:text-5xl text-[var(--text)] tracking-tight leading-[0.95]">
              {NOVEL_META.title}
            </h2>

            <div className="w-8 h-[1px] bg-[var(--text)] mx-auto opacity-30" />

            <p className="font-editorial-body text-base italic text-[var(--text-muted)]">
              by {NOVEL_META.author}
            </p>
          </div>

          {/* Bottom Colophon / Action hint */}
          <div className="relative z-10 pt-4 border-t border-[var(--border-faint)] flex items-center justify-between font-mono-meta text-[9.5px] tracking-[0.16em] text-[var(--text-muted)]">
            <span className="opacity-75">FIRST EDITION</span>
            <span className="text-[var(--text)] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold">
              <span>READ NOVEL</span>
              <span>→</span>
            </span>
          </div>
        </div>
      </Link>

      {/* Floating gentle shadow label */}
      <div className="mt-4 text-center">
        <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-faint)]">
          CLICK OR TAP TO READ THE NOVEL
        </span>
      </div>
    </div>
  );
};
