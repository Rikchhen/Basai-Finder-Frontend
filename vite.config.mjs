import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Fail loudly if 3000 is taken instead of silently drifting to 3001/3002,
    // which the backend CORS allowlist would then reject.
    strictPort: true,
  },
});
