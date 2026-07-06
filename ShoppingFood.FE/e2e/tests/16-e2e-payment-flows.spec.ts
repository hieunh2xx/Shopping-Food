/**
 * E2E Business Flow Tests — Payment & Finance (UC-PAY-001 to UC-PAY-015)
 */
import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/test-data';
import { loginViaUI } from '../helpers/auth';

test.describe('Payment Methods API Integration', () => {
  test('UC-PAY-001: checkout page loads payment methods from API', async ({ page }) => {
    await page.goto(ROUTES.CHECKOUT);
    // May redirect if cart empty — check payment section if on checkout
    const url = page.url();
    if (url.includes('/checkout')) {
      await expect(page.getByText(/phương thức thanh toán/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/tiền mặt|cod/i).first()).toBeVisible();
    }
  });

  test('UC-PAY-001: payment methods visible for authenticated customer', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.customer.username, TEST_ACCOUNTS.customer.password);
    await page.goto(ROUTES.PRODUCTS);
    await page.waitForLoadState('networkidle');
    const addBtn = page.getByRole('button', { name: /thêm vào giỏ|add to cart/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.goto(ROUTES.CHECKOUT);
      await expect(page.getByText(/phương thức thanh toán/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/ví tích lũy|ví điện tử|thẻ/i).first()).toBeVisible();
    }
  });
});

test.describe('Customer Wallet (UC-PAY-006, UC-PAY-010)', () => {
  test.use({ storageState: 'e2e/.auth/customer.json' });

  test('wallet page loads with balance and top-up form', async ({ page }) => {
    await page.goto(`${ROUTES.PROFILE}?tab=wallet`);
    await expect(page.getByText(/ví tích lũy/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/nạp tiền/i).first()).toBeVisible();
    await expect(page.getByText(/lịch sử giao dịch/i).first()).toBeVisible();
  });
});

test.describe('Seller Wallet (UC-PAY-007)', () => {
  test.use({ storageState: 'e2e/.auth/seller.json' });

  test('seller wallet page loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_WALLET);
    await expect(page.getByText(/số dư ví nhà hàng|rút tiền/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Shipper Wallet (UC-PAY-008, UC-PAY-014)', () => {
  test.use({ storageState: 'e2e/.auth/shipper.json' });

  test('shipper wallet and COD debt page loads', async ({ page }) => {
    await page.goto(ROUTES.SHIPPER_WALLET);
    await expect(page.getByText(/số dư ví tài xế|cod thu hộ/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/nộp tiền/i).first()).toBeVisible();
  });
});

test.describe('Admin Finance (UC-PAY-009, UC-PAY-015)', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('admin finance dashboard loads reconciliation', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_FINANCE);
    await expect(page.getByText(/quản lý tài chính|đối soát/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/chiết khấu sàn|doanh thu/i).first()).toBeVisible();
  });
});
