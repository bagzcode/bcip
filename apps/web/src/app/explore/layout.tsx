import { ExploreNav } from '@/app/explore/components/explore-nav';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';

export default async function ExploreLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <div className="me-shell">
      <ExploreNav
        brand={t(locale, 'exploreNavBrand')}
        searchPlaceholder={t(locale, 'exploreNavSearch')}
        labels={{
          motifs: t(locale, 'exploreNavMotifs'),
          artisans: t(locale, 'exploreNavArtisans'),
          linen: t(locale, 'exploreNavLinen'),
          map: t(locale, 'exploreNavMap'),
        }}
      />
      <div className="me-shell__content">{children}</div>
    </div>
  );
}
