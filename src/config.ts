// Same convention as the game client (frontend/src/config.ts):
// development talks to localhost, production talks to the real backend.
// The GitHub Actions build injects VITE_API_URL at build time.
export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';
