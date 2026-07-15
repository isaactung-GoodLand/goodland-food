import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_URL = process.env.DATABASE_URL!;
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

function runPsql(sql: string): Promise<{ rc: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn('psql', [DB_URL, '-c', sql], {});
    let stdout = '', stderr = '';
    proc.stdout?.on('data', (d) => (stdout += d));
    proc.stderr?.on('data', (d) => (stderr += d));
    proc.on('close', (rc) => resolve({ rc, stdout, stderr }));
  });
}

async function runMigrationFile(filename: string) {
  const content = readFileSync(join(MIGRATIONS_DIR, filename), 'utf8');
  const cleaned = content
    .replace(/^\s*BEGIN\s*;?\s*$/gim, '')
    .replace(/^\s*COMMIT\s*;?\s*$/gim, '')
    .replace(/--.*$/gm, '');

  const statements = cleaned
    .split(/;\s*$/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    const r = await runPsql(stmt);
    if (r.rc !== 0) {
      console.error(`FAILED: ${stmt.slice(0, 80)}`);
      console.error(r.stderr);
      throw new Error(`Statement failed: ${stmt.slice(0, 80)}`);
    }
  }
  console.log(`  ${filename}: ${statements.length} statements OK`);
}

async function main() {
  console.log('=== Dropping old tables ===');
  await runPsql('DROP TABLE IF EXISTS admin_sessions CASCADE');
  await runPsql('DROP TABLE IF EXISTS admin_users CASCADE');
  console.log('  Dropped.');

  console.log('=== Running migrations ===');
  await runMigrationFile('20260716_admin_users.sql');
  await runMigrationFile('20260716_admin_sessions.sql');

  console.log('=== Verifying ===');
  const r = await runPsql("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log(r.stdout);
}

main().catch((e) => { console.error(e); process.exit(1); });
