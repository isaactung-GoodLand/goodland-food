/**
 * Vitest setup — 載入 .env.local
 *
 * Next.js 會自動載入 .env.local,但 vitest 不會。
 * 測試需要 DATABASE_URL 才能對真實 Neon DB 跑 E2E。
 */

import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

const envLocal = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocal)) {
  config({ path: envLocal });
}
