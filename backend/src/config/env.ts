import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5050),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().default('onboarding@resend.dev'),
});

const parsedBaseEnv = baseEnvSchema.safeParse(process.env);

if (!parsedBaseEnv.success) {
  console.error(
    'Invalid backend environment configuration:',
    parsedBaseEnv.error.flatten().fieldErrors
  );
  process.exit(1);
}

const resolvedJwtSecret =
  parsedBaseEnv.data.JWT_SECRET && parsedBaseEnv.data.JWT_SECRET.length >= 16
    ? parsedBaseEnv.data.JWT_SECRET
    : parsedBaseEnv.data.NODE_ENV === 'production'
      ? undefined
      : 'local-development-jwt-secret';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.number().int().positive(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string(),
  FRONTEND_URL: z.string().url(),
  MONGODB_URI: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email(),
});

const parsedEnv = envSchema.safeParse({
  ...parsedBaseEnv.data,
  JWT_SECRET: resolvedJwtSecret,
});

if (!parsedEnv.success) {
  console.error('Invalid backend environment configuration:', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

if (!parsedBaseEnv.data.JWT_SECRET && parsedEnv.data.NODE_ENV !== 'production') {
  console.warn('[Config] JWT_SECRET not set. Using a local development fallback secret.');
}

export const env = parsedEnv.data;
