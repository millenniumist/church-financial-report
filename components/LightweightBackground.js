"use client";

export default function LightweightBackground({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 relative overflow-hidden">
      {/* Animated gradient blobs - Pure CSS */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blob 1 */}
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-200/40 to-sky-300/30 rounded-full blur-3xl animate-blob" />

        {/* Blob 2 */}
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-bl from-cyan-200/40 to-blue-300/30 rounded-full blur-3xl animate-blob animation-delay-2000" />

        {/* Blob 3 */}
        <div className="absolute -bottom-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-sky-200/40 to-cyan-300/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] opacity-50" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
