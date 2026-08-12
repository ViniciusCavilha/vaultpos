/// <reference types='vitest' />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), legacy()],
  resolve: {
    alias: [
      {
        find: '@supabase/supabase-js',
        replacement: path.resolve(__dirname, './src/firebase/compat/supabase-js.ts'),
      },
      {
        find: '@/supabase',
        replacement: path.resolve(__dirname, './src/firebase/compat'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
