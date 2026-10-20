import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' so the built site works when opened from any path / subdirectory,
// including file:// for fully offline use.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 1024 * 1024, // inline the data JSON as base64 to keep it a single bundle-friendly build
  },
  test: {
    // Only test this project's engine/tests — the cloned `upstream/` repo has
    // its own unrelated test suites that must not be picked up.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
