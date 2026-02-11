/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@react-oauth/google',
      '@headlessui/react',
      '@heroicons/react',
      'framer-motion',
      'socket.io-client',
      'sonner',
      'react-timezone-select'
    ],
    force: true // Force re-optimization on next server start
  },
} as any)
