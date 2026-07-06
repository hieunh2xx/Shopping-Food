import { type Page } from '@playwright/test';
import { TEST_ACCOUNTS } from './test-data';

/**
 * Shared authentication helpers for E2E tests.
 * Performs login via the actual UI (LoginPage).
 */

export function getLoginSubmitButton(page: Page) {
  return page.locator('form button[type="submit"]').first();
}

export async function loginViaUI(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  
  // Wait for the login form to render
  await page.waitForSelector('form', { timeout: 10_000 });

  // Fill in credentials - find inputs by placeholder text
  await page.getByPlaceholder('Nhập tên đăng nhập hoặc email').fill(username);
  await page.getByPlaceholder('Nhập mật khẩu').fill(password);

  // Submit form (avoid Microsoft social button that also contains "Đăng nhập")
  await getLoginSubmitButton(page).click();

  // Wait for navigation away from login page (successful login)
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  });
}

export async function loginAsCustomer(page: Page): Promise<void> {
  await loginViaUI(page, TEST_ACCOUNTS.customer.username, TEST_ACCOUNTS.customer.password);
}

export async function loginAsSeller(page: Page): Promise<void> {
  await loginViaUI(page, TEST_ACCOUNTS.seller.username, TEST_ACCOUNTS.seller.password);
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await loginViaUI(page, TEST_ACCOUNTS.admin.username, TEST_ACCOUNTS.admin.password);
}

/**
 * Check if user is currently logged in by looking for auth indicators
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if localStorage has auth token
    const token = await page.evaluate(() => localStorage.getItem('sf_token'));
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Logout by clearing localStorage and navigating to login
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    localStorage.removeItem('sf_refresh_token');
  });
  await page.goto('/login');
}
