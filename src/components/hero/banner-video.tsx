"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

const VIDEO_ID = "C6XQr7lw3vw";
const VIDEO_TITLE = "來自錫蘭高山天然的紅茶 — 三點三的底韻";

export function BannerVideo() {
  const [playing, setPlaying] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative w-full bg-ink-900 overflow-hidden">
      <div className="container-x py-3">
        <div className="relative aspect-[21/9] md:aspect-[24/9] rounded-2xl overflow-hidden bg-forest-900">
          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&rel=0&modestbranding=1`}
              title={VIDEO_TITLE}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 w-full h-full flex items-center justify-center text-left"
              aria-label="播放品牌影片"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
                alt={VIDEO_TITLE}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 via-forest-900/30 to-forest-900/40" />
              <div className="relative z-10 flex items-center gap-4 px-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-cream-50 text-forest-900 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play size={22} fill="currentColor" />
                </div>
                <div className="text-cream-50 max-w-md">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-cream-100/80">
                    Brand Film · 品牌影片
                  </p>
                  <p className="mt-1 font-serif text-lg md:text-xl leading-snug">
                    錫蘭高山 · 濃醇香 · 三點三的底韻
                  </p>
                  <p className="mt-1 text-xs text-cream-100/60">59 秒</p>
                </div>
              </div>
            </button>
          )}

          {/* 關閉按鈕 */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-cream-50/90 hover:bg-cream-50 text-ink-900 flex items-center justify-center transition-colors"
            aria-label="關閉影片"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
