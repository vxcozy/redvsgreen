import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '6px',
          gap: '1px',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#ff3b5c',
            lineHeight: 1,
          }}
        >
          R
        </span>
        <span
          style={{
            fontSize: 18,
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
