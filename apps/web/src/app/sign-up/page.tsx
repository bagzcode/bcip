import { getLocale } from '@/i18n/get-locale';
import { SignUpForm } from '@/components/sign-up-form';

export default async function SignUpPage() {
  const locale = await getLocale();
  return <SignUpForm locale={locale} />;
}
