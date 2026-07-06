import { test as setup } from '@playwright/test';
import { loginViaUI } from './auth';
import { TEST_ACCOUNTS } from './test-data';

/**
 * Auth Setup — Logs in as each role and saves the browser state
 * so subsequent tests can reuse the auth without re-logging-in.
 */

setup('authenticate as customer', async ({ page }) => {
  try {
    await loginViaUI(page, TEST_ACCOUNTS.customer.username, TEST_ACCOUNTS.customer.password);
    await page.context().storageState({ path: 'e2e/.auth/customer.json' });
  } catch (e) {
    console.warn('Customer auth setup failed (account may not exist yet):', (e as Error).message);
    // Save empty state so tests can still run with login-per-test fallback
    await page.context().storageState({ path: 'e2e/.auth/customer.json' });
  }
});

setup('authenticate as seller', async ({ page }) => {
  try {
    await loginViaUI(page, TEST_ACCOUNTS.seller.username, TEST_ACCOUNTS.seller.password);
    await page.context().storageState({ path: 'e2e/.auth/seller.json' });
  } catch (e) {
    console.warn('Seller auth setup failed (account may not exist yet):', (e as Error).message);
    await page.context().storageState({ path: 'e2e/.auth/seller.json' });
  }
});

setup('authenticate as admin', async ({ page }) => {
  try {
    await loginViaUI(page, TEST_ACCOUNTS.admin.username, TEST_ACCOUNTS.admin.password);
    await page.context().storageState({ path: 'e2e/.auth/admin.json' });
  } catch (e) {
    console.warn('Admin auth setup failed (account may not exist yet):', (e as Error).message);
    await page.context().storageState({ path: 'e2e/.auth/admin.json' });
  }
});

setup('authenticate as shipper', async ({ page }) => {
  try {
    await loginViaUI(page, TEST_ACCOUNTS.shipper.username, TEST_ACCOUNTS.shipper.password);
    await page.context().storageState({ path: 'e2e/.auth/shipper.json' });
  } catch (e) {
    console.warn('Shipper auth setup failed:', (e as Error).message);
    await page.context().storageState({ path: 'e2e/.auth/shipper.json' });
  }
});

setup('authenticate as coordinator', async ({ page }) => {
  try {
    await loginViaUI(page, TEST_ACCOUNTS.coordinator.username, TEST_ACCOUNTS.coordinator.password);
    await page.context().storageState({ path: 'e2e/.auth/coordinator.json' });
  } catch (e) {
    console.warn('Coordinator auth setup failed:', (e as Error).message);
    await page.context().storageState({ path: 'e2e/.auth/coordinator.json' });
  }
});
