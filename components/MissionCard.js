"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function MissionCard({ mission }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-6 sm:p-8 border border-slate-200 shadow-sm bg-white/90 backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary/70 font-semibold">
              {mission.theme}
            </p>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1">
              {mission.title}
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            อัปเดต {new Date(mission.updatedAt).toLocaleDateString("th-TH")}
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">{mission.summary}</p>

        <div className="flex flex-wrap gap-2">
          {mission.focusAreas.map((focus) => (
            <span
              key={focus}
              className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full"
            >
              {focus}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="self-start inline-flex items-center gap-2 text-primary font-medium text-sm hover:text-primary/80 transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียดเพิ่มเติม"}
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">
            {expanded ? "-" : "+"}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="mission-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-6 border-t border-slate-200 pt-6">
                <div className="space-y-2">
                  <h4 className="text-base font-semibold text-slate-900">
                    รายละเอียดพันธกิจ
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {mission.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-slate-900">
                    พระคัมภีร์หนุนใจ
                  </h4>
                  <blockquote className="border-l-4 border-primary/60 pl-4 text-slate-600 italic">
                    “{mission.scripture.text}”
                    <footer className="mt-2 text-sm font-medium text-primary">
                      {mission.scripture.reference}
                    </footer>
                  </blockquote>
                </div>

                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-slate-900">
                    ก้าวต่อไป
                  </h4>
                  <ul className="grid gap-2 text-sm text-slate-600">
                    {mission.nextSteps.map((step) => (
                      <li
                        key={step}
                        className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

