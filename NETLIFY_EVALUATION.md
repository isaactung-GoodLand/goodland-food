# Netlify 評估報告 — for 甘田 goodland-food

> 來源:Netlify 官網 /web_search/ Gemini CLI 評估 / 2026-06-29
> 對象:台灣中小企業主

---

## 1. Netlify 是什麼 (一句話)

Netlify = **靜態網站 + Serverless Functions 託管平台**,跟 Vercel / Cloudflare Pages 同級,主打 Jamstack(JavaScript + APIs + Markup)架構,適合 Next.js / Astro / Hugo / Gatsby 等現代框架。

---

## 2. 免費 Free Plan — 「多 free?」

### 表面上完全免費的東西
- ✅ 部署(從 Git、AI、API、CLI 都可以)
- ✅ 自訂網域 + 自動 HTTPS
- ✅ 全球 CDN
- ✅ Deploy Previews(每個 PR 一個預覽網址)
- ✅ Functions(Serverless 後端)
- ✅ **Netlify Database**(內建 Postgres 風格結構化資料!)
- ✅ Blob Storage(檔案/圖片)
- ✅ Firewall Traffic Rules + rate limiting
- ✅ Build with AI / Agent Runners

### 2026-09 之後改成 Credit 制 — 「真的免費嗎?」

官方計價方式改變,**不再寫死 100GB 流量就停**,而是改成 credit 額度,**用完繼續開自動加值**:

| 動作 | 費用(扣 credits) |
|---|---|
| **Production deploy** | 15 credits / 次 |
| **Web bandwidth** | **20 credits / GB** |
| **Web requests** | 2 credits / 10k 次 |
| **Functions compute** | 10 credits / GB-hour |

**Free Plan 每月只給 300 credits。**

換算:
- 300 credits ÷ 20 = **15 GB 免費流量** (跟 Vercel 100GB、Cloudflare 無限 比超小)
- 300 credits ÷ 15 = **每月 20 次 production deploy**

### 🚨 Reddit 真實慘案(2024)

一位開發者託管小型靜態站,結果收到 **$104,000** 帳單。因為舊制下:
- Free 雖然寫 100GB bandwidth 額度
- 超過後 **$55 / 100GB**(且沒有 hard stop)
- 一個月中病毒式分享,瞬間被打爆

Netlify 後來才補上 stop-gap(超出會停站)。**新制 credit-based 也是同樣邏輯,只是換個說法**。

**結論:免費 ≠ 安全。** Netlify 比 Vercel / Cloudflare **更容意爆量收到天價帳單**,因為:
- 計價複雜(4 種 credits 一般人根本看不懂)
- 自動加值(用完繼續扣款,不會主動停)
- 沒有「流量上限封頂」的明確警告

---

## 3. 動態功能能做到什麼程度

| 功能 | 說明 | 評 |
|---|---|---|
| **Netlify Functions** | Lambda-based,JS/TS/Go,**免費層 125k 次/月**(註:2026 新制可能改成 credits 計算) | ⭐⭐⭐⭐ |
| **Netlify Edge Functions** | 在 CDN 邊緣執行,免費層可用 | ⭐⭐⭐⭐⭐ |
| **Netlify Forms** | 給 static site 一個 `<form netlify>` 屬性就會自動接收,資料進 dashboard | ⭐⭐⭐⭐(獨家功能) |
| **Netlify Identity** | 簡易會員系統(Gotrue) | ⭐⭐ |
| **Netlify Database** | 內建 Postgres,免費層可用 | ⭐⭐⭐⭐(2025 新增) |
| **Split Testing** | A/B 測試 server-side,免費 tier 就有 | ⭐⭐⭐⭐ |
| **Long-running Functions** | 後台函式最長跑 **15 分鐘**(Vercel 只有 10 秒) | ⭐⭐⭐⭐⭐ |
| **大型媒體管理** | Large Media plugin,可處理 LFS | ⭐⭐⭐ |

### 🔥 Netlify 獨家優勢

1. **Long-running Functions 15 分鐘** — 比 Vercel 10 秒久 90 倍
2. **表單 Forms** — 不用寫後端,加 `netlify` 屬性就收到(真的對 marketing site 超好用)
3. **Identity** — 最簡單的會員系統
4. **Database** — 不用再接外部 Supabase

---

## 4. 台灣使用案例 — **幾乎沒有企業**

### 搜尋結果(2026-06-29)

我用繁中 + 英文兩輪搜尋,結果:

**台灣 .tw 搜尋:**
- ❌ 找不到「台灣企業官網用 Netlify」的具體實例
- ✅ 全部命中都是**個人技術部落格**(開發者用 Hugo / Astro / Gatsby 架 blog)
- ✅ 媒體教學文(Medium、CSDN、簡書)

**Netlify 官方客戶案例:**
- 🇬🇧 **Rapha**(自行車服飾品牌)
- 🇺🇸 **Celonis**(AI 流程平台,18k 觀眾直播)
- 🇩🇪 **Smashing Magazine**(設計媒體)
- 🇺🇸 **UW Health**(醫療機構)
- 🇺🇸 **Medallia**(客戶體驗平台)
- 🇺🇸 **Aether Apparel**(服飾電商)
- 🇺🇸 **Navan**(旅遊商務平台)
- 🇺🇸 **Contenda**(AI 內容平台)
- 🇺🇸 **Kubernetes / CNCF** 開源專案

