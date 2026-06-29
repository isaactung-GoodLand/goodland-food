# 甘田 Goodland-food — Google Sites 重建規格書

> 把 Next.js 9.4/10 版本**完整重建**到 Google Workspace「協作平台」(Google Sites)
>
> 版本:v1.0 — 2026-06-29
>
> 原檔位置:`/home/ihermes/projects/goodland-food/`

---

## 📋 目錄

1. [Google Sites 能力對照表](#1-google-sites-能力對照表)
2. [網站結構與導航](#2-網站結構與導航)
3. [共用設計 Token](#3-共用設計-token)
4. [頁面逐區塊規格](#4-頁面逐區塊規格)
   - 4.1 [首頁](#41-首頁-)
   - 4.2 [快速煮茶機 /machine](#42-快速煮茶機-machine)
   - 4.3 [三點三食材 /three-thirty](#43-三點三食材-three-thirty)
   - 4.4 [關於甘田 /about](#44-關於甘田-about)
   - 4.5 [媒體報導 /press](#45-媒體報導-press)
   - 4.6 [聯絡 /contact](#46-聯絡-contact)
5. [頁尾 Footer](#5-頁尾-footer)
6. [「降級折衷」說明](#6-降級折衷說明)
7. [30 分鐘快速上線 Checklist](#7-30-分鐘快速上線-checklist)

---

## 1. Google Sites 能力對照表

Google Sites 不像 Next.js — 它有自己固定的 section 類型。這個表告訴你「可以重現」「盡力重現」「需降級」。

| 我們的設計元素 | Google Sites 對應做法 | 狀態 |
|---|---|---|
| 圓角米白卡片 | `Image card` + 設定 corner radius 12-16px | ✅ 直接支援 |
| 森林綠大色塊 (Hero / CTA / 引言) | `Banner` 設底色 `#1A2E18`,文字白色 | ✅ |
| 米白底 | 主題色 Background = `#FBF8F3` | ✅ |
| 襯線大標題 (Fraunces) | Google Sites 預設 Serif font(標題自動套)或套 Playfair Display | ⚠️ 替換字體 |
| 內文 Sans-serif | 預設 Roboto / 換 Noto Sans TC | ⚠️ 替換字體 |
| 中文標題 | Noto Serif TC(透過 "More fonts" 加入) | ⚠️ 需手動加 |
| 上方固定 nav (sticky) | Google Sites **無 sticky nav**;移到 page 頂即可 | ⚠️ 降級 |
| SVG icon (Lucide) | 換成 unicode emoji 或上傳 PNG icon 組 | ⚠️ 降級 |
| Hover 動畫 / Reveal 進場 | **完全不支援**;靜態呈現 | 🚫 降級 |
| 茶壺 SVG 插畫 | 上傳 PNG 圖(美工另外輸出) | ⚠️ 需圖檔 |
| 分頁/子頁面 | 用 `Pages` panel 開子頁 | ✅ |
| CTA 按鈕 | `Button` section,選 Outline 或 Filled | ✅ |
| 數據 Stat (2017 / 8 min) | `Image with text` 或純文字 | ✅ |
| 引言 Quote 區 | 文字 section,大號斜體 | ✅ |
| 媒體 logo 區塊 | 上傳 logo PNG 或文字徽章 | ✅ |
| 客戶表單 | `Google Form` embed | ✅ |
| B2B PDF 下載 | `Drive` 嵌入或按鈕連到 PDF | ✅ |

---

## 2. 網站結構與導航

### Pages panel 設定

```
甘田 Goodland-food           ← 首頁 /
├─ 快速煮茶機               ← /machine
├─ 三點三食材               ← /three-thirty
├─ 關於甘田                 ← /about
├─ 媒體報導                 ← /press
└─ 聯絡                     ← /contact
```

### 頂部導航 (Navigation panel)

Google Sites 自動用 Pages 結構生成頂部 nav。設定:
- 排版:`Horizontal` (水平)
- 對齊:`Center`

### 頂部 Brand 區

由於 Google Sites header 固定,建議在「首頁」最頂端插入一個 `Banner` section:
- 尺寸:`Full width`,高度約 100px
- 背景:`#FBF8F3`
- 左側:放圓形 logo「甘」字 PNG (40×40px)
- 右側:文字 「**甘田 Goodland** 」/ 副標 「Food Innovation」(用 Noto Serif TC)

**降級說明:** Google Sites 無法做到「Logo + 6 項 nav + CTA 按鈕」橫排 sticky nav。
→ **替代方案:** 用 Google Sites 的 header 自動導航(文字風格化就好,別用太花俏)。

---

## 3. 共用設計 Token

### ⚠️ Google Sites 不能讓你在每個 text box 隨意挑 hex 色

Google Sites 的 `Themes` 只有固定的 `Style 1 / 2 / 3` 槽位可以填 hex。
做法:把品牌 3 色直接綁到這 3 個 Style,後續插入每個區塊時,選「Background = Style X」就好。

### 主題設定 (在 Google Sites 右上 Theme 按鈕)

| Style 槽位 | 用途 | Hex | 名稱 |
|---|---|---|---|
| **Base** | 網站全域背景 | `#FBF8F3` (cream-50) | 米白 |
| **Style 1 — 淺-1** | 卡片淡米底 / 內容區 | `#F5EFE2` (cream-100) | 淺米 |
| **Style 2 — 淺-2** | 強調區(標籤/hover) | `#6B8F65` (forest-500) | 中綠 |
| **Style 3 — 深** | 深色 Banner / Footer / Hero | `#1A2E18` (forest-900) | 深綠 |
| **Text 1** | 主標題文字 | `#0F0D0A` (ink-900) | 黑 |
| **Text 2** | 強調文字 | `#2F4D2B` (forest-700) | 森林綠 |

### 字體 (在「More fonts」搜尋並加入)

| 角色 | 字體 | 用途 |
|---|---|---|
| 中文標題 | `Noto Serif TC` | h1 / h2 |
| 英文標題 | `Playfair Display` (Serif) | h1 / h2 (英文 / 數字) |
| 中文內文 | `Noto Sans TC` | p |
| 英文內文 | `Roboto` | button / caption |

> 字體大小參考:
> - h1:48-72px / `Light` weight
> - h2:36-48px / `Light`
> - h3:24-28px / `Regular`
> - 內文:16-18px / `Regular`,行高 1.6-1.8
> - caption:12-14px / `Regular`,字距 `tracking-wide`

### Icons (替代 SVG)

取代 Lucide icons,在 `Text` section 直接打 emoji 或 unicode:

| 原 icon | 替代 |
|---|---|
| ☕ 咖啡 | `☕` U+2615 |
| 🌿 葉子 | `🌿` U+1F33F |
| 📰 報紙 | `📰` U+1F4F0 |
| 🏆 獎項 | `🏆` U+1F3C6 |
| 🌍 全球 | `🌏` U+1F30F |
| 🛠️ 工具 | `🛠️ U+1F6E0` |
| ➜ 箭頭 | `→` (用實心箭頭 `→` 或 `↗`) |
| ✓ Check | `✓` U+2713 |
| ✉ 信封 | `✉` U+2709 |
| 📍 位置 | `📍` U+1F4CD |
| 🏢 公司 | `🏢` U+1F3E2 |
| ✨ sparkles | `✨` U+2728 |
| " 雙引號 | 直接用 `"` 或 fancy `「」` |

---

## 4. 頁面逐區塊規格

### 4.1 首頁 `/`

**Page Title:** 甘田 Goodland-food | 港式茶飲文化的創新者
**SEO Description:** 甘田食品科技 — 從三點三拼配茶、立陶宛淡奶,到全球首創快速煮茶機,讓道地的港式奶茶變得簡單、規模化、可複製。

#### Section 1 — Hero (Banner)
- **Layout:** `Banner` → 設定 `Full-width image`,實際是用 `Solid color background = #FBF8F3`
- **高度:** ~560px (在大尺寸較好,Google Sites banner 預設會自動撐滿)
- **內含:**
  ```
  ┌────────────────────────────────────────────┐
  │                                            │
  │  [小標膠囊] ● 食品科技 · FOOD INNOVATION  │
  │                                            │
  │  港式茶飲的                                  │
  │  下一個時代。   ← h1,forest-700 italic      │
  │                                            │
  │  甘田食品科技 — 從三點三的拼配茶、           │
  │  立陶宛的港式淡奶, 到全球首創快速煮茶機,    │
  │  讓道地的港式奶茶變得簡單、規模化、可複製。   │
  │                                            │
  │  [探索煮茶機 →]  [三點三食材系列]            │
  │                                            │
  │         (右側寬度約 40% 放 PNG 茶壺插畫)     │
  │                          「快速煮茶機 · 2024」│
  └────────────────────────────────────────────┘
  ```

- **做法:**
  1. Insert → `Banner` → 選 "Use solid color"
  2. 文字寫入兩段:
     - **Eyebrow (小):** `● 食品科技 · FOOD INNOVATION` (forest-700)
     - **H1:** `港式茶飲的下一個時代。` (Use Playfair Display italic)
  3. 副標:`甘田食品科技 — 從三點三的拼配茶、立陶宛的港式淡奶,到全球首創快速煮茶機,讓道地的港式奶茶變得簡單、規模化、可複製。`
  4. 按鈕:`Button` section 兩顆,選 `Filled` (黑底) + `Outlined` (透明框)
  5. 右側 PNG 茶壺:放到 Google Drive 取分享連結 → 用 `Image` section 嵌上

**茶壺 PNG 規格:**
- 尺寸:800×1000 px
- 風格:深綠漸層背景 + 米白色極簡茶壺剪影 + 中央「甘」字
- 輸出方式:把現有 SVG `/machine` 區域直接 Screenshot 從 Next.js dev server

#### Section 2 — Stat Bar (4 個數字)
- **Layout:** 用 `4-Column` grid 或 `Image with text` ×4 並排
- **內容:**
  | 數字 | 標籤 |
  |---|---|
  | 2017 | 創立年份 |
  | 8 min | 煮茶時間 |
  | 3+ | 產品線 |
  | 10+ | 媒體報導 |
- **樣式:** 數字用 Playfair Display 48-60px forest-700;標籤用 Noto Sans TC 12px uppercase tracking-wide `#6B6962`

#### Section 3 — Belief (米白區,左標題右文)
- **Layout:** `2-Column` grid
- **左(40%):**
  - eyebrow: `Our Belief` (forest-700 caps)
  - h2: `三點三, 不只是時間, 是一種文化。` (Last `文化。` 用 forest-700 italic)
- **右(60%):** 三段內文
  ```
  午後三點三十分,香港的上班族放下工作、茶餐廳沖出一壼絲襪奶茶 —
  這套街景已延續八十多年。

  甘田相信港式茶飲的靈魂,在「茶膽 × 淡奶 × 撞茶」三者。
  我們從源頭把關:斯里蘭卡拼配茶、立陶宛小農產的港式淡奶、
  自家研發的快速煮茶機。

  把這份味道,帶到台北、台中、東京、新加坡 —
  讓世界每一個角落的三點三,都是港式。
  ```
- **背景:** `#F5EFE2` (cream-100)

#### Section 4 — Product Lines (兩張大卡並排)
- **Layout:** `2-Column` grid,各佔 50%
- **卡 1(煮茶機,左):**
  - 背景:forest-700 漸層 (Use `#2F4D2B` solid)
  - 角落 icon:☕ (cream-100)
  - eyebrow:`Hardware · 01`
  - h3:`快速煮茶機 / 8 分鐘一壼。`
  - desc:`上煮下保溫 · 一次兩壼 · 高腳出茶 — 全球首創,專為港式奶茶量身設計。`
  - 整張 clickable → 連 `/machine`
- **卡 2(食材,右):**
  - 背景:cream-100
  - icon:🌿 forest-700
  - eyebrow:`Ingredients · 02`
  - h3:`三點三 / 食材 × 茶飲。`
  - desc:`斯里蘭卡拼配茶 · 立陶宛烘焙用淡奶 · 即沖即飲茶系列 — 在家、在店,都好喝。`

#### Section 5 — Pull Quote (深綠區)
- **Layout:** `Banner` 設 solid color `#1A2E18` 文字米白
- **icon:** `"` big quote (用 `「` 或 fancy Unicode `“`)
- **quote text:**
  ```
  「做茶這件事,甘田讓傳統茶餐廳的『撞茶』
  走進了實驗室 — 從溫度、壓力、時間參數化,
  讓每一杯都是同一個味道。」
  ```
  (Playfair Display italic 32-40px)
- **attribution:**
  - 圓形 avatar HK (用 forest-700 圓 + 米白文字 HK)
  - `媒體訪談摘錄` (Noto Sans TC)
  - `HONG KONG ECONOMIC TIMES · 2022`(12px uppercase tracking-wide cream-100/60)

#### Section 6 — Press Preview (3 個媒體卡)
- **Layout:** 用 `Divider` 分線 + `3-Column` grid(用 `Image with text` 或 Text layout)
- **Card 1:**
  - outlet:`香港經濟日報 HKET`
  - title:`食品創新科技公司研港式奶茶沖茶機`
  - date:`2022` (右側)
  - arrow:`↗`
- **Card 2:**
  - outlet:`自由時報 LTN`
  - title:`立陶宛奶水卡關中國 台廠甘田接手`
  - date:`2022`
- **Card 3:**
  - outlet:`Focus Taiwan`
  - title:`Taiwan firm steps in for Lithuanian milk`
  - date:`2022`
- **右側按鈕:** `看全部報導 →` → 連 `/press`

#### Section 7 — Final CTA (米白區)
- **Layout:** 居中 `Text` + `Button` ×2
- **icon:** ✨
- **h2:** `想讓你的店, 也沖出 香港的味道？`
- **Buttons:**
  - `洽詢合作` → 連 `/contact` (Filled 黑色)
  - `了解煮茶機規格` → 連 `/machine` (Outlined)

---

### 4.2 快速煮茶機 `/machine`

**Page Title:** 快速煮茶機 — 8 分鐘一壼 | 甘田 Goodland

#### Section 1 — Page Header
- **Layout:** `Text only`
- eyebrow:`Hardware / 01`
- h1:`煮茶這件事,可以更簡單。`
- subtitle:`上煮下保溫 · 一次兩壼 · 高腳出茶 — 全球首創,專為港式奶茶量身設計的快速煮茶機,把傳統 30 分鐘的撞茶流程壓到 8 分鐘。`

#### Section 2 — Hero Product Shot
- **Layout:** `Banner` or `Image` 滿版
- **PNG:** 茶壺機台正面實物拍攝(替用現在 Hero SVG,或請美工重製 3D render)
- **背景:** cream-100
- **角落小字:** `8 min` (圓角膠囊 forest-700)

#### Section 3 — 三個 Highlights 卡
- **Layout:** `3-Column` grid
- **Card 1:**
  - icon:🕗 (時鐘)
  - title:`8 分鐘一壼`
  - desc:`從冷水到茶膽,8 分鐘完成。`
- **Card 2:**
  - icon:🫖 (兩壼)
  - title:`兩壼同時出`
  - desc:`一次煮兩壼,中午前高峰也不塞車。`
- **Card 3:**
  - icon:🦵 (高腳)
  - title:`高腳出茶設計`
  - desc:`毋須搬動,下壼直接倒入杯中,降低燙傷風險。`

#### Section 4 — SPECS 規格清單
- **Layout:** `2-Column` grid(標題 + 清單)
- **左欄標題:** `機器規格` (Playfair Display)
- **右欄清單(用 ✓ 勾):**
  ```
  ✓ 容量:5L × 2 壼
  ✓ 功率:3000W(220V)
  ✓ 煮茶時間:8 分鐘 (從 25°C 冷水到 95°C)
  ✓ 保溫時段:45 分鐘 ± 2°C
  ✓ 機身材質:SUS 304 不鏽鋼 + 食品級 PP
  ✓ 控制面板:觸控 + LCD 螢幕顯示溫度
  ✓ 安裝水電:220V 獨立迴路 / 進水 1/2" / 排水 1"
  ✓ 尺寸:寬 480 × 深 320 × 高 720 (mm)
  ✓ 重量:18 kg
  ✓ 安全:過溫斷電、空燒保護、防溢流
  ```

#### Section 5 — B2B 洽詢區
- **Layout:** `2-Column` grid(左文字、右數據)
- **左 (60%):**
  - h2:`想瞭解售價、經銷細節？`
  - p:`我們提供完整 B2B 套件 — 機器、保養、首批茶材、教育訓練。歡迎經銷夥伴、茶餐廳業者、食品廠來信索取。`
  - button 1:`洽詢 B2B` → 連 `/contact`
  - button 2:`☕ 下載規格表 PDF` → 連到 Drive PDF
- **右 (40%) — 3 個 stat cards:**
  - 30+ / 合作店家
  - 3 / 海外市場
  - 98% / 客戶回購率

---

### 4.3 三點三食材 `/three-thirty`

**Page Title:** 三點三食材 | 甘田 Goodland
**Description:** 斯里蘭卡拼配茶、立陶宛烘焙用淡奶、即沖即飲茶系列。

#### Section 1 — Header
- eyebrow:`Ingredients / 02`
- h1:`茶餐廳的味道,帶回家。`
- subtitle:`斯里蘭卡拼配茶 · 立陶宛烘焙用淡奶 · 即沖即飲茶系列 — 在家、在店,都好喝。`

#### Section 2 — 3 大產品卡
- **Layout:** 用 `Divider` 分線 + 三個 `Image with text` section 垂直堆疊(細長橫向卡)
- **每張卡:**
  - 左側 icon(40×40 圓角):🌿 / 🥛 / ☕
  - 中間:產品名 + 描述
  - 右側:包裝規格小字

| icon | 產品 | 描述 | 規格 |
|---|---|---|---|
| 🌿 | 三點三拼配茶 | 與斯里蘭卡茶廠獨家配方,適合港式奶茶/凍檸茶 | 1kg / 5kg 袋裝 |
| 🥛 | 立陶宛港式淡奶 | 高脂烘焙用,專為港式奶茶設計,香濃而不膩 | 1L × 12 盒/箱 |
| ☕ | 即沖即飲港式奶茶 | 經典味道隨手沖,3 分鐘一杯專業風味 | 10 入/盒 |

#### Section 3 — 沖泡方法 (how-to)
- **4 步驟,垂直時間軸或圖示:**
  ```
  1️⃣ 取 30g 茶 + 300ml 熱水
  2️⃣ 撞茶 30 秒(用煮茶機免此步)
  3️⃣ 加入 100ml 75°C 熱淡奶(茶奶比 7:3)
  4️⃣ 倒入杯中,完成 ✅
  ```

#### Section 4 — CTA
- h2:`立刻訂購` (中)
- button:`🛒 線上購買 →` → 連到 `https://gantianfoodtechnology.easy.co/`

---

### 4.4 關於甘田 `/about`

**Page Title:** 關於甘田 — 食品科技公司

#### Section 1 — Header
- eyebrow:`About / Story`
- h1:`把港式茶飲,做得更規模化、更品牌化、更國際化。`
- subtitle:`甘田食品科技股份有限公司 — 2017 年成立,以茶葉配方、食材代理與硬體研發為核心。`

#### Section 2 — Timeline (大事記) — 改用「折疊式群組 Collapsible group」(Google Sites 原生支援)
> ⚠️ **降級說明:** Google Sites 無法做中央垂直虛線 + 左右交替 Z 字排版的真時間軸。
> **改用 Collapsible group** — 5 個可展開節點,UX 在手機反而更好。

- **做法:**
  1. Insert → `Group` → 選 "Collapsible"(折疊式)
  2. 建 5 個,每個群組:

  ```
  ▼ 2017 — 甘田食品科技成立
    ┌──────────────────────────────────────────┐
    │ ● 中壢辦公室 · 茶葉倉儲區                │
    │                                          │
    │ 從茶葉代理與配方研發開始。                │
    └──────────────────────────────────────────┘

  ▼ 2019 — 上海 SFF 立陶宛館首度曝光
    ┌──────────────────────────────────────────┐
    │ ● 上海 SFF · 立陶宛館展位                │
    │                                          │
    │ 帶著研發多年的港式拼配茶,首次登上        │
    │ 上海國際食品展。                          │
    └──────────────────────────────────────────┘

  ▼ 2021 — 立陶宛淡奶代理接手
    ┌──────────────────────────────────────────┐
    │ ● 立陶宛農場與運輸現場                    │
    │                                          │
    │ 立陶宛淡奶進口受阻,甘田接手代理通路。      │
    └──────────────────────────────────────────┘

  ▼ 2022 — 快速煮茶機問世
    ┌──────────────────────────────────────────┐
    │ ● 第一代原型機測試                        │
    │                                          │
    │ 全球首創上煮下保溫快速煮茶機,             │
    │ 獲多家媒體專題報導。                      │
    └──────────────────────────────────────────┘

  ▼ 2024+ — 三點三食材系列上市
    ┌──────────────────────────────────────────┐
    │ ● 合作店家現場                            │
    │                                          │
    │ 港式茶飲走進家庭與便利商店。              │
    └──────────────────────────────────────────┘
  ```

- **樣式:**
  - Collapsed 時只顯示年份 + 一行小標(forest-700, 16px SemiBold)
  - 展開時背景 = Style 1(淺米色),內含 forest-700 圓點 + 章節徽章膠囊
  - 第一個預設展開,其他四個折疊

#### Section 3 — 理念小結
- h2:`我們相信`
- 三個 pillars(用 `3-Column` 圖文組塊):
  - 🌍 **國際供應鏈** — 斯里蘭卡茶園直送,立陶宛奶源
  - 🔬 **食品科技** — 從參數化煮茶到 AI 配方調整
  - 🍵 **文化傳承** — 把港式茶餐廳的味道帶到世界

---

### 4.5 媒體報導 `/press`

**Page Title:** 媒體報導 | 甘田 Goodland

#### Section 1 — Header
- eyebrow:`Media Coverage`
- h1:`我們說的故事,別人轉述過。`

#### Section 2 — 媒體 Logo Wall
- **Layout:** `5-Column` grid,各放一張 `Image` section(PNG logo,120×120)
- **5 家媒體:**

| 媒體 | 顏色徽章 | 名稱 |
|---|---|---|
| 香港經濟日報 | `#A8201A` 紅 + 「經」 | HKET |
| 自由時報 | `#1F4E9D` 藍 + 「LT」 | LTN |
| TVBS | `#000000` 黑 + 「TV」 | TVBS |
| Focus Taiwan | `#0F4A2A` 綠 + 「FT」 | FT |
| 上海 SFF | `#8C6A3A` 棕 + 「SFF」 | SFF |

> **做法:** 把每家做成 PNG 徽章 (256×256,色塊 + 雙字 chinese,Noto Serif TC) → 上傳到 Google Drive → 用 `Image` section 嵌

#### Section 3 — 報導清單 (5 筆)
- **Layout:** 垂直堆疊 5 個 `Image with text` 或自訂 `Text` section

| Logo Box (左) | 中間 (右) |
|---|---|
| 紅色「經」 | **食品創新科技公司研港式奶茶沖茶機**(2022) / excerpt / 「→」 |
| 藍色「LT」 | **立陶宛奶水卡關中國 台廠甘田接手**(2022) |
| 黑色「TV」 | **台廠自製港式奶茶機 8 分鐘沖出茶餐廳味道**(2022) |
| 綠色「FT」 | **Taiwan firm steps in for Lithuanian milk**(2022) |
| 棕色「SFF」 | **立陶宛館 - 甘田首次國際曝光**(2019) |

- **每筆連結 → 對應原文 URL(external link / new window)**

---

### 4.6 聯絡 `/contact`

**Page Title:** 聯絡我們 | 甘田 Goodland

#### Section 1 — Header
- eyebrow:`Get in touch`
- h1:`聊一聊,怎麼把港式茶飲帶給更多人。`

#### Section 2 — 兩欄 (左聯絡資訊 + 右表單)
- **左(40%):3 個資訊塊**
  - 📧 `hello@goodland-food.com`
  - 🏢 `甘田食品科技股份有限公司 / Goodland Food Technology Co., Ltd.`
  - 📍 `台灣 — 中壢 (鄰近機場捷運)`
  - 🕘 `Mon–Fri 9:00–18:00`

- **右(60%):Embed Google Form**
  1. 至 Google Form 建表單:
     - 姓名*
     - 公司/店面名稱
     - Email*
     - 電話
     - 詢問類型*(B2B 經銷/媒體合作/消費者/其他)
     - 訊息*
  2. Submit button → 直接 email 到 `hello@goodland-food.com`
  3. 把 Form 公開 → 複製 embed URL → Google Sites 插入 `Embed` → 貼 URL
  4. Form 寬度設 100%

#### Section 3 — Footer CTA
- h2(小):`趕時間?直接 Email`
- button:`✉ hello@goodland-food.com` → 開 mail client

---

## 5. 頁尾 Footer

每頁底部加一個 `Banner` solid `#1A2E18`(深森林綠),內含 4 欄 link list:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  甘田                 產品線             公司           │
│  港式茶飲的            快速煮茶機         關於我們      │
│  下一個時代           三點三食材           媒體報導      │
│                       線上購買 →           聯絡          │
│                                                          │
│  © 2026 甘田食品科技股份有限公司                          │
│  Goodland Food Technology Co., Ltd.                       │
│  Feisty Dolphin Project 495611                            │
└──────────────────────────────────────────────────────────┘
```

- 文字色 cream-50 / cream-100/70
- Logo:右上角重複使用首頁 logo PNG

---

## 5.5 🛟 新手避坑指南 (必讀)

這 7 條是 Google Sites 設計上的硬限制,**做不到就要換做法**:

1. **🚫 沒有「整張卡片 clickable」**
   - Google Sites 不支援把整個 group/容器設成一個 link
   - ✅ 改法:分別給卡片內的 **圖片、標題文字、CTA 按鈕** 三者**各設同一個超連結**(使用者點哪裡都會跳)

2. **🚫 沒有「自訂漸層背景」**
   - 不能為文字框設 linear-gradient
   - ✅ 改法:在 Figma / Canva 輸出 PNG 漸層背景 → 以 `Image` section 上傳

3. **🚫 沒有「固定吸頂 sticky nav」**
   - Google Sites 的 nav 列在頁面上方,不會跟著滾動變實心
   - ✅ 改法:Logo 改在右上角 Theme → 新增標誌(全域 logo);導航用 Pages panel 自動生成

4. **🚫 沒有「進場動畫 / scroll reveal」**
   - 完全沒有 IntersectionObserver、Framer Motion、AOS 等
   - ✅ 改法:靜態呈現所有內容,接受視覺節奏單一化

5. **🚫 不能嵌入 SVG icons**
   - Image section 只接受 PNG / JPG
   - ✅ 改法:本文件 §3 的 emoji 對照表,或把所有 icon 統一輸出成 PNG 組(32×32)

6. **🚫 客製 Hex 色只能在 `Theme → Style 1/2/3` 三個槽位選**
   - 不能在 text box 上隨便挑填色器
   - ✅ 改法:所有顏色變化透過「套用 Style X」或「標題層級變更」處理

7. **🚫 Hero 區不能自動播放影片**
   - Banner 可上傳靜態圖;若要影片背景 → 改用 `Embed YouTube` 區塊放背景
   - ✅ 改法:本專案目前用 PNG 茶壺就夠好,不需要影片

---

## 6. 降級折衷說明

原 Next.js 9.4/10 版本有這些東西,Google Sites **做不到或做不好**:

| 功能 | Next.js 原版 | Google Sites 折衷 |
|---|---|---|
| 進場 fade-up 動畫 (Reveal) | ✅ framer-motion | ❌ 靜態(但保留版型已夠好看) |
| 滾動至錨點偵測 | ✅ IntersectionObserver | ❌ 全部同時顯示 |
| Hover 微互動 | ✅ transform / 顏色過渡 | ❌ 部分 buttons 內建 hover,其他無 |
| SVG 動態 icon | ✅ Lucide React | ❌ 用 emoji 替代 |
| Sticky 透明 nav (隨滾動變實心) | ✅ JS-based | ❌ Google Sites nav 固定 |
| 客製字體 Fraunces | ✅ Google Fonts | ⚠️ 改用 Playfair Display(serif 替代) |
| 響應式斷點 < 768px | ✅ Tailwind | ⚠️ Google Sites 自動,但細節不可調 |
| GSAP / Lottie 動畫 | ✅ | ❌ 完全不能 |
| 影片背景 | ✅ mp4 | ⚠️ YouTube embed 可用 |

**結論:** 預期 Google Sites 重建版能做到 **6.5–7.5/10**。若需要 9.4/10 版本,還是要回到 Vercel 上的 Next.js 版本。

---

## 7. 30 分鐘快速上線 Checklist

按這個順序做,30 分鐘可以上線:

### ⚙️ 環境設定 (5 min)
- [ ] 進入 Google Drive → 把 `/home/ihermes/projects/goodland-food/screenshots/home-full.png` 上傳,複製 share URL
- [ ] 把茶壺 hero PNG 輸出(從 Next.js 截圖的 hero section,或用現有 SVG 找設計師輸出)
- [ ] 進入 Google Sites → 建立新網站 → 命名「甘田 Goodland-food」

### 🎨 Theme (5 min)
- [ ] Theme → Background `#FBF8F3`
- [ ] Theme → Color 1 `#2F4D2B` (forest-700)
- [ ] Theme → Color 2 `#6B8F65` (forest-500)
- [ ] Theme → Text `#0F0D0A`
- [ ] 「More fonts」加入:Noto Serif TC, Playfair Display, Noto Sans TC

### 🧭 導航 (3 min)
- [ ] Pages panel 加入 6 個頁面
- [ ] 順序:首頁 / 快速煮茶機 / 三點三食材 / 關於甘田 / 媒體報導 / 聯絡

### 📄 各頁內容填充 (15 min)
- [ ] 對著本文件「Section N —」逐個 Insert → Banner / Text / Image / Button / Divider

### 🔍 確認 & Publish (2 min)
- [ ] 桌面預覽 + 平板預覽 + 手機預覽 (Preview 鍵)
- [ ] 設定 SEO meta (標題 + 描述)
- [ ] 連結 goodland-food.com 自訂網域 (Google Sites → Settings → Custom domains)
- [ ] 按 **Publish**

---

## 📞 需要時找我

- 需要真實實物照片(機器/食材)→ 聯絡美工輸出,或之後接 AI image gen
- 需要 Form 後端 → 我幫你建 Google Form + 接到 company email
- 需要 GA4 追蹤 → 我幫你加 `gtag.js` via 嵌入 header
- 不想自己做 → 我可以幫你寫一份「Google Apps Script 自動同步 Next.js 內容到 Google Sites」的腳本(每週一次)

完成後回我,有需要再微調。
