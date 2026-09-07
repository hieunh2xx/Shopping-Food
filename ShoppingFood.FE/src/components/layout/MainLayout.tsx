import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { LiveChatWidget } from '../chat/LiveChatWidget';

/**
 * Layout Giao diện chính của Website (MainLayout).
 * Bao bọc các trang công khai (Trang chủ, Thực đơn, Quán ăn, Chi tiết món) với Header ở trên, Footer ở dưới, Outlet ở giữa và Widget Trò chuyện trực tuyến (LiveChatWidget) nổi ở góc dưới.
 */
export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <LiveChatWidget />
    </div>
  );
}
