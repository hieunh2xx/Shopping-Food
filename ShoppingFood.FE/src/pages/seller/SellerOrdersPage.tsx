import { useState, useEffect } from 'react';
import { orderService } from '../../services/OrderService';
import { authService } from '../../services/AuthService';
import { chatService } from '../../services/ChatService';
import { useAuth } from '../../hooks';
import {
  ShoppingBag,
  Clock,
  User,
  Phone,
  MapPin,
  Check,
  X,
  Utensils,
  Truck,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { Card, Button, Pagination } from '../../components/common';
import { OrderSellerChatModal } from '../../components/chat/OrderSellerChatModal';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xử lý', value: 'Pending' },
  { label: 'Đã xác nhận', value: 'Confirmed' },
  { label: 'Đang chuẩn bị', value: 'Preparing' },
  { label: 'Chờ tài xế', value: 'WaitingForShipper' },
  { label: 'Đang giao', value: 'Shipping' },
  { label: 'Đã giao', value: 'Delivered' },
  { label: 'Đã hủy', value: 'Cancelled' }
];

export function SellerOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orderChatMap, setOrderChatMap] = useState<Record<string, string>>({});
  const [sellerChat, setSellerChat] = useState<{ isOpen: boolean; orderId: string; sessionId?: string }>({
    isOpen: false,
    orderId: '',
  });

  const messageableStatuses = ['Confirmed', 'Preparing', 'WaitingForShipper', 'Shipping'];

  // Pagination states
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page]);

  useEffect(() => {
    const handleNotification = () => {
      fetchOrders();
    };
    window.addEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
    return () => {
      window.removeEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
    };
  }, [activeTab, page]);

  useEffect(() => {
    authService.getProfile().then(res => {
      if (!res.error && res.data?.sellerInfo?.restaurantId) {
        setRestaurantId(res.data.sellerInfo.restaurantId);
      }
    });
    chatService.getSellerOrderChats().then(res => {
      if (!res.error && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach(c => {
          if (c.orderId) map[c.orderId] = c.id;
        });
        setOrderChatMap(map);
      }
    });
  }, []);

  useEffect(() => {
    if (!token || !restaurantId) return;
    chatService.startConnection(token)
      .then(() => chatService.joinSellerInbox(restaurantId))
      .catch(() => undefined);
  }, [token, restaurantId]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      const params: any = { skip, take };
      if (activeTab) {
        params.status = activeTab;
      }
      const res = await orderService.getRestaurantOrders(params);
      if (!res.error && res.data) {
        setOrders(res.data);
        setTotal(res.total || 0);
      } else {
        toast.error(res.message || 'Lỗi khi tải danh sách đơn hàng');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    const toastId = toast.loading('Đang chấp nhận đơn hàng...');
    try {
      const res = await orderService.acceptOrder({ orderId });
      if (!res.error) {
        toast.success('Đã chấp nhận đơn hàng!', { id: toastId });
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, status: 'Confirmed' }));
        }
      } else {
        toast.error(res.message || 'Lỗi khi nhận đơn', { id: toastId });
      }
    } catch {
      toast.error('Có lỗi xảy ra', { id: toastId });
    }
  };

  const handlePrepare = async (orderId: string) => {
    const toastId = toast.loading('Đang chuyển trạng thái chuẩn bị...');
    try {
      const res = await orderService.prepareOrder({ orderId });
      if (!res.error) {
        toast.success('Đang thực hiện nấu món!', { id: toastId });
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, status: 'Preparing' }));
        }
      } else {
        toast.error(res.message || 'Lỗi thao tác', { id: toastId });
      }
    } catch {
      toast.error('Có lỗi xảy ra', { id: toastId });
    }
  };

  const handleWaitingForShipper = async (orderId: string) => {
    const toastId = toast.loading('Đang chuyển sang trạng thái chờ tài xế...');
    try {
      const res = await orderService.waitingForShipper({ orderId });
      if (!res.error) {
        toast.success('Chuẩn bị xong! Đang chờ tài xế đến lấy...', { id: toastId });
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, status: 'WaitingForShipper' }));
        }
      } else {
        toast.error(res.message || 'Lỗi thao tác', { id: toastId });
      }
    } catch {
      toast.error('Có lỗi xảy ra', { id: toastId });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    const toastId = toast.loading('Đang từ chối đơn hàng...');
    try {
      const res = await orderService.rejectOrder({
        orderId: selectedOrder.id,
        rejectReason: rejectReason
      });
      if (!res.error) {
        toast.success('Đã từ chối đơn hàng thành công', { id: toastId });
        setIsRejectModalOpen(false);
        setRejectReason('');
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(res.message || 'Lỗi khi từ chối đơn', { id: toastId });
      }
    } catch {
      toast.error('Có lỗi xảy ra', { id: toastId });
    }
  };

  const handleSellerCancel = async (orderId: string) => {
    const reason = window.prompt('Nhập lý do hủy đơn hàng:');
    if (!reason) return;
    const toastId = toast.loading('Đang hủy đơn hàng...');
    try {
      const res = await orderService.sellerCancelOrder({ orderId, reason });
      if (!res.error) {
        toast.success('Đã hủy đơn hàng thành công', { id: toastId });
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
      } else {
        toast.error(res.message || 'Lỗi khi hủy đơn', { id: toastId });
      }
    } catch {
      toast.error('Có lỗi xảy ra', { id: toastId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">Chờ nhận đơn</span>;
      case 'Confirmed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">Đã xác nhận</span>;
      case 'Preparing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-600">Đang chuẩn bị</span>;
      case 'WaitingForShipper':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-600">Chờ tài xế</span>;
      case 'Shipping':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-600">Đang giao hàng</span>;
      case 'Delivered':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-600">Đã giao thành công</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">Đã hủy đơn</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Xem và xử lý các đơn đặt tại quán của bạn</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.value
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders list */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="text-center py-10">Đang tải đơn hàng...</div>
          ) : orders.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-gray-100 flex flex-col items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Không tìm thấy đơn hàng</h3>
              <p className="text-sm text-gray-500">Chưa có đơn hàng nào ở trạng thái này.</p>
            </Card>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className={`p-6 cursor-pointer hover:shadow-md transition-shadow border-2 ${selectedOrder?.id === order.id ? 'border-orange-500' : 'border-transparent'
                  }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Đơn hàng #{order.id.substring(0, 8).toUpperCase()}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="space-y-2 mb-4 border-t border-b border-gray-100 py-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{order.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{order.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="line-clamp-1">{order.deliveryAddress}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-orange-500 font-bold text-lg">
                    {order.totalAmount.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Chi tiết
                    </Button> */}

                    {order.status === 'Pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(order.id);
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" /> Nhận đơn
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setIsRejectModalOpen(true);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" /> Từ chối
                        </Button>
                      </>
                    )}

                    {order.status === 'Confirmed' && (
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrepare(order.id);
                        }}
                      >
                        <Utensils className="w-4 h-4 mr-1" /> Bắt đầu chuẩn bị
                      </Button>
                    )}

                    {order.status === 'Preparing' && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWaitingForShipper(order.id);
                        }}
                      >
                        <Truck className="w-4 h-4 mr-1" /> Chờ Shipper lấy
                      </Button>
                    )}

                    {messageableStatuses.includes(order.status) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSellerChat({
                            isOpen: true,
                            orderId: order.id,
                            sessionId: orderChatMap[order.id],
                          });
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" /> Chat khách
                      </Button>
                    )}

                    {['Pending', 'Confirmed', 'Preparing'].includes(order.status) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSellerCancel(order.id);
                        }}
                      >
                        Hủy
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-500">
                Hiển thị {Math.min((page - 1) * take + 1, total)} – {Math.min(page * take, total)} trong số {total} đơn hàng
              </span>
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(total / take)}
                onPageChange={setPage}
                pageSize={take}
                pageSizeOptions={[10, 20, 50]}
                onPageSizeChange={(size) => { setTake(size); setPage(1); }}
              />
            </div>
          )}
        </div>

        {/* Selected Order Details Panel */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <Card className="p-6 bg-white sticky top-24 border border-gray-100 space-y-6">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-extrabold text-xl text-gray-900">Chi tiết #{selectedOrder.id.substring(0, 8).toUpperCase()}</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Delivery Code for Shipper Verification */}
              {['Confirmed', 'Preparing', 'WaitingForShipper', 'Shipping', 'Delivered'].includes(selectedOrder.status) && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-orange-600 font-semibold mb-1 uppercase tracking-wider">Mã xác nhận Shipper</span>
                  <span className="text-3xl font-black text-orange-600 tracking-widest">{selectedOrder.id.slice(-6).toUpperCase()}</span>
                  <p className="text-xs text-orange-500 mt-1">Sử dụng 6 ký tự cuối của mã đơn hàng để đối chiếu với tài xế</p>
                </div>
              )}

              {/* Customer Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Thông tin giao nhận</h4>
                <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{selectedOrder.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.contactPhone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{selectedOrder.deliveryAddress}</span>
                  </div>
                  {selectedOrder.note && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-orange-600">
                      Ghi chú: {selectedOrder.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Chi tiết món ăn</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.itemName}</p>
                        <p className="text-gray-400 text-xs">SL: {item.quantity} x {item.unitPrice.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <p className="font-bold text-gray-900">{(item.totalPrice).toLocaleString('vi-VN')} đ</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Section */}
              <div className="pt-4 border-t border-gray-100 text-sm space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>Phương thức thanh toán:</span>
                  <span className="font-medium text-gray-900">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-800">Tổng thanh toán:</span>
                  <span className="text-orange-500">{selectedOrder.totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {selectedOrder.status === 'Pending' && (
                  <>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAccept(selectedOrder.id)}
                    >
                      <Check className="w-4 h-4 mr-2 inline" /> Nhận đơn
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full"
                      onClick={() => setIsRejectModalOpen(true)}
                    >
                      <X className="w-4 h-4 mr-2 inline" /> Từ chối đơn
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'Confirmed' && (
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => handlePrepare(selectedOrder.id)}
                  >
                    <Utensils className="w-4 h-4 mr-2 inline" /> Bắt đầu chuẩn bị
                  </Button>
                )}
                {selectedOrder.status === 'Preparing' && (
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleWaitingForShipper(selectedOrder.id)}
                  >
                    <Truck className="w-4 h-4 mr-2 inline" /> Chờ Shipper đến lấy
                  </Button>
                )}
                {['Pending', 'Confirmed', 'Preparing'].includes(selectedOrder.status) && (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => handleSellerCancel(selectedOrder.id)}
                  >
                    Hủy đơn hàng
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-gray-400 bg-white border border-gray-100 flex flex-col items-center justify-center h-48">
              <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm">Vui lòng nhấp vào một đơn hàng để xem chi tiết chiết tính.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Từ chối đơn hàng</h3>
            <p className="text-sm text-gray-500">Vui lòng điền lý do từ chối đơn hàng này (Khách hàng sẽ nhận được thông tin lý do).</p>

            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500"
              rows={3}
              placeholder="Ví dụ: Quán hết nguyên liệu món ăn này..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => {
                setIsRejectModalOpen(false);
                setRejectReason('');
              }}>
                Hủy bỏ
              </Button>
              <Button variant="danger" onClick={handleReject}>
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}

      <OrderSellerChatModal
        isOpen={sellerChat.isOpen}
        onClose={() => setSellerChat({ isOpen: false, orderId: '' })}
        orderId={sellerChat.orderId}
        sessionId={sellerChat.sessionId}
        restaurantId={restaurantId ?? undefined}
        isSeller
      />
    </div>
  );
}
