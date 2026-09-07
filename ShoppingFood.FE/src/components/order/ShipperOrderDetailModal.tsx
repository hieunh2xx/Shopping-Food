import { useEffect, useState } from 'react';
import { MapPin, Package, CreditCard, Clock, Loader2, Truck } from 'lucide-react';
import { Modal } from '../common';
import { orderService } from '../../services/OrderService';
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel, getOrderStatusColor } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface ShipperOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

/**
 * Modal Xem Chi Tiết Đơn Hàng Dành Cho Tài Xế (ShipperOrderDetailModal).
 * Hiển thị các thông tin phục vụ giao hàng:
 * - Trạng thái đơn, thời gian cập nhật
 * - Người nhận: Tên, SĐT, Địa chỉ giao hàng
 * - Thanh toán: Hình thức, tổng tiền cần thu (nếu là COD)
 * - Chi tiết thu nhập của tài xế: Phí cơ bản, phí theo khoảng cách km, thưởng giờ cao điểm và tổng thu nhập nhận được
 * - Danh sách các món ăn cần lấy từ nhà hàng.
 */
export function ShipperOrderDetailModal({ isOpen, onClose, orderId }: ShipperOrderDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await orderService.getOrderDetails(orderId);
        if (cancelled) return;
        if (!res.error && res.data) setOrder(res.data);
        else toast.error(res.message || 'Không tải được chi tiết đơn');
      } catch {
        if (!cancelled) toast.error('Lỗi kết nối khi tải đơn');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, orderId]);


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={orderId ? `Chi tiết đơn #${orderId.slice(0, 8).toUpperCase()}` : 'Chi tiết đơn'}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          Đang tải...
        </div>
      ) : !order ? (
        <p className="text-center text-gray-400 py-8 text-sm">Không có dữ liệu đơn hàng</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
              {getOrderStatusLabel(order.status)}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(order.updatedAt || order.createdAt)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Giao đến
              </p>
              <p className="font-medium text-gray-900">{order.contactName || '—'}</p>
              <p className="text-gray-600">{order.deliveryAddress || '—'}</p>
              {order.contactPhone && <p className="text-gray-500">{order.contactPhone}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Thanh toán
              </p>
              <p className="font-medium text-gray-900">{getPaymentMethodLabel(order.paymentMethod)}</p>
              <p className="text-gray-600">Tổng đơn: {formatCurrency(order.totalAmount)}</p>
              <p className="text-emerald-600 font-semibold">
                Thu nhập: {formatCurrency(order.shipperIncome ?? 0)}
              </p>
            </div>
          </div>

          {(order.shipperBaseFeeAmount != null || order.shippingFee != null) && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs space-y-1">
              <p className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                <Truck className="w-3.5 h-3.5" /> Chi tiết thu nhập
              </p>
              <div className="flex justify-between"><span>Phí cơ bản</span><span className="font-bold">{formatCurrency(order.shipperBaseFeeAmount || 0)}</span></div>
              <div className="flex justify-between"><span>Phí km</span><span className="font-bold">{formatCurrency(order.shipperDistanceFeeAmount || 0)}</span></div>
              {(order.shipperPeakBonus || 0) > 0 && (
                <div className="flex justify-between"><span>Thưởng</span><span className="font-bold">{formatCurrency(order.shipperPeakBonus)}</span></div>
              )}
              <div className="flex justify-between"><span>Phí ship khách trả</span><span className="font-bold">{formatCurrency(order.shippingFee || 0)}</span></div>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Món ăn
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(order.items || []).map((item: any, idx: number) => (
                <div key={item.id || idx} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-800">
                    {item.quantity}× {item.productName || item.name || 'Món'}
                  </span>
                  <span className="font-medium text-gray-900">{formatCurrency((item.unitPrice || item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <p className="text-sm text-gray-400">Không có danh sách món</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
