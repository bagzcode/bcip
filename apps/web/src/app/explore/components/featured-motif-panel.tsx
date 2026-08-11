import Link from 'next/link';
import { MotifVisual } from './motif-visual';

export function FeaturedMotifPanel({
  detailHref,
  title,
  region,
  visualSeed,
  colorPalette,
  story,
  summary,
  artisan,
  linen,
  labels,
}: {
  detailHref: string;
  title: string;
  region: string | null;
  visualSeed: string;
  colorPalette: string[];
  story: string | null;
  summary: string;
  artisan: {
    code: string;
    name: string;
    bio: string;
    visualSeed: string;
  } | null;
  linen: { code: string; title: string; visualSeed: string } | null;
  labels: {
    sketch: string;
    fabric: string;
    originLinen: string;
    artisan: string;
    meaning: string;
  };
}) {
  return (
    <aside className="me-hero__panel" aria-label={title}>
      <header className="me-hero__panel-head">
        <h2>
          <Link href={detailHref}>{title}</Link>
        </h2>
        <p>{region || '—'}</p>
      </header>

      <div className="me-hero__thumbs">
        <figure className="me-hero__thumb">
          <Link href={detailHref} className="me-hero__thumb-link" aria-label={`${title} — ${labels.sketch}`}>
            <MotifVisual seed={visualSeed} colors={colorPalette} variant="sketch" label={labels.sketch} />
          </Link>
          <figcaption>{labels.sketch}</figcaption>
        </figure>
        <figure className="me-hero__thumb">
          <Link href={detailHref} className="me-hero__thumb-link" aria-label={`${title} — ${labels.fabric}`}>
            <MotifVisual seed={visualSeed} colors={colorPalette} variant="fabric" label={labels.fabric} />
          </Link>
          <figcaption>{labels.fabric}</figcaption>
        </figure>
      </div>

      <div className="me-hero__meta-row">
        <figure className="me-hero__linen">
          <Link
            href={linen ? `/explore/linen/${linen.code}` : detailHref}
            className="me-hero__thumb-link"
            aria-label={labels.originLinen}
          >
            <MotifVisual
              seed={linen?.visualSeed ?? visualSeed}
              colors={colorPalette}
              variant="linen"
              label={labels.originLinen}
            />
          </Link>
          <figcaption>
            {labels.originLinen}
            {linen ? (
              <>
                {': '}
                <Link href={`/explore/linen/${linen.code}`}>{linen.title}</Link>
              </>
            ) : null}
          </figcaption>
        </figure>

        {artisan ? (
          <div className="me-hero__artisan-card">
            <MotifVisual
              seed={artisan.visualSeed}
              colors={colorPalette}
              variant="portrait"
              label={artisan.name}
              className="me-hero__portrait"
            />
            <div>
              <p className="me-hero__artisan-label">{labels.artisan}</p>
              <p className="me-hero__artisan-name">
                <Link href={`/explore/artisans/${artisan.code}`}>{artisan.name}</Link>
              </p>
              <p className="me-hero__artisan-bio">{artisan.bio}</p>
            </div>
          </div>
        ) : null}
      </div>

      <section className="me-hero__meaning">
        <h3>{labels.meaning}</h3>
        <p>{story ?? summary}</p>
        <p className="me-hero__meaning-cta">
          <Link href={detailHref}>{title}</Link>
        </p>
      </section>
    </aside>
  );
}
