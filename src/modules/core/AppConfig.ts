import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_PORT: z.string().transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().url(),
  BULLMQ_REDIS_URL: z.string().url(),
  EMAILS_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Google API configuration
  GOOGLE_API_CLIENT_ID: z.string(),
  GOOGLE_API_CLIENT_SECRET: z.string(),
  GOOGLE_API_REFRESH_TOKEN: z.string(),
  GOOGLE_API_EMAIL: z.string().email(),
  GOOGLE_API_REDIRECT_URI: z.string().url(),
});

type EnvSchema = z.infer<typeof envSchema>;

@Injectable()
export class AppConfig {
  private readonly config: EnvSchema;
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger('AppConfig');
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      throw new Error(`Environment validation error: ${result.error.message}`);
    }

    this.config = result.data;
    this.logger.log('Environment successfully validated and loaded');
  }

  get environment(): string {
    return this.config.NODE_ENV;
  }

  get appPort(): number {
    return this.config.APP_PORT;
  }

  get postgresUrl(): string {
    return this.config.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.config.BULLMQ_REDIS_URL;
  }

  get emailsEnabled(): boolean {
    return this.config.EMAILS_ENABLED;
  }

  get googleApiConfig() {
    return {
      clientId: this.config.GOOGLE_API_CLIENT_ID,
      clientSecret: this.config.GOOGLE_API_CLIENT_SECRET,
      refreshToken: this.config.GOOGLE_API_REFRESH_TOKEN,
      redirectUri: this.config.GOOGLE_API_REDIRECT_URI,
      gmailUser: this.config.GOOGLE_API_EMAIL,
    };
  }
}
