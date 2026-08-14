/**
 * Central public brand strings for BCIP.
 * Rename here (and mirror i18n keys in messages.ts) — do not scatter display names.
 */

export const brandIdentity = {
  /** Technical / repo acronym — stable across renames. */
  acronym: 'BCIP',

  /** Graphic wordmark (dark canvas). Product name stays batik-first. */
  logoSrc: '/brand/logo-intelligence.png',

  /**
   * Former public expansion (retired on user-facing surfaces).
   * Kept for migration notes and search/replace audits.
   */
  formerExpansionEn: 'Batik Color Intelligence Platform',
  formerExpansionId: 'Platform Kecerdasan Warna Batik',

  /**
   * Interim expansion for docs and metadata.
   * Letters are no longer forced to mean “Color”; C is historical/repo continuity.
   */
  expansionEn: 'Batik Design Intelligence Platform',
  expansionId: 'Platform Kecerdasan Desain Batik',

  /** Short hero / chrome display name (batik-primary). */
  displayNameEn: 'Batik Design Intelligence',
  displayNameId: 'Kecerdasan Desain Batik',

  taglineEn:
    'Motifs, craft, color science, guidance, and dress design — governed intelligence for Batik Lasem research.',
  taglineId:
    'Motif, kerajinan, sains warna, panduan, dan desain busana — kecerdasan terkelola untuk riset Batik Lasem.',

  documentTitleEn: 'BCIP — Batik Design Intelligence',
  documentTitleId: 'BCIP — Kecerdasan Desain Batik',

  descriptionEn:
    'Multimodal batik design-intelligence ecosystem: heritage motifs, craft knowledge, color science, explainable guidance, and fashion application. Pilot domain: Batik Lasem.',
  descriptionId:
    'Ekosistem kecerdasan desain batik multimodal: motif warisan, pengetahuan kerajinan, sains warna, panduan berdasar sumber, dan aplikasi fashion. Domain percontohan: Batik Lasem.',

  pilotScopeEn: 'Pilot domain: Batik Lasem · Demo content is labelled fictional',
  pilotScopeId: 'Domain percontohan: Batik Lasem · Konten demo berlabel fiktif',

  footerBlurbEn:
    'BCIP connects Motif Explorer, Hue Seer, Lasem Guru, Dress Weaver, Research Lab, and Governance. Color analysis is one module (Hue Seer), not the whole platform.',
  footerBlurbId:
    'BCIP menghubungkan Motif Explorer, Hue Seer, Lasem Guru, Dress Weaver, Research Lab, dan Governance. Analisis warna adalah satu modul (Hue Seer), bukan seluruh platform.',
} as const;

export type BrandLocale = 'en' | 'id';

export function brandDisplayName(locale: BrandLocale): string {
  return locale === 'id' ? brandIdentity.displayNameId : brandIdentity.displayNameEn;
}

export function brandTagline(locale: BrandLocale): string {
  return locale === 'id' ? brandIdentity.taglineId : brandIdentity.taglineEn;
}

export function brandDocumentTitle(locale: BrandLocale): string {
  return locale === 'id' ? brandIdentity.documentTitleId : brandIdentity.documentTitleEn;
}

export function brandDescription(locale: BrandLocale): string {
  return locale === 'id' ? brandIdentity.descriptionId : brandIdentity.descriptionEn;
}
