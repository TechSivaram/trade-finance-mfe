import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
export default defineConfig({plugins:[react(),federation({name:'trade_mf',filename:'remoteEntry.js',exposes:{'./TradeApp':'./src/TradeApp.tsx'},shared:['react','react-dom']})],server:{port:5002,strictPort:true},build:{target:'esnext'}});