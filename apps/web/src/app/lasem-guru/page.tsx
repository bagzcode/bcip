import { LasemGuruChat } from '@/components/lasem-guru-chat';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';

const QUICK_EN = [
  'What is Fictional Lattice A used for in the demo?',
  'How was Fictional Wave B produced according to the demo source?',
  'What colour notes exist for Fictional Lattice A in the demo?',
  'What does the mythical phoenix symbol mean in Lasem batik?',
];

const QUICK_ID = [
  'Untuk apa Fictional Lattice A digunakan dalam demo?',
  'Bagaimana Fictional Wave B diproduksi menurut sumber demo?',
  'Catatan warna apa yang ada untuk Fictional Lattice A dalam demo?',
  'Apa makna simbol burung phoenix dalam batik Lasem?',
];

export default async function LasemGuruPage() {
  const locale = await getLocale();
  return (
    <section>
      <p style={{ letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bcip-clay)' }}>
        Phase 3
      </p>
      <h1>{t(locale, 'lasemGuruTitle')}</h1>
      <LasemGuruChat
        locale={locale}
        quickQuestions={locale === 'id' ? QUICK_ID : QUICK_EN}
        labels={{
          demoBadge: t(locale, 'demoBadge'),
          intro: t(locale, 'lasemGuruIntro'),
          placeholder: t(locale, 'lasemGuruPlaceholder'),
          ask: t(locale, 'lasemGuruAsk'),
          asking: t(locale, 'lasemGuruAsking'),
          sources: t(locale, 'lasemGuruSources'),
          closeSources: t(locale, 'lasemGuruCloseSources'),
          confidence: t(locale, 'lasemGuruConfidence'),
          evidence: t(locale, 'lasemGuruEvidence'),
          grounding: t(locale, 'lasemGuruGrounding'),
          feedback: t(locale, 'lasemGuruFeedback'),
          feedbackThanks: t(locale, 'lasemGuruFeedbackThanks'),
          chipsHeading: t(locale, 'lasemGuruChips'),
          noCitations: t(locale, 'lasemGuruNoCitations'),
          useful: t(locale, 'lasemGuruUseful'),
          incorrect: t(locale, 'lasemGuruIncorrect'),
          incomplete: t(locale, 'lasemGuruIncomplete'),
          culturallyInappropriate: t(locale, 'lasemGuruCultural'),
          permissionConcern: t(locale, 'lasemGuruPermission'),
        }}
      />
    </section>
  );
}
