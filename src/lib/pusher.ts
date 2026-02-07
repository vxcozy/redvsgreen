import Pusher from 'pusher';

// Server-side Pusher instance — never exposed to the client.
// Uses lazy initialization so the app doesn't crash if env vars are missing.

let _pusher: Pusher | null = null;

export function getPusher(): Pusher {
  if (!_pusher) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER;

    if (!appId || !key || !secret || !cluster) {
      throw new Error('Missing Pusher environment variables');
    }

    _pusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return _pusher;
}
