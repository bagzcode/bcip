'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

type FacetKey = 'regions' | 'eras' | 'symbolism';

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
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

  const selected = useMemo(
    () => ({
      regions: parseList(searchParams.get('regions')),
      eras: parseList(searchParams.get('eras')),
      symbolism: parseList(searchParams.get('symbolism')),
    }),
    [searchParams],
  );

  const activeCount =
    selected.regions.length + selected.eras.length + selected.symbolism.length;

  function push(next: typeof selected) {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ['regions', 'eras', 'symbolism'] as const) {
      if (next[key].length) params.set(key, next[key].join(','));
      else params.delete(key);
    }
    params.delete('offset');
    router.push(`/explore/motifs?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('regions');
    params.delete('eras');
    params.delete('symbolism');
    router.push(`/explore/motifs?${params.toString()}`);
    setOpen(null);
  }

  const facets: { key: FacetKey; label: string; values: string[] }[] = [
    { key: 'regions', label: labels.region, values: options.regions },
    { key: 'eras', label: labels.era, values: options.eras },
    { key: 'symbolism', label: labels.symbolism, values: options.symbolism },
  ];

  return (
    <div className="me-filters">
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
              {selected[facet.key].length > 0 ? (
                <span className="me-filters__count">{selected[facet.key].length}</span>
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
                        checked={selected[facet.key].includes(value)}
                        onChange={() =>
                          push({
                            ...selected,
                            [facet.key]: toggleValue(selected[facet.key], value),
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
