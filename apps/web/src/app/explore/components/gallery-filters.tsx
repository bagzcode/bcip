'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

type FacetKey = 'regions' | 'eras' | 'symbolism';

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function selectionKey(selected: Record<FacetKey, string[]>): string {
  return (['regions', 'eras', 'symbolism'] as const)
    .map((key) => `${key}:${selected[key].join('|')}`)
    .join(';');
}

export function GalleryFilters({
  options,
  labels,
}: {
  options: { regions: string[]; eras: string[]; symbolism: string[] };
  labels: {
    region: string;
    era: string;
    symbolism: string;
    clear: string;
    apply: string;
    active: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState<FacetKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const urlSelected = useMemo(
    () => ({
      regions: parseList(searchParams.get('regions')),
      eras: parseList(searchParams.get('eras')),
      symbolism: parseList(searchParams.get('symbolism')),
    }),
    [searchParams],
  );

  const [pending, setPending] = useState(urlSelected);

  useEffect(() => {
    setPending(urlSelected);
  }, [urlSelected]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const activeCount =
    pending.regions.length + pending.eras.length + pending.symbolism.length;

  function scheduleNavigation(next: typeof pending) {
    setPending(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of ['regions', 'eras', 'symbolism'] as const) {
        if (next[key].length) params.set(key, next[key].join(','));
        else params.delete(key);
      }
      params.delete('offset');
      startTransition(() => {
        router.push(`/explore/motifs?${params.toString()}`);
      });
    }, 280);
  }

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('regions');
    params.delete('eras');
    params.delete('symbolism');
    setPending({ regions: [], eras: [], symbolism: [] });
    startTransition(() => {
      router.push(`/explore/motifs?${params.toString()}`);
    });
    setOpen(null);
  }

  const facets: { key: FacetKey; label: string; values: string[] }[] = [
    { key: 'regions', label: labels.region, values: options.regions },
    { key: 'eras', label: labels.era, values: options.eras },
    { key: 'symbolism', label: labels.symbolism, values: options.symbolism },
  ];

  const isSyncing = isPending || selectionKey(pending) !== selectionKey(urlSelected);

  return (
    <div className={`me-filters${isSyncing ? ' me-filters--pending' : ''}`}>
      <div className="me-filters__bar">
        {facets.map((facet) => (
          <div key={facet.key} className="me-filters__facet">
            <button
              type="button"
              className="me-filters__trigger"
              aria-expanded={open === facet.key}
              onClick={() => setOpen(open === facet.key ? null : facet.key)}
            >
              {facet.label}
              {pending[facet.key].length > 0 ? (
                <span className="me-filters__count">{pending[facet.key].length}</span>
              ) : null}
            </button>
            {open === facet.key ? (
              <div className="me-filters__popover" role="group" aria-label={facet.label}>
                {facet.values.length === 0 ? (
                  <p className="me-muted">—</p>
                ) : (
                  facet.values.map((value) => (
                    <label key={value} className="me-filters__option">
                      <input
                        type="checkbox"
                        checked={pending[facet.key].includes(value)}
                        onChange={() =>
                          scheduleNavigation({
                            ...pending,
                            [facet.key]: toggleValue(pending[facet.key], value),
                          })
                        }
                      />
                      {value}
                    </label>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ))}
        {activeCount > 0 ? (
          <button type="button" className="me-filters__clear" onClick={clearAll}>
            {labels.clear} ({activeCount} {labels.active})
          </button>
        ) : null}
      </div>
    </div>
  );
}
