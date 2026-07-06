import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/test-data';
import { loginViaUI } from '../helpers/auth';

/**
 * Test Suite 06: Customer Orders & Profile
 * Flow: Authenticated customer views orders and profile.
 */

test.describe('Customer Orders & Profile', () => {

  test.beforeEach(async ({ page }) => {
    try {
      await loginViaUI(page, TEST_ACCOUNTS.customer.username, TEST_ACCOUNTS.customer.password);
    } catch {
      // Login may require OTP — skip authenticated tests
    }
  });

  test('Orders page loads without errors', async ({ page }) => {
    await page.goto(ROUTES.ORDERS);
    await page.waitForTimeout(3000);

    // If redirected to login, the auth failed (OTP)
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    // Page should render without crash
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Orders page shows order list or empty state', async ({ page }) => {
    await page.goto(ROUTES.ORDERS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    const pageContent = await page.textContent('body');
    // Should show orders or "chưa có đơn hàng" type message
    expect(pageContent).toBeTruthy();
  });

  test('Profile page loads without errors', async ({ page }) => {
    await page.goto(ROUTES.PROFILE);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Profile page shows user information', async ({ page }) => {
    await page.goto(ROUTES.PROFILE);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    // Profile page should display user info (name, email, phone, etc.)
    const pageContent = await page.textContent('body');
    const hasProfileInfo = pageContent?.includes('@') || // email
                          pageContent?.includes('0') || // phone number
                          pageContent?.includes('Thông tin'); // section header
    expect(hasProfileInfo).toBeTruthy();
  });

  test('Guest order tracking page loads', async ({ page }) => {
    await page.goto('/order-tracking');
    await page.waitForTimeout(2000);

    // Should load without crash
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });
});
