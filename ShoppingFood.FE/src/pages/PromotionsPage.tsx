import { CustomerVouchers } from '../components/profile/CustomerVouchers';
import { Tag } from 'lucide-react';

export function PromotionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Tag className="w-8 h-8 text-orange-500" />
            Khuyến Mãi Hệ Thống
          </h1>
          <p className="text-gray-600">
            Lưu ngay các mã giảm giá hấp dẫn vào ví để sử dụng khi đặt hàng nhé!
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <CustomerVouchers />
        </div>
      </div>
    </div>
  );
}
