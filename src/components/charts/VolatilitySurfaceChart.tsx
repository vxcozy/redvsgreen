'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { VolSurfaceData } from '@/app/api/volatility-surface/route';
import { useVolatilitySurface } from '@/hooks/useVolatilitySurface';
import SectionHeader from '@/components/ui/SectionHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// ─── Colour helpers ──────────────────────────────────────────
function ivToColor(iv: number, minIV: number, maxIV: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (iv - minIV) / (maxIV - minIV || 1)));
  if (t < 0.25) return new THREE.Color().setHSL(0.6 - t * 0.8, 0.9, 0.45);
  if (t < 0.5) return new THREE.Color().setHSL(0.4 - (t - 0.25) * 1.2, 0.9, 0.5);
  if (t < 0.75) return new THREE.Color().setHSL(0.15 - (t - 0.5) * 0.4, 0.9, 0.5);
  return new THREE.Color().setHSL(0.0, 0.9, 0.35 + (1 - t) * 0.2);
}

// ─── Surface mesh ───────────────────────────────────────────
interface SurfaceMeshProps {
  data: VolSurfaceData;
  onHover: (info: { moneyness: number; dte: number; iv: number } | null) => void;
}

function SurfaceMesh({ data, onHover }: SurfaceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, minIV, maxIV } = useMemo(() => {
    const pts = data.points;
    if (pts.length < 4) return { geometry: null, minIV: 0, maxIV: 100 };

    const moneySet = [...new Set(pts.map((p) => Math.round(p.moneyness * 100) / 100))].sort(
      (a, b) => a - b,
    );
    const dteSet = [...new Set(pts.map((p) => p.daysToExpiry))].sort((a, b) => a - b);

    if (moneySet.length < 2 || dteSet.length < 2)
      return { geometry: null, minIV: 0, maxIV: 100 };

    const lookup = new Map<string, number>();
    for (const p of pts) {
      const mk = Math.round(p.moneyness * 100) / 100;
      const key = `${mk}:${p.daysToExpiry}`;
      const existing = lookup.get(key);
      if (!existing || p.iv > existing) lookup.set(key, p.iv);
    }

    let minIV = Infinity;
    let maxIV = -Infinity;
    for (const iv of lookup.values()) {
      if (iv < minIV) minIV = iv;
      if (iv > maxIV) maxIV = iv;
    }

    const width = moneySet.length;
    const depth = dteSet.length;
    const geo = new THREE.PlaneGeometry(6, 6, width - 1, depth - 1);
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(posAttr.count * 3);

    for (let zi = 0; zi < depth; zi++) {
      for (let xi = 0; xi < width; xi++) {
        const idx = zi * width + xi;
        const key = `${moneySet[xi]}:${dteSet[zi]}`;
        const iv = lookup.get(key);

        const xPos = -3 + (xi / (width - 1)) * 6;
        const zPos = -3 + (zi / (depth - 1)) * 6;
        let yPos = 0;
        let color = new THREE.Color(0x333333);

        if (iv != null) {
          yPos = ((iv - minIV) / (maxIV - minIV || 1)) * 3;
          color = ivToColor(iv, minIV, maxIV);
        } else {
          yPos = 0.5;
        }

        posAttr.setXYZ(idx, xPos, yPos, zPos);
        colors[idx * 3] = color.r;
        colors[idx * 3 + 1] = color.g;
        colors[idx * 3 + 2] = color.b;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return { geometry: geo, minIV, maxIV };
  }, [data]);

  // Slow auto-rotation for visual interest
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.05;
    }
  });

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!meshRef.current || !geometry) return;
      e.stopPropagation();

      const point = e.point;
      const moneySet = [...new Set(data.points.map((p) => Math.round(p.moneyness * 100) / 100))].sort(
        (a, b) => a - b,
      );
      const dteSet = [...new Set(data.points.map((p) => p.daysToExpiry))].sort(
        (a, b) => a - b,
      );

      const xt = (point.x + 3) / 6;
      const zt = (point.z + 3) / 6;
      const mi = Math.round(xt * (moneySet.length - 1));
      const di = Math.round(zt * (dteSet.length - 1));
      const moneyness = moneySet[Math.max(0, Math.min(mi, moneySet.length - 1))];
      const dte = dteSet[Math.max(0, Math.min(di, dteSet.length - 1))];
      const iv = minIV + (point.y / 3) * (maxIV - minIV);

      onHover({ moneyness, dte, iv: Math.round(iv * 10) / 10 });
    },
    [data, geometry, minIV, maxIV, onHover],
  );

  if (!geometry) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerMove={handlePointerMove}
      onPointerOut={() => onHover(null)}
    >
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

