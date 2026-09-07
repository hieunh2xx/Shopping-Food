import { useState, useEffect } from 'react';
import { Tag, CheckCircle2, Ticket } from 'lucide-react';
import { discountService } from '../../services/DiscountService';
import type { IDiscountDto } from '../../interfaces';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';

/**
 * Danh Sách Mã Giảm Giá Của Khách Hàng (CustomerVouchers).
 * Hỗ trợ 2 chế độ hiển thị:
 * - Chế độ Ví voucher cá nhân (`isWalletMode = true`): Chỉ hiển thị các mã đã lưu của người dùng, phân loại đã dùng, hết hạn hoặc sẵn sàng dùng.
 * - Chế độ Khám phá voucher (`isWalletMode = false`): Danh sách voucher toàn sàn/quán ăn để khách hàng bấm lưu vào ví.
 */
export function CustomerVouchers({ isWalletMode = false }: { isWalletMode?: boolean }) {
  const [vouchers, setVouchers] = useState<IDiscountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVouchers();
  }, []);

  /**
   * Tải danh sách mã giảm giá từ API tùy theo chế độ hiển thị (đã lưu hoặc tất cả).
   */
  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await discountService.getDiscounts({ 
        take: 500, 
        isSavedOnly: isWalletMode 
      });
      if (!res.error && res.data) {
        setVouchers(res.data);
      }
    } catch {
      toast.error('Tải danh sách mã giảm giá thất bại do lỗi kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Lưu mã giảm giá vào ví cá nhân của người dùng.
   * @param discountId - ID của mã giảm giá
   */
  const handleSaveVoucher = async (discountId: string) => {
    try {
      const res = await discountService.saveDiscount({ discountId });
      if (!res.error) {
        toast.success('Đã lưu mã giảm giá vào ví!');
        setVouchers(prev => prev.map(v => v.id === discountId ? { ...v, isSaved: true } : v));
      } else {
        toast.error(res.message);
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
          {isWalletMode && (
            <Link to={ROUTES.PROMOTIONS} className="mt-4 inline-block px-4 py-2 bg-orange-100 text-orange-600 font-semibold rounded-lg hover:bg-orange-200 transition-colors">
              Lấy thêm ưu đãi
            </Link>
          )}
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vouchers.map(voucher => {
              const isExpired = new Date(voucher.endDate) < new Date();
              const isUsedUp = voucher.isUsedUp;
              const isInactive = voucher.status !== 'Active';
              const isUnavailable = isExpired || isUsedUp || isInactive;
              
              return (
                <div key={voucher.id} className={`flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isUnavailable ? 'opacity-60 grayscale-[50%]' : ''}`}>
                  <div className={`w-1/3 text-white p-4 flex flex-col justify-center items-center text-center relative ${isUnavailable ? 'bg-gray-400' : 'bg-gradient-to-br from-orange-500 to-red-500'}`}>
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
                    {voucher.restaurantId ? (
                      <span className="ml-auto px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100 truncate max-w-[110px]" title={voucher.restaurantName}>
                        {voucher.restaurantName}
                      </span>
                    ) : (
                      <span className="ml-auto px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold border border-purple-100">
                        Hệ thống
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{voucher.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">Đơn tối thiểu {voucher.minOrderAmount.toLocaleString()}đ</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">HSD: {new Date(voucher.endDate).toLocaleDateString()}</p>
                </div>
                <div className="mt-3 flex justify-end">
                  {isWalletMode ? (
                    isUsedUp ? (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg flex items-center gap-1 cursor-not-allowed">
                        Đã sử dụng
                      </span>
                    ) : isExpired ? (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg flex items-center gap-1 cursor-not-allowed">
                        Hết hạn
                      </span>
                    ) : isInactive ? (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg flex items-center gap-1 cursor-not-allowed">
                        Đã kết thúc
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 text-orange-600 text-xs font-bold rounded-lg flex items-center gap-1">
                        Sẵn sàng sử dụng <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )
                  ) : voucher.isSaved ? (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg flex items-center gap-1 cursor-not-allowed">
                      Đã lưu <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleSaveVoucher(voucher.id)}
                      className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1"
                    >
                      Lưu mã <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            )})}
          </div>
        </div>
      )}
      {isWalletMode && vouchers.length > 0 && (
        <div className="text-center mt-6">
          <Link to={ROUTES.PROMOTIONS} className="inline-block px-4 py-2 bg-orange-50 text-orange-600 font-semibold rounded-lg hover:bg-orange-100 transition-colors">
            Khám phá thêm ưu đãi khác
          </Link>
        </div>
      )}
    </div>
  );
}
