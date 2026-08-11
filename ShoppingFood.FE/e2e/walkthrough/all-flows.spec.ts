/**
 * UI Walkthrough — liên kết toàn bộ luồng nghiệp vụ để xem trực quan.
 *
 * Chạy:
 *   npm run test:walkthrough          — mở browser, chạy tuần tự từng bước
 *   npm run test:walkthrough:ui       — Playwright UI Mode (xem từng step)
 *   WALKTHROUGH_PAUSE_MS=2500 npm run test:walkthrough  — chậm hơn giữa các bước
 *
 * Yêu cầu: API http://localhost:5091 và FE (Playwright tự khởi động FE nếu chưa chạy).
 */
import { test, expect } from '@playwright/test';
import { ROUTES, TEST_ACCOUNTS } from '../helpers/test-data';
import { loginViaUI, logout } from '../helpers/auth';
import { pauseForViewer, showStepLabel, visitStep } from '../helpers/walkthrough';

test.describe.configure({ mode: 'serial' });

test.describe('Walkthrough — Toàn bộ luồng UniEats', () => {
  test('Luồng 1→5: Công khai → Khách hàng → Seller → Shipper → Admin → Thanh toán', async ({
    page,
  }) => {
  // ─── PHẦN 1: Trang công khai ─────────────────────────────────────────────
  await test.step('1. Trang công khai (khách vãng lai)', async () => {
    await visitStep(page, ROUTES.HOME, 'Luồng 1/6 — Trang chủ', 'Khách vãng lai duyệt ứng dụng');
    await expect(page.locator('body')).toBeVisible();

    await visitStep(page, ROUTES.PRODUCTS, 'Sản phẩm / Món ăn', 'Danh sách món từ API');
    await visitStep(page, ROUTES.RESTAURANTS, 'Nhà hàng', 'Danh sách cửa hàng đối tác');
    await visitStep(page, ROUTES.HELP_CENTER, 'Trung tâm trợ giúp', 'FAQ & hỗ trợ');
    await visitStep(page, ROUTES.LOGIN, 'Đăng nhập', 'Form xác thực người dùng');
    await visitStep(page, ROUTES.REGISTER, 'Đăng ký khách hàng', 'Tạo tài khoản mới');
    await visitStep(page, ROUTES.REGISTER_SELLER, 'Đăng ký Seller', 'Đăng ký đối tác nhà hàng');
    await visitStep(page, ROUTES.REGISTER_SHIPPER, 'Đăng ký Shipper', 'Đăng ký tài xế giao hàng');
  });

  // ─── PHẦN 2: Khách hàng — mua hàng & thanh toán ────────────────────────
  await test.step('2. Khách hàng — duyệt, giỏ hàng, checkout, ví', async () => {
    await showStepLabel(page, 'Luồng 2/6 — Khách hàng', `Đăng nhập: ${TEST_ACCOUNTS.customer.username}`);
    await loginViaUI(page, TEST_ACCOUNTS.customer.username, TEST_ACCOUNTS.customer.password);
    await pauseForViewer(page);

    await visitStep(page, ROUTES.PRODUCTS, 'Duyệt sản phẩm', 'Thêm món vào giỏ');
    const productLink = page.locator('a[href*="/products/"]').first();
    if (await productLink.isVisible({ timeout: 8000 }).catch(() => false)) {
      await productLink.click();
      await pauseForViewer(page);
      const addBtn = page.getByRole('button', { name: /thêm vào giỏ/i });
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await pauseForViewer(page);
      }
    }

    await visitStep(page, ROUTES.CHECKOUT, 'Thanh toán (Checkout)', 'UC-PAY-001: COD, ví, thẻ, e-wallet');
    if (page.url().includes('/checkout')) {
      await expect(page.getByText(/phương thức thanh toán/i)).toBeVisible({ timeout: 10000 });
    }

    await visitStep(page, `${ROUTES.PROFILE}?tab=wallet`, 'Ví khách hàng', 'UC-PAY-006: Nạp tiền & lịch sử');
    await visitStep(page, ROUTES.ORDERS, 'Đơn hàng của tôi', 'Theo dõi trạng thái đơn');
  });

  // ─── PHẦN 3: Seller — quản lý cửa hàng ─────────────────────────────────
  await test.step('3. Seller — dashboard, sản phẩm, ví doanh thu', async () => {
    await logout(page);
    await showStepLabel(page, 'Luồng 3/6 — Seller', `Đăng nhập: ${TEST_ACCOUNTS.seller.username}`);
    await loginViaUI(page, TEST_ACCOUNTS.seller.username, TEST_ACCOUNTS.seller.password);
    await pauseForViewer(page);

    await visitStep(page, ROUTES.SELLER_DASHBOARD, 'Dashboard Seller', 'Thống kê doanh thu & đơn hàng');
    await visitStep(page, ROUTES.SELLER_PRODUCTS, 'Quản lý sản phẩm', 'Thực đơn nhà hàng');
    await visitStep(page, ROUTES.SELLER_ORDERS, 'Đơn hàng Seller', 'Xử lý đơn từ khách');
    await visitStep(page, ROUTES.SELLER_WALLET, 'Ví Seller', 'UC-PAY-007: Rút tiền doanh thu');
    await expect(page.getByText(/số dư ví nhà hàng|rút tiền/i).first()).toBeVisible({ timeout: 15000 });
  });

  // ─── PHẦN 4: Shipper — giao hàng & COD ─────────────────────────────────
  await test.step('4. Shipper — dashboard, ví COD, thu nhập', async () => {
    await logout(page);
    await showStepLabel(page, 'Luồng 4/6 — Shipper', `Đăng nhập: ${TEST_ACCOUNTS.shipper.username}`);
    await loginViaUI(page, TEST_ACCOUNTS.shipper.username, TEST_ACCOUNTS.shipper.password);
    await pauseForViewer(page);

    await visitStep(page, ROUTES.SHIPPER_DASHBOARD, 'Dashboard Shipper', 'Nhận đơn & giao hàng');
    await visitStep(page, ROUTES.SHIPPER_WALLET, 'Ví Shipper & COD', 'UC-PAY-008/014: Nộp tiền thu hộ');
    await visitStep(page, ROUTES.SHIPPER_INCOME, 'Thu nhập Shipper', 'Báo cáo phí ship & bonus');
    await visitStep(page, ROUTES.SHIPPER_HISTORY, 'Lịch sử giao hàng', 'Đơn đã hoàn thành');
  });

  // ─── PHẦN 5: Admin — duyệt & quản trị ────────────────────────────────
  await test.step('5. Admin — duyệt hồ sơ, tài chính, quản trị', async () => {
    await logout(page);
    await showStepLabel(page, 'Luồng 5/6 — Admin', `Đăng nhập: ${TEST_ACCOUNTS.admin.username}`);
    await loginViaUI(page, TEST_ACCOUNTS.admin.username, TEST_ACCOUNTS.admin.password);
    await pauseForViewer(page);

    await visitStep(page, ROUTES.ADMIN_DASHBOARD, 'Admin Dashboard', 'Tổng quan hệ thống');
    await visitStep(page, ROUTES.ADMIN_APPROVALS, 'Phê duyệt', 'Duyệt Seller / Shipper / Món ăn');

    await showStepLabel(page, 'Tab phê duyệt', 'Cửa hàng · Tài xế · Món ăn mới');
    for (const tab of [/Cửa hàng/i, /Tài xế/i, /Món ăn mới/i]) {
      const btn = page.getByRole('button', { name: tab });
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click();
        await pauseForViewer(page);
      }
    }

    await visitStep(page, ROUTES.ADMIN_FINANCE, 'Tài chính sàn', 'UC-PAY-009/015: Đối soát & rút tiền');
    await visitStep(page, ROUTES.ADMIN_USERS, 'Quản lý người dùng', 'Tài khoản hệ thống');
    await visitStep(page, ROUTES.ADMIN_RESTAURANTS, 'Quản lý nhà hàng', 'Danh sách đối tác');
  });

  // ─── PHẦN 6: Coordinator + tổng kết thanh toán ─────────────────────────
  await test.step('6. Coordinator — điều phối giao hàng', async () => {
    await logout(page);
    await showStepLabel(page, 'Luồng 6/6 — Coordinator', `Đăng nhập: ${TEST_ACCOUNTS.coordinator.username}`);
    await loginViaUI(page, TEST_ACCOUNTS.coordinator.username, TEST_ACCOUNTS.coordinator.password);
    await pauseForViewer(page);

    await visitStep(page, ROUTES.COORDINATOR_DASHBOARD, 'Bảng điều phối', 'Phân công shipper');
    await visitStep(page, '/coordinator/monitor', 'Giám sát Shipper', 'Theo dõi tài xế realtime');
    await visitStep(page, '/coordinator/history', 'Lịch sử điều phối', 'Đơn đã phân công');

    await showStepLabel(page, 'Hoàn tất Walkthrough', 'Đã xem toàn bộ 6 luồng nghiệp vụ chính');
    await pauseForViewer(page);
    await pauseForViewer(page);
  });
  });
});
