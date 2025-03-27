import { defineConfig, } from 'vite';
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  return {
    plugins: [react()],
    base: process.env.VITE_BASE_ROUTE ?? '/',
  };
});
