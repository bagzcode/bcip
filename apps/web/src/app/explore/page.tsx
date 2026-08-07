import Link from 'next/link';
import { Badge, FilterBar, ProvenanceStrip } from '@bcip/ui';
import { CatalogueListQuerySchema, type AccessTier, type ReviewStatus } from '@bcip/contracts';
import { hasPermission } from '@bcip/domain';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { listCollectionOptions, listMotifs } from '@/lib/catalogue';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const REVIEW_OPTIONS: ReviewStatus[] = [
  'draft',
  'pending_review',
  'approved',
  'approved_with_scope',
  'contested',
  'rejected',
  'withdrawn',
];

const TIER_OPTIONS: AccessTier[] = [
  'public',
  'registered',
  'research_only',
  'partner_only',
  'culturally_restricted',
];

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const sp = await searchParams;
  const actor = await getActorContext();

  const parsed = CatalogueListQuerySchema.safeParse({
    q: first(sp.q) ?? '',
    collectionCode: first(sp.collectionCode) || undefined,
    reviewStatus: first(sp.reviewStatus) || undefined,
    accessTier: first(sp.accessTier) || undefined,
    language: first(sp.language) || undefined,
    demoOnly: first(sp.demoOnly) === 'true',
    limit: first(sp.limit) ?? '24',
    offset: first(sp.offset) ?? '0',
  });
  const query = parsed.success
    ? parsed.data
    : CatalogueListQuerySchema.parse({ q: '', demoOnly: false });

  let items: Awaited<ReturnType<typeof listMotifs>>['items'] = [];
  let total = 0;
  let collections: { code: string; title: string }[] = [];
  let unavailable = false;

  try {
    const [list, cols] = await Promise.all([
      listMotifs(actor, query),
      listCollectionOptions(actor),
    ]);
    items = list.items;
    total = list.total;
    collections = cols;
  } catch {
    unavailable = true;
  }

  const canExport = hasPermission(actor, 'catalog:export');
  const exportQs = new URLSearchParams();
  if (query.q) exportQs.set('q', query.q);
  if (query.collectionCode) exportQs.set('collectionCode', query.collectionCode);
  if (query.accessTier) exportQs.set('accessTier', query.accessTier);
  if (query.demoOnly) exportQs.set('includeDemoOnly', 'true');

  return (
    <section>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'exploreTitle')}</h1>
      <p style={{ color: 'var(--bcip-muted)', maxWidth: '40rem' }}>{t(locale, 'exploreIntro')}</p>

      <p style={{ marginTop: '1rem' }}>
        <Link href="/explore/compare">{t(locale, 'exploreCompareLink')}</Link>
      </p>

      <FilterBar
        action="/explore"
        submitLabel={t(locale, 'exploreApplyFilters')}
        fields={[
          {
            name: 'q',
            label: t(locale, 'exploreSearch'),
            defaultValue: query.q,
            placeholder: t(locale, 'exploreSearchPlaceholder'),
          },
          {
            name: 'collectionCode',
            label: t(locale, 'exploreFilterCollection'),
            type: 'select',
            defaultValue: query.collectionCode ?? '',
            options: [
              { value: '', label: t(locale, 'filterAll') },
              ...collections.map((c) => ({ value: c.code, label: c.code })),
            ],
          },
          {
            name: 'reviewStatus',
            label: t(locale, 'exploreFilterReview'),
            type: 'select',
            defaultValue: query.reviewStatus ?? '',
            options: [
              { value: '', label: t(locale, 'filterAll') },
              ...REVIEW_OPTIONS.map((v) => ({ value: v, label: v.replaceAll('_', ' ') })),
            ],
          },
          {
            name: 'accessTier',
            label: t(locale, 'exploreFilterAccess'),
            type: 'select',
            defaultValue: query.accessTier ?? '',
            options: [
              { value: '', label: t(locale, 'filterAll') },
              ...TIER_OPTIONS.map((v) => ({ value: v, label: v.replaceAll('_', ' ') })),
            ],
          },
          {
            name: 'language',
            label: t(locale, 'exploreFilterLanguage'),
            type: 'select',
            defaultValue: query.language ?? '',
            options: [
              { value: '', label: t(locale, 'filterAll') },
              { value: 'en', label: 'EN' },
              { value: 'id', label: 'ID' },
            ],
          },
          {
            name: 'demoOnly',
            label: t(locale, 'exploreFilterDemo'),
            type: 'checkbox',
            checked: query.demoOnly,
          },
        ]}
      >
        {canExport ? (
          <>
            <a href={`/api/catalog/export?format=json&${exportQs.toString()}`}>
              {t(locale, 'exploreExportJson')}
            </a>
            <a href={`/api/catalog/export?format=csv&${exportQs.toString()}`}>
              {t(locale, 'exploreExportCsv')}
            </a>
          </>
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--bcip-muted)' }}>
            {t(locale, 'exploreExportDenied')}
          </span>
        )}
      </FilterBar>

      {unavailable ? (
        <p role="alert" style={{ color: 'var(--bcip-clay)' }}>
          {t(locale, 'exploreUnavailable')}
        </p>
      ) : (
        <>
          <p style={{ color: 'var(--bcip-muted)', fontSize: '0.9rem' }}>
            {total} {t(locale, 'exploreResults')}
          </p>
          {items.length === 0 ? (
            <p>{t(locale, 'exploreNoResults')}</p>
          ) : (
            <ul className="motif-list">
              {items.map((motif) => (
                <li key={motif.id} className="motif-item">
                  <div style={{ fontSize: '0.85rem', color: 'var(--bcip-muted)' }}>
                    <Link href={`/explore/motifs/${motif.publicCode}`}>{motif.publicCode}</Link>
                    {' · '}
                    <Link href={`/explore/collections/${motif.collectionCode}`}>
                      {motif.collectionCode}
                    </Link>
                  </div>
                  <h2 style={{ margin: '0.25rem 0' }}>
                    <Link
                      href={`/explore/motifs/${motif.publicCode}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {motif.title}
                    </Link>
                  </h2>
                  <p style={{ margin: 0 }}>{motif.summary}</p>
                  <ProvenanceStrip
                    reviewStatus={motif.reviewStatus}
                    accessTier={motif.accessTier}
                    isDemoFictional={motif.isDemoFictional}
                    demoLabel={t(locale, 'demoBadge')}
                    reviewLabel={t(locale, 'provenanceReview')}
                    accessLabel={t(locale, 'provenanceAccess')}
                    sourcesLabel={t(locale, 'provenanceSources')}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
