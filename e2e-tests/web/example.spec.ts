import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Run full flow in-memory demo')).toBeVisible();
});