// ─── Fallback test cube (to verify Canvas is working) ─────
function TestCube() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta;
  });
  return (
    <mesh ref={ref} position={[0, 1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#8b5cf6" />
    </mesh>
  );
}

// ─── Scene content (separated for error isolation) ──────────
function SceneContent({ data, onHover }: SurfaceMeshProps) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />

      <SurfaceMesh data={data} onHover={onHover} />
      <gridHelper args={[6, 12, '#1a1f2e', '#141820']} position={[0, -0.01, 0]} />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.3}
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.2}
        minDistance={4}
        maxDistance={15}
      />
    </>
  );
}

// ─── Main component ─────────────────────────────────────────
interface Props {
  currency: string;
}

export default function VolatilitySurfaceChart({ currency }: Props) {
  const { data, loading, error } = useVolatilitySurface(currency);
  const [hoverInfo, setHoverInfo] = useState<{
    moneyness: number;
    dte: number;
    iv: number;
  } | null>(null);
  const [sceneError, setSceneError] = useState(false);

  if (loading) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-4">
        <SectionHeader title={`${currency} Volatility Surface`} />
        <LoadingSpinner className="py-16" />
      </div>
    );
  }

  if (error || !data || data.points.length < 4) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-4">
        <SectionHeader title={`${currency} Volatility Surface`} />
        <div className="flex items-center justify-center py-12 text-[10px] text-text-muted sm:text-xs">
          {error ? `Error: ${error}` : 'Not enough options data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <SectionHeader title={`${currency} Implied Volatility Surface`}>
        <span className="text-[7px] text-text-muted/60 sm:text-[8px]">
          Spot: ${data.spotPrice.toLocaleString()} · {data.points.length} options
        </span>
      </SectionHeader>

      <div className="relative h-[280px] sm:h-[380px]">
        <Canvas
          camera={{ position: [7, 5, 7], fov: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
          style={{ background: '#0e1119' }}
          onCreated={(state) => {
            // Force an initial render
            state.gl.render(state.scene, state.camera);
          }}
          fallback={
            <div className="flex h-full items-center justify-center text-[10px] text-text-muted">
              WebGL not supported in this browser
            </div>
          }
        >
          {sceneError ? (
            <TestCube />
          ) : (
            <SceneContent data={data} onHover={setHoverInfo} />
          )}
        </Canvas>

        {/* HTML axis labels */}
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[8px] text-text-muted/50 sm:text-[9px]">
          ← OTM Put — Moneyness — OTM Call →
        </div>
        <div className="pointer-events-none absolute bottom-1/2 left-1 origin-center -rotate-90 font-mono text-[8px] text-text-muted/50 sm:text-[9px]">
          Days to Expiry →
        </div>
        <div className="pointer-events-none absolute left-2 top-10 font-mono text-[8px] text-text-muted/50 sm:text-[9px]">
          IV %
        </div>

        {/* Hover tooltip */}
        {hoverInfo && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border-default bg-bg-tertiary/90 px-3 py-2 font-mono text-[10px] text-text-primary backdrop-blur-sm sm:text-xs">
            <div>
              <span className="text-text-muted">Moneyness:</span>{' '}
              {(hoverInfo.moneyness * 100).toFixed(0)}%
            </div>
            <div>
              <span className="text-text-muted">DTE:</span> {hoverInfo.dte}d
            </div>
            <div>
              <span className="text-text-muted">IV:</span>{' '}
              <span className="text-accent">{hoverInfo.iv}%</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2.5 rounded border border-border-default/50 bg-bg-tertiary/80 px-2.5 py-1 font-mono text-[8px] text-text-muted backdrop-blur-sm sm:gap-3 sm:px-3 sm:text-[9px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: '#1a6baa' }} />
            Low IV
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: '#55a630' }} />
            Mid
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: '#c1121f' }} />
            High IV
          </span>
        </div>
      </div>
    </div>
  );
}
