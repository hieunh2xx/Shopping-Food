import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  User, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Button, Input, Modal } from '../../components/common';
import { coordinatorService } from '../../services';
import toast from 'react-hot-toast';

export default function DispatchBoardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'WaitingForShipper' | 'Preparing' | 'Shipping' | 'incident' | 'escalated'>('WaitingForShipper');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0); // Client side total calculation
  const take = 10;

  // Selected Order for Action Modals
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Modal States
  const [isSuggestedOpen, setIsSuggestedOpen] = useState(false);
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);

  // Modal Data States
  const [suggestedShippers, setSuggestedShippers] = useState<any[]>([]);
  const [isShippersLoading, setIsShippersLoading] = useState(false);
  const [activeProposalTimer, setActiveProposalTimer] = useState<Record<string, number>>({}); // shipperId -> seconds left
  const [proposalSentStatus, setProposalSentStatus] = useState<Record<string, boolean>>({}); // shipperId -> true

  // Release Form
  const [releaseReason, setReleaseReason] = useState('');
  const [reassignShipperId, setReassignShipperId] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);

  // Incident Form
  const [resolutionType, setResolutionType] = useState('CustomerFault');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [penaltyScore, setPenaltyScore] = useState(10);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page]);

  // Handle countdown for active proposals
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveProposalTimer((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        Object.keys(next).forEach((key) => {
          if (next[key] > 0) {
            next[key] -= 1;
            hasChanges = true;
          } else {
            delete next[key];
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      let status: string | undefined = undefined;
      let isEscalated: boolean | undefined = undefined;

      if (activeTab === 'escalated') {
        isEscalated = true;
      } else if (activeTab === 'incident') {
        // Incidents are Cancelled orders starting with [Delivery Failed]
        status = 'Cancelled';
      } else if (activeTab !== 'all') {
        status = activeTab;
      }

      const res = await coordinatorService.getDispatchBoard(status, skip, take, isEscalated);
      if (!res.error && res.data) {
        let filteredData = res.data;
        // Client side filtering for incident tab to ensure it has [Delivery Failed]
        if (activeTab === 'incident') {
          filteredData = res.data.filter((o: any) => o.rejectReason && o.rejectReason.startsWith('[Delivery Failed]'));
        }
        setOrders(filteredData);
        setTotal(filteredData.length); // Fallback mock total
      }
    } catch {
      toast.error('Lỗi tải danh sách đơn hàng điều phối');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Suggest Shipper Modal
  const handleOpenSuggestModal = async (order: any) => {
    setSelectedOrder(order);
    setIsSuggestedOpen(true);
    setIsShippersLoading(true);
    setSuggestedShippers([]);
    setProposalSentStatus({});
    try {
      const res = await coordinatorService.getSuggestedShippers(order.id);
      if (!res.error && res.data) {
        setSuggestedShippers(res.data);
      }
    } catch {
      toast.error('Lỗi tải danh sách shipper gợi ý');
    } finally {
      setIsShippersLoading(false);
    }
  };

  // Send Proposal
  const handleSendProposal = async (shipperId: string) => {
    if (!selectedOrder) return;
    try {
      const res = await coordinatorService.sendProposal({
        orderId: selectedOrder.id,
        shipperId: shipperId
      });
      if (!res.error) {
        toast.success('Đã gửi đề xuất đến shipper thành công!');
        setProposalSentStatus(prev => ({ ...prev, [shipperId]: true }));
        setActiveProposalTimer(prev => ({ ...prev, [shipperId]: 60 }));
      } else {
        toast.error(res.message || 'Lỗi gửi đề xuất');
      }
    } catch {
      toast.error('Lỗi kết nối khi gửi đề xuất');
    }
  };

  // Force Assign
  const handleForceAssign = async (shipperId: string) => {
    if (!selectedOrder) return;
    if (!window.confirm('Bạn có chắc chắn muốn gán bắt buộc đơn hàng này cho tài xế?')) return;
    try {
      const res = await coordinatorService.forceAssign({
        orderId: selectedOrder.id,
        shipperId: shipperId
      });
      if (!res.error) {
        toast.success('Đã gán đơn hàng thành công!');
        setIsSuggestedOpen(false);
        fetchOrders();
      } else {
        toast.error(res.message || 'Lỗi gán đơn');
      }
    } catch {
      toast.error('Lỗi kết nối khi gán đơn');
    }
  };

  // Open Release Modal
  const handleOpenReleaseModal = (order: any) => {
    setSelectedOrder(order);
    setReleaseReason('');
    setReassignShipperId('');
    setIsReleaseOpen(true);
  };

  // Submit Release Order
  const handleReleaseOrder = async () => {
    if (!selectedOrder || !releaseReason) {
      toast.error('Vui lòng nhập lý do giải phóng đơn');
      return;
    }
    setIsReleasing(true);
    try {
      const payload: any = { reason: releaseReason };
      if (reassignShipperId) {
        payload.newShipperId = reassignShipperId;
      }
      const res = await coordinatorService.releaseOrder(selectedOrder.id, payload);
      if (!res.error) {
        toast.success(reassignShipperId ? 'Đã gán shipper mới thành công!' : 'Đã thu hồi đơn hàng thành công!');
        setIsReleaseOpen(false);
        fetchOrders();
      } else {
        toast.error(res.message || 'Lỗi xử lý thu hồi đơn');
      }
    } catch {
      toast.error('Lỗi kết nối khi giải phóng đơn');
    } finally {
      setIsReleasing(false);
    }
  };

  // Open Incident Modal
  const handleOpenIncidentModal = (order: any) => {
    setSelectedOrder(order);
    setResolutionType('CustomerFault');
    setIncidentNotes('');
    setPenaltyScore(10);
    setIsIncidentOpen(true);
  };

  // Submit Incident Resolution
  const handleResolveIncident = async () => {
    if (!selectedOrder || !incidentNotes) {
      toast.error('Vui lòng nhập chi tiết xử lý sự cố');
      return;
    }
    setIsResolving(true);
    try {
      const res = await coordinatorService.resolveIncident(selectedOrder.id, {
        resolutionType,
        notes: incidentNotes,
        penaltyScore: Number(penaltyScore)
      });
      if (!res.error) {
        toast.success('Đã giải quyết sự cố đơn hàng thành công!');
        setIsIncidentOpen(false);
        fetchOrders();
      } else {
        toast.error(res.message || 'Lỗi giải quyết sự cố');
      }
    } catch {
      toast.error('Lỗi kết nối xử lý sự cố');
    } finally {
      setIsResolving(false);
    }
  };

  const getStatusBadge = (status: string, rejectReason?: string) => {
    if (status === 'Cancelled' && rejectReason && rejectReason.startsWith('[Delivery Failed]')) {
      if (rejectReason.includes('Resolved:')) {
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-lg">Đã xử lý sự cố</span>;
      }
      return <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg animate-pulse">Sự cố giao hàng</span>;
    }

    switch (status) {
      case 'WaitingForShipper':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold rounded-lg">Chờ tài xế</span>;
      case 'Preparing':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg">Đang chuẩn bị</span>;
      case 'Shipping':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold rounded-lg">Đang giao hàng</span>;
      case 'Delivered':
        return <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 text-xs font-semibold rounded-lg">Đã giao</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-200 text-xs font-semibold rounded-lg">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-100 text-xs font-semibold rounded-lg">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-orange-500" />
          Bảng Điều Phối Đơn Hàng
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem thông tin đơn hàng trong ngày, điều phối shipper thông minh và quản trị sự cố vận chuyển
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-px">
        <button 
          onClick={() => { setActiveTab('WaitingForShipper'); setPage(1); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'WaitingForShipper' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Cần điều phối (Chờ tài xế)
        </button>
        <button 
          onClick={() => { setActiveTab('Shipping'); setPage(1); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'Shipping' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đang giao hàng
        </button>
        <button 
          onClick={() => { setActiveTab('incident'); setPage(1); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'incident' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Sự cố giao hàng
        </button>
        <button 
          onClick={() => { setActiveTab('escalated'); setPage(1); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'escalated' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          Cảnh báo rủi ro (Trễ đơn)
        </button>
        <button 
          onClick={() => { setActiveTab('Preparing'); setPage(1); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'Preparing' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đang chuẩn bị
        </button>
        <button 
          onClick={() => { setActiveTab('all'); setPage(1); }}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'all' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tất cả đơn trong ngày
        </button>
      </div>

      {/* Orders List Container */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center p-12 bg-white border border-gray-200 rounded-2xl text-gray-500">
            Không có đơn hàng nào trong phân mục này.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-900">Đơn hàng: #{order.id.slice(0, 8)}</span>
                  {getStatusBadge(order.status, order.rejectReason)}
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Items */}
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Món ăn: </span>
                  {order.items?.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="truncate">Cửa hàng: <strong className="text-gray-700">{order.items?.[0]?.product?.restaurant?.restaurantName || 'N/A'}</strong> ({order.items?.[0]?.product?.restaurant?.address})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>Khách hàng: <strong className="text-gray-700">{order.contactName || order.userAccount?.profile?.fullName || 'Khách vãng lai'}</strong> ({order.contactPhone})</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span>Giao tới: <strong className="text-gray-700">{order.deliveryAddress}</strong></span>
                  </div>
                  {order.shipper && (
                    <div className="flex items-center gap-1.5 sm:col-span-2 mt-1 py-1 px-2.5 bg-gray-50 rounded-lg w-max border border-gray-100">
                      <Truck className="w-3.5 h-3.5 text-purple-500" />
                      <span>Tài xế giao: <strong className="text-purple-700">{order.shipper.userProfile.fullName}</strong> ({order.shipper.userProfile.userAccount.phone})</span>
                    </div>
                  )}
                  {order.rejectReason && order.status === 'Cancelled' && (
                    <div className="flex items-start gap-1.5 sm:col-span-2 mt-1 py-1 px-2.5 bg-red-50 rounded-lg w-full border border-red-100 text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                      <span>Chi tiết sự cố: <strong>{order.rejectReason}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col gap-2 md:items-end justify-start md:justify-center">
                <div className="text-sm font-bold text-gray-900 mb-0 md:mb-1">
                  {order.totalAmount.toLocaleString('vi-VN')}đ
                </div>

                {order.status === 'WaitingForShipper' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenSuggestModal(order)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  >
                    Gợi ý & Điều phối
                  </Button>
                )}

                {order.status === 'Shipping' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOpenReleaseModal(order)}
                    className="text-red-600 hover:bg-red-50 border-red-200"
                  >
                    Thu hồi / Đổi shipper
                  </Button>
                )}

                {order.status === 'Cancelled' && order.rejectReason && order.rejectReason.startsWith('[Delivery Failed]') && !order.rejectReason.includes('Resolved:') && (
                  <Button 
                    size="sm"
                    onClick={() => handleOpenIncidentModal(order)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium"
                  >
                    Xử lý sự cố
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Suggested Shippers Modal */}
      <Modal
        isOpen={isSuggestedOpen}
        onClose={() => setIsSuggestedOpen(false)}
        title={`Điều phối Shipper thông minh - Đơn #${selectedOrder?.id.slice(0, 8)}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Danh sách tài xế đang hoạt động (Online), xếp hạng theo khoảng cách gần cửa hàng <strong className="text-gray-700">{selectedOrder?.items?.[0]?.product?.restaurant?.restaurantName}</strong> nhất.
          </p>

          {isShippersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : suggestedShippers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Không có tài xế phù hợp lân cận đang online.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {suggestedShippers.map((shipper) => (
                <div key={shipper.shipperId} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      {shipper.fullName}
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{shipper.vehicleType === 'Motorcycle' ? 'Xe máy' : shipper.vehicleType}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      SĐT: {shipper.phone} | Điểm uy tín: <strong className="text-orange-600">{shipper.reputationScore} ⭐</strong>
                    </div>
                    <div className="text-xs text-gray-400">
                      Khoảng cách đến nhà hàng: <strong className="text-gray-600">{(shipper.distanceInKm || 0).toFixed(2)} km</strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {proposalSentStatus[shipper.shipperId] ? (
                      <Button
                        size="xs"
                        variant="outline"
                        disabled
                        className="bg-gray-50 text-gray-400"
                      >
                        Đã gửi ({activeProposalTimer[shipper.shipperId] || 0}s)
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleSendProposal(shipper.shipperId)}
                      >
                        Gửi Đề xuất
                      </Button>
                    )}
                    <Button
                      size="xs"
                      onClick={() => handleForceAssign(shipper.shipperId)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
                    >
                      Gán bắt buộc
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Release Modal */}
      <Modal
        isOpen={isReleaseOpen}
        onClose={() => setIsSuggestedOpen(false)}
        title="Thu hồi / Phân phối lại Đơn hàng"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do thu hồi <span className="text-red-500">*</span></label>
            <textarea
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder="VD: Shipper báo hỏng xe, Shipper không di chuyển..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Điều phối sang tài xế mới (Tùy chọn)</label>
            <select
              value={reassignShipperId}
              onChange={(e) => setReassignShipperId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="">Chỉ thu hồi về hàng đợi (Chờ gán đơn mới)</option>
              {suggestedShippers.map((s) => (
                <option key={s.shipperId} value={s.shipperId}>
                  {s.fullName} (SĐT: {s.phone} - {(s.distanceInKm || 0).toFixed(2)} km)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Danh sách tài xế được lấy từ danh sách tài xế lân cận vừa đề xuất.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsReleaseOpen(false)} disabled={isReleasing}>Hủy</Button>
            <Button 
              onClick={handleReleaseOrder} 
              isLoading={isReleasing} 
              disabled={isReleasing || !releaseReason}
              className="bg-red-500 hover:bg-red-600 text-white font-medium"
            >
              Xác nhận thu hồi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Incident Modal */}
      <Modal
        isOpen={isIncidentOpen}
        onClose={() => setIsIncidentOpen(false)}
        title={`Xử lý sự cố giao hàng - Đơn #${selectedOrder?.id.slice(0, 8)}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kết luận trách nhiệm</label>
            <select
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="CustomerFault">Lỗi khách hàng (Không nghe máy, sai địa chỉ...)</option>
              <option value="ShipperFault">Lỗi tài xế (Tự ý hủy đơn, giao thiếu...)</option>
              <option value="ForceCancelNoPenalty">Trường hợp bất khả kháng (Thời tiết, tai nạn...) - Hủy không phạt</option>
            </select>
          </div>

          {resolutionType === 'ShipperFault' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Điểm phạt tài xế (Trừ vào điểm uy tín)</label>
              <Input
                type="number"
                value={penaltyScore}
                onChange={(e) => setPenaltyScore(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chi tiết phân giải & Ghi chú quyết định <span className="text-red-500">*</span></label>
            <textarea
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              placeholder="Nhập chi tiết biên bản giải quyết sự cố..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsIncidentOpen(false)} disabled={isResolving}>Hủy</Button>
            <Button 
              onClick={handleResolveIncident} 
              isLoading={isResolving} 
              disabled={isResolving || !incidentNotes}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              Lưu Biên bản
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
