import { test, expect } from '@playwright/test';
import { setupUiTest, loginAsDev, openDemoProject } from './fixtures/testUtils';

test.beforeEach(async ({ page }) => {
  await setupUiTest(page);
});

test('UX: navegação sem mouse (teclado), foco e atalhos básicos', async ({ page }) => {
  await loginAsDev(page);
  await expect(page.getByText(/Hub de Engenharia/i)).toBeVisible();

  // Abre "Novo Projeto" via teclado (sem clique do mouse)
  const newProjectBtn = page.getByRole('button', { name: /\+ Novo Projeto/i });
  await newProjectBtn.focus();
  await expect(newProjectBtn).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Configurar Novo Estudo/i)).toBeVisible();

  // Preenche campos usando Tab/teclado
  const sobInput = page.getByLabel('SOB / ID');
  await sobInput.focus();
  await page.keyboard.type(`E2E.KEY.${Date.now()}`);
  await page.keyboard.press('Tab');
  await page.keyboard.type('BT-KEY');
  await page.keyboard.press('Tab');
  await page.keyboard.type(`Projeto Teclado ${new Date().toISOString().slice(11, 19)}`);

  // Submete com Enter a partir do botão
  const submit = page.getByRole('button', { name: /Inicializar Workspace/i });
  await submit.focus();
  await expect(submit).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Configurar Novo Estudo/i)).toBeHidden();

  // Abre o demo e navega pelo menu lateral sem mouse
  await openDemoProject(page);
  const editorLink = page.getByRole('link', { name: /Editor de Rede/i });
  await editorLink.focus();
  await expect(editorLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Editor de Topologia/i)).toBeVisible();

  const chatbotLink = page.getByRole('link', { name: /Analista IA/i });
  await chatbotLink.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Theseus: Inteligência de Rede/i)).toBeVisible();
});

