import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [react(), federation({
    name: 'shell',
    remotes: {
      dashboard: 'http://localhost:5001/assets/remoteEntry.js',
      trade: 'http://localhost:5002/assets/remoteEntry.js',
    },
    shared: ['react', 'react-dom', 'react-router-dom']
  })],
  server: { port: 5000, strictPort: true },
  build: { target: 'esnext' }
});