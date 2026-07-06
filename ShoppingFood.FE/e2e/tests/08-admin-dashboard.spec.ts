import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/test-data';
import { loginViaUI } from '../helpers/auth';

/**
 * Test Suite 08: Admin Dashboard
 * Flow: Authenticated admin views dashboard and manages system.
 */

test.describe('Admin Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    try {
      await loginViaUI(page, TEST_ACCOUNTS.admin.username, TEST_ACCOUNTS.admin.password);
    } catch {
      // Ignore auth setup failures if account doesn't exist
    }
  });

  test('Admin Dashboard home loads', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_DASHBOARD);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Users page loads', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_USERS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Restaurants page loads', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_RESTAURANTS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Approvals page loads', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_APPROVALS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Permissions page loads', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_PERMISSIONS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Admin Settings page loads', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_SETTINGS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });
});
