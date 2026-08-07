'use client';

import Link from 'next/link';

export type MapMarker = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  href: string;
  kind?: 'motif' | 'artisan';
};

/** Lightweight SVG origin map (no Mapbox/Leaflet dependency). */
export function OriginMap({
  pins,
  focus,
}: {
  pins: MapMarker[];
  focus?: { lat: number; lng: number };
}) {
  // Rough Indonesia bounding box for demo pins (Java / north coast).
  const minLng = 105;
  const maxLng = 115;
  const minLat = -9;
  const maxLat = -5;

  function project(lat: number, lng: number) {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.min(98, Math.max(2, x)),
      y: Math.min(98, Math.max(2, y)),
    };
  }

  const focusPt = focus ? project(focus.lat, focus.lng) : null;

  return (
    <div className="me-map" role="img" aria-label="Origin map of demo motifs and artisans">
      <svg viewBox="0 0 100 60" className="me-map__svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="me-map-sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d7e6ef" />
            <stop offset="100%" stopColor="#b9cfdc" />
          </linearGradient>
        </defs>
        <rect width="100" height="60" fill="url(#me-map-sea)" />
        <path
          d="M8 28 C18 18, 35 16, 48 22 C58 26, 70 24, 82 28 C90 31, 94 38, 88 44 C78 52, 55 54, 38 48 C22 42, 12 40, 8 28 Z"
          fill="#e7dcc8"
          stroke="#8b7355"
          strokeWidth="0.4"
        />
        {focusPt ? (
          <circle cx={focusPt.x} cy={(focusPt.y / 100) * 60} r="3.2" fill="none" stroke="#0f766e" strokeWidth="0.6" />
        ) : null}
        {pins.map((pin) => {
          const pt = project(pin.lat, pin.lng);
          return (
            <g key={pin.id}>
              <circle
                cx={pt.x}
                cy={(pt.y / 100) * 60}
                r="1.8"
                fill={pin.kind === 'artisan' ? '#8b4513' : '#1e3a5f'}
                stroke="#f7f3ec"
                strokeWidth="0.4"
              />
            </g>
          );
        })}
      </svg>
      <ul className="me-map__list">
        {pins.map((pin) => (
          <li key={pin.id}>
            <Link href={pin.href}>
              <span className={pin.kind === 'artisan' ? 'me-map__dot me-map__dot--artisan' : 'me-map__dot'} />
              {pin.label}
            </Link>
            <span className="me-muted">
              {pin.lat.toFixed(3)}, {pin.lng.toFixed(3)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
