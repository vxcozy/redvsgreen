import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, fallback, formatUnits, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';

// ─── Types ───────────────────────────────────────────────────
export interface AavePosition {
  address: string;
  label: string;
  healthFactor: number;
  totalCollateralUSD: number;
  totalDebtUSD: number;
  availableBorrowsUSD: number;
  ltv: number;
  liquidationThreshold: number;
  riskLevel: 'safe' | 'moderate' | 'warning' | 'critical';
}

export interface AavePositionsResponse {
  positions: AavePosition[];
  timestamp: number;
  blockNumber: number;
}

// ─── Aave V3 Pool on Ethereum mainnet ────────────────────────
const POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as const;

const POOL_ABI = parseAbi([
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
]);

// ─── Known large Aave V3 positions (publicly visible on-chain) ───
const WHALE_ADDRESSES: { address: `0x${string}`; label: string }[] = [
  { address: '0xfaf1358fe6a9fa29a169dfc272b14e709f54840f', label: 'Trend Research' },
  { address: '0xE5C248D8d3F3871bD0f68E9C4743459C43BB4e4c', label: 'ETH Mega Whale' },
  { address: '0x85e05C10dB73499fbDeCAb0dfbB794a446feEeC8', label: 'ETH Whale #2' },
  { address: '0x6e9e81EfCC4CBff68eD04c4a90AeA33cB22c8c89', label: 'ETH Whale #3' },
  { address: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', label: '0x Protocol' },
  { address: '0x8103683202aa8DA10536036EDef04CDd865C225E', label: 'Whale #5' },
  { address: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e', label: 'aWETH Whale' },
  { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Binance 14' },
];

// ─── RPC client with fallback ────────────────────────────────
const client = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http(process.env.ETH_RPC_URL || 'https://1rpc.io/eth', {
      retryCount: 2,
      timeout: 15_000,
    }),
    http('https://eth.llamarpc.com', {
      retryCount: 2,
      timeout: 15_000,
    }),
    http('https://rpc.ankr.com/eth', {
      retryCount: 1,
      timeout: 15_000,
    }),
  ]),
});

// ─── Helpers ─────────────────────────────────────────────────
function classifyRisk(healthFactor: number): AavePosition['riskLevel'] {
  if (healthFactor >= 2.0) return 'safe';
  if (healthFactor >= 1.5) return 'moderate';
  if (healthFactor >= 1.1) return 'warning';
  return 'critical';
}

// ─── In-memory cache ─────────────────────────────────────────
let cache: { data: AavePositionsResponse; expiry: number } | null = null;
const CACHE_TTL = 30_000;

async function fetchPositions(
  addresses: { address: `0x${string}`; label: string }[],
): Promise<{ positions: AavePosition[]; blockNumber: number }> {
  const results = await client.multicall({
    contracts: addresses.map(({ address }) => ({
      address: POOL_ADDRESS,
      abi: POOL_ABI,
      functionName: 'getUserAccountData',
      args: [address],
    })),
    allowFailure: true,
  });

  const blockNumber = Number(await client.getBlockNumber());

  const positions: AavePosition[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const result = results[i];
    const { address, label } = addresses[i];

    if (result.status === 'failure') continue;

    const [
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      currentLiquidationThreshold,
      ltvRaw,
      healthFactorRaw,
    ] = result.result;

    const collateral = parseFloat(formatUnits(totalCollateralBase, 8));
    const debt = parseFloat(formatUnits(totalDebtBase, 8));
    const available = parseFloat(formatUnits(availableBorrowsBase, 8));
    const hf = parseFloat(formatUnits(healthFactorRaw, 18));

    // Skip positions with no active debt
    if (debt < 100) continue;

    positions.push({
      address,
      label,
      healthFactor: Math.min(hf, 99.99),
      totalCollateralUSD: collateral,
      totalDebtUSD: debt,
      availableBorrowsUSD: available,
      ltv: Number(ltvRaw) / 10000,
      liquidationThreshold: Number(currentLiquidationThreshold) / 10000,
      riskLevel: classifyRisk(hf),
    });
  }

  // Sort by health factor ascending (most at-risk first)
  positions.sort((a, b) => a.healthFactor - b.healthFactor);

  return { positions, blockNumber };
}

// ─── Route handler ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const customAddress = req.nextUrl.searchParams.get('address');

  try {
    // Custom address lookup (not cached)
    if (customAddress) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(customAddress)) {
        return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
      }

      const { positions, blockNumber } = await fetchPositions([
        { address: customAddress as `0x${string}`, label: 'Custom' },
      ]);

      return NextResponse.json({
        positions,
        timestamp: Date.now(),
        blockNumber,
      } satisfies AavePositionsResponse);
    }

    // Check cache for whale positions
    if (cache && Date.now() < cache.expiry) {
      return NextResponse.json(cache.data, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
      });
    }

    const { positions, blockNumber } = await fetchPositions(WHALE_ADDRESSES);

    const response: AavePositionsResponse = {
      positions,
      timestamp: Date.now(),
      blockNumber,
    };

    cache = { data: response, expiry: Date.now() + CACHE_TTL };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('Aave positions error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch Aave positions' },
      { status: 500 },
    );
  }
}
