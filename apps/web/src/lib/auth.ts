import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import {
  user,
  session,
  account,
  verification,
  organization as authOrganization,
  member,
  invitation,
} from '@bcip/db';
import { getDb } from './db';

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
  }

  const db = getDb();
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user,
        session,
        account,
        verification,
        organization: authOrganization,
        member,
        invitation,
      },
    }),
    secret,
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    emailAndPassword: {
      enabled: true,
    },
    plugins: [organization()],
  });
}

let _auth: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

/** Lazy proxy so importing modules during build does not require a live DB. */
export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop, receiver) {
    const instance = getAuth();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === 'function'
      ? (value as (...args: never[]) => unknown).bind(instance)
      : value;
  },
  // `toNextJsHandler` uses `"handler" in auth`; without `has`, an empty-target
  // Proxy reports false and the helper tries to call auth as a function.
  has(_target, prop) {
    return Reflect.has(getAuth() as object, prop);
  },
});
