import { brandIdentity } from '@/brand/identity';

export const BRAND_LOGO_SRC = '/brand/logo-intelligence.png';

export function brandLogoAlt(): string {
  return `${brandIdentity.acronym} — ${brandIdentity.displayNameEn}`;
}

type BrandLogoSize = 'header' | 'nav' | 'footer' | 'auth';

export function BrandLogo({
  size = 'header',
  decorative = false,
}: {
  size?: BrandLogoSize;
  decorative?: boolean;
}) {
  return (
    <span className={`brand-logo brand-logo--${size}`}>
      {/* Dark-background wordmark; keep PNG as-is (no invert). */}
      <img src={BRAND_LOGO_SRC} alt={decorative ? '' : brandLogoAlt()} />
    </span>
  );
}
