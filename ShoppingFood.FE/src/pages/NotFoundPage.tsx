import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { Button } from '../components/common';
import { ROUTES } from '../routes/routeConfig';

/**
 * Trang Báo Lỗi 404 Không Tìm Thấy Trang (NotFoundPage).
 * Hiển thị giao diện thân thiện khi người dùng truy cập một URL không tồn tại,
 * cung cấp các nút tắt quay lại Trang chủ hoặc Xem thực đơn món ăn.
 */
export function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">

      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-full h-full bg-white rounded-3xl shadow-xl shadow-orange-500/10 border border-gray-100 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-500">
            <ChefHat className="w-16 h-16 text-orange-500" />
            <span className="absolute -top-4 -right-4 text-4xl">❓</span>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-9xl font-black text-gray-900 mb-4 opacity-10">404</h1>
        <div className="-mt-16 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Ôi không! Bụng đói rồi...</h2>
          <p className="text-gray-500 text-lg">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={ROUTES.HOME} className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              Về trang chủ
            </Button>
          </Link>
          <Link to={ROUTES.PRODUCTS} className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full">
              Xem thực đơn
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
