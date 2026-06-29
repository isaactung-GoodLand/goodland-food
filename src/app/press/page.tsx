import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";
import { ArrowUpRight } from "lucide-react";

const PRESS = [
  {
    outlet: "香港經濟日報 HKET",
    name: "HKET",
    color: "#A8201A",
    initial: "經",
    title: "食品創新科技公司研港式奶茶沖茶機",
    date: "2022",
    excerpt: "立陶宛奶水卡關中國,台廠甘田接手重新打通路,並研發出全球首創的快速煮茶機。",
    url: "https://sme.hket.com/article/2804307/",
  },
  {
    outlet: "自由時報 LTN",
    name: "LTN",
    color: "#1F4E9D",
    initial: "LT",
    title: "立陶宛奶水卡關中國 台廠甘田接手",
    date: "2022",
    excerpt: "承接原物料供應,創立品牌打入華語市場。",
    url: "https://news.ltn.com.tw/news/politics/paper/1495085",
  },
  {
    outlet: "TVBS",
    name: "TVBS",
    color: "#000000",
    initial: "TV",
    title: "台廠自製港式奶茶機 8 分鐘沖出茶餐廳味道",
    date: "2022",
    excerpt: "甘田研發團隊專訪,深入煮茶機原理與香港茶文化。",
    url: "#",
  },
  {
    outlet: "Focus Taiwan",
    name: "FT",
    color: "#0F4A2A",
    initial: "FT",
    title: "Taiwan firm steps in for Lithuanian milk",
    date: "2022",
    excerpt: "International coverage of Goodland's pivot during the supply chain disruption.",
    url: "https://japan.focustaiwan.tw/economy/202201110005",
  },
  {
    outlet: "2019 上海國際食品展",
    name: "SFF",
    color: "#8C6A3A",
    initial: "SFF",
    title: "立陶宛館 - 甘田首次國際曝光",
    date: "2019",
    excerpt: "於立陶宛國家館展出三點三食材概念,獲得業界關注。",
    url: "#",
  },
];

export default function PressPage() {
  return (
    <>
      <PageShell
        eyebrow="Media · 媒體報導"
        title={
          <>
            上過這些
            <span className="italic text-forest-700">媒體。</span>
          </>
        }
        subtitle="從香港經濟日報、台灣自由時報,到國際新聞 Focus Taiwan — 甘田的故事被不同語境的人看見。"
      />

      <section className="py-16">
        <div className="container-x space-y-4">
          {PRESS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.04}>
              <a
                href={p.url}
                target="_blank"
                className="group block rounded-2xl border border-ink-900/10 bg-cream-50 hover:bg-cream-100 transition-all overflow-hidden"
              >
                <div className="grid md:grid-cols-12 gap-6 items-center p-6 md:p-8">
                  <div className="md:col-span-2">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-cream-50 font-serif text-lg font-medium shadow-sm"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.initial}
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-500">{p.name}</div>
                  </div>
                  <div className="md:col-span-8">
                    <h3 className="font-serif text-xl md:text-2xl font-light leading-tight group-hover:text-forest-700 transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-ink-700 text-sm leading-relaxed">{p.excerpt}</p>
                  </div>
                  <div className="md:col-span-2 md:text-right">
                    <div className="font-serif text-xl text-ink-900">{p.date}</div>
                    <ArrowUpRight size={20} className="text-forest-700 ml-auto mt-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
