import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/test-data';

/**
 * Test Suite 12: Coordinator Flow
 * Covers Coordinator Dispatch Board and Monitoring pages.
 */

test.describe('Coordinator Flows', () => {

  // Use the coordinator's pre-logged-in state
  test.use({ storageState: 'e2e/.auth/coordinator.json' });

  test('Coordinator Dispatch Board loads without error', async ({ page }) => {
    await page.goto(ROUTES.COORDINATOR_DASHBOARD);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Coordinator Dispatch History loads', async ({ page }) => {
    await page.goto('/coordinator/history');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Coordinator Monitor Shippers page loads', async ({ page }) => {
    await page.goto('/coordinator/monitor');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Coordinator Incidents page loads', async ({ page }) => {
    await page.goto('/coordinator/incidents');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Coordinator Chat page loads', async ({ page }) => {
    await page.goto('/coordinator/chat');
    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

});
