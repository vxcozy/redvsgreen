import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CoziestTools — BTC & ETH Analytics';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#06080d',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0px',
            marginBottom: '24px',
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 900, color: '#e2e8f0' }}>
            COZIEST
          </span>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#00ff87' }}>
            .TOOLS
          </span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#7a8599',
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
          }}
        >
          BTC & ETH Analytics
        </div>
        <div
          style={{
            fontSize: 18,
            color: '#4a5568',
            marginTop: '32px',
            maxWidth: '600px',
            textAlign: 'center' as const,
          }}
        >
          Streak analysis, technical indicators, and cycle analytics
        </div>
      </div>
    ),
    { ...size }
  );
}
