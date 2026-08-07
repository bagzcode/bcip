'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DesignDocument, DesignLayer } from '@bcip/contracts';
import { Button } from '@bcip/ui';
import type { GarmentTemplateSummary } from '@/lib/dress-weaver';
import { motifFill } from './motif-swatch';

type PlaceableMotif = {
  id: string;
  publicCode: string;
  title: string;
  summary: string;
  isDemoFictional?: boolean;
};

type DesignCanvasProps = {
  template: GarmentTemplateSummary;
  initialDesign: DesignDocument;
  motifs: PlaceableMotif[];
  onDesignChange: (design: DesignDocument) => void;
};

type KonvaModule = typeof import('react-konva');

const STAGE_SCALE = 0.72;

export function DesignCanvas({
  template,
  initialDesign,
  motifs,
  onDesignChange,
}: DesignCanvasProps) {
  const [Konva, setKonva] = useState<KonvaModule | null>(null);
  const [design, setDesign] = useState<DesignDocument>(initialDesign);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDesign.layers[0]?.id ?? null,
  );
  const [regionKey, setRegionKey] = useState(
    template.regions[0]?.regionKey ?? 'body',
  );
  const stageRef = useRef<{ toDataURL?: (config?: object) => string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('react-konva').then((mod) => {
      if (!cancelled) setKonva(mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDesign(initialDesign);
    setSelectedId(initialDesign.layers[0]?.id ?? null);
  }, [initialDesign]);

  const selected = useMemo(
    () => design.layers.find((l) => l.id === selectedId) ?? null,
    [design.layers, selectedId],
  );

  function commit(next: DesignDocument) {
    setDesign(next);
    onDesignChange(next);
  }

  function updateLayer(layerId: string, patch: Partial<DesignLayer>) {
    commit({
      ...design,
      layers: design.layers.map((l) => (l.id === layerId ? { ...l, ...patch } : l)),
    });
  }

  function placeMotif(motif: PlaceableMotif) {
    const id = `layer-${crypto.randomUUID().slice(0, 8)}`;
    const region = template.regions.find((r) => r.regionKey === regionKey);
    const cx = region
      ? region.clipPolygon.reduce((s, p) => s + p.x, 0) / region.clipPolygon.length
      : template.canvasWidth / 2;
    const cy = region
      ? region.clipPolygon.reduce((s, p) => s + p.y, 0) / region.clipPolygon.length
      : template.canvasHeight / 2;

    const layer: DesignLayer = {
      id,
      kind: 'motif',
      motifPublicCode: motif.publicCode,
      motifId: motif.id,
      regionKey,
      transform: {
        x: cx - 48,
        y: cy - 48,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 0.85,
      },
      zIndex: design.layers.length + 1,
      repeat: { enabled: false, gapX: 48, gapY: 48 },
    };
    commit({ ...design, layers: [...design.layers, layer] });
    setSelectedId(id);
  }

  function removeSelected() {
    if (!selectedId) return;
    commit({
      ...design,
      layers: design.layers.filter((l) => l.id !== selectedId),
    });
    setSelectedId(null);
  }

  const clipForRegion = (key: string) => {
    const region = template.regions.find((r) => r.regionKey === key);
    if (!region?.clipPolygon.length) return undefined;
    return (ctx: CanvasRenderingContext2D) => {
      const pts = region.clipPolygon;
      ctx.beginPath();
      ctx.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i]!.x, pts[i]!.y);
      }
      ctx.closePath();
    };
  };

  if (!Konva) {
    return (
      <div className="dw-canvas-loading" role="status">
        Loading 2D workspace…
      </div>
    );
  }

  const { Stage, Layer, Rect, Line, Group, Text, Circle } = Konva;
  const width = template.canvasWidth * STAGE_SCALE;
  const height = template.canvasHeight * STAGE_SCALE;

  return (
    <div className="dw-workspace">
      <aside className="dw-sidebar">
        <h2>Motifs</h2>
        <p className="dw-muted">Public demo catalogue only. Original assets are never edited.</p>
        <label className="dw-field">
          <span>Place into region</span>
          <select value={regionKey} onChange={(e) => setRegionKey(e.target.value)}>
            {template.regions.map((r) => (
              <option key={r.regionKey} value={r.regionKey}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <ul className="dw-motif-picker">
          {motifs.map((m) => (
            <li key={m.publicCode}>
              <button type="button" onClick={() => placeMotif(m)}>
                <strong>{m.title}</strong>
                <span>{m.publicCode}</span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="dw-inspector">
            <h3>Selected layer</h3>
            <p>
              {selected.motifPublicCode} · {selected.regionKey}
            </p>
            <label className="dw-field">
              <span>Scale {selected.transform.scaleX.toFixed(2)}</span>
              <input
                type="range"
                min={0.35}
                max={2.5}
                step={0.05}
                value={selected.transform.scaleX}
                onChange={(e) => {
                  const scale = Number(e.target.value);
                  updateLayer(selected.id, {
                    transform: {
                      ...selected.transform,
                      scaleX: scale,
                      scaleY: scale,
                    },
                  });
                }}
              />
            </label>
            <label className="dw-field">
              <span>Rotate {selected.transform.rotation.toFixed(0)}°</span>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={selected.transform.rotation}
                onChange={(e) =>
                  updateLayer(selected.id, {
                    transform: {
                      ...selected.transform,
                      rotation: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label className="dw-field">
              <span>Opacity {selected.transform.opacity.toFixed(2)}</span>
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={selected.transform.opacity}
                onChange={(e) =>
                  updateLayer(selected.id, {
                    transform: {
                      ...selected.transform,
                      opacity: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label className="dw-check">
              <input
                type="checkbox"
                checked={Boolean(selected.repeat?.enabled)}
                onChange={(e) =>
                  updateLayer(selected.id, {
                    repeat: {
                      enabled: e.target.checked,
                      gapX: selected.repeat?.gapX ?? 48,
                      gapY: selected.repeat?.gapY ?? 48,
                    },
                  })
                }
              />
              Repeat tile
            </label>
            <Button type="button" variant="ghost" onClick={removeSelected}>
              Remove layer
            </Button>
          </div>
        ) : null}
      </aside>

      <div className="dw-stage-wrap">
        <Stage
          width={width}
          height={height}
          scaleX={STAGE_SCALE}
          scaleY={STAGE_SCALE}
          ref={stageRef as never}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setSelectedId(null);
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={template.canvasWidth}
              height={template.canvasHeight}
              fill="#f3ebe0"
            />
            {template.regions.map((region) => {
              const flat = region.clipPolygon.flatMap((p) => [p.x, p.y]);
              return (
                <Line
                  key={region.regionKey}
                  points={flat}
                  closed
                  fill="rgba(255,255,255,0.55)"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                />
              );
            })}
            {template.silhouetteSvg ? (
              <Text
                x={24}
                y={24}
                text="DEMO / FICTIONAL garment flat"
                fontSize={16}
                fill="#8b4513"
                opacity={0.85}
              />
            ) : null}
          </Layer>

          {[...design.layers]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((layer) => {
              const style = motifFill(layer.motifPublicCode);
              const t = layer.transform;
              const tiles =
                layer.repeat?.enabled
                  ? [
                      [0, 0],
                      [layer.repeat.gapX, 0],
                      [0, layer.repeat.gapY],
                      [layer.repeat.gapX, layer.repeat.gapY],
                    ]
                  : [[0, 0]];
              return (
                <Group
                  key={layer.id}
                  x={t.x}
                  y={t.y}
                  scaleX={t.scaleX}
                  scaleY={t.scaleY}
                  rotation={t.rotation}
                  opacity={t.opacity}
                  draggable
                  clipFunc={clipForRegion(layer.regionKey)}
                  onClick={() => setSelectedId(layer.id)}
                  onTap={() => setSelectedId(layer.id)}
                  onDragEnd={(e) => {
                    updateLayer(layer.id, {
                      transform: {
                        ...t,
                        x: e.target.x(),
                        y: e.target.y(),
                      },
                    });
                  }}
                >
                  {tiles.map(([ox, oy], idx) => (
                    <Group key={`${layer.id}-${idx}`} x={ox} y={oy}>
                      <Rect
                        width={96}
                        height={96}
                        fill={style.fill}
                        stroke={selectedId === layer.id ? '#0f766e' : style.stroke}
                        strokeWidth={selectedId === layer.id ? 3 : 1.5}
                      />
                      {style.pattern === 'lattice' ? (
                        <>
                          <Line points={[0, 24, 96, 24]} stroke={style.stroke} strokeWidth={1} />
                          <Line points={[0, 48, 96, 48]} stroke={style.stroke} strokeWidth={1} />
                          <Line points={[0, 72, 96, 72]} stroke={style.stroke} strokeWidth={1} />
                          <Line points={[24, 0, 24, 96]} stroke={style.stroke} strokeWidth={1} />
                          <Line points={[48, 0, 48, 96]} stroke={style.stroke} strokeWidth={1} />
                          <Line points={[72, 0, 72, 96]} stroke={style.stroke} strokeWidth={1} />
                        </>
                      ) : null}
                      {style.pattern === 'wave' ? (
                        <Line
                          points={[8, 48, 28, 28, 48, 48, 68, 28, 88, 48]}
                          stroke={style.stroke}
                          strokeWidth={2}
                        />
                      ) : null}
                      {style.pattern === 'dots' ? (
                        <>
                          <Circle x={24} y={24} radius={4} fill={style.stroke} />
                          <Circle x={48} y={48} radius={4} fill={style.stroke} />
                          <Circle x={72} y={72} radius={4} fill={style.stroke} />
                        </>
                      ) : null}
                      <Text
                        x={6}
                        y={102}
                        width={120}
                        text={layer.motifPublicCode}
                        fontSize={11}
                        fill="#1c1917"
                      />
                    </Group>
                  ))}
                </Group>
              );
            })}
        </Stage>
        <p className="dw-hint">Drag layers to position. Scale / rotate from the inspector.</p>
      </div>
    </div>
  );
}
