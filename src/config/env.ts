import { z } from 'zod';

const envSchema = z.object({
  VITE_HUBSPOT_PRIVATE_APP_TOKEN: z.string().optional(),
  VITE_HEYGEN_API_KEY: z.string().min(1, "HeyGen API key is required"),
  VITE_SUPABASE_URL: z.string().min(1, "Supabase URL is required"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const env = {
    VITE_HUBSPOT_PRIVATE_APP_TOKEN: import.meta.env.VITE_HUBSPOT_PRIVATE_APP_TOKEN,
    VITE_HEYGEN_API_KEY: import.meta.env.VITE_HEYGEN_API_KEY,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

export const env = validateEnv();