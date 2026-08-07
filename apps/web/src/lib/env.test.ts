import { describe, expect, it } from 'vitest';
import { loadWebEnv } from './env';

describe('loadWebEnv', () => {
  it('accepts a complete configuration', () => {
    const env = loadWebEnv({
      NODE_ENV: 'test',
      APP_URL: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://bcip:change-me@localhost:5432/bcip',
      REDIS_URL: 'redis://localhost:6379/0',
      BETTER_AUTH_SECRET: '0123456789abcdef0123456789abcdef',
      BETTER_AUTH_URL: 'http://localhost:3000',
      AI_SERVICE_URL: 'http://localhost:8000',
      AI_SERVICE_TOKEN: 'test-token',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_REGION: 'us-east-1',
      S3_BUCKET_PRIVATE: 'bcip-private',
      S3_BUCKET_PUBLIC: 'bcip-public',
      S3_ACCESS_KEY: 'change-me',
      S3_SECRET_KEY: 'change-me-secret',
      S3_FORCE_PATH_STYLE: 'true',
    });
    expect(env.APP_URL).toBe('http://localhost:3000');
  });

  it('rejects short auth secrets', () => {
    expect(() =>
      loadWebEnv({
        DATABASE_URL: 'postgresql://bcip:change-me@localhost:5432/bcip',
        BETTER_AUTH_SECRET: 'too-short',
        AI_SERVICE_TOKEN: 'x',
        S3_ACCESS_KEY: 'a',
        S3_SECRET_KEY: 'b',
      }),
    ).toThrow(/Invalid environment configuration/);
  });
});
