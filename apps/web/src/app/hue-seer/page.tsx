import Link from 'next/link';
import { Badge, StatusBadge } from '@bcip/ui';
import { analysisModeLabel } from '@bcip/domain';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { listColorAnalyses, listDemoHueSeerAssets } from '@/lib/hue-seer';
import { HueSeerEnqueueForm } from '@/components/hue-seer-enqueue-form';
import { HueSeerDyePredictTool } from '@/components/hue-seer/dye-predict-tool';

export default async function HueSeerPage() {
  const locale = await getLocale();
  const actor = await getActorContext();
  let analyses: Awaited<ReturnType<typeof listColorAnalyses>> = [];
  let assets: Awaited<ReturnType<typeof listDemoHueSeerAssets>> = [];
  let loadError: string | null = null;
  try {
    [analyses, assets] = await Promise.all([
      listColorAnalyses(actor),
      listDemoHueSeerAssets(),
    ]);
  } catch {
    loadError = t(locale, 'hueSeerUnavailable');
  }

  const colorPickerLabels = {
    picker: t(locale, 'hueSeerPickerLabel'),
    presets: t(locale, 'hueSeerPresetsLabel'),
    rgbValues: t(locale, 'hueSeerRgbValues'),
    channelR: t(locale, 'hueSeerChannelR'),
    channelG: t(locale, 'hueSeerChannelG'),
    channelB: t(locale, 'hueSeerChannelB'),
    currentRgb: t(locale, 'hueSeerCurrentRgb'),
    selectPreset: t(locale, 'hueSeerSelectPreset'),
  };

  return (
    <section className="hs-page">
      <HueSeerDyePredictTool
        analysesHref="#hs-lab"
        compareHref="/hue-seer/compare"
        labels={{
          toolTitle: t(locale, 'hueSeerDyeToolTitle'),
          toolSubtitle: t(locale, 'hueSeerDyeToolSubtitle'),
          exploratoryBadge: t(locale, 'hueSeerExploratoryBadge'),
          demoBadge: t(locale, 'demoBadge'),
          aboutTitle: t(locale, 'hueSeerDyeAboutTitle'),
          aboutBody: t(locale, 'hueSeerDyeAboutBody'),
          dyeColors: t(locale, 'hueSeerDyeColors'),
          primaryDye: t(locale, 'hueSeerPrimaryDye'),
          secondaryDye: t(locale, 'hueSeerSecondaryDye'),
          fabricType: t(locale, 'hueSeerFabricType'),
          fabricCotton: t(locale, 'hueSeerFabricCotton'),
          fabricCottonDesc: t(locale, 'hueSeerFabricCottonDesc'),
          fabricSilk: t(locale, 'hueSeerFabricSilk'),
          fabricSilkDesc: t(locale, 'hueSeerFabricSilkDesc'),
          fabricLinen: t(locale, 'hueSeerFabricLinen'),
          fabricLinenDesc: t(locale, 'hueSeerFabricLinenDesc'),
          fabricRayon: t(locale, 'hueSeerFabricRayon'),
          fabricRayonDesc: t(locale, 'hueSeerFabricRayonDesc'),
          parameters: t(locale, 'hueSeerParameters'),
          concentration: t(locale, 'hueSeerConcentration'),
          temperature: t(locale, 'hueSeerTemperature'),
          dyeTime: t(locale, 'hueSeerDyeTime'),
          concentrationLight: t(locale, 'hueSeerConcentrationLight'),
          concentrationIntense: t(locale, 'hueSeerConcentrationIntense'),
          temperatureCold: t(locale, 'hueSeerTemperatureCold'),
          temperatureHot: t(locale, 'hueSeerTemperatureHot'),
          timeQuick: t(locale, 'hueSeerTimeQuick'),
          timeDeep: t(locale, 'hueSeerTimeDeep'),
          prediction: t(locale, 'hueSeerPrediction'),
          saveColor: t(locale, 'hueSeerSaveColor'),
          reset: t(locale, 'hueSeerReset'),
          clearHistory: t(locale, 'hueSeerClearHistory'),
          historyTitle: t(locale, 'hueSeerHistoryTitle'),
          historyEmpty: t(locale, 'hueSeerHistoryEmpty'),
          historyEmptyHint: t(locale, 'hueSeerHistoryEmptyHint'),
          historyRestore: t(locale, 'hueSeerHistoryRestore'),
          footer: t(locale, 'hueSeerDyeFooter'),
          analysesLink: t(locale, 'hueSeerAnalysesLink'),
          compareLink: t(locale, 'hueSeerCompareLink'),
          pipelineNote: t(locale, 'hueSeerPipelineNote'),
          colorPicker: colorPickerLabels,
        }}
      />

      <div className="hs-lab panel" id="hs-lab">
        <p style={{ letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bcip-clay)' }}>
          Phase 2
        </p>
        <h2 style={{ marginTop: '0.35rem' }}>{t(locale, 'hueSeerLabHeading')}</h2>
        <p style={{ maxWidth: '40rem' }}>{t(locale, 'hueSeerLabIntro')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          <Badge>{t(locale, 'demoBadge')}</Badge>
          <StatusBadge tone="access">{t(locale, 'hueSeerExploratoryBadge')}</StatusBadge>
          <StatusBadge tone="review">{t(locale, 'hueSeerCalibratedBadge')}</StatusBadge>
        </div>

        <p style={{ marginTop: '1rem' }}>
          <Link href="/hue-seer/compare">{t(locale, 'hueSeerCompareLink')}</Link>
          <span style={{ color: 'var(--bcip-muted)' }}>
            {' '}
            · {t(locale, 'hueSeerUploadApiHint')}: POST /api/uploads/initiate|finalize
          </span>
        </p>

        {loadError ? (
          <p role="alert" style={{ color: 'var(--bcip-clay)' }}>
            {loadError}
          </p>
        ) : null}

        <div className="panel">
          <HueSeerEnqueueForm
            assets={assets}
            labels={{
              title: t(locale, 'hueSeerEnqueueTitle'),
              mode: t(locale, 'hueSeerMode'),
              exploratory: t(locale, 'hueSeerExploratoryBadge'),
              calibrated: t(locale, 'hueSeerCalibratedBadge'),
              calibrationTarget: t(locale, 'hueSeerCalibrationTarget'),
              paletteSize: t(locale, 'hueSeerPaletteSize'),
              submit: t(locale, 'hueSeerEnqueueSubmit'),
              signInHint: t(locale, 'hueSeerSignInHint'),
              progress: t(locale, 'hueSeerJobProgress'),
              uploadHint: t(locale, 'hueSeerUploadHint'),
            }}
          />
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>{t(locale, 'hueSeerAnalysesHeading')}</h3>
          {analyses.length === 0 ? (
            <p style={{ color: 'var(--bcip-muted)' }}>{t(locale, 'hueSeerNoAnalyses')}</p>
          ) : (
            <ul className="motif-list">
              {analyses.map((a) => (
                <li key={a.id} className="motif-item">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'baseline' }}>
                    <Link href={`/hue-seer/${a.publicCode}`} style={{ fontWeight: 600 }}>
                      {a.title}
                    </Link>
                    <span style={{ color: 'var(--bcip-muted)', fontSize: '0.85rem' }}>{a.publicCode}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                    <StatusBadge tone={a.isCalibrated ? 'review' : 'access'}>
                      {a.isCalibrated
                        ? t(locale, 'hueSeerCalibratedBadge')
                        : t(locale, 'hueSeerExploratoryBadge')}
                    </StatusBadge>
                    {a.isDemoFictional ? <StatusBadge tone="demo">{t(locale, 'demoBadge')}</StatusBadge> : null}
                    <span style={{ fontSize: '0.8rem', color: 'var(--bcip-muted)' }}>
                      {a.algorithmVersion}
                    </span>
                  </div>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--bcip-muted)' }}>
                    {analysisModeLabel(a.analysisMode, a.isCalibrated)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
