"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function ChurchBackground({ children }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(
      [...Array(15)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 6 + Math.random() * 4,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Subtle animated cross pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.02]">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cross-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 10 L30 50 M10 30 L50 30" stroke="currentColor" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cross-pattern)" />
        </svg>
      </div>

      {/* Animated light rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scaleY: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent"
          animate={{
            opacity: [0.6, 0.3, 0.6],
            scaleY: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Subtle gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
