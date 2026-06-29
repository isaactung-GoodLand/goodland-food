import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
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
    throw new Error(`Invalid/missing env vars: ${missing}`)
  }
  cached = parsed.data
  return cached
}
