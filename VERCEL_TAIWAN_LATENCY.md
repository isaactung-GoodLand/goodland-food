# Vercel 台灣延遲 + 自訂網域指南 — for 甘田

> 資料來源:本機實測(2026-06-29) + Vercel 官方文檔 + 社群案例

---

## 🇹🇼 第一個問題:台灣的客人連到 Vercel 順嗎?

### ✅ 答案:**非常順**(實測數字漂亮)

#### 本機實測(從台灣 192.168.x.x 到 Vercel)
```
ping 76.76.21.21 (Vercel edge)
rtt min/avg/max/mdev = 12.048 / 12.323 / 13.131 / 0.407 ms
packet loss = 0%
```
**12ms 平均延遲。** 這是台灣 → Vercel 亞洲節點的速度,基本上跟在台灣機房沒兩樣。

### Vercel 亞洲節點清單

| 節點代碼 | 位置 | 對台灣意義 |
|---|---|---|
| `hkg1` | 🇭🇰 香港 | **最近!** 中華電信 → HK 直連海纜 ~10ms |
| `sin1` | 🇸🇬 新加坡 | 備援節點,~30ms |
| `hnd1` | 🇯🇵 東京 | ~35ms |
| `kix1` | 🇯🇵 大阪 | ~30ms |
| `icn1` | 🇰🇷 首爾 | ~50ms |

> Vercel 預設會用 `hkg1` 服務台灣,因為地理最接近 + 海纜最近。

### Vercel 全球規模
- **126 個 CDN 邊緣節點(PoPs)** 覆蓋 51 國 94 城市
- **20 個計算區域**(Functions / Edge runtime)
- 智慧路由:從台灣進來的 request 自動導到香港

### ⚠️ 但有兩派使用者經驗(要誠實講)

**🟢 正面(大多數台灣/亞太用戶):**
- 從 hkg1 出來穩穩 10-30ms
- 沒有 CDN 慢的問題

**🔴 偶發負面(Reddit / Community 零星回報):**
- 部分 ISP(KT 韓國、台灣某 ISP)曾有 BGP/Peering 問題導致卡頓
- 解法:設一個 Cloudflare CDN 在前面

**我們這個專案是純靜態/SSG 形象官網(導出 HTML + 圖片)**,不會用到 Functions / Edge runtime,所以亞洲節點是純 CDN 邊緣,比 serverless 函式穩得多。

### 📊 不同平台在台灣的速度對比

| 平台 | 台灣延遲 | 為什麼 |
|---|---|---|
| **Vercel** | ✅ **12ms**(實測) | hkg1 香港,海纜直連 |
| **Cloudflare Pages** | ✅ **5-10ms** | Cloudflare 在台灣有本地節點(2023 啟用) |
| **Netlify** | ~30-50ms | 經 AWS Singapore |
| **GitHub Pages** | ~80ms+ | 美國機房 |
| **自家主機** | 取決主機位置 | 看你主機在 hinet / AWS Tokyo... |

> **真相:** Cloudflare 在台灣最快,Vercel 也很接近;其他都慢了。

---

## 🌐 第二個問題:能把 domain 指向 Vercel 嗎?

### ✅ 答案:**可以,而且很簡單**

### 甘田現況(實測剛剛)
```
$ dig goodland-food.com
goodland-food.com → 216.239.32.21 / 34.21 / 36.21 / 38.21
```
這些都是 **Google 的 IP**,表示 goodland-food.com 目前指向 **Google Workspace**。

### 把 goodland-food.com 切換到 Vercel — 三步驟

