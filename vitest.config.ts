import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    alias: {
      // Resolve the Vite virtual PWA module to a hand-written stub
      'virtual:pwa-register/react': '/Users/f00421k/Documents/GitHub/kiln/src/__mocks__/pwa-register-react.ts',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/components/**', 'src/pages/**'],
    },
  },
})
