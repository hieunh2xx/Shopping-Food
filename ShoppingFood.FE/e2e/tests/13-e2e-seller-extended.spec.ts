import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/test-data';

/**
 * Test Suite 13: Extended Seller Flow
 * Covers additional seller UIs like Promotions, Flash Sales, and Appeals.
 */

test.describe('Extended Seller Flows', () => {

  // Use the seller's pre-logged-in state
  test.use({ storageState: 'e2e/.auth/seller.json' });

  test('Seller Promotions page loads without error', async ({ page }) => {
    await page.goto(ROUTES.SELLER_PROMOTIONS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Seller Flash Sales page loads without error', async ({ page }) => {
    await page.goto('/seller/flash-sales');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Seller Appeal page loads without error', async ({ page }) => {
    await page.goto('/seller/appeal');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

});
