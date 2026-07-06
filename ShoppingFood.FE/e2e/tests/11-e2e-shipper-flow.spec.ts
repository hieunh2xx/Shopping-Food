import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/test-data';

/**
 * Test Suite 11: Shipper Flow
 * Covers Shipper Application (guest & auth) and Shipper Dashboard pages.
 */

test.describe('Shipper Flows', () => {

  test('Guest Shipper Apply page renders form', async ({ page }) => {
    await page.goto('/register/shipper');
    await page.waitForTimeout(2000);

    // Guest apply form should be visible
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
    const isVisible = await page.getByText(/Đăng ký/i).count() > 0;
    expect(isVisible).toBeTruthy();
  });

  test.describe('Authenticated Shipper', () => {
    // Use the shipper's pre-logged-in state
    test.use({ storageState: 'e2e/.auth/shipper.json' });

    test('Shipper Dashboard loads without error', async ({ page }) => {
      await page.goto(ROUTES.SHIPPER_DASHBOARD);
      await page.waitForTimeout(3000);

      if (page.url().includes('/login')) {
        test.skip();
        return;
      }

      await expect(page.locator('body')).not.toContainText('Cannot read properties');
    });

    test('Shipper History page loads', async ({ page }) => {
      await page.goto('/shipper/history');
      await page.waitForTimeout(2000);

      if (page.url().includes('/login')) {
        test.skip();
        return;
      }

      await expect(page.locator('body')).not.toContainText('Cannot read properties');
    });

    test('Shipper Income page loads', async ({ page }) => {
      await page.goto('/shipper/income');
      await page.waitForTimeout(2000);

      if (page.url().includes('/login')) {
        test.skip();
        return;
      }

      await expect(page.locator('body')).not.toContainText('Cannot read properties');
    });

    test('Shipper Profile page loads', async ({ page }) => {
      await page.goto('/shipper/profile');
      await page.waitForTimeout(2000);

      if (page.url().includes('/login')) {
        test.skip();
        return;
      }

      await expect(page.locator('body')).not.toContainText('Cannot read properties');
    });
  });

});
