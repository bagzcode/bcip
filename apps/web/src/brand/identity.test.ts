import { describe, expect, it } from 'vitest';
import { brandIdentity } from './identity';

describe('brand identity', () => {
  it('points the graphic wordmark at a public asset without renaming the product', () => {
    expect(brandIdentity.logoSrc).toBe('/brand/logo-intelligence.png');
    expect(brandIdentity.logoIconSrc).toBe('/brand/logo-intelligence-icon.png');
    expect(brandIdentity.logoWidth).toBeGreaterThan(brandIdentity.logoHeight);
    expect(brandIdentity.displayNameEn).toBe('Batik Design Intelligence');
    expect(brandIdentity.acronym).toBe('BCIP');
  });
});
