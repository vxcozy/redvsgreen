import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Red vs Green Streaks by Cozy';
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
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 900, color: '#ff3b5c' }}>
            RED
          </span>
          <span style={{ fontSize: 48, fontWeight: 300, color: '#4a5568' }}>
            vs
          </span>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#00ff87' }}>
            GREEN
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
          Streaks by Cozy
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
          BTC & ETH streak analytics with technical indicators and cycle analysis
        </div>
      </div>
    ),
    { ...size }
  );
}
