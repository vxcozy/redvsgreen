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
          backgroundColor: '#000000',
          borderRadius: '6px',
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
        >
          <defs>
            <linearGradient id="g" x1="0" y1="26" x2="0" y2="0">
              <stop offset="0%" stopColor="#ff3b5c" />
              <stop offset="45%" stopColor="#ff3b5c" />
              <stop offset="55%" stopColor="#00ff87" />
              <stop offset="100%" stopColor="#00ff87" />
            </linearGradient>
          </defs>
          <path
            d="M2 22 L6 18 L10 20 L14 14 L18 10 L22 6 L24 4"
            stroke="url(#g)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