### ⚠️ 「台灣用 Netlify 的公司」要嘛是?

結論:**查無台灣有名企業公開使用 Netlify 的官方資料**。台灣企業主流還是:
- 中小企業:**WordPress 架主機 / 痞客邦 / 蝦皮開店** 
- 電商:**Shopline / Cyberbiz / 91app**
- 形象官網:**自家主機 / 委託網頁設計公司 / Webflow / Wix**
- 開發團隊:**Vercel 為主**

Netlify 在台灣的能見度,等於 / 低於 Vercel。

---

## 5. Netlify vs Vercel vs Cloudflare Pages

| 評估維度 | Netlify (2026) | Vercel | Cloudflare Pages |
|:---|:---|:---|:---|
| **免費流量** | 15 GB/月(credit 制) | **100 GB/月** | **無限** |
| **計價清晰度** | ⚠️ 複雜 4 種 credits | ✅ 直覺(流量/席位) | ✅ 最簡單(基本無上限) |
| **Next.js 支援** | ✅ 堪用 | ✅ **完美原生(自家)** | ✅ 堪用,但要學 Wrangler |
| **防爆量 DDoS** | ⚠️ 仍可超額扣款 | ✅ 較溫和 | ✅ **無上限 DDoS 防護** |
| **台灣連線速度** | 中等 | 優(亞洲節點) | ✅ **全台最快**(本地節點) |
| **中文客服** | ❌ | ❌ | ⚠️ 後台繁中,但客服無 |
| **長任務函式** | ✅ **15 分鐘** | ❌ 10 秒 | ⚠️ Workers 30 秒(付費可到 5 分鐘) |
| **表單內建** | ✅ **Netlify Forms** | ❌ 要自己寫 | ❌ |
| **A/B 測試** | ✅ 內建(Split) | ❌ | ❌ |
| **Database 內建** | ✅ Netlify DB | ⚠️ Vercel Storage | ⚠️ D1(beta) |

---

## 6. 結論:Netlify 適合甘田 goodland-food 嗎?

### ❌ 不推薦

**三個理由:**

1. **💸 爆量財務風險太高**
   - 食品/硬體品牌官網遇上節慶促銷、媒體報導、廣告投放,流量在短時間暴增
   - Netlify credit 額度(300/月 = 15GB)遠比 Vercel(100GB)、Cloudflare(無限)都小
   - 中小企業無 IT 人員監控,容易收到意外帳單

2. **🇹🇼 台灣支援薄弱**
   - Netlify 在台無分公司 / 無中文客服
   - 無公開台灣企業案例可借鏡
   - 萬一出事,只能 email 跟國外官方慢慢喬

3. **🥊 台灣市場主流替代品更強**
   - 動態形象官網:**Vercel**(Next.js 自家,完整支援)
   - 純靜態 / 大量流量:**Cloudflare Pages**(免費無限流量,DDoS 防護最猛)
   - 不會寫程式:**Google Sites**(已寫好的規格書)/ **Webflow** / **Wix** / **Shopline**

### ✅ Netlify 真正的甜蜜點

如果你的專案是:
- **Jamstack 部落格 / 個人作品集**(Next.js + Headless CMS)
- **要內建 Forms 又不想寫後端**(Netlify Forms 真的好用)
- **要跑長任務 AI 推論 5-15 分鐘**(Edge Functions 強項)
- **要 A/B testing 內建**(Split Testing)
- **要簡單 Database**(Netlify DB)

→ 那 Netlify 仍然是首選。

### 🎯 給甘田的建議(重新總結)

| 選項 | 成本 | 適合情境 |
|---|---|---|
| **A. Vercel** ← 主推 | 免費(~100GB/月) | 想要保留 Next.js 9.4/10 原汁原味 |
| **B. Cloudflare Pages** | 免費(無限流量) | 預期會有大量流量、抗 DDoS 需求 |
| **C. Google Sites** | 免費 + 30 min 重建 | 不想管部署、不需要 SSR/動畫 |
| **D. Netlify** | ⚠️ 不推薦 | — |

---

## 7. 若堅持要用 Netlify,**怎麼避開天價帳單**

如果要保險一點用 Netlify,務必:

1. ✅ 設 **預算上限**(Billing → Usage limits → Hard cap = $0 或 $5)
2. ✅ 取消 auto-recharge(預設是開的!)
3. ✅ 監控每月 credits 用量(`/account/credits`)
4. ✅ 開 Cloudflare CDN 在前面擋 DDoS
5. ✅ 表單用 Netlify Forms,後端用 Functions,別用太多 bandwidth

---

## 📞 結論一句話

> Netlify 是**強大但對台灣中小企業有隱藏財務風險**的平台 — 不熟別碰;要免費穩定,Vercel / Cloudflare Pages 都比它安全。
