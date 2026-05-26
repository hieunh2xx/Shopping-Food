import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ROUTES } from '../routes/routeConfig';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-8xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy trang</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Trang bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.
        </p>
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-gray-900 font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
