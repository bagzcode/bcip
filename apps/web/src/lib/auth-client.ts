'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth React client for email/password sign-in, sign-up, and sign-out.
 * Uses the current origin in the browser so cookies stay same-site.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
});
