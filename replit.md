# vibe-code-hub

## Project Overview
A modern web application for running and deploying AI Studio apps. Built with React 19, TypeScript, Firebase, and Google Gemini AI integration.

## Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

### Backend
- **Server**: Express (with Vite middleware in dev mode)
- **Runtime**: tsx (TypeScript execution)
- **Entry**: `vibe-code-hub/server.ts`

### External Services
- **Firebase**: Authentication + Firestore (config in `firebase-applet-config.json`)
- **Google Gemini AI**: `GEMINI_API_KEY` env var
- **Mux Video**: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_KEY_PRIVATE` env vars

## Project Structure
```
vibe-code-hub/
├── src/                    # Frontend source
│   ├── components/         # Reusable React components
│   ├── App.tsx             # Main app + routing
│   ├── AuthContext.tsx     # Firebase auth provider
│   ├── Dashboard.tsx       # Main authenticated view
│   ├── Login.tsx           # Auth view
│   ├── firebase.ts         # Firebase init
│   └── index.css           # Global styles
├── server.ts               # Express server (API + Vite dev middleware)
├── vite.config.ts          # Vite config
├── firebase-applet-config.json  # Firebase client config
└── package.json
```

## Development
- **Workflow**: "Start application" runs `cd vibe-code-hub && npm run dev`
- **Port**: 5000 (Express server with embedded Vite middleware)
- **Host**: 0.0.0.0

## Key Environment Variables
- `GEMINI_API_KEY` - Google Gemini AI key
- `MUX_TOKEN_ID` - Mux API token ID
- `MUX_TOKEN_SECRET` - Mux API token secret
- `MUX_SIGNING_KEY_ID` - Mux signing key ID
- `MUX_SIGNING_KEY_PRIVATE` - Mux signing key private key

## Deployment
- Target: autoscale
- Build: `cd vibe-code-hub && npm run build`
- Run: `cd vibe-code-hub && NODE_ENV=production npx tsx server.ts`
