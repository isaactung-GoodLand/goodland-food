import Link from "next/link";
import { Clock, Layers, ArrowUpRight, Coffee, Check } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";

const SPECS = [
  { k: "煮茶時間", v: "8 分鐘", icon: Clock },
  { k: "同時出茶", v: "2 壼", icon: Layers },
  { k: "保溫設計", v: "上煮下保溫", icon: Coffee },
  { k: "出茶高度", v: "高腳式 · 免傾倒", icon: ArrowUpRight },
];

const HIGHLIGHTS = [
  "全球首創『上煮下保溫』一體式結構",
  "食品級不鏽鋼茶膽 · 易拆洗",
  "智慧溫控曲線 90°C → 100°C",
  "專利高腳出茶口 · 不滴、不灑、不燙手",
  "獨立包裝茶包專用槽位",
  "可用即沖茶包、拼配散茶、茶磚",
];

export default function MachinePage() {
  return (
    <>
      <PageShell
        eyebrow="Product · Hardware 01"
        title={
          <>
            快速煮茶機,<br />
            <span className="italic text-forest-700">把撞茶時間</span> 壓到 8 分鐘。
          </>
        }
        subtitle="一台專為港式奶茶設計的煮茶機 — 把過去茶餐廳師傅半小時的手藝,變成任何人按下按鈕就能沖出的品質。"
      />

      {/* Photo + Specs */}
      <section className="py-20">
        <div className="container-x">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="relative aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-forest-700 via-forest-900 to-ink-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20 grain" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-56 rounded-2xl bg-cream-50/10 backdrop-blur-sm border border-cream-50/20 relative">
                    <div className="absolute top-4 left-4 right-4 h-32 rounded-xl bg-cream-50/15" />
                    <div className="absolute bottom-12 left-6 right-6 h-10 rounded-full bg-forest-500/40" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-cream-50/40" />
                  </div>
                </div>
                <div className="absolute bottom-8 left-8 text-cream-50 font-serif text-2xl italic">
                  The Kettle. 2024
                </div>
              </div>
            </Reveal>

            <div>
              <Reveal delay={0.1}>
                <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight">
                  從茶餐廳到實驗室 —<br />
                  <span className="italic text-forest-700">參數化的好茶。</span>
                </h2>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-6 text-ink-700 leading-relaxed">
                  我們與香港資深茶餐廳師傅合作,把「撞茶」這套工藝拆解成溫度曲線、水流速度、悶蒸時間。
                  煮茶機內建微控制器,精準複現每一個動作。
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10">
                  {SPECS.map((s) => (
                    <div key={s.k} className="border-t border-ink-900/15 pt-5">
                      <s.icon size={20} className="text-forest-700" />
                      <div className="mt-3 font-serif text-2xl text-forest-700">{s.v}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mt-1">{s.k}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 bg-cream-100">
        <div className="container-x">
          <Reveal>
            <h2 className="font-serif text-3xl md:text-4xl font-light max-w-2xl leading-tight">
              為什麼這台機器,<br />
              <span className="italic text-forest-700">最適合港式奶茶。</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            {HIGHLIGHTS.map((h, i) => (
              <Reveal key={h} delay={i * 0.05}>
                <div className="flex items-start gap-4 p-6 bg-cream-50 rounded-2xl border border-ink-900/5">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-forest-700 text-cream-50 flex items-center justify-center">
                    <Check size={18} />
                  </div>
                  <div className="font-medium text-ink-900">{h}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + B2B */}
      <section className="py-24 bg-cream-100">
        <div className="container-x">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight text-balance">
                想瞭解售價、<span className="italic text-forest-700">經銷細節？</span>
              </h2>
              <p className="mt-5 text-ink-700 leading-relaxed max-w-lg">
                我們提供完整 B2B 套件 — 機器、保養、首批茶材、教育訓練。歡迎經銷夥伴、茶餐廳業者、食品廠來信索取。
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/contact" className="px-7 py-3.5 bg-ink-900 text-cream-50 rounded-full font-medium hover:bg-forest-700 transition-colors">
                  洽詢 B2B
                </Link>
                <a
                  href="#"
                  download
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-ink-900/20 rounded-full font-medium hover:bg-ink-900 hover:text-cream-50 transition-colors"
                >
                  <Coffee size={16} /> 下載規格表 PDF
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { k: "30+", v: "合作店家" },
                  { k: "3", v: "海外市場" },
                  { k: "98%", v: "客戶回購率" },
                ].map((s) => (
                  <div key={s.k} className="bg-cream-50 rounded-2xl p-6 border border-ink-900/5">
                    <div className="font-serif text-3xl text-forest-700">{s.k}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mt-2">{s.v}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
