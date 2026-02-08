'use client';

import { useState } from 'react';
import { useAavePositions } from '@/hooks/useAavePositions';
import SectionHeader from '@/components/ui/SectionHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { AavePosition } from '@/app/api/aave/positions/route';

const RISK_COLORS: Record<AavePosition['riskLevel'], string> = {
  safe: '#00ff87',
  moderate: '#eab308',
  warning: '#f97316',
  critical: '#ff3b5c',
};

const RISK_LABELS: Record<AavePosition['riskLevel'], string> = {
  safe: 'Safe',
  moderate: 'Moderate',
  warning: 'Warning',
  critical: 'Critical',
};

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatUSD(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export default function AaveLiquidationMonitor() {
  const {
    positions,
    loading,
    error,
    blockNumber,
    addCustomAddress,
    removeCustomAddress,
    customAddresses,
  } = useAavePositions();

  const [inputAddress, setInputAddress] = useState('');
  const [inputError, setInputError] = useState('');

  const handleAddAddress = () => {
    const addr = inputAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setInputError('Invalid Ethereum address');
      return;
    }
    setInputError('');
    addCustomAddress(addr);
    setInputAddress('');
  };

  if (loading) {
    return (
      <div className="chart-container flex h-full flex-col rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
        <SectionHeader title="Aave V3 Liquidation Monitor" />
        <LoadingSpinner className="py-16" />
      </div>
    );
  }

  return (
    <div className="chart-container flex h-full flex-col rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <SectionHeader title="Aave V3 Liquidation Monitor">
        <span className="text-[7px] text-text-muted/60 sm:text-[8px]">
          Block #{blockNumber.toLocaleString()} &middot; {positions.length} positions
        </span>
      </SectionHeader>

      {/* Custom address input */}
      <div className="mb-2 flex gap-1.5 px-1">
        <input
          type="text"
          value={inputAddress}
          onChange={(e) => {
            setInputAddress(e.target.value);
            setInputError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleAddAddress()}
          placeholder="Watch address (0x...)"
          className="flex-1 rounded border border-border-default bg-bg-secondary px-2 py-1 font-mono text-[9px] text-text-primary placeholder:text-text-muted/40 focus:border-accent/50 focus:outline-none sm:text-[10px]"
        />
        <button
          onClick={handleAddAddress}
          className="rounded border border-border-default bg-bg-tertiary px-2 py-1 text-[9px] font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-accent sm:text-[10px]"
        >
          Watch
        </button>
      </div>
      {inputError && (
        <p className="mb-1 px-1 text-[8px] text-[#ff3b5c] sm:text-[9px]">{inputError}</p>
      )}
      {error && !inputError && (
        <p className="mb-1 px-1 text-[8px] text-[#f97316] sm:text-[9px]">{error}</p>
      )}

      {/* Positions table */}
      <div className="flex-1 space-y-0.5 overflow-y-auto px-1 sm:space-y-1">
        {/* Header row */}
        <div className="flex items-center gap-2 border-b border-border-default pb-1 text-[7px] uppercase tracking-[0.1em] text-text-muted/60 sm:text-[8px]">
          <span className="w-20 sm:w-24">Address</span>
          <span className="w-12 text-right sm:w-14">Health</span>
          <span className="hidden w-16 text-right sm:inline-block">Collateral</span>
          <span className="w-14 text-right sm:w-16">Debt</span>
          <span className="ml-auto w-14 text-right sm:w-16">Risk</span>
        </div>

        {positions.map((pos) => {
          const isCustom = customAddresses.includes(pos.address.toLowerCase());
          const riskColor = RISK_COLORS[pos.riskLevel];

          return (
            <div
              key={pos.address}
              className="flex items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-bg-hover sm:py-1.5"
              style={{ borderLeft: `2px solid ${riskColor}33` }}
            >
              {/* Address + label */}
              <div className="w-20 sm:w-24">
                <a
                  href={`https://etherscan.io/address/${pos.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] text-text-secondary transition-colors hover:text-accent sm:text-[10px]"
                  title={pos.address}
                >
                  {truncateAddress(pos.address)}
                </a>
                <div className="flex items-center gap-1">
                  <span className="text-[7px] text-text-muted/60 sm:text-[8px]">
                    {pos.label}
                  </span>
                  {isCustom && (
                    <button
                      onClick={() => removeCustomAddress(pos.address)}
                      className="text-[8px] text-text-muted/40 transition-colors hover:text-[#ff3b5c]"
                      title="Remove from watchlist"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Health Factor */}
              <span
                className="w-12 text-right font-mono text-[10px] font-bold sm:w-14 sm:text-xs"
                style={{ color: riskColor }}
              >
                {pos.healthFactor >= 10 ? '>10' : pos.healthFactor.toFixed(2)}
              </span>

              {/* Collateral (hidden on mobile) */}
              <span className="hidden w-16 text-right font-mono text-[9px] text-text-secondary sm:inline-block sm:text-[10px]">
                {formatUSD(pos.totalCollateralUSD)}
              </span>

              {/* Debt */}
              <span className="w-14 text-right font-mono text-[9px] text-text-secondary sm:w-16 sm:text-[10px]">
                {formatUSD(pos.totalDebtUSD)}
              </span>

              {/* Risk badge */}
              <span
                className="ml-auto w-14 text-right text-[7px] font-semibold uppercase tracking-wide sm:w-16 sm:text-[8px]"
                style={{ color: riskColor }}
              >
                {RISK_LABELS[pos.riskLevel]}
              </span>
            </div>
          );
        })}

        {positions.length === 0 && (
          <div className="py-8 text-center text-[10px] text-text-muted/60 sm:text-[11px]">
            No positions with active debt found
          </div>
        )}
      </div>
    </div>
  );
}
