import { test, expect } from '@playwright/test';
import { setupUiTest, loginAsDev, createProjectFromHub, duplicateProjectByName, deleteProjectByName } from './fixtures/testUtils';

test.beforeEach(async ({ page }) => {
  await setupUiTest(page);
});

test('Hub: CRUD básico de projetos (criar, duplicar, apagar) + validação de formulário', async ({ page }) => {
  await loginAsDev(page);
  await expect(page.getByText('Projeto Demo', { exact: true })).toBeVisible();

  // Negativo: tentar criar sem obrigatórios
  await page.getByRole('button', { name: /\+ Novo Projeto/i }).click();
  await expect(page.getByText(/Configurar Novo Estudo/i)).toBeVisible();
  await page.getByRole('button', { name: /Inicializar Workspace/i }).click();
  await expect(page.getByText(/Preencha os campos obrigatórios/i)).toBeVisible();
  await page.getByRole('button', { name: /Cancelar/i }).click();
  await expect(page.getByText(/Configurar Novo Estudo/i)).toBeHidden();

  // Positivo: criar projeto
  const sob = `E2E.${Date.now()}`;
  const name = `Projeto E2E ${new Date().toISOString().slice(11, 19)}`;
  await createProjectFromHub(page, { sob, name, pe: 'BT-E2E' });

  // Duplicar
  await duplicateProjectByName(page, name);
  await expect(page.getByRole('heading', { name: new RegExp(`${escapeRegExp(name)}\\s*\\(Cópia\\)`, 'i') })).toBeVisible();

  // Apagar cópia
  const copyName = `${name} (Cópia)`;
  await deleteProjectByName(page, copyName);
  await expect(page.getByText(/Projeto apagado\./i)).toBeVisible();
  await expect(page.getByRole('heading', { name: copyName })).toBeHidden();
});

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

