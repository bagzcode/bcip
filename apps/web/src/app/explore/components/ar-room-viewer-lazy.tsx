'use client';

import dynamic from 'next/dynamic';

const ArRoomViewer = dynamic(
  () => import('./ar-room-viewer').then((m) => m.ArRoomViewer),
  {
    ssr: false,
    loading: () => <p className="me-muted">…</p>,
  },
);

type Props = {
  seed: string;
  colors: string[];
  title: string;
  labels: {
    loading: string;
    room: string;
    sofa: string;
    floor: string;
    table: string;
  };
};

export function ArRoomViewerLazy(props: Props) {
  return <ArRoomViewer {...props} />;
}
