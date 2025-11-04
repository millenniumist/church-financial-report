"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";

const DEFAULT_CONTENT = {
  title: "ข่าวดีเพื่อทุกคน",
  headline: "Full Gospel – พระกิตติคุณเพื่อทุกครอบครัวในชลบุรี",
  cta: {
    label: "เรียนรู้พระกิตติคุณ",
    href: "/about",
  },
};

const extractText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.th ?? value.en ?? Object.values(value)[0] ?? "";
  }
  return String(value);
};

const containsFinancialKeyword = (value) => {
  if (typeof value !== "string") return false;
  return /การเงิน|financial/i.test(value);
};

export default function LandingPromo() {
  const container = useRef();
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10vh", "10vh"]);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        const res = await fetch("/api/page-content/landing?section=promo");
        if (!res.ok) return;
        const data = await res.json();
        const section = data?.sections?.[0];
        if (!cancelled && section) {
          const remoteTitle = extractText(section.title);
          const remoteHeadline = extractText(section.description);
          const remoteCtaLabel = extractText(section.body?.cta?.label);
          const remoteCtaHref = section.body?.cta?.href;

          const isFinancialSection =
            remoteCtaHref === "/financial" ||
            containsFinancialKeyword(remoteHeadline) ||
            containsFinancialKeyword(remoteTitle) ||
            containsFinancialKeyword(remoteCtaLabel);

          setContent({
            title: isFinancialSection
              ? DEFAULT_CONTENT.title
              : remoteTitle || DEFAULT_CONTENT.title,
            headline: isFinancialSection
              ? DEFAULT_CONTENT.headline
              : remoteHeadline || DEFAULT_CONTENT.headline,
            cta: {
              label:
                isFinancialSection || !remoteCtaLabel
                  ? DEFAULT_CONTENT.cta.label
                  : remoteCtaLabel,
              href:
                isFinancialSection || !remoteCtaHref
                  ? DEFAULT_CONTENT.cta.href
                  : remoteCtaHref,
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setContent(DEFAULT_CONTENT);
        }
      }
    }

    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          <Image
            src="/images/image.png"
            fill
            alt="Worship band leading music on a church stage"
            className="object-cover filter grayscale"
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </div>

      <h3 className="absolute top-12 right-6 text-white uppercase z-10 text-sm md:text-base lg:text-lg font-semibold tracking-wide">
        {content.title}
      </h3>

      <div className="absolute bottom-12 right-6 flex flex-col items-end gap-6 text-right z-10 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-5xl">
        <p className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight font-bold">
          {content.headline}
        </p>
        <Link
          href={content.cta?.href ?? DEFAULT_CONTENT.cta.href}
          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900 shadow-lg transition hover:bg-primary/90 hover:text-white"
        >
          {content.cta?.label ?? DEFAULT_CONTENT.cta.label}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
