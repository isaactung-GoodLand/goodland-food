import Link from "next/link";
import { ArrowUpRight, Sparkles, Leaf, Coffee, Newspaper, Quote } from "lucide-react";
import { Reveal } from "@/components/reveal";

export default function Home() {
  return (
    <>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative pt-12 pb-24 grain overflow-hidden">
        <div className="container-x relative z-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-50 border border-forest-300 text-forest-700 text-xs uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-500 pulse-dot" />
              食品科技 · Food Innovation Co.
            </div>
          </Reveal>

          <div className="mt-10 grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <Reveal delay={0.1}>
                <h1 className="font-serif font-light text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] tracking-tight text-balance">
                  港式茶飲的<br />
                  <span className="italic text-forest-700">下一個時代。</span>
                </h1>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="mt-7 max-w-xl text-base md:text-lg text-ink-700 leading-relaxed">
                  甘田食品科技 — 從三點三的拼配茶、立陶宛的港式淡奶,
                  到全球首創快速煮茶機,讓道地的港式奶茶變得簡單、規模化、可複製。
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/machine"
                    className="group inline-flex items-center gap-2 px-6 py-3.5 bg-ink-900 text-cream-50 rounded-full font-medium hover:bg-forest-700 transition-colors"
                  >
                    探索煮茶機
                    <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    href="/three-thirty"
                    className="inline-flex items-center gap-2 px-6 py-3.5 border border-ink-900/20 rounded-full font-medium hover:bg-ink-900 hover:text-cream-50 transition-colors"
                  >
                    三點三食材系列
                  </Link>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={0.2}>
                <div className="relative aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-forest-700 via-forest-900 to-ink-900 overflow-hidden">
                  <div className="absolute inset-0 opacity-30 grain" />
                  {/* Stylized kettle illustration */}
                  <svg viewBox="0 0 400 500" className="absolute inset-0 w-full h-full">
                    <defs>
                      <linearGradient id="cup" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#FBF8F3" stopOpacity="0.92" />
                        <stop offset="1" stopColor="#EAE0CE" stopOpacity="0.85" />
                      </linearGradient>
                    </defs>
                    {/* Steam */}
                    <path d="M 180 60 Q 175 40 185 25 Q 195 10 188 -5" stroke="#FBF8F3" strokeOpacity="0.4" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M 210 70 Q 205 50 215 35 Q 225 20 218 5" stroke="#FBF8F3" strokeOpacity="0.5" strokeWidth="2" fill="none" strokeLinecap="round" />
                    {/* Kettle body */}
                    <rect x="120" y="100" width="160" height="220" rx="28" fill="url(#cup)" />
                    {/* Tea level */}
                    <rect x="135" y="180" width="130" height="120" rx="8" fill="#8C6A3A" opacity="0.6" />
                    {/* Spout */}
                    <path d="M 280 150 L 320 130 L 320 165 L 280 165 Z" fill="url(#cup)" />
                    {/* Handle */}
                    <path d="M 120 130 Q 80 170 80 220 Q 80 270 120 290" stroke="url(#cup)" strokeWidth="14" fill="none" strokeLinecap="round" />
                    {/* Base/stand */}
                    <rect x="110" y="330" width="180" height="14" rx="7" fill="#1A2E18" />
                    <rect x="160" y="344" width="80" height="30" rx="4" fill="#1A2E18" />
                    <rect x="150" y="374" width="100" height="8" rx="4" fill="#0F1A14" />
                    {/* Brand mark on cup */}
                    <text x="200" y="245" textAnchor="middle" fontFamily="serif" fontSize="36" fontStyle="italic" fill="#2F4D2B" opacity="0.7">甘</text>
                  </svg>
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-cream-50">
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-cream-100/70">The Kettle</div>
                      <div className="font-serif text-xl mt-0.5">快速煮茶機 · 2024</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cream-50/15 backdrop-blur-sm border border-cream-50/20">8 min</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.4}>
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-ink-900/10">
              {[
                { k: "2017", v: "創立年份" },
                { k: "8 min", v: "煮茶時間" },
                { k: "3+", v: "產品線" },
                { k: "10+", v: "媒體報導" },
              ].map((s) => (
                <div key={s.k}>
                  <div className="font-serif text-4xl md:text-5xl text-forest-700">{s.k}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mt-2">{s.v}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── PHILOSOPHY ───────────────── */}
      <section className="py-24 bg-cream-100">
        <div className="container-x">
          <Reveal>
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4">
                <div className="text-xs uppercase tracking-[0.25em] text-forest-700 font-medium">
                  Our Belief
                </div>
                <h2 className="mt-4 font-serif text-3xl md:text-4xl font-light leading-[1.1] text-balance">
                  三點三,<br />不只是時間,<br />是一種
                  <span className="italic text-forest-700">文化。</span>
                </h2>
              </div>
              <div className="lg:col-span-7 lg:col-start-6 space-y-5 text-base md:text-lg text-ink-700 leading-relaxed">
                <p>
                  午後三點三十分,香港的上班族放下工作、茶餐廳沖出一壼絲襪奶茶 — 這套街景已延續八十多年。
                </p>
                <p>
                  甘田相信港式茶飲的靈魂,在「茶膽 × 淡奶 × 撞茶」三者。
                  我們從源頭把關:斯里蘭卡拼配茶、立陶宛小農產的港式淡奶、自家研發的快速煮茶機。
                </p>
                <p className="text-ink-900 font-medium">
                  把這份味道,帶到台北、台中、東京、新加坡 — 讓世界每一個角落的三點三,都是港式。
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── PRODUCTS ───────────────── */}
      <section className="py-24">
        <div className="container-x">
          <Reveal>
            <div className="flex items-end justify-between mb-16 gap-8 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-forest-700 font-medium">
                  Product Lines
                </div>
                <h2 className="mt-4 font-serif text-4xl md:text-5xl font-light leading-tight">
                  兩條產品線,<br />
                  <span className="italic text-forest-700">一份初心。</span>
                </h2>
              </div>
              <p className="max-w-sm text-ink-700">
                從硬體設備到配方食材,我們把港式奶茶標準化。
              </p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-6">
            <Reveal>
              <Link href="/machine" className="group block relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-forest-900 text-cream-50 p-10 transition-transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-forest-700 via-forest-900 to-ink-900" />
                <div className="absolute inset-0 opacity-20 grain" />
                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <Coffee size={32} className="text-forest-300" />
                    <ArrowUpRight size={24} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-forest-300 mb-3">Hardware · 01</div>
                    <h3 className="font-serif text-4xl font-light leading-tight">
                      快速煮茶機<br />
                      <span className="italic">8 分鐘一壼。</span>
                    </h3>
                    <p className="mt-4 text-cream-100/70 text-sm max-w-sm">
                      上煮下保溫 · 一次兩壼 · 高腳出茶 — 全球首創,專為港式奶茶量身設計。
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>

            <Reveal delay={0.1}>
              <Link href="/three-thirty" className="group block relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-cream-100 p-10 transition-transform hover:-translate-y-1 border border-ink-900/10">
                <div className="absolute inset-0 bg-gradient-to-br from-cream-100 to-cream-200" />
                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <Leaf size={32} className="text-forest-700" />
                    <ArrowUpRight size={24} className="text-ink-700 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-forest-700 mb-3">Ingredients · 02</div>
                    <h3 className="font-serif text-4xl font-light leading-tight text-ink-900">
                      三點三<br />
                      <span className="italic text-forest-700">食材 × 茶飲。</span>
                    </h3>
                    <p className="mt-4 text-ink-700 text-sm max-w-sm">
                      斯里蘭卡拼配茶 · 立陶宛烘焙用淡奶 · 即沖即飲茶系列 — 在家、在店,都好喝。
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────────── PULL QUOTE ───────────────── */}
      {/* ───────────────── PULL QUOTE ───────────────── */}
      <section className="py-20 bg-forest-900 text-cream-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 grain" />
        <div className="container-x relative z-10">
          <Quote size={36} className="text-forest-500 mb-6" />
          <Reveal>
            <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-light leading-[1.25] text-balance max-w-4xl">
              「做茶這件事,甘田讓傳統茶餐廳的『撞茶』走進了實驗室 — 從溫度、壓力、時間參數化,讓每一杯都是同一個味道。」
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-forest-700 flex items-center justify-center text-cream-50 font-serif text-lg">HK</div>
              <div>
                <div className="text-sm font-medium">媒體訪談摘錄</div>
                <div className="text-xs text-cream-100/60 uppercase tracking-[0.2em] mt-1">Hong Kong Economic Times · 2022</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── PRESS TEASER ───────────────── */}
      <section className="py-32">
        <div className="container-x">
          <Reveal>
            <div className="flex items-end justify-between mb-12 gap-8 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-forest-700 font-medium flex items-center gap-2">
                  <Newspaper size={14} /> Media Coverage
                </div>
                <h2 className="mt-4 font-serif text-4xl md:text-5xl font-light leading-tight">
                  上過這些
                  <span className="italic text-forest-700">媒體。</span>
                </h2>
              </div>
              <Link href="/press" className="text-ink-700 hover:text-forest-700 text-sm font-medium border-b border-ink-900/20 pb-0.5">
                看全部報導 →
              </Link>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-px bg-ink-900/10 border border-ink-900/10 rounded-2xl overflow-hidden">
            {[
              { src: "香港經濟日報 HKET", title: "食品創新科技公司研港式奶茶沖茶機", date: "2022" },
              { src: "自由時報 LTN", title: "立陶宛奶水卡關中國 台廠甘田接手", date: "2022" },
              { src: "Focus Taiwan", title: "Taiwan firm steps in for Lithuanian milk", date: "2022" },
            ].map((m, i) => (
              <Reveal key={m.title} delay={i * 0.05}>
                <Link href="/press" className="group block bg-cream-50 p-8 h-full hover:bg-cream-100 transition-colors">
                  <div className="text-xs uppercase tracking-[0.2em] text-ink-500">{m.src}</div>
                  <h3 className="mt-4 font-serif text-2xl font-light leading-tight text-balance">
                    {m.title}
                  </h3>
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <span className="text-ink-500">{m.date}</span>
                    <ArrowUpRight size={16} className="text-forest-700 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── CTA ───────────────── */}
      <section className="py-32 bg-cream-100">
        <div className="container-x text-center">
          <Reveal>
            <Sparkles size={28} className="text-forest-700 mx-auto mb-6" />
            <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight max-w-3xl mx-auto text-balance">
              想讓你的店,<br />也沖出 <span className="italic text-forest-700">香港的味道？</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className="px-7 py-3.5 bg-ink-900 text-cream-50 rounded-full font-medium hover:bg-forest-700 transition-colors">
                洽詢合作
              </Link>
              <Link href="/machine" className="px-7 py-3.5 border border-ink-900/20 rounded-full font-medium hover:bg-ink-900 hover:text-cream-50 transition-colors">
                了解煮茶機規格
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
