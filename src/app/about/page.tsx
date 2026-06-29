import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";

const TIMELINE = [
  { year: "2017", text: "甘田食品科技成立,從茶葉代理與配方研發開始。", photo: "中壢辦公室 · 茶葉倉儲區" },
  { year: "2019", text: "帶著研發產品參加上海國際食品展,於立陶宛館首度曝光。", photo: "上海 SFF · 立陶宛館展位" },
  { year: "2021", text: "立陶宛淡奶進口受阻,甘田接手代理通路。", photo: "立陶宛農場與運輸現場" },
  { year: "2022", text: "全球首創『快速煮茶機』問世,獲多家媒體專題報導。", photo: "第一代原型機測試" },
  { year: "2024+", text: "三點三食材系列上市,港式茶飲走進家庭與便利商店。", photo: "合作店家現場" },
];

export default function AboutPage() {
  return (
    <>
      <PageShell
        eyebrow="About · 關於甘田"
        title={
          <>
            做文化的<br />
            <span className="italic text-forest-700">食品科技公司。</span>
          </>
        }
        subtitle="我們不只是一間賣茶和機器的公司。我們想把港式茶飲文化的『對』,讓更多人喝得到、學得到、開得出來。"
      />

      <section className="py-20">
        <div className="container-x">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <Reveal>
                <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight">
                  從台灣出發,<br />
                  <span className="italic text-forest-700">面向華語市場。</span>
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7 space-y-5 text-lg text-ink-700 leading-relaxed">
              <Reveal delay={0.1}>
                <p>
                  甘田食品科技股份有限公司(Goodland Food Technology Co., Ltd.)創立於 2017,
                  從進口斯里蘭卡茶葉與立陶宛奶製品起家,逐步走向自有品牌與專利設備。
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <p>
                  我們相信「好吃」背後是參數,「文化」背後是商業模型。
                  這兩件事看似衝突,但正是甘田想解決的命題。
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-cream-100">
        <div className="container-x">
          <Reveal>
            <div className="text-xs uppercase tracking-[0.3em] text-forest-700 font-medium">
              Timeline · 甘田大事記
            </div>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl font-light leading-tight">
              一路走來,<br />
              <span className="italic text-forest-700">從茶葉到機器。</span>
            </h2>
          </Reveal>

          <div className="mt-16 relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-ink-900/15" />
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={i * 0.05}>
                <div className={`relative grid md:grid-cols-2 gap-8 md:gap-12 mb-12 ${i % 2 ? "md:rtl" : ""}`}>
                  <div className={`md:px-8 ${i % 2 ? "md:text-right" : ""}`}>
                    <div className={`relative inline-block ${i % 2 ? "md:ml-auto" : ""}`}>
                      <div className="absolute -left-8 md:left-auto md:right-full md:mr-8 top-2 w-3 h-3 rounded-full bg-forest-500 ring-4 ring-cream-100" />
                      <div className="font-serif text-3xl text-forest-700">{t.year}</div>
                      <p className="mt-2 text-ink-700 max-w-sm">{t.text}</p>
                      <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-700 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-forest-500" />
                        {t.photo}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
