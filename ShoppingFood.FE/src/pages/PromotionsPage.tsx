import { CustomerVouchers } from '../components/profile/CustomerVouchers';
import { Tag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';

/**
 * Trang Khám Phá Mã Khuyến Mãi Toàn Hệ Thống (PromotionsPage).
 * Trưng bày tất cả các mã voucher giảm giá công khai của toàn sàn và các quán ăn đối tác để người dùng lưu vào ví.
 */
export function PromotionsPage() {
  return (
    <div className="h-screen bg-gray-50 py-8 flex flex-col">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col w-full">
        <div>
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 mb-6 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
        </div>
        <div className="text-center mb-6 shrink-0">
          <h1 className="text-3xl font-black text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Tag className="w-8 h-8 text-orange-500" />
            Khuyến Mãi Hệ Thống
          </h1>
          <p className="text-gray-600">
            Lưu ngay các mã giảm giá hấp dẫn vào ví để sử dụng khi đặt hàng nhé!
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col mb-8 min-h-0">
          <CustomerVouchers />
        </div>
      </div>
    </div>
  );
}
