/**
 * Discover stores via Gemini CLI (no search-grounding, LLM knowledge only).
 *
 * Workflow (zone-based, stable prompt):
 *   For each "zone" (city + district) in the city:
 *     1. Query Gemini CLI with zone keyword + "1-3 筆確定店家"
 *     2. Normalize + dedupe
 *     3. Compare against DB (name + phone fuzzy)
 *     4. Print table
 *     5. Prompt user to approve each candidate one-by-one (interactive)
 *   Or use --write to auto-insert all verified.
 *
 * Usage:
 *   npx tsx scripts/discover-stores.ts "台北市"                                       # dry-run all zones
 *   npx tsx scripts/discover-stores.ts "台北市" --write                               # auto-insert all
 *   npx tsx scripts/discover-stores.ts "台北市 大安區"                                 # just one zone
 */

import { CITY_DISTRICTS, getCityForDay } from '../src/lib/cron-schedule';
import { Pool } from '@neondatabase/serverless';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Load .env.local (DATABASE_URL) since tsx doesn't auto-load like next does
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envText = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envText.split(String.fromCharCode(10))) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DEV_URL = process.env.DATABASE_URL!;
if (!DEV_URL) {
  console.error('DATABASE_URL not set. Did you run from .env.local?');
  process.exit(1);
}

const pool = new Pool({ connectionString: DEV_URL, ssl: { rejectUnauthorized: false } });

const STOP_WORDS = [
  '店', '分店', '總店', '本店', '旗艦店',
  '茶餐廳', '茶樓', '餐廳', '冰室', '飲茶', '酒樓', '飯店', '食堂', '料理', '粵菜', '燒臘',
  '餐飲', '飲食', '點心', '快餐', '小吃', '美食', '港式',
  '股份有限公司', '有限公司', '公司',
];

interface Candidate {
  name: string;
  phone: string;
  address: string;
  district: string;
}

function normalizeName(raw: string): string {
  let n = raw.toLowerCase();
  // 去掉常見標點
  n = n.replace(/[【】\[\]（）()「」『』《》〈〉，,。.!?！？\/／\-\–\—:：]/g, ' ');
  // 過濾只留中英數
  n = n.replace(/[^\w\u4e00-\u9fff]/g, '');
  // 移除 stop words
  for (const sw of STOP_WORDS) {
    n = n.split(sw).join('');
  }
  // 去掉末尾的「店名後綴」如:「鳳城燒臘粵菜 公館店」→ 「鳳城」（取主詞首 3 字或品牌名）
  return n.trim();
}

/** Get the "primary brand" — everything before the first space or paren. */
function extractBrand(raw: string): string {
  // 「波記茶餐廳 西門店」 → 「波記」
  // 「三合院港式飲茶 台北店」 → 「三合院」 (or detect known chains)
  // 「香港鑫華茶餐廳」 → 「香港鑫華」
  // 規則：取最前面的連續中文 (2-6 chars)，且有品牌特徵(不包含「店」「總店」等)
  const m = raw.match(/^([\u4e00-\u9fff]{2,8})/);
  if (m) return m[1];
  return raw;
}

/** Dice coefficient on bigrams (for fuzzy Chinese string match). */
function diceCoefficient(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const aSet = new Set<string>();
  const bSet = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) aSet.add(a.substring(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) bSet.add(b.substring(i, i + 2));
  let inter = 0;
  aSet.forEach(x => { if (bSet.has(x)) inter++; });
  return (2 * inter) / (aSet.size + bSet.size);
}

function normalizePhone(raw: string): string {
  // 移除空格、dash、parens,只留數字
  return raw.replace(/[^\d]/g, '');
}

function isDuplicate(cand: Candidate, dbRows: { name: string; phone?: string }[]): boolean {
  const candBrand = extractBrand(cand.name);
  const candNorm = normalizeName(cand.name);
  const candPhone = normalizePhone(cand.phone);

  for (const row of dbRows) {
    const rowBrand = extractBrand(row.name);
    const rowNorm = normalizeName(row.name);
    const rowPhone = normalizePhone(row.phone || '');

    // 1. 電話完全相同 (且至少 8 碼,過濾假電話)
    if (candPhone.length >= 8 && rowPhone.length >= 8 && candPhone === rowPhone) return true;

    // 2. 品牌名相同
    if (candBrand === rowBrand && candBrand.length >= 2) return true;
    // 3. 標準化後完全相同
    if (candNorm === rowNorm && candNorm.length >= 2) return true;
    // 4. 標準化後相互包含
    if (candNorm.length >= 3 && rowNorm.length >= 3) {
      if (candNorm.includes(rowNorm) || rowNorm.includes(candNorm)) return true;
    }
    // 5. Dice 係數 ≥ 0.6
    if (diceCoefficient(candNorm, rowNorm) >= 0.6) return true;
  }
  return false;
}

