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
  artisanName,
  isDemoFictional = false,
  demoLabel,
}: {
  code: string;
  title: string;
  region: string | null;
  era: string | null;
  symbolism: string[];
  visualSeed: string;
  colorPalette: string[];
  arLabel: string;
  artisanName?: string | null;
  isDemoFictional?: boolean;
  demoLabel?: string;
}) {
  const tags = symbolism.slice(0, 3).join(', ');
  const mediaLabel = [title, region, era, tags].filter(Boolean).join(' ');

  return (
    <article className="me-card">
      <div className="me-card__media">
        <Link href={`/explore/motifs/${code}`} className="me-card__media-link" aria-label={mediaLabel}>
          <MotifVisual seed={visualSeed} colors={colorPalette} variant="fabric" label={title} />
          <span className="me-card__zoom" aria-hidden />
        </Link>
        {isDemoFictional && demoLabel ? <span className="me-card__demo">{demoLabel}</span> : null}
        <Link href={`/explore/motifs/${code}/ar`} className="me-card__ar" prefetch={false}>
          {arLabel}
        </Link>
      </div>
      <div className="me-card__body">
        <h3 className="me-card__title">
          <Link href={`/explore/motifs/${code}`}>{title}</Link>
        </h3>
        <p className="me-card__region">{region || '—'}</p>
        {artisanName ? <p className="me-card__artisan">{artisanName}</p> : null}
        <div className="me-card__footer">
          <span className="me-card__era">{era || '—'}</span>
          {tags ? <span className="me-card__tags-inline">{tags}</span> : null}
        </div>
      </div>
    </article>
  );
}
