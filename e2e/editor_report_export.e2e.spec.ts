import { test, expect } from '@playwright/test';
import { setupUiTest, loginAsDev, openDemoProject } from './fixtures/testUtils';

test.beforeEach(async ({ page }) => {
  await setupUiTest(page);
});

test('Jornada: Editor → cálculo → Memorial (relatório renderiza com dados do cenário)', async ({ page }) => {
  await loginAsDev(page);
  await openDemoProject(page);

  // Editor: altera carga e valida que as métricas reagem (motor local via Worker)
  await page.getByRole('link', { name: /Editor de Rede/i }).click();
  await expect(page.getByText(/Editor de Topologia/i)).toBeVisible();

  const monoInput = page.locator('[data-row="1"][data-col="4"]');
  await expect(monoInput).toBeVisible();
  const currentBadge = page.getByTestId('current-badge-P-1');
  await expect(currentBadge).toBeVisible();
  const before = (await currentBadge.textContent()) || '';

  await monoInput.fill('3');

  // Badge de corrente deve mudar e terminar com "A" (sem depender de valor exato).
  await expect
    .poll(async () => (await currentBadge.textContent()) || '', { timeout: 15_000 })
    .not.toBe(before);
  await expect(currentBadge).toContainText(/A$/);

  // Memorial
  await page.getByRole('link', { name: /Memorial/i }).click();
  await expect(page.getByText(/Exportação de Documentos/i)).toBeVisible();
  await expect(page.getByText(/Memorial Descritivo Técnico/i)).toBeVisible();
  await expect(page.getByText(/SOB:/i)).toBeVisible();
});

test('Exportação: Memorial → gerar PDF (chromium apenas)', async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'chromium') test.skip('Geração de PDF via canvas é validada apenas no Chromium.');

  await loginAsDev(page);
  await openDemoProject(page);

  await page.getByRole('link', { name: /Memorial/i }).click();
  await expect(page.getByText(/Exportação de Documentos/i)).toBeVisible();

  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 }).catch(() => null);
  await page.getByRole('button', { name: /Gerar PDF/i }).click();

  // Feedback imediato
  await expect(page.getByText(/Iniciando geração do PDF/i)).toBeVisible();

  const download = await downloadPromise;
  if (download) {
    expect(download.suggestedFilename()).toMatch(/^Memorial_SOB_/);
  }

  // Feedback final (mesmo que o browser não emita evento de download)
  await expect(page.getByText(/Memorial gerado com sucesso!/i)).toBeVisible({ timeout: 60_000 });
});

