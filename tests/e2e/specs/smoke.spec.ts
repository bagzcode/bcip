import { test, expect } from '@playwright/test';

test('landing and health smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByText(/Batik Design Intelligence|Kecerdasan Desain Batik/),
  ).toBeVisible();

  await page.goto('/system/health');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('web')).toBeVisible();
});
