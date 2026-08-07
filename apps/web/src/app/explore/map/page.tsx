import { Badge } from '@bcip/ui';
import { OriginMap } from '@/app/explore/components/origin-map';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { listMapPins } from '@/lib/catalogue';

export default async function ExploreMapPage() {
  const locale = await getLocale();
  const actor = await getActorContext();

  let pins: Awaited<ReturnType<typeof listMapPins>> = [];
  let unavailable = false;
  try {
    pins = await listMapPins(actor);
  } catch {
    unavailable = true;
  }

  const markers = pins.map((pin) => ({
    id: `${pin.kind}-${pin.code}`,
    label: `${pin.title}${pin.region ? ` (${pin.region})` : ''}`,
    lat: pin.lat,
    lng: pin.lng,
    href: pin.kind === 'motif' ? `/explore/motifs/${pin.code}` : `/explore/artisans/${pin.code}`,
    kind: pin.kind,
  }));

  return (
    <section>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'exploreNavMap')}</h1>
      <p className="me-muted">{t(locale, 'exploreMapIntro')}</p>

      {unavailable ? (
        <p role="alert">{t(locale, 'exploreUnavailable')}</p>
      ) : markers.length === 0 ? (
        <p>{t(locale, 'exploreNoResults')}</p>
      ) : (
        <OriginMap pins={markers} />
      )}
    </section>
  );
}
