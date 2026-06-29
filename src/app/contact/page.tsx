"use client";
import { useState } from "react";
import { Mail, MapPin, Building2, Check } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageShell
        eyebrow="Contact · 聯絡合作"
        title={
          <>
            聊聊你的<br />
            <span className="italic text-forest-700">下一個想法。</span>
          </>
        }
        subtitle="經銷合作、團購客製、媒體邀訪 — 不論你是品牌、店家還是個人,我們都想聽聽看。"
      />

      <section className="py-16">
        <div className="container-x">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Reveal>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-ink-500">Email</div>
                    <a href="mailto:hello@goodland-food.com" className="block mt-1 font-serif text-xl hover:text-forest-700 transition-colors">
                      hello@goodland-food.com
                    </a>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700 shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-ink-500">Company</div>
                    <div className="mt-1 font-serif text-xl">甘田食品科技股份有限公司</div>
                    <div className="text-sm text-ink-500 mt-1">Goodland Food Technology Co., Ltd.</div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center text-forest-700 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-ink-500">Markets</div>
                    <div className="mt-1 font-serif text-xl">Taiwan · Hong Kong</div>
                    <div className="text-sm text-ink-500 mt-1">業務範圍: 華語市場、東亞、東南亞</div>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-3">
              <Reveal delay={0.15}>
                <form
                  onSubmit={(e) => { e.preventDefault(); setSent(true); }}
                  className="space-y-5 bg-cream-100 p-8 md:p-10 rounded-[2rem]"
                >
                  {sent ? (
                    <div className="py-12 text-center">
                      <div className="w-14 h-14 rounded-full bg-forest-700 text-cream-50 flex items-center justify-center mx-auto">
                        <Check size={28} />
                      </div>
                      <h3 className="mt-6 font-serif text-3xl">訊息已送出</h3>
                      <p className="mt-3 text-ink-700">我們會在 1–2 個工作天內回覆你。</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-5">
                        <FormField label="姓名 / Name" name="name" />
                        <FormField label="公司 / Company" name="company" />
                      </div>
                      <FormField label="Email" name="email" type="email" />
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-ink-500">合作類型</label>
                        <select className="mt-2 w-full bg-cream-50 border border-ink-900/15 rounded-xl px-4 py-3 focus:outline-none focus:border-forest-500">
                          <option>B2B 經銷</option>
                          <option>團購 / 客製</option>
                          <option>媒體邀訪</option>
                          <option>其他</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[0.2em] text-ink-500">訊息</label>
                        <textarea
                          name="message"
                          rows={5}
                          className="mt-2 w-full bg-cream-50 border border-ink-900/15 rounded-xl px-4 py-3 focus:outline-none focus:border-forest-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-6 py-3.5 bg-ink-900 text-cream-50 rounded-full font-medium hover:bg-forest-700 transition-colors"
                      >
                        送出訊息 →
                      </button>
                    </>
                  )}
                </form>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FormField({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-500">{label}</label>
      <input
        name={name}
        type={type}
        className="mt-2 w-full bg-cream-50 border border-ink-900/15 rounded-xl px-4 py-3 focus:outline-none focus:border-forest-500"
      />
    </div>
  );
}
