"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "首頁" },
  { href: "/products", label: "商品" },
  { href: "/machine", label: "快速煮茶機" },
  { href: "/three-thirty", label: "三點三食材" },
  { href: "/about", label: "關於甘田" },
  { href: "/press", label: "媒體報導" },
  { href: "/contact", label: "聯絡" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-cream-50/85 backdrop-blur-md border-b border-ink-900/10"
          : "bg-transparent"
      )}
    >
      <div className="container-x flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full bg-forest-700 flex items-center justify-center text-cream-50 font-serif text-lg font-semibold transition-transform group-hover:scale-105">
            甘
          </div>
          <div className="leading-none">
            <div className="font-serif text-lg font-semibold tracking-tight">
              甘田 Goodland
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 mt-0.5">
              Food Innovation
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
                  active
                    ? "text-forest-700"
                    : "text-ink-700 hover:text-ink-900"
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1 h-1 rounded-full bg-forest-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="https://gantianfoodtechnology.easy.co/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-cream-50 rounded-full text-sm font-medium hover:bg-forest-700 transition-colors"
        >
          線上購買 →
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-ink-900"
          aria-label="menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-cream-50 border-t border-ink-900/10">
          <div className="container-x py-6 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-base font-medium text-ink-700 hover:bg-cream-100 rounded-lg"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="https://gantianfoodtechnology.easy.co/"
              target="_blank"
              className="mt-2 px-4 py-3 bg-ink-900 text-cream-50 rounded-full text-center font-medium"
            >
              線上購買 →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
