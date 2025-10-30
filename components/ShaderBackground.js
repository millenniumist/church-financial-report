"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const MeshGradient = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.MeshGradient),
  { ssr: false }
);

export default function ShaderBackground({ children }) {
  const containerRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true);
    const handleMouseLeave = () => setIsActive(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background relative overflow-hidden">
      {/* SVG Filters */}
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Background Shaders - Elegant blue tones */}
      <div className="absolute inset-0 w-full h-full">
        <MeshGradient
          className="w-full h-full"
          colors={["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6"]}
          speed={0.5}
        />
      </div>
      <div className="absolute inset-0 w-full h-full opacity-60">
        <MeshGradient
          className="w-full h-full"
          colors={["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8"]}
          speed={0.3}
          wireframe="true"
        />
      </div>
      
      {/* Animated gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/50 via-blue-100/40 to-cyan-100/30 animate-gradient" />
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-50/40 via-sky-50/30 to-white/40 animate-gradient-reverse" />
      
      {/* Radial glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-white/40 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
