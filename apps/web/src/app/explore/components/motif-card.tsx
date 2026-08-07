import Link from 'next/link';
import { MotifVisual } from './motif-visual';

export function MotifCard({
  code,
  title,
  region,
  era,
  symbolism,
  visualSeed,
  colorPalette,
  arLabel,
}: {
  code: string;
  title: string;
  region: string | null;
  era: string | null;
  symbolism: string[];
  visualSeed: string;
  colorPalette: string[];
  arLabel: string;
}) {
  return (
    <article className="me-card">
      <div className="me-card__media">
        <Link href={`/explore/motifs/${code}`} className="me-card__media-link" aria-label={title}>
          <MotifVisual seed={visualSeed} colors={colorPalette} variant="fabric" label={title} />
          <span className="me-card__zoom" aria-hidden />
        </Link>
        <Link href={`/explore/motifs/${code}/ar`} className="me-card__ar" prefetch={false}>
          {arLabel}
        </Link>
      </div>
      <div className="me-card__body">
        <h3 className="me-card__title">
          <Link href={`/explore/motifs/${code}`}>{title}</Link>
        </h3>
        <p className="me-card__meta">{[region, era].filter(Boolean).join(' · ') || '—'}</p>
        <ul className="me-card__tags">
          {symbolism.slice(0, 3).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
