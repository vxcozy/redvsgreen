'use client';

import { Component, type ReactNode, useState, useEffect } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Error boundary to catch Three.js render crashes
class VolSurfaceErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-4">
          <SectionHeader title="Volatility Surface" />
          <div className="flex items-center justify-center py-12 text-[10px] text-red-streak sm:text-xs">
            3D rendering error: {this.state.error}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Props {
  currency: string;
}

// Manual lazy load with error catching (next/dynamic swallows import errors)
export default function LazyVolatilitySurface({ currency }: Props) {
  const [Chart, setChart] = useState<React.ComponentType<{ currency: string }> | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('./VolatilitySurfaceChart')
      .then((mod) => {
        if (!cancelled) setChart(() => mod.default);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[VolSurface] Dynamic import failed:', err);
          setImportError(err?.message || 'Failed to load 3D module');
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (importError) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-4">
        <SectionHeader title="Volatility Surface" />
        <div className="flex items-center justify-center py-12 text-[10px] text-red-streak sm:text-xs">
          Failed to load 3D module: {importError}
        </div>
      </div>
    );
  }

  if (!Chart) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-4">
        <SectionHeader title="Volatility Surface" />
        <LoadingSpinner className="py-16" />
      </div>
    );
  }

  return (
    <VolSurfaceErrorBoundary>
      <Chart currency={currency} />
    </VolSurfaceErrorBoundary>
  );
}
