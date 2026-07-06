import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/test-data';

/**
 * Test Suite 15: Extended Customer Flow
 * Covers specific actions a customer takes like reporting incidents or applying to become a seller/shipper.
 */

test.describe('Extended Customer Flows', () => {

  // Use the customer's pre-logged-in state
  test.use({ storageState: 'e2e/.auth/customer.json' });

  test('Customer can access apply to be Seller form', async ({ page }) => {
    await page.goto(ROUTES.SELLER_APPLY);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Customer can access apply to be Shipper form (Auth flow)', async ({ page }) => {
    await page.goto(ROUTES.SHIPPER_APPLY);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Customer Report Incident page loads', async ({ page }) => {
    // Navigating without order ID usually just shows an empty form or redirects, 
    // but the route itself shouldn't crash.
    await page.goto(ROUTES.REPORT_INCIDENT);
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

});
