import { test, expect } from '@playwright/test';
import { ROUTES, generateRegisterData } from '../helpers/test-data';

/**
 * Test Suite 02: User Registration
 * Flow: New user registers an account via the Register page.
 */

test.describe('User Registration', () => {

  test('Register page shows all required fields', async ({ page }) => {
    await page.goto(ROUTES.REGISTER);

    // Verify all form fields exist
    await expect(page.getByPlaceholder('username')).toBeVisible();
    await expect(page.getByPlaceholder('Nguyễn Văn A')).toBeVisible();
    await expect(page.getByPlaceholder('email@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('0901234567')).toBeVisible();
    await expect(page.getByPlaceholder('Tối thiểu 6 ký tự')).toBeVisible();
    await expect(page.getByPlaceholder('Nhập lại mật khẩu')).toBeVisible();
  });

  test('Shows validation errors for empty form submission', async ({ page }) => {
    await page.goto(ROUTES.REGISTER);

    // Click submit without filling anything
    await page.getByRole('button', { name: 'Đăng ký' }).click();

    // Should show validation errors
    await expect(page.getByText('Vui lòng nhập tên đăng nhập')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập mật khẩu')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập họ tên')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập email')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập số điện thoại')).toBeVisible();
  });

  test('Shows validation error for invalid email format', async ({ page }) => {
    await page.goto(ROUTES.REGISTER);

    await page.getByPlaceholder('email@example.com').fill('not-a-valid-email');
    await page.getByPlaceholder('username').fill('testuser');
    await page.getByPlaceholder('Nguyễn Văn A').fill('Test User');
    await page.getByPlaceholder('0901234567').fill('0901234567');
    await page.getByPlaceholder('Tối thiểu 6 ký tự').fill('Test@123');
    await page.getByPlaceholder('Nhập lại mật khẩu').fill('Test@123');

    await page.getByRole('button', { name: 'Đăng ký' }).click();

    // HTML5 email validation may block submit before custom error renders
    const emailInput = page.getByPlaceholder('email@example.com');
    const isCustomErrorVisible = await page.getByText(/email không hợp lệ/i).isVisible().catch(() => false);
    const isHtmlInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isCustomErrorVisible || isHtmlInvalid).toBeTruthy();
  });

  test('Shows validation error for mismatched passwords', async ({ page }) => {
    await page.goto(ROUTES.REGISTER);

    await page.getByPlaceholder('username').fill('testuser');
    await page.getByPlaceholder('Nguyễn Văn A').fill('Test User');
    await page.getByPlaceholder('email@example.com').fill('test@test.com');
    await page.getByPlaceholder('0901234567').fill('0901234567');
    await page.getByPlaceholder('Tối thiểu 6 ký tự').fill('Test@123');
    await page.getByPlaceholder('Nhập lại mật khẩu').fill('DifferentPassword');

    await page.getByRole('button', { name: 'Đăng ký' }).click();

    await expect(page.getByText('Mật khẩu không khớp')).toBeVisible();
  });

  test('Register with valid data submits form', async ({ page }) => {
    await page.goto(ROUTES.REGISTER);
    
    const data = generateRegisterData();
    
    await page.getByPlaceholder('username').fill(data.userName);
    await page.getByPlaceholder('Nguyễn Văn A').fill(data.fullName);
    await page.getByPlaceholder('email@example.com').fill(data.email);
    await page.getByPlaceholder('0901234567').fill(data.phone);
    await page.getByPlaceholder('Tối thiểu 6 ký tự').fill(data.password);
    await page.getByPlaceholder('Nhập lại mật khẩu').fill(data.confirmPassword);

    await page.getByRole('button', { name: 'Đăng ký' }).click();

    // Wait for API response — either redirect to login or show server validation error
    await page.waitForTimeout(3000);
    
    // If registration succeeds, user is redirected to Login page
    // If it fails (e.g., username taken), an error message shows
    const isOnLogin = page.url().includes('/login');
    const hasServerError = await page.locator('text=/đã tồn tại|đã được sử dụng/i').count() > 0;
    
    expect(isOnLogin || hasServerError).toBeTruthy();
  });

  test('"Đã có tài khoản?" link navigates to login', async ({ page }) => {
    await page.goto(ROUTES.REGISTER);

    await page.getByRole('link', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('"Đăng ký đối tác" link navigates to seller registration', async ({ page }) => {
    await page.goto(ROUTES.REGISTER);

    await page.getByRole('link', { name: 'Đăng ký đối tác' }).click();
    await expect(page).toHaveURL(/\/register\/seller/);
  });

  test('Seller registration page shows multi-step form', async ({ page }) => {
    await page.goto(ROUTES.REGISTER_SELLER);

    // Should show step indicator
    await expect(page.getByText('Đăng ký đối tác')).toBeVisible();
    
    // Step 1 fields visible
    await expect(page.getByPlaceholder('username')).toBeVisible();
    
    // Step 2 button
    await expect(page.getByRole('button', { name: 'Tiếp tục' })).toBeVisible();
  });
});
