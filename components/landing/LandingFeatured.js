"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_CONTENT = {
  subtitle: "กิจกรรมและการนมัสการ",
  title: "เข้าร่วมนมัสการและสามัคคีธรรมกับเรา",
  description:
    "ร่วมมอบเวลาพิเศษแด่พระเจ้าในทุกวันอาทิตย์ และต่อยอดความสัมพันธ์ผ่านกิจกรรมที่หนุนใจทุกวัย",
  bullets: [
    "การนมัสการประจำสัปดาห์ พร้อมบทเรียนพระคัมภีร์สำหรับทุกวัย",
    "กลุ่มสามัคคีธรรมและกิจกรรมพิเศษสำหรับครอบครัวและเยาวชน",
    "กิจกรรมบริการสังคมและพันธกิจชุมชนตลอดปี",
  ],
  cta: {
    label: "ดูตารางกิจกรรม",
    href: "/worship",
  },
};

export default function LandingFeatured() {
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        const res = await fetch("/api/page-content/landing?section=featured");
        if (!res.ok) return;
        const data = await res.json();
        const section = data?.sections?.[0];
        if (!cancelled && section) {
          setContent({
            subtitle: section.subtitle ?? DEFAULT_CONTENT.subtitle,
            title: section.title ?? DEFAULT_CONTENT.title,
            description: section.description ?? DEFAULT_CONTENT.description,
            bullets: Array.isArray(section.body?.bullets) ? section.body.bullets : DEFAULT_CONTENT.bullets,
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

    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-6 py-12 bg-white">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
        <div className="relative h-[320px] sm:h-[420px] lg:h-[500px] w-full overflow-hidden rounded-3xl shadow-xl">
          <Image
            src="/images/landing-featured.png"
            alt="Exterior of a church building with cross signage"
            fill
            className="object-cover filter grayscale"
            priority
          />
        </div>

        <div className="space-y-6 text-left">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              {content.subtitle}
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold leading-tight text-neutral-900">
              {content.title}
            </h2>
          </div>
          <p className="text-base lg:text-lg text-neutral-600 leading-relaxed max-w-xl">
            {content.description}
          </p>
          <ul className="space-y-3 text-sm text-neutral-700">
            {content.bullets.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-neutral-800" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href={content.cta?.href ?? DEFAULT_CONTENT.cta.href}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-neutral-700"
          >
            {content.cta?.label ?? DEFAULT_CONTENT.cta.label} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
