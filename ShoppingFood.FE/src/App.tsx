import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { UserLocationProvider } from './contexts/UserLocationContext';
import { AppRoutes } from './routes/AppRoutes';
import { ScrollToTop } from './components/common/ScrollToTop';

/**
 * Component Gốc Của Ứng Dụng (App Root Component).
 * Bọc toàn bộ ứng dụng bằng các Provider quản lý trạng thái toàn cục:
 * - BrowserRouter: Điều hướng và định tuyến URL
 * - ScrollToTop: Tự động cuộn lên đầu trang khi chuyển Route
 * - ConfirmProvider: Hộp thoại xác nhận hành động toàn cục
 * - AuthProvider: Quản lý đăng nhập, phân quyền và phiên làm việc
 * - UserLocationProvider: Quản lý GPS và tọa độ vị trí người dùng
 * - Toaster: Hệ thống thông báo toast notification (thành công, lỗi, cảnh báo)
 * - CartProvider: Quản lý giỏ hàng, tính toán món và mã giảm giá
 * - AppRoutes: Bộ cây điều hướng trang.
 */
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ConfirmProvider>
        <AuthProvider>
          <UserLocationProvider>
            <Toaster

              position="top-right"
              containerStyle={{ zIndex: 99999 }}
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1F2937',
                  color: '#F3F4F6',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#FF6B35',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFFFF',
                  },
                },
              }}
            />
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </UserLocationProvider>
        </AuthProvider>
      </ConfirmProvider>
    </BrowserRouter>
  );
}

export default App;
