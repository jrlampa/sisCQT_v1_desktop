import { test, expect } from '@playwright/test';
import { setupUiTest } from './fixtures/testUtils';

test.beforeEach(async ({ page }) => {
  await setupUiTest(page);
});

test('Login: modo desenvolvedor falha quando /auth/sync retorna erro (cenário negativo)', async ({ page }) => {
  // Override do mock para forçar falha no sync
  await page.route('**/api/auth/sync', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ success: false, error: 'Falha simulada no sync' }),
    });
  });

  await page.goto('/login');
  await expect(page.getByText('Engenharia Digital')).toBeVisible();

  await page.getByRole('button', { name: /modo desenvolvedor/i }).click();
  await expect(page.getByText(/Falha ao ativar o modo de desenvolvimento/i)).toBeVisible();
});

