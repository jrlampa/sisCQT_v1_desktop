import { test, expect } from '@playwright/test';
import { setupUiTest, loginAsDev, openDemoProject } from './fixtures/testUtils';

test.beforeEach(async ({ page }) => {
  await setupUiTest(page);
});

test('Chatbot: erro do backend é exibido como resposta (cenário negativo)', async ({ page }) => {
  // Override do mock de IA para simular indisponibilidade
  await page.route('**/api/gemini/ask', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ success: false, error: 'IA indisponível (simulada)' }),
    });
  });

  await loginAsDev(page);
  await openDemoProject(page);

  await page.getByRole('link', { name: /Analista IA/i }).click();
  await expect(page.getByText(/Theseus: Inteligência de Rede/i)).toBeVisible();

  await page.getByPlaceholder(/Peça ao Theseus/i).fill('Teste de indisponibilidade');
  await page.getByRole('button', { name: '➔' }).click();

  // A UI coloca o erro como mensagem "ai"
  await expect(page.getByText(/IA indisponível \(simulada\)/i)).toBeVisible();
});

