
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    // Em Windows, muitos workers podem estourar memória (especialmente com libs grandes).
    // Vitest v4: limites ficam no nível superior (pool rework).
    pool: 'threads',
    minThreads: 1,
    maxThreads: 2,
    exclude: [
      'e2e/**',
      'node_modules/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'reports/**',
    ],
    // Cobertura é opcional e só roda quando habilitada via CLI/CI (--coverage).
    // Deixamos a configuração aqui para padronizar paths/formatos e facilitar evidências.
    coverage: {
      provider: 'v8',
      reportsDirectory: 'reports/vitest/coverage',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportOnFailure: true,
      exclude: [
        'e2e/**',
        'node_modules/**',
        'dist/**',
        'playwright-report/**',
        'test-results/**',
        'reports/**',
        '**/*.d.ts',
      ],
    },
  },
});
