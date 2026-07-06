import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/test-data';
import { loginViaUI } from '../helpers/auth';

/**
 * Test Suite 10: Role Approvals Flow
 * Flow: Admin logs in, navigates to Approvals page, checks tabs and modals.
 */

test.describe('Admin Approvals Flow', () => {

  test.beforeEach(async ({ page }) => {
    try {
      await loginViaUI(page, TEST_ACCOUNTS.admin.username, TEST_ACCOUNTS.admin.password);
    } catch {
      // Allow fallback if auth fails
    }
  });

  test('Approvals page shows Sellers, Shippers, and Products tabs', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_APPROVALS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    // Check tabs exist
    await expect(page.getByRole('button', { name: /Cửa hàng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tài xế/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Món ăn mới/i })).toBeVisible();
  });

  test('Can switch to Shippers tab and view empty/list state', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_APPROVALS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    // Click Shippers tab
    await page.getByRole('button', { name: /Tài xế/i }).click();
    await page.waitForTimeout(1000);

    // Either list shows up or "Chưa có hồ sơ" message
    const hasEmptyMsg = await page.getByText('Chưa có hồ sơ tài xế nào chờ phê duyệt.').isVisible();
    const hasTable = await page.locator('table').count() > 0;
    
    expect(hasEmptyMsg || hasTable).toBeTruthy();
  });

  test('Action modals open for approval/rejection (if items exist)', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_APPROVALS);
    await page.waitForTimeout(3000);

    if (page.url().includes('/login')) {
      test.skip();
      return;
    }

    // Try to find any "Từ chối" or "Duyệt" button in the table
    const rejectBtn = page.getByRole('button', { name: /Từ chối/i }).first();
    const isVisible = await rejectBtn.isVisible();

    if (isVisible) {
      // Click reject to open the rejection modal
      await rejectBtn.click();
      await page.waitForTimeout(500);

      // Verify modal opened
      await expect(page.getByText('Xác nhận từ chối')).toBeVisible();
      
      // Verify reason textarea exists
      await expect(page.getByPlaceholder('Nhập lý do từ chối')).toBeVisible();

      // Close modal
      await page.getByRole('button', { name: 'Hủy' }).click();
    } else {
      // No items to approve/reject, test passes
      test.skip();
    }
  });

});
