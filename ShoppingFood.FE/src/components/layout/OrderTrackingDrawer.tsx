import { useState, useEffect } from 'react';
import { Search, X, Package, CheckCircle2, Truck, Clock, XCircle, ShoppingBag } from 'lucide-react';
import { Button, Input } from '../common';
import { orderService } from '../../services/OrderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { CustomerOrderDetailModal } from '../order/CustomerOrderDetailModal';
import { useAuth } from '../../hooks';

interface OrderTrackingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTrackingDrawer({ isOpen, onClose }: OrderTrackingDrawerProps) {
  const { isAuthenticated } = useAuth();
  const [orderCode, setOrderCode] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [detailModal, setDetailModal] = useState({ isOpen: false, orderId: '' });
  
  const [skip, setSkip] = useState(0);
  const take = 10;
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSkip(0);
      setHasMore(true);
      fetchOrders(false, 0);
    }
  }, [isOpen, isAuthenticated]);

  const fetchOrders = async (isLoadMore = false, currentSkip = 0) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      let res;
      if (isAuthenticated) {
        res = await orderService.getMyOrders({ skip: currentSkip, take });
      } else {
        const guestUserId = localStorage.getItem('sf_guest_id');
        if (guestUserId) {
          res = await orderService.getGuestOrders(guestUserId, { skip: currentSkip, take });
        }
      }
      
      if (res && !res.error && res.data) {
        if (isLoadMore) {
          setOrders(prev => [...prev, ...res.data]);
        } else {
          setOrders(res.data);
        }
        setHasMore(res.data.length === take);
        setSkip(currentSkip);
      } else if (!isLoadMore) {
        setOrders([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    fetchOrders(true, skip + take);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng');
      return;
    }
    
    // Mở modal chi tiết luôn
    setDetailModal({ isOpen: true, orderId: orderCode.trim() });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'preparing': return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipping': return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Đang chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'preparing': return 'Đang chuẩn bị';
      case 'waitingforshipper': return 'Chờ tài xế';
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao thành công';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600';
      case 'preparing': return 'text-blue-600';
      case 'shipping': return 'text-purple-600';
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Search className="w-6 h-6 text-orange-500" />
            Tra cứu đơn hàng
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
          <form onSubmit={handleSearch} className="space-y-3 bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Nhập mã đơn hàng để tra cứu chi tiết</p>
            <div className="flex gap-2">
              <Input
                placeholder="VD: ABCD-1234..."
                value={orderCode}
                onChange={e => setOrderCode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="primary" className="bg-orange-500">
                Tìm
              </Button>
            </div>
          </form>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-500" />
              Lịch sử mua hàng của bạn
            </h3>
            
            {isLoading ? (
              <div className="text-center py-10 text-gray-500">Đang tải lịch sử...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Chưa có đơn hàng nào gần đây</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => setDetailModal({ isOpen: true, orderId: order.id })}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-gray-800">#{order.id.substring(0, 8).toUpperCase()}</span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-sm font-bold ${getStatusColorClass(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{getStatusText(order.status)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                      <p className="text-sm text-gray-600 truncate flex-1 pr-2">{order.restaurantName}</p>
                      <p className="font-bold text-orange-600">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="flex justify-center pt-2 pb-4">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore} 
                      disabled={isLoadingMore}
                      className="w-full text-sm border-gray-200 text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                    >
                      {isLoadingMore ? 'Đang tải thêm...' : 'Xem thêm đơn cũ'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerOrderDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => {
          setDetailModal({ isOpen: false, orderId: '' });
          fetchOrders(); // refresh after modal close
        }}
        orderId={detailModal.orderId}
      />
    </>
  );
}
