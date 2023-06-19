import { Dialog, Page, expect, test } from '@playwright/test';

function waitForDialog(page: Page, f: () => Promise<void>): Promise<Dialog> {
  return new Promise(async (resolve) => {
    page.once('dialog', async (dialog) => {
      resolve(dialog);
    });
    await f();
  });
}

test('full registration & login flow', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('Host').fill('http://localhost:8181');
  await page.getByPlaceholder('Username').fill('jane_doe');
  await page.getByPlaceholder('Password').fill('hunter42');

  let dialog = await waitForDialog(page, () =>
    page.getByRole('button', { name: 'Register' }).click()
  );
  expect(dialog.message()).toBe(`User "jane_doe" registered successfully`);
  await dialog.dismiss();

  dialog = await waitForDialog(page, () =>
    page.getByRole('button', { name: 'Login' }).click()
  );
  expect(dialog.message()).toContain('User "jane_doe" logged in successfully');
  await dialog.dismiss();

  dialog = await waitForDialog(page, () =>
    page.getByRole('button', { name: 'Login' }).click()
  );
  expect(dialog.message()).toContain('User "jane_doe" logged in successfully');
  await dialog.dismiss();
});
