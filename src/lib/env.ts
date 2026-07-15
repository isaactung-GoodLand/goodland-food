import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  // Admin CRM credentials — moved to DB (2026-07-15)
  // ADMIN_EMAIL and ADMIN_PASSWORD removed; auth is now DB-backed
})

export type Env = z.infer<typeof EnvSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ')
    // Log but throw so middleware/handlers can return 500 with a clear error
    console.error(`[env] ${missing}`)
    throw new Error(`Invalid/missing env vars: ${missing}`)
  }
  cached = parsed.data
  return cached
}
