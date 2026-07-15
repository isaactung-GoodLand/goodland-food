# 甘田 Goodland-food — 公司網站

> **港式茶飲文化的創新者** — Next.js 15 + TypeScript + Tailwind CSS v4

正式品牌網站,取代舊有 Google Sites 版本。設計風格:**米白 + 森林綠 + 襯線標題** (Fraunces) + 現代簡約食品科技。

兩輪 Gemini CLI 品牌評估:
| 輪次 | 評分 | 摘要 |
|---|---|---|
| 第一輪 | **8.5 / 10** | 視覺系統高度一致,但需補強實物信任感 / B2B 證言 / 細節豐富度 |
| 第二輪 | **9.4 / 10** | 加 PDF 規格、媒體 Logo 表單 Focus 動畫後,可上線級精品站 |

---

## 🚀 本機開發

```bash
npm install
npm run dev          # http://localhost:3030
npm run build        # 產出 .next/
npm start            # 生產模式啟動

# 截圖評估用
google-chrome --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1440,3800 --virtual-time-budget=4000 \
  --screenshot=full.png http://localhost:3030/
```

## 📁 結構

```
src/
├─ app/
│  ├─ page.tsx              # 首頁 (Hero / Belief / Products / Quote / Press / CTA)
│  ├─ layout.tsx            # 全站 Navbar / Footer / Metadata
│  ├─ globals.css           # 設計系統 (forest / cream / ink + Fraunces + Inter)
│  ├─ machine/page.tsx      # 快速煮茶機 (含 B2B PDF 下載 + 經銷數據)
│  ├─ three-thirty/page.tsx # 三點三食材
│  ├─ about/page.tsx        # 關於甘田 (Timeline 加 photo 章節徽章)
│  ├─ press/page.tsx        # 媒體報導 (5 家媒體 Logo 區)
│  └─ contact/page.tsx      # 聯絡合作 (含 client form)
├─ components/
│  ├─ navbar.tsx            # Header (sticky + 手機選單)
│  ├─ footer.tsx            # 深綠 Footer (CTA + 連結 + 著作權)
│  ├─ reveal.tsx            # SSR-safe IntersectionObserver 進場動畫
│  └─ page-shell.tsx        # 內頁統一 header + eyebrow
└─ lib/
   ├─ utils.ts              # cn() className 工具
   ├─ env.ts                # Zod schema 驗證所有 process.env（fail-fast）
   └─ db.ts                 # Neon Postgres pool
```

## 🔐 環境變數

所有 env 在 `src/lib/env.ts` 用 Zod schema 強制驗證。少設或格式錯就 fail-fast 拋錯。

### 本機開發

```bash
cp .env.example .env.local       # 沒有 .env.example 就從 README 對照建
# 編輯 .env.local,把 ADMIN_PASSWORD 改成真實密碼
npm run dev
```

`.env.local` 不會被 git 追蹤（`.git*` 已 gitignore）。

### Vercel 部署

Project → Settings → Environment Variables，逐個加：

| 名稱 | 必填 | 用途 |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres 連線字串 |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis（rate limit）|
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token |
| `NEXT_PUBLIC_SITE_URL` | ⭕ | 正式網址（影響 OG / sitemap）|
| `ADMIN_EMAIL` | ✅ | `/admin` 登入帳號（預設 `goodland`）|
| `ADMIN_PASSWORD` | ✅ | `/admin` 登入密碼 |

設完按 **Save**，下次 deploy 自動生效。

### ⚠️ 安全紀律

- 任何 **密碼 / API key / token** 一律走 env var，**絕不寫進程式碼或 commit**
- 絕不 `console.log(process.env)` / `console.log(getEnv())` — debug 完立刻拿掉
- 改完 `ADMIN_PASSWORD` 後需重新 deploy 才生效（Vercel env 是 build-time / runtime 注入）
- 詳 `src/lib/env.ts` 與 `.env.example`

## 🎨 設計系統

| Token | 顏色 |
|---|---|
| `cream-50/100/200` | `#FBF8F3 / F5EFE2 / EAE0CE` — 米白基底 |
| `forest-50/300/500/700/900` | `#EFF3EC / C5D1BF / 6B8F65 / 2F4D2B / 1A2E18` — 森林綠主色 |
| `ink-500/700/900` | `#6B6962 / 2A2724 / 0F0D0A` — 深色文字 |
| 字體 | Fraunces (serif + italic) + Inter (sans) + Noto Serif TC (中文) |

## ☁️ 部署到 Vercel (推薦)

### 一鍵部署

1. 推上 GitHub:`cd /home/ihermes/projects/goodland-food && git init && git add . && git commit -m "init" && gh repo create goodland-food --public --source=. --push`
2. 連到 https://vercel.com/new → Import Git Repo → 選 goodland-food
3. Framework auto-detect: Next.js → 直接 Deploy

### 自訂網域 (goodland-food.com)

1. Vercel Project → Settings → Domains → Add `goodland-food.com` 與 `www.goodland-food.com`
2. 到 DNS 提供商 (如 Cloudflare):
   ```
   A    @    76.76.21.21        (Vercel IP)
   CNAME www  cname.vercel-dns.com
   ```
3. 等 DNS propagate (5-30 min),Vercel 自動簽發 Let's Encrypt SSL

### 或部署到 公司 server (192.168.x.x)

```bash
npm run build
npm install -g pm2
pm2 start npm --name goodland-food -- start
pm2 save
pm2 startup
```

Nginx reverse proxy:
```nginx
server {
  listen 80;
  server_name goodland-food.com www.goodland-food.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## 📋 上線 Checklist

- [ ] 替換機台 SVG → 實物 / 3D 渲染圖
- [ ] 替換食材圖 → 沖泡情境照片
- [ ] 補上 Contact form 後端 (Formspree / Resend)
- [ ] 補上 B2B 規格表 PDF 檔
- [ ] 補上 Google Analytics 4
- [ ] 補上 sitemap.xml / robots.txt
- [ ] DNS 切換 (goodland-food.com)
- [ ] 保留 Google Sites 30 天當備份

## 🔗 相關連結

- 線上商店: https://goodland-food.vercel.app/products
- 媒體: HKET / 自由時報 / TVBS / Focus Taiwan
- 公司: 甘田食品科技股份有限公司 / Goodland Food Technology Co., Ltd.
