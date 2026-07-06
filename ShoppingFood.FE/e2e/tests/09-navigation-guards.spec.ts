import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/test-data';

/**
 * Test Suite 09: Navigation Guards
 * Flow: Anonymous users and unauthorized roles are redirected properly.
 */

test.describe('Navigation Guards & Route Protection', () => {

  test('Anonymous user is redirected to login when accessing profile', async ({ page }) => {
    await page.goto(ROUTES.PROFILE);
    await page.waitForTimeout(2000);
    
    // Should be redirected to login
    await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN));
  });

  test('Anonymous user is redirected to login when accessing orders', async ({ page }) => {
    await page.goto(ROUTES.ORDERS);
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN));
  });

  test('Anonymous user is redirected to login when accessing seller dashboard', async ({ page }) => {
    await page.goto(ROUTES.SELLER_DASHBOARD);
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN));
  });

  test('Anonymous user is redirected to login when accessing admin dashboard', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_DASHBOARD);
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN));
  });

  test('Anonymous user is redirected to login when accessing shipper dashboard', async ({ page }) => {
    await page.goto(ROUTES.SHIPPER_DASHBOARD);
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN));
  });

  test('Anonymous user is redirected to login when accessing coordinator dashboard', async ({ page }) => {
    await page.goto(ROUTES.COORDINATOR_DASHBOARD);
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(new RegExp(ROUTES.LOGIN));
  });
});
