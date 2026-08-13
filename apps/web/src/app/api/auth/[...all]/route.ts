import { getAuth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

/**
 * Pass an explicit handler object — do not hand the lazy `auth` Proxy to
 * `toNextJsHandler`. That helper uses `"handler" in auth`, which is false for
 * a Proxy with an empty target, then tries to call `auth(request)` and throws
 * `TypeError: auth is not a function`.
 */
export const { GET, POST } = toNextJsHandler({
  handler: (request: Request) => getAuth().handler(request),
});
