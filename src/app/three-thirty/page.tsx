import Link from "next/link";
import { Leaf, Drumstick, Coffee, ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";

const PRODUCTS = [
  {
    name: "三點三 — 拼配茶系列",
    sub: "Sri Lanka Blend Tea",
    desc: "來自斯里蘭卡中低海拔茶園,五種茶葉比例拼配 — 重現 1960 年代香港茶餐廳的茶膽風味。",
    specs: ["獨立茶包 · 每包 8g", "20 包 / 盒", "冷萃 / 熱沖兩用"],
    icon: Leaf,
    tone: "forest",
  },
  {
    name: "三點三 — 立陶宛淡奶",
    sub: "Lithuania Evaporated Milk",
    desc: "立陶宛當地牧場的低脂鮮乳,經低溫蒸發成港式奶茶專用比例。卡關中國後由甘田接手代理。",
    specs: ["400ml 罐裝", "一箱 24 罐", "未開封常溫 18 個月"],
    icon: Drumstick,
    tone: "tea",
  },
  {
    name: "三點三 — 即沖茶飲",
    sub: "Ready-to-drink Series",
    desc: "絲襪奶茶、凍檸茶、鴛鴦 — 沖氮包裝,辦公室、飯店、便利商店都好用。",
    specs: ["隨手包 25g", "12 入盒裝", "熱水 30 秒即沖"],
    icon: Coffee,
    tone: "forest",
  },
];

export default function ThreeThirtyPage() {
  return (
    <>
      <PageShell
        eyebrow="Product · Ingredients 02"
        title={
          <>
            三點三食材,<br />
            <span className="italic text-forest-700">把茶餐廳</span> 帶回家。
          </>
        }
        subtitle="拼配茶 × 淡奶 × 即沖茶 — 從源頭把關的港式茶飲素材,在家用三分鐘沖出香港的味道。"
      />

      <section className="py-16">
        <div className="container-x space-y-6">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div className="group relative rounded-[2rem] border border-ink-900/10 bg-cream-50 overflow-hidden">
                <div className="grid md:grid-cols-12 gap-6 p-8 md:p-12">
                  <div className="md:col-span-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      p.tone === "tea" ? "bg-tea-500/15 text-tea-500" : "bg-forest-50 text-forest-700"
                    }`}>
                      <p.icon size={28} />
                    </div>
                    <div className="mt-6 text-xs uppercase tracking-[0.25em] text-ink-500">{p.sub}</div>
                  </div>
                  <div className="md:col-span-6">
                    <h3 className="font-serif text-3xl md:text-4xl font-light leading-tight">
                      {p.name}
                    </h3>
                    <p className="mt-4 text-ink-700 leading-relaxed">{p.desc}</p>
                  </div>
                  <div className="md:col-span-3 md:border-l md:border-ink-900/10 md:pl-8">
                    <ul className="space-y-2 text-sm text-ink-700">
                      {p.specs.map((s) => (
                        <li key={s} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-forest-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="https://gantianfoodtechnology.easy.co/"
                      target="_blank"
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-forest-900"
                    >
                      線上購買 <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-24 bg-cream-100">
        <div className="container-x text-center">
          <Reveal>
            <h2 className="font-serif text-3xl md:text-4xl font-light max-w-2xl mx-auto leading-tight text-balance">
              三點三的下午,<br />
              <span className="italic text-forest-700">從一杯好茶開始。</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Link
              href="https://gantianfoodtechnology.easy.co/"
              target="_blank"
              className="mt-10 inline-flex items-center gap-2 px-7 py-3.5 bg-ink-900 text-cream-50 rounded-full font-medium hover:bg-forest-700 transition-colors"
            >
              前往線上商店 →
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
