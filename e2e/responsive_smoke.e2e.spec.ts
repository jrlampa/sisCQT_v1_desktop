import { test, expect } from '@playwright/test';
import { setupUiTest, loginAsDev, openDemoProject } from './fixtures/testUtils';

const viewports = [
  { name: 'mobile', size: { width: 375, height: 700 } },
  { name: 'tablet', size: { width: 768, height: 900 } },
  { name: 'desktop', size: { width: 1440, height: 900 } },
] as const;

for (const vp of viewports) {
  test.describe(`Responsividade smoke: ${vp.name}`, () => {
    test.use({ viewport: vp.size });

    test.beforeEach(async ({ page }) => {
      await setupUiTest(page);
    });

    test('Login/Hub/Projeto renderizam nos breakpoints principais', async ({ page }) => {
      await loginAsDev(page);
      await expect(page.getByText(/Hub de Engenharia/i)).toBeVisible();
      await expect(page.getByText('Projeto Demo', { exact: true })).toBeVisible();

      await openDemoProject(page);
      await expect(page.getByRole('link', { name: /Visão Geral/i })).toBeVisible();
    });
  });
}

