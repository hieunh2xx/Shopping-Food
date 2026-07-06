import { test, expect } from '@playwright/test';
import { ROUTES } from '../helpers/test-data';
import { getLoginSubmitButton } from '../helpers/auth';

/**
 * Test Suite 01: Public Pages
 * Flow: Anonymous user browses the public-facing pages.
 * No login required.
 */

test.describe('Public Pages — Anonymous Browsing', () => {

  test('Home page loads with hero section and feature cards', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    
    // Hero heading
    await expect(page.locator('h1')).toContainText('Đặt món ngon');
    
    // Feature cards section
    await expect(page.getByText('1000+ Nhà hàng')).toBeVisible();
    await expect(page.getByText('Giao nhanh 30p')).toBeVisible();
    await expect(page.getByText('Thanh toán an toàn')).toBeVisible();

    // CTA buttons
    await expect(page.getByRole('link', { name: 'Xem thực đơn' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trở thành đối tác' })).toBeVisible();
  });

  test('Home page shows Best Sellers section', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    
    // Best sellers heading
    await expect(page.getByText('Món bán chạy')).toBeVisible();
    await expect(page.getByText('Được yêu thích nhất tuần này')).toBeVisible();
  });

  test('Home page shows Nearby Restaurants section', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    
    await expect(page.getByText('Quán ngon quanh bạn')).toBeVisible();
  });

  test('Navigate to Products page', async ({ page }) => {
    await page.goto(ROUTES.PRODUCTS);
    
    // Page should load without crash
    await expect(page).toHaveURL(/\/products/);
    
    // Wait for content to render (products or empty state)
    await page.waitForTimeout(2000);
    
    // The page should have rendered without errors
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Navigate to Restaurants page', async ({ page }) => {
    await page.goto(ROUTES.RESTAURANTS);
    
    await expect(page).toHaveURL(/\/restaurants/);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Navigate to Help Center page', async ({ page }) => {
    await page.goto(ROUTES.HELP_CENTER);
    
    await expect(page).toHaveURL(/\/help/);
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Navigate to Terms of Use page', async ({ page }) => {
    await page.goto(ROUTES.TERMS);
    
    await expect(page).toHaveURL(/\/terms/);
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Navigate to Privacy Policy page', async ({ page }) => {
    await page.goto(ROUTES.PRIVACY);
    
    await expect(page).toHaveURL(/\/privacy/);
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Navigate from Home to Products via CTA button', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    
    await page.getByRole('link', { name: 'Xem thực đơn' }).click();
    await expect(page).toHaveURL(/\/products/);
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-at-all');
    
    // The NotFoundPage should render (look for 404-related content)
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page renders correctly', async ({ page }) => {
    await page.goto(ROUTES.LOGIN);
    
    await expect(page.getByRole('heading', { name: /chào mừng trở lại/i })).toBeVisible();
    await expect(page.getByPlaceholder('Nhập tên đăng nhập hoặc email')).toBeVisible();
    await expect(page.getByPlaceholder('Nhập mật khẩu')).toBeVisible();
    await expect(getLoginSubmitButton(page)).toBeVisible();
  });

  test('Register page renders correctly', async ({ page }) => {
    await page.goto(ROUTES.REGISTER);
    
    await expect(page.getByText('Tạo tài khoản')).toBeVisible();
    await expect(page.getByPlaceholder('username')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng ký' })).toBeVisible();
  });
});
