import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as Mux from "@mux/mux-node";
const { JWT } = Mux;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/check-env", (req, res) => {
    res.json({
      hasMuxTokenId: !!process.env.MUX_TOKEN_ID,
      hasMuxTokenSecret: !!process.env.MUX_TOKEN_SECRET,
      hasMuxSigningKeyId: !!process.env.MUX_SIGNING_KEY_ID,
      hasMuxSigningKeyPrivate: !!process.env.MUX_SIGNING_KEY_PRIVATE,
      muxSigningKeyId: process.env.MUX_SIGNING_KEY_ID ? process.env.MUX_SIGNING_KEY_ID.substring(0, 5) + '...' : null,
    });
  });

  // Mux Signed URL endpoint
  app.get("/api/mux/sign/:playbackId", async (req, res) => {
    const { playbackId } = req.params;
    
    // Check if we have Mux Signing Keys
    const keyId = process.env.MUX_SIGNING_KEY_ID;
    const keySecret = process.env.MUX_SIGNING_KEY_PRIVATE;

    if (keyId && keySecret) {
      console.log("Mux namespace:", Mux);
      try {
        const token = Mux.JWT.signPlaybackId(playbackId, {
          keyId: keyId,
          keySecret: keySecret,
          type: 'video',
          expiration: '1h',
        });
        res.json({ token, signed: true });
      } catch (error: any) {
        console.error("Error signing Mux URL:", error);
        res.status(500).json({ error: "Failed to sign playback ID", details: error.message });
      }
    } else {
      // Fallback to standard playback if signing keys are not yet configured
      res.json({ token: playbackId, signed: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
