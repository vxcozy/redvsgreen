'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AavePositionsResponse, AavePosition } from '@/app/api/aave/positions/route';

const REFRESH_INTERVAL = 30_000;

export function useAavePositions() {
  const [whalePositions, setWhalePositions] = useState<AavePosition[]>([]);
  const [customPositions, setCustomPositions] = useState<AavePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customAddresses, setCustomAddresses] = useState<string[]>([]);
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWhales = useCallback(async () => {
    try {
      const res = await fetch('/api/aave/positions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AavePositionsResponse = await res.json();
      setWhalePositions(json.positions);
      setBlockNumber(json.blockNumber);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomAddress = useCallback(
    async (address: string) => {
      if (customAddresses.includes(address.toLowerCase())) return;

      try {
        const res = await fetch(`/api/aave/positions?address=${address}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: AavePositionsResponse = await res.json();
        if (json.positions.length > 0) {
          setCustomPositions((prev) => [...prev, ...json.positions]);
          setCustomAddresses((prev) => [...prev, address.toLowerCase()]);
        } else {
          setError('No active Aave position found for this address');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Invalid address or no position');
      }
    },
    [customAddresses],
  );

  const removeCustomAddress = useCallback((address: string) => {
    const lower = address.toLowerCase();
    setCustomAddresses((prev) => prev.filter((a) => a !== lower));
    setCustomPositions((prev) => prev.filter((p) => p.address.toLowerCase() !== lower));
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchWhales();
    intervalRef.current = setInterval(fetchWhales, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchWhales]);

  // Merge and sort all positions
  const allPositions = [...whalePositions, ...customPositions].sort(
    (a, b) => a.healthFactor - b.healthFactor,
  );

  return {
    positions: allPositions,
    loading,
    error,
    blockNumber,
    addCustomAddress,
    removeCustomAddress,
    customAddresses,
    refresh: fetchWhales,
  };
}
