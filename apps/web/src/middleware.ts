import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Early redirect optimization only.
 * Authorization for /workspace is enforced again in the page via requireSession().
 */
export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
