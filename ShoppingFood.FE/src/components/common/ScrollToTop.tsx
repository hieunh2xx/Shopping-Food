import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component Tự động Cuộn trang lên đỉnh (ScrollToTop).
 * Lắng nghe thay đổi đường dẫn pathname của React Router để cuộn màn hình về tọa độ (0, 0).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
