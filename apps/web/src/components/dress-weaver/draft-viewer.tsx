'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@bcip/ui';

type DraftViewerProps = {
  svg: string | null;
  loading?: boolean;
  notes?: string[];
  setName?: string;
  onExportSvg?: () => void;
};

/** FreeSewing-like pan/zoom SVG draft stage (wheel zoom, drag pan). */
export function DraftViewer({
  svg,
  loading,
  notes,
  setName,
  onExportSvg,
}: DraftViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(3, Math.max(0.25, s - e.deltaY * 0.0015)));
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.x),
      y: dragRef.current.panY + (e.clientY - dragRef.current.y),
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div className="dw-draft">
      <div className="dw-draft-toolbar">
        <span className="dw-muted">
          Draft {setName ? `· set “${setName}”` : ''} · zoom {(scale * 100).toFixed(0)}%
        </span>
        <div className="dw-actions">
          <Button type="button" variant="ghost" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>
            Zoom in
          </Button>
          <Button type="button" variant="ghost" onClick={() => setScale((s) => Math.max(0.25, s - 0.1))}>
            Zoom out
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setScale(0.85);
              setPan({ x: 24, y: 24 });
            }}
          >
            Reset view
          </Button>
          {onExportSvg ? (
            <Button type="button" variant="ghost" onClick={onExportSvg} disabled={!svg}>
              Download SVG
            </Button>
          ) : null}
        </div>
      </div>
      <div
        ref={viewportRef}
        className="dw-draft-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="img"
        aria-label="Pattern draft"
      >
        {loading ? <p className="dw-canvas-loading">Drafting pattern…</p> : null}
        {!loading && svg ? (
          <div
            className="dw-draft-surface"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            }}
            // FreeSewing SVG is trusted server output from MIT packages / our placeholder.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : null}
        {!loading && !svg ? (
          <p className="dw-muted">No draft yet — adjust measurements and open Draft view.</p>
        ) : null}
      </div>
      {notes?.length ? (
        <ul className="dw-draft-notes">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
      <p className="dw-hint">Scroll to zoom · drag to pan (FreeSewing-style draft stage).</p>
    </div>
  );
}
