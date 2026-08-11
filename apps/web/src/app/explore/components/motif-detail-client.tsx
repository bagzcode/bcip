'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MotifVisual } from './motif-visual';
import { OriginMap } from './origin-map';

type Tab = 'sketch' | 'fabric' | 'linen';

export function MotifDetailClient({
  code,
  title,
  region,
  era,
  fabricType,
  colorPalette,
  symbolism,
  story,
  summary,
  visualSeed,
  originLat,
  originLng,
  artisan,
  linen,
  labels,
}: {
  code: string;
  title: string;
  region: string | null;
  era: string | null;
  fabricType: string | null;
  colorPalette: string[];
  symbolism: string[];
  story: string | null;
  summary: string;
  visualSeed: string;
  originLat: number | null;
  originLng: number | null;
  artisan: {
    code: string;
    name: string;
    bio: string;
    visualSeed: string;
    region: string | null;
  } | null;
  linen: { code: string; title: string; visualSeed: string } | null;
  labels: {
    backHome: string;
    back: string;
    sketch: string;
    fabric: string;
    originLinen: string;
    zoom: string;
    meaning: string;
    details: string;
    region: string;
    era: string;
    fabricType: string;
    palette: string;
    symbolism: string;
    artisan: string;
    tryAr: string;
    viewAr: string;
    map: string;
  };
}) {
  const [tab, setTab] = useState<Tab>('sketch');

  return (
    <div className="me-detail">
      <p className="me-detail__crumb">
        <Link href="/explore">← {labels.backHome}</Link>
        <span aria-hidden> · </span>
        <Link href="/explore/motifs">{labels.back}</Link>
      </p>

      <header className="me-detail__header">
        <div>
          <h1>{title}</h1>
          <p className="me-detail__region">{region ?? '—'}</p>
        </div>
        <div className="me-detail__actions">
          <Link className="me-btn me-btn--primary" href={`/explore/motifs/${code}/ar`}>
            {labels.viewAr}
          </Link>
        </div>
      </header>

      <div className="me-detail__gallery">
        <div className="me-detail__tabs" role="tablist" aria-label="Motif images">
          {(
            [
              ['sketch', labels.sketch],
              ['fabric', labels.fabric],
              ['linen', labels.originLinen],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'is-active' : undefined}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
          <button type="button" className="me-detail__zoom" aria-label={labels.zoom}>
            +
          </button>
        </div>
        <div className="me-detail__stage" role="tabpanel">
          <MotifVisual
            seed={tab === 'linen' && linen ? linen.visualSeed : visualSeed}
            colors={colorPalette}
            variant={tab === 'sketch' ? 'sketch' : tab === 'linen' ? 'linen' : 'fabric'}
            label={`${title} ${tab}`}
          />
        </div>
      </div>

      <section className="me-detail__story panel">
        <h2>{labels.meaning}</h2>
        <p>{story ?? summary}</p>
      </section>

      <section className="me-detail__grid panel">
        <h2>{labels.details}</h2>
        <dl className="me-kv">
          <div>
            <dt>{labels.region}</dt>
            <dd>{region ?? '—'}</dd>
          </div>
          <div>
            <dt>{labels.era}</dt>
            <dd>{era ?? '—'}</dd>
          </div>
          <div>
            <dt>{labels.fabricType}</dt>
            <dd>
              {linen ? (
                <Link href={`/explore/linen/${linen.code}`}>{fabricType ?? linen.title}</Link>
              ) : (
                fabricType ?? '—'
              )}
            </dd>
          </div>
          <div>
            <dt>{labels.palette}</dt>
            <dd className="me-swatches">
              {colorPalette.map((hex) => (
                <span key={hex} style={{ background: hex }} title={hex} />
              ))}
            </dd>
          </div>
          <div>
            <dt>{labels.symbolism}</dt>
            <dd>{symbolism.join(', ') || '—'}</dd>
          </div>
        </dl>
      </section>

      {artisan ? (
        <section className="me-detail__artisan panel">
          <h2>{labels.artisan}</h2>
          <div className="me-artisan-block">
            <MotifVisual
              seed={artisan.visualSeed}
              colors={colorPalette}
              variant="portrait"
              className="me-artisan-block__photo"
              label={artisan.name}
            />
            <div>
              <h3>
                <Link href={`/explore/artisans/${artisan.code}`}>{artisan.name}</Link>
              </h3>
              <p className="me-muted">{artisan.region}</p>
              <p>{artisan.bio}</p>
            </div>
          </div>
        </section>
      ) : null}

      {originLat != null && originLng != null ? (
        <section className="panel">
          <h2>{labels.map}</h2>
          <OriginMap
            pins={[
              {
                id: code,
                label: title,
                lat: originLat,
                lng: originLng,
                href: `/explore/motifs/${code}`,
              },
            ]}
            focus={{ lat: originLat, lng: originLng }}
          />
        </section>
      ) : null}
    </div>
  );
}
