import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ path: '../server/.env' });

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['slashspace.xwalfie.dev'],
    proxy: {
      '/ws': {
        target: `ws://localhost:${process.env.PORT}`,
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
      },
    },
  },
});