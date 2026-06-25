import { useState, useEffect } from 'react';
import { orderService } from '../services/OrderService';
import type { IOrderSummary } from '../interfaces';
import toast from 'react-hot-toast';
import { 
  PackageOpen, 
  MapPin, 
  Store, 
  Navigation, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks';

export function OrdersPage() {
  const { user } = useAuth();
  const isShipper = user?.role === 'Shipper' || user?.role === 'Coordinator';

  // Customer State
  const [orders, setOrders] = useState<IOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Shipper Mock State
  const [isOnline, setIsOnline] = useState(true);
  const [earnings, setEarnings] = useState({
    total: 485000,
    completed: 14,
    rating: 4.9,
    tips: 60000
  });

  const [proposedOffer, setProposedOffer] = useState<{
    id: string;
    restaurantName: string;
    restaurantAddress: string;
    deliveryAddress: string;
    distance: string;
    shippingFee: number;
    items: string;
    totalAmount: number;
  } | null>({
    id: "OFFER-1004",
    restaurantName: "Phở Thìn Lò Đúc",
    restaurantAddress: "13 Lò Đúc, Hai Bà Trưng, Hà Nội",
    deliveryAddress: "34 Hoàng Cầu, Đống Đa, Hà Nội",
    distance: "4.2 km",
    shippingFee: 25000,
    items: "2x Phở bò tái lăn, 1x Quẩy thêm",
    totalAmount: 180000
  });

  const [activeDelivery, setActiveDelivery] = useState<{
    id: string;
    restaurantName: string;
    restaurantAddress: string;
    deliveryAddress: string;
    distance: string;
    shippingFee: number;
    items: string;
    totalAmount: number;
    step: 'accepted' | 'arrived' | 'picked_up';
  } | null>({
    id: "ORD-8821",
    restaurantName: "Bún Chả Hương Liên",
    restaurantAddress: "24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội",
    deliveryAddress: "102 Thái Thịnh, Đống Đa, Hà Nội",
    distance: "5.6 km",
    shippingFee: 35000,
    items: "2x Suất bún chả đặc biệt, 2x Nem hải sản",
    totalAmount: 220000,
    step: 'picked_up'
  });

  const [availableOffers, setAvailableOffers] = useState([
    {
      id: "OFFER-2001",
      restaurantName: "Pizza Company - Bà Triệu",
      restaurantAddress: "330 Bà Triệu, Hai Bà Trưng, Hà Nội",
      deliveryAddress: "88 Láng Hạ, Đống Đa, Hà Nội",
      distance: "3.8 km",
      shippingFee: 22000,
      totalAmount: 350000
    },
    {
      id: "OFFER-2002",
      restaurantName: "Bánh Mì Dân Tổ",
      restaurantAddress: "32 Trần Nhật Duật, Hoàn Kiếm, Hà Nội",
      deliveryAddress: "12 Chùa Bộc, Đống Đa, Hà Nội",
      distance: "6.1 km",
      shippingFee: 40000,
      totalAmount: 120000
    }
  ]);

  useEffect(() => {
    if (!isShipper) {
      fetchOrders();
    }
  }, [isShipper]);

  // Customer fetch
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

  // Shipper actions
  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    toast.success(!isOnline ? 'Bạn đã BẬT trạng thái trực tuyến!' : 'Bạn đã TẮT trạng thái trực tuyến!');
  };

  const handleAcceptProposed = () => {
    if (!isOnline) {
      toast.error('Vui lòng bật trạng thái trực tuyến để nhận đơn');
      return;
    }
    if (activeDelivery) {
      toast.error('Bạn đang có đơn hàng chưa hoàn thành');
      return;
    }
    if (proposedOffer) {
      setActiveDelivery({
        ...proposedOffer,
        step: 'accepted'
      });
      setProposedOffer(null);
      toast.success('Đã chấp nhận đơn hàng!');
    }
  };

  const handleRejectProposed = () => {
    setProposedOffer(null);
    toast.success('Đã từ chối đơn hàng đề xuất');
  };

  const handleAcceptAvailable = (id: string) => {
    if (!isOnline) {
      toast.error('Vui lòng bật trạng thái trực tuyến để nhận đơn');
      return;
    }
    if (activeDelivery) {
      toast.error('Bạn đang có đơn hàng chưa hoàn thành');
      return;
    }
    const offer = availableOffers.find(o => o.id === id);
    if (offer) {
      setActiveDelivery({
        ...offer,
        items: "1x Combo cơm sườn & coca lớn",
        step: 'accepted'
      });
      setAvailableOffers(availableOffers.filter(o => o.id !== id));
      toast.success('Nhận đơn hàng thành công!');
    }
  };

  const handleProgressDelivery = () => {
    if (!activeDelivery) return;
    if (activeDelivery.step === 'accepted') {
      setActiveDelivery({ ...activeDelivery, step: 'arrived' });
      toast.success('Đã xác nhận đến cửa hàng!');
    } else if (activeDelivery.step === 'arrived') {
      setActiveDelivery({ ...activeDelivery, step: 'picked_up' });
      toast.success('Đã lấy hàng thành công! Bắt đầu giao hàng.');
    }
  };

  const handleDeliverySuccess = () => {
    if (!activeDelivery) return;
    setEarnings(prev => ({
      ...prev,
      total: prev.total + activeDelivery.shippingFee,
      completed: prev.completed + 1
    }));
    setActiveDelivery(null);
    toast.success('Chúc mừng! Giao hàng thành công.');
  };

  const handleDeliveryFailed = () => {
    setActiveDelivery(null);
    toast.error('Đã báo cáo giao hàng thất bại.');
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

  // Render Shipper Dashboard
  if (isShipper) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Dashboard Header Banner */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển Shipper</h1>
                  <span className="bg-orange-100 text-orange-800 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Chế độ Demo
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">Chào mừng quay lại, {user?.fullName || 'Tài xế đối tác'}</p>
              </div>
            </div>
            
            {/* Online Status Toggle */}
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
              <span className={`text-sm font-semibold ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                {isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
              </span>
              <button 
                onClick={handleToggleOnline}
                className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-300 ${isOnline ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-md shadow-emerald-500/10">
              <div className="flex items-center justify-between opacity-80 mb-3">
                <span className="text-sm font-medium">Tổng thu nhập</span>
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold">{formatCurrency(earnings.total)}</h2>
              <div className="mt-2 flex items-center gap-1 text-xs opacity-90">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+25% so với hôm qua</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-md shadow-orange-500/10">
              <div className="flex items-center justify-between opacity-80 mb-3">
                <span className="text-sm font-medium">Đơn đã giao</span>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold">{earnings.completed} đơn</h2>
              <p className="mt-2 text-xs opacity-95">Tỷ lệ hoàn thành: 100%</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-5 text-white shadow-md shadow-indigo-500/10">
              <div className="flex items-center justify-between opacity-80 mb-3">
                <span className="text-sm font-medium">Đánh giá sao</span>
                <Star className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold">{earnings.rating} / 5.0</h2>
              <p className="mt-2 text-xs opacity-95">120 lượt đánh giá tích cực</p>
            </div>

            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-5 text-white shadow-md shadow-pink-500/10">
              <div className="flex items-center justify-between opacity-80 mb-3">
                <span className="text-sm font-medium">Tiền Tips</span>
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold">{formatCurrency(earnings.tips)}</h2>
              <p className="mt-2 text-xs opacity-95">Nhận thêm từ khách hàng</p>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left section: Proposed & Active deliveries */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Proposed Offer */}
              {proposedOffer && (
                <div className="bg-orange-50/70 border-2 border-orange-400 rounded-3xl p-6 shadow-sm relative overflow-hidden animate-pulse">
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Đề xuất đơn hàng mới
                  </div>
                  
                  <div className="space-y-4 mt-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{proposedOffer.restaurantName}</h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <Store className="w-4 h-4 text-orange-500 shrink-0" /> {proposedOffer.restaurantAddress}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">Tiền ship nhận được</span>
                        <span className="text-xl font-extrabold text-orange-600">{formatCurrency(proposedOffer.shippingFee)}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-orange-200 my-3"></div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" /> 
                        <span><strong>Điểm giao:</strong> {proposedOffer.deliveryAddress} ({proposedOffer.distance})</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-start gap-2">
                        <PackageOpen className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <span><strong>Món ăn:</strong> {proposedOffer.items}</span>
                      </p>
                    </div>

                    <div className="flex gap-3 mt-4 pt-2">
                      <button 
                        onClick={handleAcceptProposed}
                        className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
                      >
                        Chấp nhận đơn
                      </button>
                      <button 
                        onClick={handleRejectProposed}
                        className="py-3 px-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-all active:scale-[0.98]"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Delivery */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-orange-500" /> Đơn hàng đang thực hiện
                </h2>

                {activeDelivery ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 gap-3">
                      <div>
                        <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">Đơn hàng active</span>
                        <h3 className="font-bold text-gray-900 text-lg">#{activeDelivery.id} - {activeDelivery.restaurantName}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Thu nhập của bạn</span>
                        <span className="font-extrabold text-lg text-emerald-600">{formatCurrency(activeDelivery.shippingFee)}</span>
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="relative py-4 px-2">
                      <div className="absolute left-[20px] top-[30px] bottom-[30px] w-0.5 bg-gray-200"></div>
                      
                      <div className="relative flex items-start gap-4 mb-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 font-bold text-sm ${
                          activeDelivery.step === 'accepted' || activeDelivery.step === 'arrived' || activeDelivery.step === 'picked_up'
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          1
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Đã nhận đơn</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Xác nhận chuyển giao cho tài xế</p>
                        </div>
                      </div>

                      <div className="relative flex items-start gap-4 mb-6">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 font-bold text-sm ${
                          activeDelivery.step === 'arrived' || activeDelivery.step === 'picked_up'
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          2
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Đã đến cửa hàng</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Lấy đồ ăn tại: {activeDelivery.restaurantAddress}</p>
                        </div>
                      </div>

                      <div className="relative flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 font-bold text-sm ${
                          activeDelivery.step === 'picked_up'
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          3
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Đang giao / Hoàn thành</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Giao đến cho khách tại: {activeDelivery.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600">
                      <p><strong>Món ăn cần lấy:</strong> {activeDelivery.items}</p>
                      <p><strong>Tổng tiền thu hộ (COD):</strong> <span className="font-bold text-orange-600">{formatCurrency(activeDelivery.totalAmount)}</span></p>
                    </div>

                    {/* Action buttons based on steps */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {activeDelivery.step !== 'picked_up' ? (
                        <button 
                          onClick={handleProgressDelivery}
                          className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
                        >
                          {activeDelivery.step === 'accepted' ? 'Đã đến cửa hàng' : 'Đã lấy đồ ăn'}
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={handleDeliverySuccess}
                            className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
                          >
                            Giao thành công
                          </button>
                          <button 
                            onClick={handleDeliveryFailed}
                            className="py-3 px-6 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-all active:scale-[0.98]"
                          >
                            Thất bại
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center">
                    <PackageOpen className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Bạn chưa nhận đơn hàng nào</p>
                    <p className="text-gray-400 text-xs mt-1">Các đơn hàng bạn nhận hoặc đề xuất sẽ hiện ở đây</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right section: Available offers */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-500 animate-bounce" /> Đơn hàng xung quanh
                </h2>

                <div className="space-y-4">
                  {availableOffers.map(offer => (
                    <div key={offer.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/10 transition-all space-y-3 group">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{offer.restaurantName}</h4>
                          <span className="text-[11px] text-gray-400 block mt-0.5">{offer.distance} • Giao trong khu vực</span>
                        </div>
                        <span className="font-extrabold text-sm text-emerald-600">{formatCurrency(offer.shippingFee)}</span>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1.5 bg-white p-2.5 rounded-xl border border-gray-100">
                        <p className="truncate"><strong>Lấy:</strong> {offer.restaurantAddress}</p>
                        <p className="truncate"><strong>Giao:</strong> {offer.deliveryAddress}</p>
                      </div>

                      <button 
                        onClick={() => handleAcceptAvailable(offer.id)}
                        className="w-full py-2 bg-white hover:bg-orange-500 hover:text-white border border-gray-200 hover:border-orange-500 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        Nhận đơn ngay <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {availableOffers.length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Hết đơn hàng chờ trong khu vực</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // Render Customer Orders View
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
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-800">Đơn hàng #{order.id.substring(0, 8)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Ngày đặt: {formatDate(order.createdAt)}</p>
                <p className="text-sm text-gray-500">Thanh toán: {order.paymentMethod}</p>
              </div>
              
              <div className="text-right">
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