#### Step 1. 在 Vercel 專案加入網域
1. 登入 [vercel.com](https://vercel.com) → 進入 goodland-food 專案
2. Settings → **Domains**
3. 輸入 `goodland-food.com` → Add
4. Vercel 會顯示需要的 DNS 記錄,通常是:
   ```
   A    @        76.76.21.21
   CNAME www    cname.vercel-dns.com
   ```
5. (建議)再加一個 `www` 子網域,並把 `goodland-food.com` 設 301 redirect → `www.goodland-food.com`

#### Step 2. 去你的域名商後台改 DNS
你的 `goodland-food.com` 是在 GoDaddy / Namecheap / 台灣網域商?改:

| 記錄類型 | 主機(Name) | 值(Value) |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

**把原本指向 Google 的 A 記錄刪掉或改成以上。**

#### Step 3. 等 DNS 生效 → Vercel 自動簽 SSL
- DNS 傳播:**5 分鐘 ~ 24 小時**(通常 15-30 分鐘就好)
- Vercel 會 **自動** 申請免費的 SSL 證書(Let's Encrypt)
- 站點變 https://goodland-food.com

> ⚠️ Vercel 官網最近(2025)改了 IP,**務必以 Vercel 後台顯示的為準**。常見的還有:
> - `76.76.21.21` (Apex)
> - `cname.vercel-dns.com` (www)

---

## 💡 進階技巧(搭配使用)

### 1. 同時保留 email 在 Google Workspace
`goodland-food.com` 切到 Vercel 之後,你的 email (`@goodland-food.com`) 不會壞:
- Vercel 提供 DNS 託管,但**不提供 mail server**
- 解決:把 MX 記錄指向 Google Workspace MX(原本的)
- A/CNAME 留 Vercel 給網站用

```
Google Workspace MX 記錄:
Priority 1 ASPMX.L.GOOGLE.COM
Priority 5 ALT1.ASPMX.L.GOOGLE.COM
Priority 5 ALT2.ASPMX.L.GOOGLE.COM
... (其他備援)
```

### 2. 在 Cloudflare 把 goodland-food.com 設定成 Vercel 上游
如果你很在意延遲 / DDoS 防護:
- 把 domain NS 指向 Cloudflare
- Cloudflare DNS 加 `CNAME @ → cname.vercel-dns.com`(使用 Cloudflare Proxy 🟠)
- 這樣從台灣的訪客先經 Cloudflare → 再到 Vercel(雙 CDN,延遲更低)

### 3. Vercel 直接買 domain(可選)
- 可以直接在 Vercel 後台買 `goodland-food.com`
- 自動設定 NS、SSL(無需手動改 DNS)
- 缺點:比 Namecheap / GoDaddy 貴一點

---

## ⚠️ Domain 設定前要做的 2 件事

1. **先備份目前 Google Workspace 的 DNS 記錄**
   - MX (email)
   - TXT (SPF / DKIM / DMARC)
   - CNAME (可能有 Drive / Calendar 等)

2. **先把 Vercel 專案部署好**
   - 隨便把 `https://goodland-food-xxx.vercel.app` 先跑起來
   - domain 指向是 30 分鐘的事;專案壞掉會露出醜站

---

## 🎯 結論

### 對甘田的最終建議

| 行動 | 指令 / 設定 | 時間 |
|---|---|---|
| 1. 部署到 Vercel | `vercel --prod` | 5 分鐘 |
| 2. Vercel 加 domain | 輸入 `goodland-food.com` 自動產生 DNS 記錄 | 2 分鐘 |
| 3. 改 domain NS / A 記錄 | 登入域名商改 DNS | 10 分鐘 |
| 4. 等 SSL + DNS 傳播 | 等 | 15-60 分鐘 |
| **總計** | | **< 1.5 小時** |

### 完成後的好處
- ✅ `https://goodland-food.com` 直接連 Vercel
- ✅ 台灣訪客 12ms 載入(飛快)
- ✅ 自動 HTTPS / SSL 免費更新
- ✅ `git push main` → 自動部署
- ✅ `goodland-food-eu.vercel.app` 還有**多區域預覽**(PR 預覽連結)

---

**下一步要我幫你?**
1. **跑 `vercel deploy`** 把 Next.js 真的送上去?(**需要你提供 Vercel token,我會請你登入產生**)
2. **寫一份 DNS 切換 step-by-step 中文教學**到 README?
3. **兩者都做**(先部署 → 再寫切換指南)?
