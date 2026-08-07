import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { tryLoadWebEnv } from '@/lib/env';

async function ping(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    return { ok: res.ok, detail: `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : 'unreachable' };
  }
}

export default async function HealthPage() {
  const locale = await getLocale();
  const env = tryLoadWebEnv();
  const aiBase = env?.AI_SERVICE_URL ?? process.env.AI_SERVICE_URL ?? 'http://localhost:8000';

  const [live, ready] = await Promise.all([
    ping(`${aiBase}/health/live`),
    ping(`${aiBase}/health/ready`),
  ]);

  const rows = [
    { name: 'web', ok: true, detail: 'serving' },
    { name: 'ai-live', ok: live.ok, detail: live.detail },
    { name: 'ai-ready', ok: ready.ok, detail: ready.detail },
    {
      name: 'env',
      ok: Boolean(env),
      detail: env ? 'validated' : 'incomplete (expected in local builds without .env)',
    },
  ];

  return (
    <section>
      <h1>{t(locale, 'healthTitle')}</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th align="left">Check</th>
            <th align="left">Status</th>
            <th align="left">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={{ borderTop: '1px solid var(--bcip-border)' }}>
              <td style={{ padding: '0.5rem 0' }}>{row.name}</td>
              <td>{row.ok ? 'ok' : 'down'}</td>
              <td style={{ color: 'var(--bcip-muted)' }}>{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
