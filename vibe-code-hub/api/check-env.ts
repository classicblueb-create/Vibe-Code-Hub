import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    hasMuxTokenId: !!process.env.MUX_TOKEN_ID,
    hasMuxTokenSecret: !!process.env.MUX_TOKEN_SECRET,
    hasMuxSigningKeyId: !!process.env.MUX_SIGNING_KEY_ID,
    hasMuxSigningKeyPrivate: !!process.env.MUX_SIGNING_KEY_PRIVATE,
    muxSigningKeyId: process.env.MUX_SIGNING_KEY_ID
      ? process.env.MUX_SIGNING_KEY_ID.substring(0, 5) + '...'
      : null,
  });
}
