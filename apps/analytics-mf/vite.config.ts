import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // Vue's production runtime checks NODE_ENV; replace it at build time for browsers.
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [vue({ customElement: /\.ce\.vue$/ })],
  build: {
    lib: { entry: 'src/main.ts', name: 'TradeAnalyticsElement', formats: ['es'], fileName: () => 'trade-analytics.js' },
    target: 'esnext', outDir: 'dist', emptyOutDir: true,
    rollupOptions: { output: { inlineDynamicImports: true } }
  },
  preview: { host: '0.0.0.0', port: 5004, strictPort: true }
});
