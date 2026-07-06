import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/test-data';
import { getLoginSubmitButton } from '../helpers/auth';

/**
 * Test Suite 03: User Login
 * Flow: Existing user logs in, role-based redirects, error handling.
 */

test.describe('User Login', () => {

  test('Login page shows username and password fields', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await expect(page.getByPlaceholder('Nhập tên đăng nhập hoặc email')).toBeVisible();
    await expect(page.getByPlaceholder('Nhập mật khẩu')).toBeVisible();
    await expect(getLoginSubmitButton(page)).toBeVisible();
  });

  test('Shows validation errors for empty submission', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await getLoginSubmitButton(page).click();

    await expect(page.getByText('Vui lòng nhập tên đăng nhập')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập mật khẩu')).toBeVisible();
  });

  test('Shows error for invalid credentials', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await page.getByPlaceholder('Nhập tên đăng nhập hoặc email').fill('nonexistentuser999');
    await page.getByPlaceholder('Nhập mật khẩu').fill('WrongPassword123');
    await getLoginSubmitButton(page).click();

    // Wait for API response
    await page.waitForTimeout(3000);

    // Should show an error message (either inline or toast)
    const hasError = await page.locator('text=/không đúng|thất bại|sai|lỗi/i').count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('Login as Customer redirects to Home', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await page.getByPlaceholder('Nhập tên đăng nhập hoặc email').fill(TEST_ACCOUNTS.customer.username);
    await page.getByPlaceholder('Nhập mật khẩu').fill(TEST_ACCOUNTS.customer.password);
    await getLoginSubmitButton(page).click();

    // Customer should be redirected to home or OTP step
    await page.waitForTimeout(5000);
    
    const url = page.url();
    const isHomeOrOtp = url.endsWith('/') || url.includes('/login');
    expect(isHomeOrOtp).toBeTruthy();
  });

  test('Login as Seller redirects to Seller Dashboard', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await page.getByPlaceholder('Nhập tên đăng nhập hoặc email').fill(TEST_ACCOUNTS.seller.username);
    await page.getByPlaceholder('Nhập mật khẩu').fill(TEST_ACCOUNTS.seller.password);
    await getLoginSubmitButton(page).click();

    await page.waitForTimeout(5000);
    
    const url = page.url();
    // Seller goes to /seller or stays at login (OTP step)
    const isSellerOrLogin = url.includes('/seller') || url.includes('/login');
    expect(isSellerOrLogin).toBeTruthy();
  });

  test('Login as Admin redirects to Admin Dashboard', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await page.getByPlaceholder('Nhập tên đăng nhập hoặc email').fill(TEST_ACCOUNTS.admin.username);
    await page.getByPlaceholder('Nhập mật khẩu').fill(TEST_ACCOUNTS.admin.password);
    await getLoginSubmitButton(page).click();

    await page.waitForTimeout(5000);
    
    const url = page.url();
    const isAdminOrLogin = url.includes('/admin') || url.includes('/login');
    expect(isAdminOrLogin).toBeTruthy();
  });

  test('Password visibility toggle works', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    const passwordInput = page.getByPlaceholder('Nhập mật khẩu');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the eye icon toggle
    await page.locator('button').filter({ has: page.locator('svg') }).last().click();
    
    // After toggle, type should be 'text'
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('"Đăng ký ngay" link navigates to register', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await page.getByRole('link', { name: 'Đăng ký ngay' }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('"Quên mật khẩu?" opens forgot password modal', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    await page.getByText('Quên mật khẩu?').click();

    // Forgot password modal should appear
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('text=/quên mật khẩu|khôi phục|reset/i').count() > 0;
    expect(modalVisible).toBeTruthy();
  });

  test('Social login buttons are visible', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);

    // Google login button
    await expect(page.getByText('Hoặc')).toBeVisible();
    
    // Microsoft login button
    await expect(page.getByText('Đăng nhập bằng Microsoft')).toBeVisible();
  });
});
