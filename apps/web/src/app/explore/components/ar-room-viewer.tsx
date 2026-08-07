'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useMemo, useState } from 'react';
import * as THREE from 'three';
import { paletteFromSeed } from './motif-visual';

function BatikMaterial({ seed, colors }: { seed: string; colors: string[] }) {
  const texture = useMemo(() => {
    const palette = paletteFromSeed(seed, colors);
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = palette[0] ?? '#1e3a5f';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 24; i += 1) {
      ctx.strokeStyle = palette[(i % (palette.length - 1)) + 1] ?? '#c4a35a';
      ctx.lineWidth = 2 + (i % 3);
      ctx.beginPath();
      const y = (i * 14) % size;
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 16) {
        ctx.lineTo(x, y + Math.sin((x + i) * 0.08) * 10);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [seed, colors]);

  if (!texture) return <meshStandardMaterial color="#8b4513" />;
  return <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />;
}

function Room({ seed, colors, mode }: { seed: string; colors: string[]; mode: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#d9cfc0" />
      </mesh>
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <planeGeometry args={[12, 5]} />
        <meshStandardMaterial color="#ece4d6" />
      </mesh>
      <mesh position={[-0.2, 0.55, 0.4]} castShadow>
        <boxGeometry args={[2.6, 0.7, 1.1]} />
        {mode === 'sofa' || mode === 'room' ? (
          <BatikMaterial seed={seed} colors={colors} />
        ) : (
          <meshStandardMaterial color="#6b4f3a" />
        )}
      </mesh>
      <mesh position={[-0.2, 1.05, -0.05]} castShadow>
        <boxGeometry args={[2.6, 0.45, 0.25]} />
        {mode === 'sofa' || mode === 'room' ? (
          <BatikMaterial seed={seed} colors={colors} />
        ) : (
          <meshStandardMaterial color="#5a4030" />
        )}
      </mesh>
      <mesh position={[1.6, 0.35, 1.4]} castShadow>
        <cylinderGeometry args={[0.45, 0.5, 0.7, 24]} />
        <meshStandardMaterial color="#7a5c3e" />
      </mesh>
      <mesh position={[1.6, 0.72, 1.4]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 24]} />
        {mode === 'table' || mode === 'room' ? (
          <BatikMaterial seed={seed} colors={colors} />
        ) : (
          <meshStandardMaterial color="#a67c52" />
        )}
      </mesh>
      {(mode === 'floor' || mode === 'room') && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[4, 3]} />
          <BatikMaterial seed={seed} colors={colors} />
        </mesh>
      )}
    </group>
  );
}

export function ArRoomViewer({
  seed,
  colors,
  title,
  labels,
}: {
  seed: string;
  colors: string[];
  title: string;
  labels: { loading: string; room: string; sofa: string; floor: string; table: string };
}) {
  const [mode, setMode] = useState<'room' | 'sofa' | 'floor' | 'table'>('room');

  return (
    <div className="me-ar">
      <div className="me-ar__tabs" role="tablist" aria-label="AR view mode">
        {(
          [
            ['room', labels.room],
            ['sofa', labels.sofa],
            ['floor', labels.floor],
            ['table', labels.table],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            className={mode === id ? 'is-active' : undefined}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="me-ar__canvas" aria-label={`3D preview for ${title}`}>
        <Canvas shadows camera={{ position: [3.2, 2.4, 4.2], fov: 45 }}>
          <color attach="background" args={['#e8e2d6']} />
          <ambientLight intensity={0.55} />
          <directionalLight castShadow position={[4, 6, 2]} intensity={1.1} />
          <Suspense fallback={null}>
            <Room seed={seed} colors={colors} mode={mode} />
          </Suspense>
          <hemisphereLight args={['#f7f3ec', '#8b7355', 0.45]} />
          <OrbitControls enablePan makeDefault />
        </Canvas>
        <p className="me-ar__loading me-muted">{labels.loading}</p>
      </div>
    </div>
  );
}
