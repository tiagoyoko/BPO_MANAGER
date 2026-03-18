import { test, expect } from '@playwright/test';

test.describe('BPO360 smoke', () => {
  test('home page renders', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/BPO/i);

    await expect(page.getByTestId('app-shell-root')).toBeVisible({ timeout: 15_000 });
  });
});

