import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['dot'],
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
  },
})
