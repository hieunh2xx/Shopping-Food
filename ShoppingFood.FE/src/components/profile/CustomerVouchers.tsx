import { useState, useEffect } from 'react';
import { Tag, CheckCircle2, Ticket } from 'lucide-react';
import { discountService } from '../../services/DiscountService';
import type { IDiscountDto } from '../../interfaces';
import toast from 'react-hot-toast';

export function CustomerVouchers() {
  const [vouchers, setVouchers] = useState<IDiscountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      // Get all public active vouchers
      const res = await discountService.getDiscounts({ take: 500 });
      if (!res.error && res.data) {
        setVouchers(res.data.filter(d => d.status === 'Active' && !d.restaurantId));
      }
    } catch {
      toast.error('Tải danh sách mã giảm giá thất bại do lỗi kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVoucher = async (discountId: string) => {
    try {
      const res = await discountService.saveDiscount({ discountId });
      if (!res.error) {
        toast.success('Đã lưu mã giảm giá vào ví!');
        // Refresh or visually mark as saved if backend supports a saved flag
      } else {
        toast.error(res.message || 'Bạn đã lưu mã này rồi hoặc có lỗi xảy ra');
      }
    } catch {
      toast.error('Lưu mã giảm giá thất bại do lỗi kết nối mạng.');
    }
  };

  if (isLoading) {
    return <div className="text-center p-6 text-gray-500">Đang tải mã giảm giá...</div>;
  }

  return (
    <div className="space-y-4">
      {vouchers.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
          <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Hiện chưa có mã giảm giá nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vouchers.map(voucher => (
            <div key={voucher.id} className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="w-1/3 bg-gradient-to-br from-orange-500 to-red-500 text-white p-4 flex flex-col justify-center items-center text-center relative">
                {/* Dotted border effect */}
                <div className="absolute top-0 bottom-0 -right-2 w-4 flex flex-col justify-between py-1 z-10">
                  {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-white rounded-full -ml-2" />
                  ))}
                </div>
                
                <span className="text-2xl font-black">{voucher.type === 'Percentage' ? `${voucher.value}%` : `-${(voucher.value / 1000)}k`}</span>
                <span className="text-xs font-medium uppercase mt-1 opacity-90 text-orange-100">Giảm giá</span>
              </div>
              <div className="w-2/3 p-4 flex flex-col justify-between pl-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-gray-900 text-lg uppercase tracking-tight">{voucher.code}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{voucher.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">Đơn tối thiểu {voucher.minOrderAmount.toLocaleString()}đ</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">HSD: {new Date(voucher.endDate).toLocaleDateString()}</p>
                </div>
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={() => handleSaveVoucher(voucher.id)}
                    className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1"
                  >
                    Lưu mã <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
