'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SectionHeader from '@/components/ui/SectionHeader';

const VolatilitySurfaceChart = dynamic(
  () => import('./VolatilitySurfaceChart'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-4">
        <SectionHeader title="Volatility Surface" />
        <LoadingSpinner className="py-16" />
      </div>
    ),
  },
);

interface Props {
  currency: string;
}

export default function LazyVolatilitySurface({ currency }: Props) {
  return <VolatilitySurfaceChart currency={currency} />;
}
