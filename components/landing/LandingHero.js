"use client";

import Image from "next/image";
import { useScroll, useTransform, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function LandingHero() {
  const container = useRef();
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "150vh"]);

  useEffect(() => {
    let cancelled = false;
    async function loadMissions() {
      try {
        const res = await fetch("/api/missions?page=1&pageSize=2", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load missions");
        const data = await res.json();
        if (!cancelled) {
          const pinned = data?.pinned ?? [];
          setHighlights(pinned.length ? pinned : data?.missions ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setHighlights([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMissions();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-white text-sm sm:text-base uppercase tracking-wide font-semibold"
          >
            คริสตจักรชลบุรี
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link
              href="/missions"
              className="text-white hover:text-neutral-300 transition-colors duration-300 uppercase text-sm"
            >
              พันธกิจ
            </Link>
            <Link
              href="/about"
              className="text-white hover:text-neutral-300 transition-colors duration-300 uppercase text-sm"
            >
              เกี่ยวกับเรา
            </Link>
            <Link
              href="/ministries"
              className="text-white hover:text-neutral-300 transition-colors duration-300 uppercase text-sm"
            >
              กิจกรรม
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-neutral-300 transition-colors duration-300 uppercase text-sm"
            >
              ติดต่อเรา
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-expanded={menuOpen}
            aria-controls="hero-mobile-menu"
          >
            เมนู
            <span className="relative h-3 w-4">
              <span
                className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-current transition ${
                  menuOpen ? 'translate-y-1.5 rotate-45' : ''
                }`}
              />
              <span
                className={`absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-current transition ${
                  menuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute inset-x-0 top-3 h-0.5 rounded-full bg-current transition ${
                  menuOpen ? '-translate-y-1.5 -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>
        {menuOpen && (
          <div
            id="hero-mobile-menu"
            className="mt-4 rounded-2xl border border-white/20 bg-black/60 p-4 backdrop-blur-md md:hidden"
          >
            <div className="grid gap-2">
              {[
                { href: "/missions", label: "พันธกิจ" },
                { href: "/about", label: "เกี่ยวกับเรา" },
                { href: "/ministries", label: "กิจกรรม" },
                { href: "/contact", label: "ติดต่อเรา" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Content with Parallax */}
      <motion.div ref={container} style={{ y }} className="relative min-h-screen">
        <Image
          src="/images/mountain-landscape.jpg"
          fill
          alt="Church background"
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-start justify-start z-10 pt-24 md:pt-32">
          <div className="text-left text-white max-w-3xl px-6">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              ยินดีต้อนรับสู่คริสตจักรชลบุรี
              <br />
              ร่วมนำข่าวประเสริฐสู่ชุมชนของเรา
            </h1>
            <p className="text-sm md:text-base lg:text-lg leading-relaxed mb-8 max-w-2xl">
              เราเชื่อว่าพระเจ้าทรงเรียกคริสตจักรให้ประกาศพระกิตติคุณ สร้างสาวก และดูแลผู้คนในทุกฤดูกาล
              มาร่วมอธิษฐาน สนับสนุน และลงมือทำไปกับพันธกิจที่พระองค์มอบหมายแก่เราในชลบุรีและไกลกว่านั้น
            </p>
            <div className="space-y-6">
              <div className="grid gap-4">
                {loading ? (
                  <div className="h-24 w-full rounded-2xl bg-white/20 animate-pulse" aria-hidden="true" />
                ) : highlights.length ? (
                  highlights.slice(0, 1).map((mission) => (
                    <div
                      key={mission.id}
                      className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur"
                    >
                      <p className="text-xs uppercase tracking-wide text-white/70">
                        {mission.theme}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {mission.title}
                      </p>
                      <p className="mt-1 text-xs text-white/80">
                        อัปเดต {new Date(mission.updatedAt).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur">
                    ขณะนี้ยังไม่มีพันธกิจไฮไลต์ กรุณากลับมาใหม่อีกครั้ง
                  </div>
                )}
              </div>
              <Link
                href="/missions"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white bg-transparent text-white text-sm uppercase font-semibold transition-all duration-300 hover:bg-white hover:text-slate-900"
              >
                สำรวจพันธกิจของเรา <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
