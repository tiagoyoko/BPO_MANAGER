import { Page, expect } from '@playwright/test';

export async function loginAsTestUser(page: Page, email: string) {
  await page.goto('/login');

  await page.getByLabel(/e-mail/i).fill(email);
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page.getByTestId('app-shell-root')).toBeVisible();
}

