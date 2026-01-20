import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ path: '../server/.env' });

export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: `ws://localhost:${process.env.PORT}`,
        ws: true,
      },
    },
  },
});