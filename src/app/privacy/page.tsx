import { PageShell } from "@/components/page-shell";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "隱私權政策 | 甘田食品科技",
  description:
    "甘田食品科技股份有限公司隱私權政策。說明我們蒐集哪些個人資料、如何使用與保護,以及您的權利。",
};

const SECTIONS = [
  {
    no: "01",
    title: "適用範圍",
    body: "本政策適用於甘田食品科技股份有限公司(以下簡稱「本公司」)所經營之網站及其相關服務,包含但不限於線上購物、經銷商合作洽詢、以及透過 LINE、Facebook Messenger、Instagram 官方帳號與您之互動。本政策亦涵蓋本公司於業務推廣時,經您同意後與您聯繫所使用之個人資料。",
  },
  {
    no: "02",
    title: "我們蒐集的資料",
    body: "我們僅蒐集為提供服務所必要之資料,包含:姓名、聯絡電話、電子郵件、公司或店家名稱、營業地址、聯絡管道(含 LINE ID、Facebook 粉專名稱、Instagram 帳號),以及您於洽詢、訂購或參與活動時主動提供之其他資訊。本公司網站不蒐集兒童資料。",
  },
  {
    no: "03",
    title: "資料的使用目的",
    body: "上述資料用於:(1) 提供產品與服務及處理訂單;(2) 與您聯繫有關產品供應、經銷合作、物流與售後服務事項;(3) 寄送產品資訊或活動通知(您可隨時取消訂閱);(4) 改善產品與服務品質;(5) 履行法定義務及維護權益。",
  },
  {
    no: "04",
    title: "資料的利用與分享",
    body: "本公司不出售您的個人資料。僅在下列情形向第三方揭露: (1) 委託物流或金流服務商執行配送與收付款;(2) 依法令或主管機關要求;(3) 為保護本公司或第三方之合法权益所必要。上述第三方均受其個別隱私權規範約束,本公司並要求其負保密義務。",
  },
  {
    no: "05",
    title: "資料安全與保存",
    body: "本公司依「個人資料保護法」及相關法令辦理,採取加密傳輸、權限控管、存取紀錄等合理安全措施以保護您的資料。您的資料保存期間為達成蒐集目的所必要期間,或依法令規定之保存期限;逾期間後將依法刪除或匿名化。",
  },
  {
    no: "06",
    title: "您的權利",
    body: "依個人資料保護法,您得就本公司持有之您的個人資料行使下列權利: (1) 查閱、閱覽、複製您的個人資料;(2) 請求更正或補充您的個人資料;(3) 請求刪除您的個人資料;(4) 撤回您先前所為之同意;(5) 限制利用您的個人資料。行使方式請來信至下方聯絡方式,本公司將於法定期間內回覆。",
  },
  {
    no: "07",
    title: "Cookie 與分析工具",
    body: "本公司網站使用 Cookie 與類似技術以提供基本功能、統計網站流量與改善使用體驗。您可以透過瀏覽器設定停用 Cookie,惟部分功能可能無法正常使用。",
  },
  {
    no: "08",
    title: "政策更新",
    body: "本公司可能因法令變更或業務調整而更新本政策,更新後將於本網站公告,並標示生效日期。重大變更時,本公司將另行通知。",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageShell
        eyebrow="Privacy · 隱私權政策"
        title={
          <>
            我們如何
            <br />
            <span className="italic text-forest-700">對待您的資料。</span>
          </>
        }
        subtitle="本政策說明甘田食品科技股份有限公司如何蒐集、使用與保護您的個人資料。政策生效日期:2026 年 11 月 16 日。"
      />

      <section className="pb-20">
        <div className="container-x">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <Reveal>
                <div className="sticky top-24 space-y-6">
                  <div className="text-xs uppercase tracking-[0.3em] text-forest-700 font-medium">
                    Contents · 目次
                  </div>
                  <ol className="space-y-2 text-sm">
                    {SECTIONS.map((s) => (
                      <li key={s.no}>
                        <a
                          href={`#s${s.no}`}
                          className="flex gap-3 text-ink-700 hover:text-forest-700 transition-colors"
                        >
                          <span className="text-forest-700/60 font-mono text-xs pt-0.5">
                            {s.no}
                          </span>
                          <span>{s.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-8 space-y-12">
              {SECTIONS.map((s, i) => (
                <Reveal key={s.no} delay={Math.min(i * 0.05, 0.3)}>
                  <article id={`s${s.no}`} className="scroll-mt-24">
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="font-mono text-sm text-forest-700/60">{s.no}</span>
                      <h2 className="font-serif text-2xl md:text-3xl font-light leading-tight">
                        {s.title}
                      </h2>
                    </div>
                    <p className="text-ink-700 leading-loose pl-0 md:pl-10">{s.body}</p>
                  </article>
                </Reveal>
              ))}

              <Reveal>
                <div className="mt-16 pt-10 border-t border-ink-900/10">
                  <h2 className="font-serif text-2xl font-light mb-6">聯絡我們</h2>
                  <div className="grid sm:grid-cols-2 gap-6 text-sm leading-relaxed">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-forest-700 font-medium mb-2">
                        公司名稱
                      </div>
                      <p>甘田食品科技股份有限公司</p>
                      <p className="text-ink-700">
                        (Goodland Food Technology Co., Ltd.)
                      </p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-forest-700 font-medium mb-2">
                        隱私權相關申訴
                      </div>
                      <p>電子郵件:hello@goodland-food.com</p>
                      <p className="text-ink-700">專人於收到後 7 個工作天內回覆</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
