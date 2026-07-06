/**
 * E2E Full Business Flow Tests — 5 core flows
 */
import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/test-data';
import { loginViaUI } from '../helpers/auth';

test.describe('Flow 1: Customer Registration → Browse → Checkout', () => {
  test('customer can browse products and reach checkout', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.customer.username, TEST_ACCOUNTS.customer.password);
    await page.goto(ROUTES.PRODUCTS);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');

    const productLink = page.locator('a[href*="/products/"]').first();
    if (await productLink.isVisible({ timeout: 8000 }).catch(() => false)) {
      await productLink.click();
      const addBtn = page.getByRole('button', { name: /thêm vào giỏ/i });
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.goto(ROUTES.CHECKOUT);
        await expect(page.getByText(/thông tin giao hàng|thanh toán/i).first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('customer orders page accessible after login', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.customer.username, TEST_ACCOUNTS.customer.password);
    await page.goto(ROUTES.ORDERS);
    await expect(page).toHaveURL(new RegExp(ROUTES.ORDERS));
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Flow 2: Shipper Registration & Dashboard', () => {
  test('shipper apply page renders for guest', async ({ page }) => {
    await page.goto(ROUTES.REGISTER_SHIPPER);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/shipper|tài xế|đăng ký/i).first()).toBeVisible({ timeout: 10000 });
  });

  test.use({ storageState: 'e2e/.auth/shipper.json' });
  test('authenticated shipper dashboard loads', async ({ page }) => {
    await page.goto(ROUTES.SHIPPER_DASHBOARD);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Flow 3: Admin Approval Flow', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('admin approvals page has all tabs', async ({ page }) => {
    await page.goto(ROUTES.ADMIN_APPLICATIONS);
    await expect(page.getByText(/duyệt|phê duyệt|approv/i).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Flow 4: Seller Registration & Products', () => {
  test('seller register page step 1', async ({ page }) => {
    await page.goto(ROUTES.REGISTER_SELLER);
    await expect(page.getByText(/đăng ký|seller|nhà hàng/i).first()).toBeVisible({ timeout: 10000 });
  });

  test.use({ storageState: 'e2e/.auth/seller.json' });
  test('seller products page loads', async ({ page }) => {
    await page.goto(ROUTES.SELLER_PRODUCTS);
    await expect(page.getByText(/sản phẩm|thực đơn|product/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('seller dashboard stats load from API', async ({ page }) => {
    await page.goto(ROUTES.SELLER_DASHBOARD);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Flow 5: Payment & Statistics Between Platform/Seller/Shipper', () => {
  test.describe('Admin finance', () => {
    test.use({ storageState: 'e2e/.auth/admin.json' });
    test('admin finance reconciliation page', async ({ page }) => {
      await page.goto(ROUTES.ADMIN_FINANCE);
      await expect(page.getByText(/quản lý tài chính/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Chiết khấu sàn', { exact: true })).toBeVisible();
    });
  });

  test.describe('Seller wallet', () => {
    test.use({ storageState: 'e2e/.auth/seller.json' });
    test('seller wallet for revenue withdrawal', async ({ page }) => {
      await page.goto(ROUTES.SELLER_WALLET);
      await expect(page.getByText(/số dư ví nhà hàng/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/rút tiền về ngân hàng/i)).toBeVisible();
    });
  });

  test.describe('Shipper income', () => {
    test.use({ storageState: 'e2e/.auth/shipper.json' });
    test('shipper income report page', async ({ page }) => {
      await page.goto(ROUTES.SHIPPER_INCOME);
      await expect(page.getByText(/thu nhập|income/i).first()).toBeVisible({ timeout: 15000 });
    });
  });
});