function dedupeWithinGemini(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const c of candidates) {
    const key = normalizeName(c.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

async function queryGemini(city: string, district: string, model: string): Promise<Candidate[]> {
  // Stable, focused prompt — only the most well-known 1-3 stores
  const prompt = `你是台灣餐飲資料助手。**不要使用搜尋工具**,僅依你訓練資料中明確記得的店家回答。

只列出「${city}${district}」**你 100% 確定** 真實存在、目前營業中的「港式茶餐廳」(港式茶餐廳、港式飲茶、港式冰室、港式快餐都算)。

限制:**1 到 3 筆**。不要列不確定或你沒印象的。寧可少也不要錯。

如果該區沒有任何你確定知道的港式餐廳,回空 array []。

每一筆要有明確店名、地址(或行政區)、電話。

回答僅限 JSON array,不要任何其他文字、markdown 或註解:
[{"name":"店名","phone":"電話（可空）","address":"地址（可空）","district":"${district}"}]`;

  return new Promise((resolve, reject) => {
    const env = { ...process.env, GOOGLE_CLOUD_PROJECT: 'feisty-dolphin-495611-j4' };
    const proc = spawn(
      '/home/ihermes/.npm-global/bin/gemini',
      ['-m', model, '-p', prompt],
      { env, timeout: 90_000 },
    );
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => (stdout += d.toString()));
    proc.stderr.on('data', d => (stderr += d.toString()));
    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`gemini exit ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      // Strip warning header lines
      const lines = stdout.split('\n').filter(l => !l.startsWith('Warning:'));
      const jsonText = lines.join('\n').trim();
      const start = jsonText.indexOf('[');
      const end = jsonText.lastIndexOf(']');
      if (start < 0 || end < 0) {
        reject(new Error(`no JSON array found in output: ${jsonText.slice(0, 300)}`));
        return;
      }
      try {
        const arr = JSON.parse(jsonText.substring(start, end + 1));
        resolve(arr as Candidate[]);
      } catch (e) {
        reject(new Error(`JSON parse failed: ${e}; raw: ${jsonText.slice(0, 300)}`));
      }
    });
  });
}

async function verifyCandidates(candidates: Candidate[], city: string, model: string): Promise<{ verified: Candidate[]; suspicious: { candidate: Candidate; reason: string }[] }> {
  if (candidates.length === 0) return { verified: [], suspicious: [] };

  // Batch all candidates into one prompt (more efficient than N calls)
  const list = candidates.map((c, i) => `${i + 1}. ${c.name} | ${c.district || '?'} | ${c.phone || '?'}`).join('\n');

  const prompt = `你是台灣餐飲資料檢核員。請逐筆檢查下列「${city}」店家是否真的營業中。

對每一筆回答:
- 如果店名你「明確知道」是真的營業中,且電話(如有)看起來合理(8 碼以上台灣電話): 標記「OK」
- 如果你不確定 / 沒聽過 / 可能是 LLM 幻覺: 標記「?」並給一句原因

回答格式僅限 JSON array,不要任何其他文字:
[{"n":1,"verdict":"OK|?","reason":"理由或空字串"}, ...]

檢查清單:
${list}`;

  return new Promise((resolve, reject) => {
    const env = { ...process.env, GOOGLE_CLOUD_PROJECT: 'feisty-dolphin-495611-j4' };
    const proc = spawn(
      '/home/ihermes/.npm-global/bin/gemini',
      ['-m', model, '-p', prompt],
      { env, timeout: 90_000 },
    );
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => (stdout += d.toString()));
    proc.stderr.on('data', d => (stderr += d.toString()));
    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`gemini verify exit ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      const lines = stdout.split('\n').filter(l => !l.startsWith('Warning:'));
      const jsonText = lines.join('\n').trim();
      const start = jsonText.indexOf('[');
      const end = jsonText.lastIndexOf(']');
      if (start < 0 || end < 0) {
        // If verifier fails, treat all as verified (don't block on verifier failure)
        console.warn('  ⚠️ verifier LLM did not return JSON, treating all as verified');
        resolve({ verified: candidates, suspicious: [] });
        return;
      }
      try {
        const verdicts = JSON.parse(jsonText.substring(start, end + 1)) as { n: number; verdict: string; reason: string }[];
        const verified: Candidate[] = [];
        const suspicious: { candidate: Candidate; reason: string }[] = [];
        for (const v of verdicts) {
          const c = candidates[v.n - 1];
          if (!c) continue;
          if (v.verdict === 'OK') verified.push(c);
          else suspicious.push({ candidate: c, reason: v.reason || '? verdict' });
        }
        resolve({ verified, suspicious });
      } catch (e) {
        console.warn('  ⚠️ verifier JSON parse failed, treating all as verified:', e);
        resolve({ verified: candidates, suspicious: [] });
      }
    });
  });
}

