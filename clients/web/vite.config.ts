import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  plugins: [
    svgr({
      include: '**/*.svg'
    }),
    react(),
    NodeGlobalsPolyfillPlugin({
      buffer: true,
      process: true
    })
  ],
  resolve: {
    alias: {
      '@web': resolve(__dirname, 'src'),
      // other directories
      '@shared': resolve(__dirname, '../shared'),
      '@commons': resolve(__dirname, '../../commons')
    }
  },
  define: {
    'process.env': {
      AWS_REGION: process.env.AWS_REGION,
      AWS_COGNITO_REGION: process.env.AWS_COGNITO_REGION,
      AWS_USER_POOL_ID: process.env.AWS_USER_POOL_ID,
      AWS_USER_POOL_WEB_CLIENT_ID: process.env.AWS_USER_POOL_WEB_CLIENT_ID,
      PASSWORD_MINIMUM_LENGTH: process.env.PASSWORD_MINIMUM_LENGTH,
      API_URL: process.env.API_URL,
    },
  }
})
