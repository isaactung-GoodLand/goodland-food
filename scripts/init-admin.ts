import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const email = 'goodland';
  const plainPassword = 'isaactung0902';
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${email}, ${passwordHash})
    ON CONFLICT (email) DO UPDATE
    SET password_hash = ${passwordHash}
  `;

  console.log(`Admin user '${email}' initialized.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
