import { expect, type Page } from '@playwright/test';
import { installMockApi } from './mockApi';

export async function setupUiTest(page: Page) {
  await installMockApi(page);

  // Evita que o Hub crie automaticamente o projeto WELCOME durante testes (flaky / muda URL).
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sisqat_welcome_project_created', 'true');
    } catch {
      // ignore
    }
  });

  // Desabilita animações/transições para snapshots estáveis
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        transition: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

export async function loginAsDev(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /modo desenvolvedor/i }).click();
  await expect(page).toHaveURL(/\/hub$/);
}

export async function openDemoProject(page: Page) {
  // Clica no card do projeto demo (tem texto "Projeto Demo")
  const card = page.getByText('Projeto Demo', { exact: true });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(page).toHaveURL(/\/project\/prj-1\/dashboard/);
}

export async function createProjectFromHub(
  page: Page,
  data: { sob: string; name: string; pe?: string; lat?: string; lng?: string }
) {
  await expect(page.getByText(/Hub de Engenharia/i)).toBeVisible();
  await page.getByRole('button', { name: /\+ Novo Projeto/i }).click();
  await expect(page.getByText(/Configurar Novo Estudo/i)).toBeVisible();

  await page.getByLabel('SOB / ID').fill(data.sob);
  if (data.pe !== undefined) await page.getByLabel('Ponto Elétrico').fill(data.pe);
  await page.getByLabel('Título do Estudo').fill(data.name);

  // lat/lng não são obrigatórios no UI atual; se vierem, preenche como texto
  if (data.lat !== undefined) {
    // inputs de lat/lng não existem no modal hoje; mantemos compatibilidade futura sem falhar
    const latInput = page.getByLabel(/Latitude/i);
    if (await latInput.count()) await latInput.fill(data.lat);
  }
  if (data.lng !== undefined) {
    const lngInput = page.getByLabel(/Longitude/i);
    if (await lngInput.count()) await lngInput.fill(data.lng);
  }

  await page.getByRole('button', { name: /Inicializar Workspace/i }).click();
  await expect(page.getByText(/Configurar Novo Estudo/i)).toBeHidden();
  await expect(page.getByRole('heading', { name: data.name })).toBeVisible({ timeout: 30_000 });
}

export async function duplicateProjectByName(page: Page, projectName: string) {
  const heading = page.getByRole('heading', { name: projectName });
  await expect(heading).toBeVisible();
  const card = heading.locator('xpath=ancestor::div[contains(@class,"glass-dark")]').first();
  await card.hover();
  await page.getByRole('button', { name: new RegExp(`Duplicar projeto\\s+${escapeRegExp(projectName)}`, 'i') }).click();
}

export async function deleteProjectByName(page: Page, projectName: string) {
  const heading = page.getByRole('heading', { name: projectName });
  await expect(heading).toBeVisible();
  const card = heading.locator('xpath=ancestor::div[contains(@class,"glass-dark")]').first();
  await card.hover();
  page.once('dialog', async (d) => d.accept());
  await page.getByRole('button', { name: new RegExp(`Apagar projeto\\s+${escapeRegExp(projectName)}`, 'i') }).click();
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

