import React from 'react';

export const AigoraLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 350 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#E05A2B" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter">
      {/* A */}
      <path d="M 25 70 L 35 30 L 55 30 L 65 70 M 30 50 L 60 50" />
      {/* G */}
      <path d="M 165 30 L 125 30 L 125 70 L 165 70 L 165 50 L 145 50" />
      {/* O */}
      <path d="M 180 30 L 220 30 L 220 70 L 180 70 Z" />
      {/* R */}
      <path d="M 235 70 L 235 30 L 275 30 L 275 50 L 235 50 M 255 50 L 275 70" />
      {/* A */}
      <path d="M 290 70 L 300 30 L 320 30 L 330 70 M 295 50 L 325 50" />
    </g>
    <g stroke="currentColor" strokeLinecap="square">
      {/* Pillar Top/Bottom */}
      <path d="M 70 28 L 110 28 M 70 72 L 110 72" strokeWidth="4" />
      {/* Pillar Verticals */}
      <path d="M 78 28 L 78 72 M 84 28 L 84 72 M 90 28 L 90 72 M 96 28 L 96 72 M 102 28 L 102 72" strokeWidth="2" />
    </g>
  </svg>
);
