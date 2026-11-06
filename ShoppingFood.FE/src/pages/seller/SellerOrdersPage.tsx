import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService } from '../../services/OrderService';
import { authService } from '../../services/AuthService';
import { chatService } from '../../services/ChatService';
import { notificationRealtimeService } from '../../services/NotificationRealtimeService';
import type { INotificationDto } from '../../interfaces';
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
  MessageCircle,
  Package,
  Search,
  Printer
} from 'lucide-react';
import { Card, Button, Pagination, PromptModal, Input } from '../../components/common';
import { OrderSellerChatModal } from '../../components/chat/OrderSellerChatModal';
import toast from 'react-hot-toast';
import { printSellerOrderBills, type OrderBillData } from '../../utils/printOrderBill';
import { useGroupOrdersForOrders } from '../../components/groupOrder/useGroupOrdersForOrders';
import { GroupOrderTag } from '../../components/groupOrder/GroupOrderTag';
import { GroupOrderPortionsPanel } from '../../components/groupOrder/GroupOrderPortionsPanel';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const groupOrderIds = useMemo(() => orders.map((o) => o.id as string), [orders]);
  const { byOrderId: groupInfo } = useGroupOrdersForOrders(groupOrderIds);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || '');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  
  // Cancel Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('Shopping Food');
  const [deliveryType, setDeliveryType] = useState<string>('PlatformDelivery');
  const [printingBatchCode, setPrintingBatchCode] = useState<string | null>(null);
  const [orderChatMap, setOrderChatMap] = useState<Record<string, string>>({});
  const [sellerChat, setSellerChat] = useState<{ isOpen: boolean; orderId: string; sessionId?: string }>({
    isOpen: false,
    orderId: '',
  });

  const messageableStatuses = ['Confirmed', 'Preparing', 'WaitingForShipper', 'Shipping'];

  // Pagination states
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page, take, appliedFilter]);

  // Deep-link từ thông báo: ?orderId=...&status=Cancelled
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId || isLoading) return;

    const matched = orders.find((o) => o.id === orderId);
    if (matched) {
      setSelectedOrder(matched);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      }, { replace: true });
      return;
    }

    // Đơn không nằm trang hiện tại → lấy chi tiết trực tiếp
    orderService.getOrderDetails(orderId).then((res) => {
      if (!res.error && res.data) {
        setSelectedOrder(res.data);
        if (res.data.status === 'Cancelled' && activeTab !== 'Cancelled') {
          setActiveTab('Cancelled');
          setPage(1);
        }
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      }, { replace: true });
    });
  }, [orders, isLoading, searchParams]);

  useEffect(() => {
    const handleNotification = (notif: INotificationDto) => {
      const title = (notif.title || '').toLowerCase();
      const isCancel =
        title.includes('hủy') ||
        title.includes('cancel') ||
        title.includes('thất bại') ||
        title.includes('sự cố');

      if (isCancel) {
        setActiveTab('Cancelled');
        setPage(1);
      }

      if (notif.targetId) {
        fetchOrders();
        orderService.getOrderDetails(notif.targetId).then(res => {
          if (!res.error && res.data) setSelectedOrder(res.data);
        });
      } else {
        fetchOrders();
      }
    };
    notificationRealtimeService.onNotification(handleNotification);
    return () => {
      notificationRealtimeService.offNotification(handleNotification);
    };
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

  const refreshOrderChatMap = () => {
    chatService.getSellerOrderChats().then(res => {
      if (!res.error && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach(c => {
          if (c.orderId) map[c.orderId] = c.id;
        });
        setOrderChatMap(map);
      }
    });
  };

  useEffect(() => {
    authService.getProfile().then(res => {
      if (!res.error && res.data?.sellerInfo?.restaurantId) {
        setRestaurantId(res.data.sellerInfo.restaurantId);
        if (res.data.sellerInfo.restaurantName) {
          setRestaurantName(res.data.sellerInfo.restaurantName);
        }
        if (res.data.sellerInfo.deliveryType) {
          setDeliveryType(res.data.sellerInfo.deliveryType);
        }
      }
    });
    refreshOrderChatMap();
  }, []);

  useEffect(() => {
    if (!token || !restaurantId) return;
    chatService.startConnection(token)
      .then(() => chatService.joinSellerInbox(restaurantId))
      .catch(() => undefined);

    const onOrderChat = () => {
      refreshOrderChatMap();
    };
    chatService.onOrderChatMessage(onOrderChat);
    chatService.onNewOrderChat(onOrderChat);
    return () => {
      chatService.offOrderChatMessage(onOrderChat);
      chatService.offNewOrderChat(onOrderChat);
    };
  }, [token, restaurantId]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      const params: any = { skip, take };
      if (activeTab) {
        params.status = activeTab;
      }
      if (appliedFilter.trim()) {
        params.filter = appliedFilter.trim();
      }
      const res = await orderService.getRestaurantOrders(params);
      if (!res.error && res.data) {
        setOrders(res.data);
        setTotal(res.total || 0);
        // 1 kết quả → mở sẵn chi tiết để đọc OTP nhanh
        if (appliedFilter.trim() && res.data.length === 1) {
          setSelectedOrder(res.data[0]);
        }
      } else {
        toast.error(res.message || 'Không tải được danh sách đơn hàng.');
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message;
      toast.error(apiMsg || 'Tải danh sách đơn hàng thất bại do lỗi kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    setAppliedFilter(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedFilter('');
    setPage(1);
  };

  const toBillData = (order: any): OrderBillData => ({
    id: order.id,
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    deliveryAddress: order.deliveryAddress,
    note: order.note,
    status: order.status,
    paymentMethod: order.paymentMethod,
    itemsSubtotal: order.itemsSubtotal,
    shippingFee: order.shippingFee,
    discountAmount: order.discountAmount,
    tierDiscountAmount: order.tierDiscountAmount,
    discountCode: order.discountCode,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    items: order.items,
    shipperName: order.shipperName,
    batchPickupCode: order.batchPickupCode,
  });

  const handlePrintOrderBill = (order: any) => {
    if (!order?.id) return;
    printSellerOrderBills([toBillData(order)], {
      restaurantName,
      title: `Bill #${String(order.id).slice(0, 8).toUpperCase()}`,
    });
  };

  /** In riêng từng đơn trong lô (mỗi đơn 1 trang) — không in 1 tờ gộp. */
  const handlePrintBatchBills = async (batch: {
    code: string;
    labels: { orderId: string; shortCode: string; contactName: string }[];
  }) => {
    if (!batch.labels.length) return;
    setPrintingBatchCode(batch.code);
    const toastId = toast.loading(`Đang chuẩn bị ${batch.labels.length} bill...`);
    try {
      const bills: OrderBillData[] = [];
      for (const label of batch.labels) {
        const cached = orders.find((o) => o.id === label.orderId);
        if (cached?.items?.length) {
          bills.push(toBillData({ ...cached, batchPickupCode: batch.code }));
          continue;
        }
        const res = await orderService.getOrderDetails(label.orderId);
        if (!res.error && res.data) {
          bills.push(toBillData({ ...res.data, batchPickupCode: batch.code }));
        } else {
          bills.push({
            id: label.orderId,
            contactName: label.contactName,
            batchPickupCode: batch.code,
            items: [],
          });
        }
      }
      printSellerOrderBills(bills, {
        restaurantName,
        title: `Bill lô ${batch.code}`,
      });
      toast.success(`Đã mở ${bills.length} bill (mỗi đơn 1 trang)`, { id: toastId });
    } catch {
      toast.error('Không chuẩn bị được bill lô', { id: toastId });
    } finally {
      setPrintingBatchCode(null);
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
        toast.error(res.message , { id: toastId });
      }
    } catch {
      toast.error('Xác nhận đơn hàng thất bại do lỗi kết nối mạng.', { id: toastId });
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
        toast.error(res.message , { id: toastId });
      }
    } catch {
      toast.error('Xác nhận hoàn thành chuẩn bị thất bại do lỗi kết nối mạng.', { id: toastId });
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
        toast.error(res.message , { id: toastId });
      }
    } catch {
      toast.error('Bàn giao đơn hàng thất bại do lỗi kết nối mạng.', { id: toastId });
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
        toast.error(res.message , { id: toastId });
      }
    } catch {
      toast.error('Từ chối đơn hàng thất bại do lỗi kết nối mạng.', { id: toastId });
    }
  };

  const handleSellerCancelClick = (orderId: string) => {
    setCancellingOrderId(orderId);
    setIsCancelModalOpen(true);
  };

  const handleSellerCancelConfirm = async (reason: string) => {
    if (!cancellingOrderId) return;
    const orderId = cancellingOrderId;
    setIsCancelModalOpen(false);
    setCancellingOrderId(null);

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
        toast.error(res.message , { id: toastId });
      }
    } catch {
      toast.error('Hủy đơn hàng thất bại do lỗi kết nối mạng.', { id: toastId });
    }
  };

  const handleConfirmSelfDelivery = async (orderId: string) => {
    const toastId = toast.loading('Đang xác nhận giao hàng...');
    try {
      const res = await orderService.confirmSelfDelivery(orderId);
      if (!res.error) {
        toast.success('Xác nhận giao hàng thành công!', { id: toastId });
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, status: 'Delivered' }));
        }
      } else {
        toast.error(res.message , { id: toastId });
      }
    } catch {
      toast.error('Xác nhận giao hàng thất bại do lỗi kết nối mạng.', { id: toastId });
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

  /** Unique pickup batches on current page (one card per shipper code). */
  const pickupBatches = useMemo(() => {
    const map = new Map<string, {
      code: string;
      shipperId: string;
      shipperName?: string;
      shipperPhone?: string;
      labels: { orderId: string; shortCode: string; contactName: string }[];
    }>();
    for (const o of orders) {
      if (!o.batchPickupCode || !o.shipperId) continue;
      if (map.has(o.batchPickupCode)) continue;
      const labels = (o.batchOrderLabels || []).map((l: any) => ({
        orderId: l.orderId || l.OrderId,
        shortCode: (l.shortCode || l.ShortCode || String(l.orderId || '').slice(0, 8)).toUpperCase(),
        contactName: l.contactName || l.ContactName || 'Khách',
      }));
      map.set(o.batchPickupCode, {
        code: o.batchPickupCode,
        shipperId: o.shipperId,
        shipperName: o.shipperName,
        shipperPhone: o.shipperPhone,
        labels,
      });
    }
    return Array.from(map.values());
  }, [orders]);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Xem và xử lý các đơn đặt tại quán của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1">
          <Input
            label="Tìm đơn / OTP"
            placeholder="Mã đơn (#8 ký tự), OTP 6 ký tự, SĐT, tên khách, tên tài xế..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0 pb-0.5">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
            <Search className="w-4 h-4 mr-1.5" />
            Tìm kiếm
          </Button>
          {(appliedFilter || searchInput) && (
            <Button type="button" variant="outline" onClick={handleClearSearch}>
              Xóa
            </Button>
          )}
        </div>
      </form>
      {appliedFilter && (
        <p className="text-xs text-gray-500 -mt-4 mb-4">
          Đang lọc: <span className="font-semibold text-orange-600">“{appliedFilter}”</span>
          {total >= 0 ? ` · ${total} kết quả` : ''}
        </p>
      )}

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
          {pickupBatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-gray-900">Bảng giao túi cho tài xế</h3>
              </div>
              <p className="text-xs text-gray-500 -mt-1">
                Mỗi tài xế chỉ cần <strong>1 mã</strong>. Dán / đọc nhãn <strong>#8 ký tự</strong> trên từng túi để khỏi lẫn đơn.
              </p>
              {pickupBatches.map((batch) => (
                <Card key={batch.code} className="p-4 bg-orange-50/80 border border-orange-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-800">
                        <Truck className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold">{batch.shipperName || 'Tài xế'}</span>
                        {batch.shipperPhone && (
                          <span className="text-gray-500">· {batch.shipperPhone}</span>
                        )}
                      </div>
                      <p className="text-xs text-orange-700 font-medium">
                        Đưa đủ {batch.labels.length} túi · đọc mã gộp bên phải cho tài xế
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {batch.labels.map((label, idx) => (
                          <li
                            key={label.orderId}
                            className="flex items-center gap-2 text-sm bg-white/80 rounded-lg px-2.5 py-1.5 border border-orange-100 cursor-pointer hover:border-orange-300"
                            onClick={() => {
                              const found = orders.find((o) => o.id === label.orderId);
                              if (found) setSelectedOrder(found);
                            }}
                          >
                            <span className="text-[10px] font-bold text-orange-500 w-5">#{idx + 1}</span>
                            <span className="font-mono font-bold text-gray-900 tracking-wide">#{label.shortCode}</span>
                            <span className="text-gray-600 truncate">{label.contactName}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex flex-col items-center justify-center bg-white border-2 border-orange-300 rounded-xl px-5 py-3 min-w-[140px]">
                        <span className="text-[10px] uppercase tracking-wider text-orange-500 font-semibold">Mã gộp</span>
                        <span className="text-3xl font-black text-orange-600 tracking-widest">{batch.code}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        disabled={printingBatchCode === batch.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintBatchBills(batch);
                        }}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        {printingBatchCode === batch.code ? 'Đang in...' : 'In bill từng đơn'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

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
                    {order.batchPickupCode && (
                      <div className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-md">
                        <Package className="w-3.5 h-3.5" />
                        Lô TX {order.shipperName ? `· ${order.shipperName}` : ''} · mã {order.batchPickupCode} ·{' '}
                        {(order.batchOrderLabels?.length || order.batchOrderIds?.length || 0)} túi
                      </div>
                    )}
                    {groupInfo[order.id] && (
                      <div className="mt-2"><GroupOrderTag info={groupInfo[order.id]} /></div>
                    )}
                    {!order.batchPickupCode && order.shipperName && order.status === 'Shipping' && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                        <Truck className="w-3.5 h-3.5" />
                        TX: {order.shipperName}
                        <span className="font-mono">· OTP {order.id.slice(-6).toUpperCase()}</span>
                      </div>
                    )}
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
                  {order.status === 'Cancelled' && order.rejectReason && (
                    <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        <strong>Lý do hủy:</strong>{' '}
                        {String(order.rejectReason).replace(/^\[.*?\]\s*/, '')}
                      </span>
                    </div>
                  )}
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
                        className={deliveryType === 'SelfDelivery' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWaitingForShipper(order.id);
                        }}
                      >
                        <Truck className="w-4 h-4 mr-1" /> {deliveryType === 'SelfDelivery' ? 'Bắt đầu đi giao' : 'Chờ Shipper lấy'}
                      </Button>
                    )}

                    {messageableStatuses.includes(order.status) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshOrderChatMap();
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

                    {order.status === 'Shipping' && !order.shipperId && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmSelfDelivery(order.id);
                        }}
                      >
                        Đã giao thành công
                      </Button>
                    )}

                    {['Pending', 'Confirmed', 'Preparing'].includes(order.status) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSellerCancelClick(order.id);
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
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrintOrderBill(selectedOrder)}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    In bill
                  </Button>
                </div>
              </div>

              {/* Delivery Code for Shipper Verification */}
              {deliveryType !== 'SelfDelivery' && ['Confirmed', 'Preparing', 'WaitingForShipper', 'Shipping', 'Delivered'].includes(selectedOrder.status) && (
                selectedOrder.batchPickupCode && selectedOrder.status === 'Shipping' ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                    <div className="text-center">
                      <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Mã lấy hàng gộp</span>
                      <div className="text-3xl font-black text-orange-600 tracking-widest mt-1">{selectedOrder.batchPickupCode}</div>
                      <p className="text-xs text-orange-700 mt-1 font-medium">
                        Tài xế: {selectedOrder.shipperName || '—'}
                        {selectedOrder.shipperPhone ? ` · ${selectedOrder.shipperPhone}` : ''}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-orange-100">
                      <p className="text-[11px] font-semibold text-orange-600 uppercase mb-2">
                        Túi cần đưa ({selectedOrder.batchOrderLabels?.length || selectedOrder.batchOrderIds?.length || 0})
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        {(selectedOrder.batchOrderLabels || []).map((l: any, idx: number) => (
                          <li key={l.orderId || l.OrderId || idx} className="flex gap-2 items-center">
                            <span className="text-[10px] text-orange-500 font-bold w-4">#{idx + 1}</span>
                            <span className="font-mono font-bold">#{(l.shortCode || l.ShortCode || '').toUpperCase()}</span>
                            <span className="text-gray-600 truncate">{l.contactName || l.ContactName}</span>
                            {(l.orderId || l.OrderId) === selectedOrder.id && (
                              <span className="text-[10px] text-orange-500">(đang xem)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[11px] text-orange-500 text-center">
                      Không đọc mã từng đơn — chỉ đọc mã gộp + đối chiếu nhãn túi #...
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-orange-600 font-semibold mb-1 uppercase tracking-wider">Mã xác nhận Shipper</span>
                    <span className="text-3xl font-black text-orange-600 tracking-widest">{selectedOrder.id.slice(-6).toUpperCase()}</span>
                    <p className="text-xs text-orange-500 mt-1">Sử dụng 6 ký tự cuối của mã đơn hàng để đối chiếu với tài xế</p>
                    {selectedOrder.shipperName && selectedOrder.status === 'Shipping' && (
                      <p className="text-xs text-gray-600 mt-2">Tài xế: {selectedOrder.shipperName}</p>
                    )}
                  </div>
                )
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

              {groupInfo[selectedOrder.id] && (
                <GroupOrderPortionsPanel info={groupInfo[selectedOrder.id]} mode="restaurant" restaurantName={restaurantName} />
              )}

              {/* Items Section */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Chi tiết món ăn</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item: any) => {
                    const isGift = !!item.isGift || String(item.itemName || '').startsWith('[Tặng]');
                    const displayName = String(item.itemName || '').replace(/^\[Tặng\]\s*/, '');
                    const unit = isGift ? 0 : (item.unitPrice || 0);
                    const total = isGift ? 0 : (item.totalPrice ?? unit * (item.quantity || 0));
                    return (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
                            {displayName}
                            {isGift && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Tặng kèm
                              </span>
                            )}
                          </p>
                          {(item.selectedSize || item.selectedToppings) && (
                            <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                              {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                              {item.selectedToppings && <p>Topping: {item.selectedToppings}</p>}
                            </div>
                          )}
                          <p className="text-gray-400 text-xs mt-1">
                            SL: {item.quantity} x {unit.toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                      <p className={`font-bold ${isGift ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {isGift ? 'Miễn phí' : `${total.toLocaleString('vi-VN')} đ`}
                      </p>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Section */}
              <div className="pt-4 border-t border-gray-100 text-sm space-y-2">
                {selectedOrder.status === 'Cancelled' && (
                  <div className="mb-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    <strong>Lý do hủy:</strong>{' '}
                    {selectedOrder.rejectReason
                      ? String(selectedOrder.rejectReason).replace(/^\[.*?\]\s*/, '')
                      : 'Không có lý do được ghi nhận.'}
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Phương thức thanh toán:</span>
                  <span className="font-medium text-gray-900">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tiền món:</span>
                  <span className="font-medium text-gray-900">
                    {(selectedOrder.itemsSubtotal ?? Math.max(0, (selectedOrder.totalAmount || 0) - (selectedOrder.shippingFee || 0))).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Giảm giá{selectedOrder.discountCode ? ` (${selectedOrder.discountCode})` : ''}:</span>
                    <span className="font-medium">-{(selectedOrder.discountAmount || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {Number(selectedOrder.tierDiscountAmount) > 0 && (
                  <div className="flex justify-between text-violet-700">
                    <span>Chiết khấu điểm hạng:</span>
                    <span className="font-medium">-{(selectedOrder.tierDiscountAmount || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Phí giao hàng:</span>
                  <span className="font-medium text-gray-900">{(selectedOrder.shippingFee ?? 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-800">Tổng thanh toán:</span>
                  <span className="text-orange-500">{(selectedOrder.totalAmount ?? 0).toLocaleString('vi-VN')} đ</span>
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
                      className={deliveryType === 'SelfDelivery' ? "w-full bg-green-600 hover:bg-green-700 text-white" : "w-full bg-purple-600 hover:bg-purple-700 text-white"}
                      onClick={() => handleWaitingForShipper(selectedOrder.id)}
                    >
                      <Truck className="w-4 h-4 mr-2 inline" /> {deliveryType === 'SelfDelivery' ? 'Bắt đầu đi giao' : 'Chờ Shipper lấy'}
                    </Button>
                  )}
                {selectedOrder.status === 'Shipping' && !selectedOrder.shipperId && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleConfirmSelfDelivery(selectedOrder.id)}
                  >
                    <Check className="w-4 h-4 mr-2 inline" /> Đã giao thành công
                  </Button>
                )}
                {['Pending', 'Confirmed', 'Preparing'].includes(selectedOrder.status) && (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => handleSellerCancelClick(selectedOrder.id)}
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
        onSessionReady={(sid, oid) => {
          setOrderChatMap(prev => ({ ...prev, [oid]: sid }));
          setSellerChat(prev => prev.orderId === oid ? { ...prev, sessionId: sid } : prev);
        }}
      />

      {/* Cancel Order Prompt Modal */}
      <PromptModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setCancellingOrderId(null);
        }}
        onConfirm={handleSellerCancelConfirm}
        title="Hủy đơn hàng"
        description="Vui lòng cho biết lý do bạn muốn hủy đơn hàng này (VD: Hết món, không thể chuẩn bị...)."
        placeholder="Nhập lý do hủy đơn..."
        confirmLabel="Hủy đơn hàng"
        confirmVariant="danger"
      />
    </div>
  );
}
