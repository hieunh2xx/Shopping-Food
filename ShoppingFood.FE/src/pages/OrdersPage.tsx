import { useState, useEffect } from 'react';
import { orderService } from '../services/OrderService';
import type { IOrderSummary } from '../interfaces';
import toast from 'react-hot-toast';
import { PackageOpen, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/common';

export function OrdersPage() {
  const [orders, setOrders] = useState<IOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getMyOrders();
      if (!res.error && res.data) {
        setOrders(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải danh sách đơn hàng');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    try {
      await orderService.cancelOrder({ orderId });
      toast.success('Hủy đơn hàng thành công');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi hủy đơn hàng');
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      await orderService.reorder({ orderId });
      toast.success('Đã thêm lại các món vào giỏ hàng');
      // Should ideally refresh cart context here or redirect to cart
      // window.dispatchEvent(new Event('cart_updated')); // naive approach if context needs trigger
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi đặt lại đơn hàng');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Đơn hàng của tôi</h1>

      {isLoading ? (
        <div className="flex justify-center p-10">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-sm border border-gray-100 text-center flex flex-col items-center">
          <PackageOpen className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Chưa có đơn hàng nào</h3>
          <p className="text-gray-500">Bạn chưa thực hiện bất kỳ giao dịch nào trên hệ thống.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-800">Đơn hàng #{order.id.substring(0, 8)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Ngày đặt: {formatDate(order.createdAt)}</p>
                <p className="text-sm text-gray-500 mb-4">Thanh toán: {order.paymentMethod}</p>
                
                <div className="flex gap-2">
                  {order.status.toLowerCase() === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Hủy đơn
                    </Button>
                  )}
                  {['delivered', 'cancelled'].includes(order.status.toLowerCase()) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReorder(order.id)}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" /> Đặt lại
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-right sm:mt-0 mt-4 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
                <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

