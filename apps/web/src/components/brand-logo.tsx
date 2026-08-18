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
      {/* Tight-cropped dark-canvas wordmark; height-driven sizing preserves aspect ratio. */}
      <img
        src={BRAND_LOGO_SRC}
        alt={decorative ? '' : brandLogoAlt()}
        width={brandIdentity.logoWidth}
        height={brandIdentity.logoHeight}
        decoding="async"
      />
    </span>
  );
}
