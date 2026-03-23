import type { VercelRequest, VercelResponse } from '@vercel/node';
import Mux from '@mux/mux-node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { playbackId } = req.query;

  if (!playbackId || typeof playbackId !== 'string') {
    return res.status(400).json({ error: 'Missing playbackId' });
  }

  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_KEY_PRIVATE;

  if (keyId && keySecret) {
    try {
      const mux = new Mux({
        tokenId: process.env.MUX_TOKEN_ID,
        tokenSecret: process.env.MUX_TOKEN_SECRET,
        jwtSigningKey: keyId,
        jwtPrivateKey: keySecret,
      });

      const token = await mux.jwt.signPlaybackId(playbackId, {
        type: 'video',
        expiration: '1h',
      });

      return res.json({ token, signed: true });
    } catch (error: any) {
      console.error('Error signing Mux URL:', error);
      return res.status(500).json({ error: 'Failed to sign playback ID', details: error.message });
    }
  } else {
    return res.json({ token: playbackId, signed: false });
  }
}
