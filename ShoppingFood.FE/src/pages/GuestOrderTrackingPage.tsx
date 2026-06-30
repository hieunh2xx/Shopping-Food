import { useState, useEffect } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input } from '../components/common';
import { orderService } from '../services/OrderService';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

export function GuestOrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';
  
  const [orderCode, setOrderCode] = useState(initialOrderId);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialOrderId) {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          const res = await orderService.getOrderDetails(initialOrderId.trim());
          if (!res.error && res.data) {
            setOrder(res.data);
          } else {
            toast.error('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã.');
            setOrder(null);
          }
        } catch (error) {
          toast.error('Lỗi khi tra cứu đơn hàng');
          setOrder(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [initialOrderId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await orderService.getOrderDetails(orderCode.trim());
      if (!res.error && res.data) {
        setOrder(res.data);
      } else {
        toast.error('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã.');
        setOrder(null);
      }
    } catch (error) {
      toast.error('Lỗi khi tra cứu đơn hàng');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'processing': return <Package className="w-6 h-6 text-blue-500" />;
      case 'shipped': return <Truck className="w-6 h-6 text-purple-500" />;
      case 'delivered': return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'cancelled': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Đang chờ xử lý';
      case 'processing': return 'Đang chuẩn bị';
      case 'shipped': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao thành công';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Search className="w-8 h-8 text-orange-500" />
            Tra Cứu Đơn Hàng
          </h1>
          <p className="text-gray-500">Nhập mã đơn hàng của bạn để theo dõi tiến trình giao hàng</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <Input 
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="Nhập mã đơn hàng (VD: ORD-12345...)"
                className="h-14 text-lg"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-14 px-8 bg-orange-600 hover:bg-orange-700 text-lg font-semibold rounded-xl"
            >
              {isLoading ? 'Đang tìm...' : 'Tra cứu'}
            </Button>
          </form>
        </div>

        {order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border-4 border-orange-100">
                {getStatusIcon(order.status)}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-500 font-medium mb-1">Mã đơn hàng: #{order.id.substring(0,8)}</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{getStatusText(order.status)}</h3>
                <p className="text-gray-600 text-sm">
                  Cập nhật lần cuối: {formatDate(order.updatedAt || order.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Info */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" /> Thông tin nhận hàng
                </h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-700">Người nhận:</span> {order.contactName}</p>
                  <p><span className="font-medium text-gray-700">Điện thoại:</span> {order.contactPhone}</p>
                  <p><span className="font-medium text-gray-700">Địa chỉ:</span> {order.deliveryAddress}</p>
                  {order.note && <p><span className="font-medium text-gray-700">Ghi chú:</span> {order.note}</p>}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" /> Chi tiết đơn hàng
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{item.productName}</p>
                        <p className="text-xs text-gray-500 mt-1">x{item.quantity}</p>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-orange-600">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-1">Thanh toán: {order.paymentMethod}</p>
                </div>
              </div>
            </div>
            
            {order.status.toLowerCase() === 'pending' && (
              <div className="flex justify-center mt-6">
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={async () => {
                    if (window.confirm('Bạn chắc chắn muốn hủy đơn này?')) {
                      try {
                        await orderService.cancelOrder({ orderId: order.id, guestUserId: localStorage.getItem('sf_guest_id') || undefined });
                        toast.success('Hủy đơn thành công');
                        // re-fetch
                        handleSearch({ preventDefault: () => {} } as any);
                      } catch (error) {
                        toast.error('Lỗi khi hủy đơn');
                      }
                    }
                  }}
                >
                  <XCircle className="w-5 h-5 mr-2" /> Hủy Đơn Hàng Này
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
