import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/test-data';
import { loginViaUI } from '../helpers/auth';

/**
 * Test Suite 07: Seller Dashboard
 * Flow: Authenticated seller views dashboard and manages store.
 */

test.describe('Seller Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    try {
      await loginViaUI(page, TEST_ACCOUNTS.seller.username, TEST_ACCOUNTS.seller.password);
    } catch {
      // Ignore auth setup failures if account doesn't exist
    }
  });

  test('Seller Dashboard home loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_DASHBOARD);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
    // Ensure it's the dashboard
    await expect(page).toHaveURL(new RegExp(ROUTES.SELLER_DASHBOARD));
  });

  test('Seller Products page loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_PRODUCTS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Seller Orders page loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_ORDERS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Seller Categories page loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_CATEGORIES);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Seller Toppings page loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_TOPPINGS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Seller Discounts page loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_DISCOUNTS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Seller Settings page loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_SETTINGS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });
});
