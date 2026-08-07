import { getLocale } from '@/i18n/get-locale';
import { SignInForm } from '@/components/sign-in-form';

export default async function SignInPage() {
  const locale = await getLocale();
  return <SignInForm locale={locale} />;
}
