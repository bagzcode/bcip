import { randomUUID } from 'node:crypto';
import type { ProblemDetails } from '@bcip/contracts';

export function createRequestId(existing?: string | null): string {
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
    return existing;
  }
  return randomUUID();
}

export function problem(
  partial: Omit<ProblemDetails, 'request_id'> & { request_id?: string },
): ProblemDetails {
  return {
    ...partial,
    request_id: partial.request_id ?? createRequestId(),
  };
}
