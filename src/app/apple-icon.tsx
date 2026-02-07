import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#06080d',
          borderRadius: '36px',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: '#ff3b5c',
            lineHeight: 1,
          }}
        >
          R
        </span>
        <span
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: '#00ff87',
            lineHeight: 1,
          }}
        >
          G
        </span>
      </div>
    ),
    { ...size }
  );
}
