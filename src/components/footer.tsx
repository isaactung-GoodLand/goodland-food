"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink-900 text-cream-100 mt-32 relative grain overflow-hidden">
      <div className="container-x py-20">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="font-serif text-3xl tracking-tight text-cream-50">
              甘田 <span className="text-forest-300">.</span>
            </div>
            <p className="mt-4 text-cream-100/70 text-sm leading-relaxed max-w-md">
              食品科技公司。專注港式茶飲文化 — 從斯里蘭卡拼配茶、立陶宛淡奶,到全球首創快速煮茶機,讓一杯港式奶茶更簡單、更道地。
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cream-100/50">
              <span className="w-2 h-2 rounded-full bg-forest-500 pulse-dot" />
              三點三時光 · 港式茶飲
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.25em] text-cream-100/50 mb-5">
              Products
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/machine" className="hover:text-forest-300 transition-colors">快速煮茶機</Link></li>
              <li><Link href="/three-thirty" className="hover:text-forest-300 transition-colors">三點三食材</Link></li>
              <li><Link href="/three-thirty" className="hover:text-forest-300 transition-colors">三點三茶飲</Link></li>
              <li>
                <Link href="/products" className="hover:text-forest-300 transition-colors">
                  線上購買 →
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.25em] text-cream-100/50 mb-5">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="hover:text-forest-300 transition-colors">關於甘田</Link></li>
              <li><Link href="/press" className="hover:text-forest-300 transition-colors">媒體報導</Link></li>
              <li><Link href="/contact" className="hover:text-forest-300 transition-colors">聯絡合作</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.25em] text-cream-100/50 mb-5">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-cream-100/80">
              <li>Taiwan · Hong Kong</li>
              <li>
                <a href="mailto:hello@goodland-food.com" className="hover:text-forest-300 transition-colors">
                  hello@goodland-food.com
                </a>
              </li>
            </ul>
            <div className="mt-6 flex items-center gap-4">
              <button onClick={() => window.open('https://www.facebook.com/goodland.food', '_blank', 'width=600,height=700,left=100,top=100')} aria-label="Facebook" className="text-cream-100/60 hover:text-forest-300 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </button>
              <button onClick={() => window.open('https://www.instagram.com/goodland.food/', '_blank', 'width=600,height=700,left=100,top=100')} aria-label="Instagram" className="text-cream-100/60 hover:text-forest-300 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </button>
              <button onClick={() => window.open('https://www.youtube.com/@KnowOrUnknow', '_blank', 'width=800,height=600,left=100,top=100')} aria-label="YouTube" className="text-cream-100/60 hover:text-forest-300 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </button>
              <button onClick={() => window.open('https://maps.app.goo.gl/7Vyv9WidxxSYz1Ta8', '_blank', 'width=600,height=700,left=100,top=100')} aria-label="Google Maps" className="text-cream-100/60 hover:text-forest-300 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C7.802 0 4.4 3.402 4.4 7.6c0 5.715 7.6 14.4 7.6 14.4s7.6-8.685 7.6-14.4C19.6 3.402 16.198 0 12 0zm0 10.4a2.8 2.8 0 110-5.6 2.8 2.8 0 010 5.6z"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="hairline my-12 bg-cream-100/20" style={{ opacity: 1 }} />

        <div className="flex flex-col md:flex-row justify-between gap-4 text-xs text-cream-100/50">
          <div>© {new Date().getFullYear()} 甘田食品科技股份有限公司 Goodland Food Technology Co., Ltd.</div>
          <div className="flex gap-6">
            <span>Feisty Dolphin 495611</span>
            <Link href="/" className="hover:text-cream-100">回到頂部 ↑</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
