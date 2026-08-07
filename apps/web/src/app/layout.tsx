import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { getLocale } from '@/i18n/get-locale';
import './globals.css';

export const metadata: Metadata = {
  title: 'BCIP — Batik Color Intelligence Platform',
  description:
    'Multimodal, culturally grounded batik design-intelligence ecosystem. Pilot domain: Batik Lasem.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <SiteHeader locale={locale} />
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
