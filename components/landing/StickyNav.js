"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_NAV_ITEMS = [
  { id: "home", name: "หน้าแรก", href: "/" },
  { id: "about", name: "เกี่ยวกับเรา", href: "/about" },
  { id: "worship", name: "การนมัสการ", href: "/worship" },
  { id: "missions", name: "พันธกิจ", href: "/missions" },
  { id: "financial", name: "การเงิน", href: "/financial" },
  { id: "contact", name: "ติดต่อเรา", href: "/contact" },
];

export default function StickyNav() {
  const [isVisible, setIsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState(DEFAULT_NAV_ITEMS);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show nav at the top (first 100px) OR near the bottom (within 200px of end)
      const isAtTop = scrollY < 100;
      const isAtBottom = scrollY + windowHeight >= documentHeight - 200;

      if (isAtTop || isAtBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Run on mount to check initial position
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setMenuOpen(false);
    }
  }, [isVisible]);

  useEffect(() => {
    let cancelled = false;

    async function loadNavigation() {
      try {
        const response = await fetch("/api/navigation?locale=th");
        if (!response.ok) {
          throw new Error("Failed to load navigation");
        }
        const data = await response.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length) {
          setNavItems(
            data.items.map((item) => ({
              id: item.id,
              name: item.label ?? item.href,
              href: item.href,
            }))
          );
        }
      } catch (error) {
        console.warn("StickyNav fallback to defaults", error);
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              {/* Logo */}
              <Link
                href="/"
                className="text-white text-sm uppercase tracking-wide font-semibold hover:text-neutral-300 transition-colors"
              >
                คริสตจักรชลบุรี
              </Link>

              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="md:hidden inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                aria-expanded={menuOpen}
                aria-controls="sticky-mobile-nav"
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

              {/* Navigation Links */}
              <div className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-white hover:text-neutral-300 transition-colors text-sm uppercase"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div
              id="sticky-mobile-nav"
              className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
                menuOpen ? 'max-h-60 opacity-100 pb-3' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="mt-2 grid gap-2 rounded-xl border border-white/15 bg-white/5 p-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide text-white/90 transition hover:bg-white/10"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
