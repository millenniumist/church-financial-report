"use client";

import Image from "next/image";
import { useScroll, useTransform, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DEFAULT_NAV_ITEMS = [
  { id: "missions", name: "พันธกิจ", href: "/missions" },
  { id: "about", name: "เกี่ยวกับเรา", href: "/about" },
  { id: "ministries", name: "กิจกรรม", href: "/ministries" },
  { id: "contact", name: "ติดต่อเรา", href: "/contact" },
];

const DEFAULT_CONTENT = {
  title: "ยินดีต้อนรับสู่คริสตจักรชลบุรี",
  tagline: "ร่วมนำข่าวประเสริฐสู่ชุมชนของเรา",
  description:
    "ร่วมเดินไปกับเราในการประกาศพระกิตติคุณ สร้างสาวก และดูแลชุมชนด้วยความรักของพระคริสต์",
  cta: {
    label: "สำรวจพันธกิจของเรา",
    href: "/missions",
  },
};

export default function LandingHero() {
  const container = useRef();
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);
  const [socialLinks, setSocialLinks] = useState({ facebook: null, youtube: null });
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "150vh"]);

  useEffect(() => {
    let cancelled = false;
    async function loadMissions() {
      try {
        const res = await fetch("/api/missions?page=1&pageSize=2");
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

    async function loadContent() {
      try {
        const res = await fetch("/api/page-content/landing?section=hero");
        if (!res.ok) return;
        const data = await res.json();
        const section = data?.sections?.[0];
        if (!cancelled && section) {
          setContent({
            title: section.title ?? DEFAULT_CONTENT.title,
            tagline: section.body?.tagline ?? DEFAULT_CONTENT.tagline,
            description: section.description ?? DEFAULT_CONTENT.description,
            cta: {
              label: section.body?.cta?.label ?? DEFAULT_CONTENT.cta.label,
              href: section.body?.cta?.href ?? DEFAULT_CONTENT.cta.href,
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setContent(DEFAULT_CONTENT);
        }
      }
    }

    loadMissions();
    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNavigation() {
      try {
        const res = await fetch("/api/navigation?locale=th");
        if (!res.ok) throw new Error("Failed to load navigation");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length) {
          setNavItems(
            data.items
              .filter((item) => item.href !== "/")
              .map((item) => ({
                id: item.id,
                name: item.label ?? item.href,
                href: item.href,
              }))
          );
        }
      } catch (error) {
        if (!cancelled) {
          setNavItems(DEFAULT_NAV_ITEMS);
        }
      }
    }

    loadNavigation();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadContactInfo() {
      try {
        const res = await fetch("/api/contact?locale=th");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.social) {
          setSocialLinks({
            facebook: data.social.facebook || null,
            youtube: data.social.youtube || null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setSocialLinks({ facebook: null, youtube: null });
        }
      }
    }

    loadContactInfo();
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
            {navItems.map((item) => (
              <Link
                key={item.id ?? item.href}
                href={item.href}
                className="text-white hover:text-neutral-300 transition-colors duration-300 uppercase text-sm"
              >
                {item.name}
              </Link>
            ))}
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
              {navItems.map((item) => (
                <Link
                  key={item.id ?? item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Content with Parallax */}
      <motion.div ref={container} style={{ y }} className="relative min-h-screen">
        <Image
          src="/images/landing-hero.png"
          fill
          alt="Congregation worship service inside a modern church"
          className="object-cover filter grayscale"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-start justify-start z-10 pt-24 md:pt-32">
          <div className="text-left text-white max-w-3xl px-6">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {content.title}
              {content.tagline && (
                <>
                  <br />
                  {content.tagline}
                </>
              )}
            </h1>
            <p className="text-sm md:text-base lg:text-lg leading-relaxed mb-8 max-w-2xl">
              {content.description}
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
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur">
                    ขณะนี้ยังไม่มีพันธกิจไฮไลต์ กรุณากลับมาใหม่อีกครั้ง
                  </div>
                )}
              </div>
              <Link
                href={content.cta?.href ?? DEFAULT_CONTENT.cta.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white bg-transparent text-white text-sm uppercase font-semibold transition-all duration-300 hover:bg-white hover:text-slate-900"
              >
                {content.cta?.label ?? DEFAULT_CONTENT.cta.label} <span aria-hidden="true">→</span>
              </Link>
              {(socialLinks.facebook || socialLinks.youtube) && (
                <div className="mt-6">
                  <style jsx>{`
                    @keyframes shine {
                      0% {
                        background-position: -200% center;
                      }
                      100% {
                        background-position: 200% center;
                      }
                    }
                    @keyframes wiggle {
                      0%, 100% {
                        transform: rotate(0deg) scale(1);
                      }
                      25% {
                        transform: rotate(-5deg) scale(1.05);
                      }
                      75% {
                        transform: rotate(5deg) scale(1.05);
                      }
                    }
                    @keyframes pulse-glow {
                      0%, 100% {
                        box-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3);
                      }
                      50% {
                        box-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.5);
                      }
                    }
                    .social-icon {
                      position: relative;
                      overflow: hidden;
                      animation: wiggle 2s ease-in-out infinite, pulse-glow 2s ease-in-out infinite;
                      background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.2) 0%,
                        rgba(255, 255, 255, 0.3) 50%,
                        rgba(255, 255, 255, 0.2) 100%
                      );
                      background-size: 200% 200%;
                    }
                    .social-icon::before {
                      content: '';
                      position: absolute;
                      top: 0;
                      left: -100%;
                      width: 100%;
                      height: 100%;
                      background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.6),
                        transparent
                      );
                      animation: shine 2s infinite;
                    }
                    .social-icon:hover {
                      animation: none;
                      background: white;
                      transform: scale(1.1);
                    }
                  `}</style>
                  <p className="text-white font-bold text-xl mb-8 ">
                    ติดตามถ่ายทอดสดและกิจกรรมล่าสุด
                  </p>
                  <div className="flex gap-4">
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-icon w-24 h-24 mx-2 rounded-full backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-white hover:text-slate-900 transition-all duration-300"
                        aria-label="Facebook - ติดตามถ่ายทอดสดและกิจกรรม"
                      >
                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                        </svg>
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a
                        href={socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-icon w-24 h-24 mx-2 rounded-full backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-white hover:text-slate-900 transition-all duration-300"
                        aria-label="YouTube - รับชมถ่ายทอดสดและคลิปวิดีโอ"
                        style={{ animationDelay: '0.5s' }}
                      >
                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
