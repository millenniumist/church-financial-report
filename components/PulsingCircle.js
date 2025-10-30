"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const PulsingBorder = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.PulsingBorder),
  { ssr: false }
);

export default function PulsingCircle() {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Pulsing Border Circle - Monotone colors */}
        <div className="absolute inset-0 w-full h-full">
          <PulsingBorder
            className="w-full h-full"
            colors={["#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb"]}
            speed="1.5"
            roundness="1"
            thickness="0.15"
            softness="0.2"
            intensity="5"
            pulse="0.15"
            smoke="0.6"
            scale="1"
            rotation="0"
          />
        </div>

        {/* Rotating Text Around the Pulsing Border */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transform: "scale(1.6)" }}
        >
          <defs>
            <path id="circle" d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
          </defs>
          <text className="text-sm fill-foreground/60 font-medium">
            <textPath href="#circle" startOffset="0%">
              คริสตจักรชลบุรี • Chonburi Church • คริสตจักรชลบุรี •
            </textPath>
          </text>
        </motion.svg>
      </div>
    </div>
  );
}
