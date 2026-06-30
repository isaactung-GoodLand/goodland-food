import type { Metadata } from "next";
import { getProductRepo } from "@/lib/db/products";
import { Reveal } from "@/components/reveal";
import { PageShell } from "@/components/page-shell";
import { ArrowUpRight, Sparkles, Package } from "lucide-react";
import type { Product } from "@/lib/adapters/types";

export const metadata: Metadata = {
  title: "商品總覽 — 甘田 Goodland-food",
  description:
    "三點三拼配茶、立陶宛港式淡奶、商用快速煮茶機 — 道地港式奶茶材料一次購足。",
};

// 每 60 秒重驗證,讓 cron 同步的商品能快速出現
export const revalidate = 60;

const PLATFORM_LABEL: Record<Product["platform"], string> = {
  shopee: "蝦皮",
  momo: "momo",
  pchome: "PChome",
  yahoo: "Yahoo",
  coupang: "酷澎",
  line: "LINE",
  iopenmall: "iOpen",
  maiship: "賣貨便",
  native: "甘田直營",
};

const PLATFORM_ACCENT: Record<Product["platform"], string> = {
  shopee: "text-orange-600",
  momo: "text-pink-600",
  pchome: "text-blue-600",
  yahoo: "text-purple-600",
  coupang: "text-red-600",
  line: "text-green-600",
  iopenmall: "text-amber-600",
  maiship: "text-sky-600",
  native: "text-forest-700",
};

function formatPrice(p: Product) {
  return `NT$ ${p.price.toLocaleString()}`;
}

export default async function ProductsPage() {
  const repo = getProductRepo();
  const products = await repo.listAll();
  const inStock = products.filter((p) => p.inStock !== false).length;

  return (
    <>
      <PageShell
        eyebrow="商品總覽 · Catalog"
        title={
          <>
            道地港式奶茶的<br />
            <span className="italic text-forest-700">完整材料庫。</span>
          </>
        }
        subtitle="從三點三拼配茶、立陶宛淡奶、商用煮茶機,到煉奶杯杯。每一個都為了好喝的那杯。"
      />

      {/* Stats strip */}
      <section className="container-x -mt-10 mb-12 relative z-10">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { v: products.length, l: "商品總數" },
              { v: inStock, l: "現貨供應" },
              { v: products.length - inStock, l: "補貨中" },
              { v: "100%", l: "台灣配送" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-ink-900/10 bg-cream-50 p-5 text-center"
              >
                <p className="font-serif text-3xl text-forest-700">{s.v}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-ink-500">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Product grid */}
      <section className="container-x pb-24">
        {products.length === 0 ? (
          <Reveal>
            <div className="text-center py-20 border border-dashed border-ink-900/20 rounded-2xl">
              <Package className="w-12 h-12 mx-auto text-ink-300 mb-4" />
              <p className="text-ink-500">商品資料準備中,請稍後再來。</p>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl border border-ink-900/10 bg-white p-5 hover:border-forest-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  data-testid="product-card"
                  data-product-id={p.id}
                >
                  <div className="relative aspect-[4/3] bg-cream-100 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {p.inStock === false && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-cream-50/90 backdrop-blur rounded-full text-xs text-ink-700 border border-ink-900/10">
                        補貨中
                      </div>
                    )}
                    {p.inStock !== false && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-forest-700 text-cream-50 rounded-full text-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        現貨
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <p
                      className={`text-[10px] uppercase tracking-[0.2em] font-medium ${PLATFORM_ACCENT[p.platform]}`}
                    >
                      {PLATFORM_LABEL[p.platform]}
                    </p>
                    <h3 className="mt-2 font-serif text-xl text-ink-900 leading-snug">
                      {p.name}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-serif text-2xl text-ink-900">
                        {formatPrice(p)}
                      </p>
                      <ArrowUpRight className="w-5 h-5 text-ink-400 group-hover:text-forest-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="container-x pb-24">
        <Reveal>
          <div className="rounded-3xl bg-forest-700 text-cream-50 p-8 md:p-12 text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-balance">
              想要 <span className="italic">B2B 批價</span> 或客製化方案?
            </h2>
            <p className="mt-3 text-cream-200/90 max-w-xl mx-auto">
              餐廳、連鎖茶飲、品牌聯名 — 我們有專人為您評估。
            </p>
            <a
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-cream-50 text-ink-900 rounded-full font-medium hover:bg-cream-100 transition"
            >
              聯絡業務團隊 →
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
