'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const LINKS = [
  { href: '/explore/motifs', key: 'motifs' as const },
  { href: '/explore/artisans', key: 'artisans' as const },
  { href: '/explore/linen', key: 'linen' as const },
  { href: '/explore/map', key: 'map' as const },
];

export function ExploreNav({
  brand,
  searchPlaceholder,
  labels,
}: {
  brand: string;
  searchPlaceholder: string;
  labels: Record<(typeof LINKS)[number]['key'], string>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`/explore/motifs?${params.toString()}`);
  }

  return (
    <header className="me-nav">
      <div className="me-nav__bar">
        <Link href="/explore" className="me-nav__brand">
          {brand}
        </Link>
        <form className="me-nav__search" onSubmit={onSearch} role="search">
          <label className="sr-only" htmlFor="me-search">
            {searchPlaceholder}
          </label>
          <input
            id="me-search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
          />
          <button type="submit">{labels.motifs}</button>
        </form>
        <nav className="me-nav__links" aria-label="Motif Explorer">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? 'me-nav__link me-nav__link--active' : 'me-nav__link'}
                aria-current={active ? 'page' : undefined}
              >
                {labels[link.key]}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
