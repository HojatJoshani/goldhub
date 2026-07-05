"use client";

import * as React from "react";

export function GoldHubLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4A017" />
          <stop offset="50%" stopColor="#F5D061" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      {/* Hexagon/diamond shape representing gem */}
      <path
        d="M24 3L42 14V34L24 45L6 34V14L24 3Z"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
        fill="url(#goldGrad)"
        fillOpacity="0.1"
      />
      {/* Inner gem facets */}
      <path
        d="M24 12L33 18V30L24 36L15 30V18L24 12Z"
        fill="url(#goldGrad)"
        fillOpacity="0.3"
      />
      <path
        d="M24 12L33 18L24 22L15 18L24 12Z"
        fill="url(#goldGrad)"
        fillOpacity="0.6"
      />
      {/* Letter G */}
      <path
        d="M28 20H24C22.3431 20 21 21.3431 21 23V25C21 26.6569 22.3431 28 24 28H27V25H24"
        stroke="url(#goldGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
