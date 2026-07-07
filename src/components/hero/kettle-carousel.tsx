"use client";

import { useEffect, useState } from "react";
import { Coffee, ArrowUpRight } from "lucide-react";

const SLIDES = [
  {
    src: "/products/tea-machine-1.jpg",
    alt: "三點三快速煮茶機 — 全球首創上煮下保溫設計",
  },
  {
    src: "/products/tea-machine-2.jpg",
    alt: "三點三快速煮茶機 — 實機操作畫面",
  },
  {
    src: "/products/matcha-powder.jpg",
    alt: "三點三抹茶粉 — 100% 純天然烘焙專用",
  },
];

const ROTATE_MS = 5000;

export function KettleCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / ROTATE_MS) * 100);
      setProgress(pct);
      if (elapsed >= ROTATE_MS) {
        setIdx((i) => (i + 1) % SLIDES.length);
        setProgress(0);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [idx, paused]);

  const goTo = (i: number) => {
    setIdx(i);
    setProgress(0);
  };

  return (
    <div
      className="relative aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-forest-700 via-forest-900 to-ink-900 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setProgress(0);
      }}
    >
      <div className="absolute inset-0 opacity-30 grain z-10 pointer-events-none" />

      {/* 照片層 */}
      {SLIDES.map((s, i) => (
        <div
          key={s.src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === idx ? 1 : 0 }}
          aria-hidden={i !== idx}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.src}
            alt={s.alt}
            className="absolute inset-0 w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* 暗化遮罩 + 底部文字 */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-900/85 via-forest-900/40 to-transparent z-20 pointer-events-none" />
      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-cream-50 z-30">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-cream-100/70">
            The Kettle
          </div>
          <div className="font-serif text-xl mt-0.5">快速煮茶機 · 2024</div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cream-50/15 backdrop-blur-sm border border-cream-50/20">
          8 min
        </span>
      </div>

      {/* 右下 — 進度條 + dot 指示 */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="group relative h-1 rounded-full bg-cream-50/30 hover:bg-cream-50/50 transition-colors"
            style={{ width: i === idx ? 28 : 12 }}
            aria-label={`第 ${i + 1} 張`}
          >
            {i === idx && !paused && (
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-cream-50"
                style={{ width: `${progress}%` }}
              />
            )}
            {i === idx && paused && (
              <span className="absolute inset-y-0 left-0 right-0 rounded-full bg-cream-50/80" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
