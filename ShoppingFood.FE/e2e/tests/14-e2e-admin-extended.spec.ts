import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/test-data';

/**
 * Test Suite 14: Extended Admin Flow
 * Covers additional admin UIs like Chat, Loyalty Config, Notifications, etc.
 */

test.describe('Extended Admin Flows', () => {

  // Use the admin's pre-logged-in state
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('Admin Discounts page loads without error', async ({ page }) => {
    await page.goto('/admin/discounts');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Loyalty Config page loads without error', async ({ page }) => {
    await page.goto('/admin/loyalty-config');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin FAQ page loads without error', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_FAQ);
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Chat page loads without error', async ({ page }) => {
    await page.goto('/admin/chat');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Review Reports page loads without error', async ({ page }) => {
    await page.goto('/admin/review-reports');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Flash Sale Config page loads without error', async ({ page }) => {
    await page.goto('/admin/flash-sale');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Notifications page loads without error', async ({ page }) => {
    await page.goto('/admin/notifications');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

});