async function fetchDbRestaurants(cityHint: string): Promise<{ id: number; name: string; city: string; district: string; phone: string }[]> {
  const res = await pool.query(
    `SELECT id, name, city, district, phone FROM restaurants WHERE city ILIKE $1 AND disabled_at IS NULL ORDER BY name`,
    [`%${cityHint}%`],
  );
  return res.rows as any;
}

interface ZoneResult {
  zone: string;
  raw: Candidate[];
  verified: Candidate[];
  suspicious: { candidate: Candidate; reason: string }[];
  existing: { candidate: Candidate; matched: any }[];
  error?: string;
}

async function discoverZone(city: string, district: string, model: string, dbRows: { id: number; name: string; city: string; district: string; phone: string }[]): Promise<ZoneResult> {
  const zone = `${city}${district}`;
  const result: ZoneResult = { zone, raw: [], verified: [], suspicious: [], existing: [] };

  console.log(`\n  📍 Zone: ${zone}`);
  try {
    const raw = await queryGemini(city, district, model);
    result.raw = raw;
    console.log(`     gemini 給: ${raw.length} 筆`);

    if (raw.length === 0) return result;

    // Compare against DB
    const existing: { candidate: Candidate; matched: any }[] = [];
    const novel: Candidate[] = [];
    for (const c of raw) {
      if (isDuplicate(c, dbRows)) {
        const match = dbRows.find(r => {
          const candBrand = extractBrand(c.name);
          const rowBrand = extractBrand(r.name);
          const candNorm = normalizeName(c.name);
          const rowNorm = normalizeName(r.name);
          const candPhone = normalizePhone(c.phone);
          const rowPhone = normalizePhone(r.phone || '');
          return (
            (candPhone.length >= 8 && rowPhone.length >= 8 && candPhone === rowPhone) ||
            (candBrand === rowBrand && candBrand.length >= 2) ||
            (candNorm === rowNorm && candNorm.length >= 2) ||
            (candNorm.length >= 3 && rowNorm.length >= 3 && (candNorm.includes(rowNorm) || rowNorm.includes(candNorm))) ||
            diceCoefficient(candNorm, rowNorm) >= 0.6
          );
        });
        existing.push({ candidate: c, matched: match });
      } else {
        novel.push(c);
      }
    }

    // Phone sanity check
    for (const c of novel) {
      const phoneNorm = normalizePhone(c.phone);
      if (c.phone && phoneNorm.length < 8) {
        result.suspicious.push({ candidate: c, reason: `電話過短 (${c.phone})` });
      } else {
        result.verified.push(c);
      }
    }
    result.existing = existing;
  } catch (e: any) {
    result.error = e.message;
    console.log(`     ❌ ${e.message}`);
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes('--write');
  const modelArg = args.find(a => a.startsWith('--model='));
  const model = modelArg ? modelArg.split('=')[1] : 'gemini-2.5-flash';

  // Parse city + optional district
  const cityArg = args[0];
  if (!cityArg) {
    console.error('Usage: npx tsx scripts/discover-stores.ts "<city>" [--write] [--model=flash|pro]');
    console.error('       npx tsx scripts/discover-stores.ts "<city> <district>" [--write]');
    process.exit(1);
  }

  const cityDistSplit = cityArg.split(/\s+/);
  const city = cityDistSplit[0];
  const singleDistrict = cityDistSplit.length > 1 ? cityDistSplit[1] : null;

  if (singleDistrict) {
    console.log(`\n🔍 Discover: ${city} ${singleDistrict} (model=${model}, ${writeMode ? 'WRITE MODE' : 'DRY-RUN'})`);
  } else {
    console.log(`\n🔍 Discover: ${city} (all districts, model=${model}, ${writeMode ? 'WRITE MODE' : 'DRY-RUN'})`);
  }

  // 1. Determine zones to process
  let districts: string[];
  if (singleDistrict) {
    districts = [singleDistrict];
  } else if (CITY_DISTRICTS[city]) {
    districts = CITY_DISTRICTS[city];
  } else {
    console.error(`❌ Unknown city "${city}". Add it to CITY_DISTRICTS.`);
    process.exit(1);
  }

  // 2. Fetch DB rows once
  const dbRows = await fetchDbRestaurants(city);
  console.log(`  📊 DB has ${dbRows.length} active rows for ${city}`);

  // 3. Loop zones
  const t0 = Date.now();
  const allResults: ZoneResult[] = [];
  for (const district of districts) {
    const r = await discoverZone(city, district, model, dbRows);
    allResults.push(r);
  }
  console.log(`\n⏱️  Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // 4. Aggregate
  const existing = allResults.flatMap(r => r.existing);
  const verified = allResults.flatMap(r => r.verified);
  const suspicious = allResults.flatMap(r => r.suspicious);
  const errors = allResults.filter(r => r.error).map(r => `${r.zone}: ${r.error}`);
  const novel = verified;  // alias

  console.log(`\n=== 比對結果 ===`);
  console.log(`  🟢 新發現: ${novel.length} 筆`);
  console.log(`  🟡 已在 DB: ${existing.length} 筆`);

  if (existing.length > 0) {
    console.log(`\n--- 已在 DB (${existing.length}) ---`);
    for (const e of existing) {
      console.log(`  🟡 ${e.candidate.name.padEnd(28)} ↔ id=${e.matched.id} ${e.matched.name}`);
    }
  }

  if (verified.length > 0) {
    console.log(`\n--- 新發現+已驗證 (${verified.length}) ---`);
    for (const n of verified) {
      console.log(`  🟢 ${n.name.padEnd(28)} | ${n.district.padEnd(6)} | ${n.phone}`);
    }
  }

  if (suspicious.length > 0) {
    console.log(`\n--- 驗證為「?」(不寫入 DB) (${suspicious.length}) ---`);
    for (const s of suspicious) {
      console.log(`  ⚠️  ${s.candidate.name.padEnd(28)} | ${s.candidate.district.padEnd(6)} | ${s.candidate.phone}`);
      console.log(`       原因: ${s.reason}`);
    }
  }

  // 5. Save log
  const logDir = path.join(process.cwd(), 'discover-logs');
  fs.mkdirSync(logDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const logPath = path.join(logDir, `${today}-${city}.json`);
  fs.writeFileSync(logPath, JSON.stringify({
    city, model, timestamp: new Date().toISOString(),
    districts_processed: districts.length,
    raw_count: allResults.reduce((s, r) => s + r.raw.length, 0),
    existing_count: existing.length,
    novel_count: verified.length,
    suspicious_count: suspicious.length,
    errors,
    zones: allResults,
    verified,
    existing,
    suspicious,
  }, null, 2), 'utf8');
  console.log(`\n📝 Log saved: ${logPath}`);

  // 6. Write to DB (only if --write)
  if (writeMode && verified.length > 0) {
    console.log(`\n⚠️  WRITE MODE: inserting ${verified.length} rows to DB...`);
    const inserted: number[] = [];
    for (const n of verified) {
      try {
        const res = await pool.query(
          `INSERT INTO restaurants (name, city, district, address, phone, has_hongkong_milk_tea, created_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW())
           RETURNING id`,
          [n.name, city, n.district || '', n.address || '', n.phone || ''],
        );
        inserted.push(res.rows[0].id);
      } catch (e: any) {
        console.error(`  ❌ insert failed: ${n.name} - ${e.message}`);
      }
    }
    console.log(`  ✅ Inserted ${inserted.length} rows: ${inserted.join(', ')}`);
  } else if (verified.length > 0) {
    console.log(`\n💡 Run with --write to actually insert these ${verified.length} rows.`);
  }

  await pool.end();
}

main().catch(e => {
  console.error('Unhandled:', e);
  process.exit(1);
});
