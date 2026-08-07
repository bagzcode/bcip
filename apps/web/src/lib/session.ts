import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Optional session lookup for server components / actions.
 * Returns null when unauthenticated or auth/DB is unavailable.
 */
export async function getSession() {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    return null;
  }
}

/**
 * Server-side session validation for protected routes (e.g. /workspace).
 * Proxy redirects alone are not authorization — pages must call this (or getActorContext).
 */
export async function requireSession() {
  return getSession();
}
