import { cookies } from 'next/headers';
import type { Locale } from './messages';

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get('bcip_locale')?.value;
  return value === 'id' ? 'id' : 'en';
}
