"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";

import { useTheme } from "@/components/ThemeProvider";

export default function LandingPromo() {
  const { colorTheme } = useTheme();
  const container = useRef();
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10vh", "10vh"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center min-h-screen overflow-hidden py-20"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          <Image
            src="/images/image.png"
            fill
            alt="Come to Jesus"
            className={`object-cover ${colorTheme === 'bw' ? 'filter grayscale' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
        </motion.div>
      </div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12"
      >
        <div className="text-center space-y-12">
          {/* Matthew 11:28 - Hero Verse */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 bg-muted/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider border border-border/30">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  พระคัมภีร์
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight tracking-tight drop-shadow-xl">
                <span className="text-white/95">&ldquo;บรรดาผู้ที่เหน็ดเหนื่อย</span>
                <br />
                <span className="text-white/95">และแบกหนักอยู่</span>
                <br />
                <span className="text-white/90">จงมาหาเรา</span>
                <br />
                <span className={`bg-gradient-to-r ${colorTheme === 'lowkey' ? 'from-white via-primary/50 to-white' : 'from-white via-neutral-400 to-white'} bg-clip-text text-transparent`}>
                  และเราจะให้ท่านทั้งหลายได้หยุดพัก&rdquo;
                </span>
              </h2>

              <p className="text-white/80 text-lg sm:text-xl md:text-2xl font-light tracking-wide italic">
                มัทธิว 11:28 
              </p>
            </motion.div>
          </div>

          {/* Gospel Message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8 max-w-4xl mx-auto"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="space-y-6 text-white">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white drop-shadow-lg">
                ข่าวประเสริฐแห่งความรอด
              </h3>

              <div className="space-y-4 text-base sm:text-lg md:text-xl leading-relaxed">
                <p className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 shadow-inner">
                  &ldquo;เพราะว่าพระเจ้าทรงรักโลก จนได้ทรงประทานพระบุตรองค์เดียวของพระองค์
                  เพื่อทุกคนที่วางใจในพระบุตรนั้นจะไม่พินาศ แต่มีชีวิตนิรันดร์&rdquo;
                  <span className="block mt-3 text-sm text-white/50 italic">
                    — ยอห์น 3:16 
                  </span>
                </p>

                <p className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 shadow-inner">
                  &ldquo;ด้วยว่าซึ่งท่านทั้งหลายรอดนั้นก็รอดโดยพระคุณเพราะความเชื่อ และมิใช่โดยตัวท่านทั้งหลายกระทำเอง แต่พระเจ้าทรงประทานให้&rdquo;
                  <span className="block mt-3 text-sm text-white/50 italic">
                    — เอเฟซัส 2:8
                  </span>
                </p>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <p className="text-white/95 text-xl sm:text-2xl md:text-3xl font-light italic leading-relaxed">
              &ldquo;เหตุฉะนั้นถ้าผู้ใดอยู่ในพระคริสต์ ผู้นั้นก็เป็นคนที่ถูกสร้างใหม่แล้ว 
              <br />
              สิ่งสารพัดเก่าๆก็ล่วงไป นี่แน่ะกลายเป็นสิ่งใหม่ทั้งนั้น&rdquo;
            </p>

            <p className="text-white/60 text-lg sm:text-xl font-medium">2 โครินธ์ 5:17</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link
                href="/contact"
                className={`inline-flex items-center gap-2 rounded-full px-10 py-5 text-lg font-bold uppercase tracking-wider transition-all duration-300 shadow-xl ${
                  colorTheme === 'lowkey' 
                    ? 'bg-primary text-primary-foreground hover:bg-white hover:text-primary shadow-primary/20' 
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                ติดต่อเรา
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
