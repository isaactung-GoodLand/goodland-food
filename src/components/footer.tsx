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
                <a href="https://gantianfoodtechnology.easy.co/" target="_blank" className="hover:text-forest-300 transition-colors">
                  線上購買 →
                </a>
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
