"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * SSR-safe reveal component.
 * - Default state (no JS, print, SEO crawlers): fully visible.
 * - With JS: starts hidden at first paint after mount if not in view,
 *   then fades up when scrolled into view.
 * - Hydration mismatch is avoided because initial render is visible on server,
 *   client switches to hidden only after mount if element is below the fold.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 16,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const rect = el.getBoundingClientRect();
    const visible = rect.top < window.innerHeight - 50 && rect.bottom > 0;
    if (visible) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => setShown(true), delay * 1000);
            io.disconnect();
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  // Visible during SSR / before mount / after reveal
  const visible = !mounted || shown;
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
