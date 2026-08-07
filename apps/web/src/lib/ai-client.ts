import { createRequestId, problem } from './errors';
import { tryLoadWebEnv } from './env';
import type { ColorAnalyzeQueuedResponse } from '@bcip/contracts';
import { ColorAnalyzeRequestSchema } from '@bcip/contracts';

export async function analyzeColorQueued(
  body: unknown,
  requestId = createRequestId(),
): Promise<ColorAnalyzeQueuedResponse> {
  const env = tryLoadWebEnv();
  if (!env) {
    throw problem({
      type: 'https://bcip.local/problems/misconfigured',
      title: 'Service misconfigured',
      status: 500,
      code: 'ENV_INVALID',
      detail: 'Web environment is not valid.',
      request_id: requestId,
    });
  }

  const payload = ColorAnalyzeRequestSchema.parse(body);
  const response = await fetch(`${env.AI_SERVICE_URL}/v1/color/analyze`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': requestId,
      authorization: `Bearer ${env.AI_SERVICE_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw problem({
      type: 'https://bcip.local/problems/ai-upstream',
      title: 'AI service error',
      status: response.status,
      code: 'AI_UPSTREAM_ERROR',
      detail: 'Color analysis enqueue failed.',
      request_id: requestId,
    });
  }

  return (await response.json()) as ColorAnalyzeQueuedResponse;
}
