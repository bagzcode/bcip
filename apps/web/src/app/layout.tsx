import type { Metadata } from 'next';
import { brandIdentity } from '@/brand/identity';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getLocale } from '@/i18n/get-locale';
import './globals.css';
import './chrome.css';

export const metadata: Metadata = {
  title: brandIdentity.documentTitleEn,
  description: brandIdentity.descriptionEn,
  icons: {
    icon: brandIdentity.logoSrc,
    apple: brandIdentity.logoSrc,
  },
  openGraph: {
    title: brandIdentity.documentTitleEn,
    description: brandIdentity.descriptionEn,
    images: [{ url: brandIdentity.logoSrc, width: 1024, height: 588, alt: `${brandIdentity.acronym} — ${brandIdentity.displayNameEn}` }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <SiteHeader locale={locale} />
        <main className="shell">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
