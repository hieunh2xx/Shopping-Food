import { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  Shield,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { shipperService } from '../../services';
import type { IProposedDeliveryOfferDto, IShipperIncomeReportDto } from '../../interfaces/IShipper';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { SuccessDeliveryModal } from './components/SuccessDeliveryModal';
import { OrderProposalPopup } from './components/OrderProposalPopup';

export function ShipperDashboard() {
  const { user } = useAuth();

  // Real state from API (persisted locally across page changes)
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem('shipper_is_online') === 'true';
  });
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [availableOffers, setAvailableOffers] = useState<IProposedDeliveryOfferDto[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // State cho Popup đề xuất 60s
  const [proposalPopupOffer, setProposalPopupOffer] = useState<IProposedDeliveryOfferDto | null>(null);

  // Active delivery (locally tracked after accept)
  const [activeDelivery, setActiveDelivery] = useState<{
    orderId: string;
    restaurantName: string;
    restaurantAddress: string;
    deliveryAddress: string;
    distanceInKm: number;
    totalIncome: number;
    totalAmount: number;
    contactName: string;
    contactPhone: string;
    note?: string;
    step: 'accepted' | 'arrived' | 'picked_up';
    googleMapNavigationUrl?: string;
  } | null>(() => {
    const saved = localStorage.getItem('shipper_active_delivery');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Save activeDelivery to localStorage whenever it changes
  useEffect(() => {
    if (activeDelivery) {
      localStorage.setItem('shipper_active_delivery', JSON.stringify(activeDelivery));
    } else {
      localStorage.removeItem('shipper_active_delivery');
    }
  }, [activeDelivery]);

  // Income report from API
  const [incomeReport, setIncomeReport] = useState<IShipperIncomeReportDto | null>(null);

  // GPS Coordinates (starts with HCM/Hanoi default, then grabs real Geolocation)
  const [coords, setCoords] = useState({ lat: 10.7769, lng: 106.7009 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Fetch available offers
  const fetchAvailableOffers = useCallback(async () => {
    try {
      const res = await shipperService.getAvailableOffers(coords.lat, coords.lng);
      if (res.data) {
        setAvailableOffers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch available offers:', err);
    }
  }, [coords.lat, coords.lng]);

  // Fetch income report (today)
  const fetchIncomeReport = useCallback(async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      const res = await shipperService.getIncomeReport(startOfDay, endOfDay);
      if (res.data) {
        setIncomeReport(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch income report:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      // Only show full screen loader on initial render
      if (loading) {
        await Promise.all([
          fetchAvailableOffers(),
          fetchIncomeReport()
        ]);
        setLoading(false);
      } else {
        // Just fetch in background without full screen loader
        await Promise.all([
          fetchAvailableOffers(),
          fetchIncomeReport()
        ]);
      }
    };
    loadData();
  }, [fetchAvailableOffers, fetchIncomeReport]);

  // Polling for new offers when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      fetchAvailableOffers();
    }, 8000); // Check for new offers every 8 seconds

    return () => clearInterval(interval);
  }, [isOnline, fetchAvailableOffers]);

  // Lắng nghe sự kiện thông báo hệ thống real-time để hiển thị popup hoặc nhận đơn Force Assign
  useEffect(() => {
    const handleNotification = async (e: CustomEvent) => {
      const n = e.detail;
      // 1. Nếu có đề xuất giao hàng mới
      if (n.title === 'Đề xuất giao hàng mới' && n.message) {
        const match = n.message.match(/'([a-fA-F0-9\-]{36})'/);
        if (match && match[1]) {
          const orderId = match[1];
          try {
            const res = await shipperService.getProposedOffer(orderId);
            if (res.data) {
              setProposalPopupOffer(res.data);
            }
          } catch (err) {
            console.error('Lỗi khi lấy thông tin đề xuất:', err);
          }
        }
      }
      // 2. Nếu bị gán bắt buộc (Force Assign)
      else if (n.title === 'Đơn hàng gán bắt buộc' && n.message) {
        toast.success(`Nhận được thông báo Force Assign! Message: ${n.message}`, { duration: 5000 });
        const match = n.message.match(/'([a-fA-F0-9\-]{36})'/);
        if (match && match[1]) {
          const orderId = match[1];
          try {
            toast.success(`Bắt đầu lấy thông tin đơn: ${orderId}`, { duration: 3000 });
            const res = await shipperService.getProposedOffer(orderId);
            if (res.data) {
              // Tự động ghi đè và gán thành active delivery
              setActiveDelivery({
                orderId: res.data.orderId,
                restaurantName: res.data.restaurantName,
                restaurantAddress: res.data.restaurantAddress,
                deliveryAddress: res.data.deliveryAddress,
                distanceInKm: res.data.distanceInKm,
                totalIncome: res.data.totalIncome,
                totalAmount: res.data.totalAmount,
                contactName: res.data.contactName,
                contactPhone: res.data.contactPhone,
                step: 'accepted'
              });
              toast.success('Bạn vừa được điều phối viên gán trực tiếp một đơn hàng mới!');
              // Ẩn popup đề xuất nếu đang hiển thị cho đơn này
              setProposalPopupOffer(prev => prev?.orderId === orderId ? null : prev);
            } else {
              toast.error(`API trả về nhưng không có data. Lỗi: ${res.message}`);
            }
          } catch (err: any) {
            console.error('Lỗi khi lấy thông tin force assign:', err);
            toast.error(`Lỗi API GetProposedOffer: ${err?.message || 'Không rõ'}`);
          }
        } else {
          toast.error(`Không thể trích xuất orderId từ message: ${n.message}`);
        }
      }
    };

    window.addEventListener('ON_REALTIME_NOTIFICATION', handleNotification as EventListener);
    return () => window.removeEventListener('ON_REALTIME_NOTIFICATION', handleNotification as EventListener);
  }, []);

  // Handlers cho Proposal Popup
  const handleAcceptProposal = async (orderId: string) => {
    if (!proposalPopupOffer) return;
    try {
      await shipperService.acceptOffer({
        orderId,
        latitude: coords.lat,
        longitude: coords.lng
      });
      setActiveDelivery({
        orderId: proposalPopupOffer.orderId,
        restaurantName: proposalPopupOffer.restaurantName,
        restaurantAddress: proposalPopupOffer.restaurantAddress,
        deliveryAddress: proposalPopupOffer.deliveryAddress,
        distanceInKm: proposalPopupOffer.distanceInKm,
        totalIncome: proposalPopupOffer.totalIncome,
        totalAmount: proposalPopupOffer.totalAmount,
        contactName: proposalPopupOffer.contactName,
        contactPhone: proposalPopupOffer.contactPhone,
        step: 'accepted'
      });
      setProposalPopupOffer(null);
      toast.success('Nhận đơn thành công!');
      fetchAvailableOffers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể nhận đơn. Có thể đơn đã bị hủy hoặc người khác đã nhận.');
      setProposalPopupOffer(null);
      fetchAvailableOffers();
    }
  };

  const handleRejectProposal = async (orderId: string) => {
    try {
      await shipperService.rejectOffer({ orderId, reason: 'Shipper từ chối' });
    } catch (e) { } // ignore
    setProposalPopupOffer(null);
  };

  const handleTimeoutProposal = async (orderId: string) => {
    try {
      await shipperService.rejectOffer({ orderId, reason: 'Quá thời gian phản hồi' });
    } catch (e) { } // ignore
    setProposalPopupOffer(null);
    toast.error('Đã hết thời gian phản hồi đề xuất.');
  };

  // Update live GPS location to backend periodically when online
  useEffect(() => {
    if (!isOnline) return;

    const updateGPSLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newCoords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCoords(newCoords);

            // Post live location to backend API
            try {
              await shipperService.updateLocation({
                latitude: newCoords.lat,
                longitude: newCoords.lng
              });
            } catch (err) {
              console.error("Gửi GPS lên server thất bại:", err);
            }
          },
          (error) => {
            console.warn("Lỗi định vị GPS hoặc chưa cấp quyền:", error.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    };

    updateGPSLocation();
    const locInterval = setInterval(updateGPSLocation, 15000); // Update location every 15s

    return () => clearInterval(locInterval);
  }, [isOnline]);

  // Load routing details for active delivery
  useEffect(() => {
    if (!activeDelivery || activeDelivery.googleMapNavigationUrl) return;

    const fetchRoute = async () => {
      try {
        const res = await shipperService.getDeliveryRoute(activeDelivery.orderId);
        if (res.data?.googleMapNavigationUrl) {
          setActiveDelivery(prev => prev ? {
            ...prev,
            googleMapNavigationUrl: res.data.googleMapNavigationUrl
          } : null);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin đường đi:", err);
      }
    };

    fetchRoute();
  }, [activeDelivery?.orderId]);

  // Toggle online/offline
  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const newStatus = !isOnline;
      const res = await shipperService.toggleOnline({ isOnline: newStatus });

      if (res && res.error) {
        toast.error(res.message || 'Không thể thay đổi trạng thái.');
        return;
      }

      setIsOnline(newStatus);
      localStorage.setItem('shipper_is_online', newStatus ? 'true' : 'false');
      toast.success(newStatus ? 'Bạn đã BẬT trạng thái trực tuyến!' : 'Bạn đã TẮT trạng thái trực tuyến!');
      if (newStatus) {
        // Refresh offers when going online
        fetchAvailableOffers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thay đổi trạng thái. Vui lòng thử lại.');
    } finally {
      setTogglingOnline(false);
    }
  };

  // Accept an available offer
  const handleAcceptOffer = async (orderId: string) => {
    if (!isOnline) {
      toast.error('Vui lòng bật trạng thái trực tuyến để nhận đơn');
      return;
    }
    if (activeDelivery) {
      toast.error('Bạn đang có đơn hàng chưa hoàn thành');
      return;
    }

    setActionLoading(orderId);
    try {
      await shipperService.acceptOffer({
        orderId,
        latitude: coords.lat,
        longitude: coords.lng
      });

      const offer = availableOffers.find(o => o.orderId === orderId);
      if (offer) {
        setActiveDelivery({
          orderId: offer.orderId,
          restaurantName: offer.restaurantName,
          restaurantAddress: offer.restaurantAddress,
          deliveryAddress: offer.deliveryAddress,
          distanceInKm: offer.distanceInKm,
          totalIncome: offer.totalIncome,
          totalAmount: offer.totalAmount,
          contactName: offer.contactName,
          contactPhone: offer.contactPhone,
          note: offer.note,
          step: 'accepted'
        });
        setAvailableOffers(prev => prev.filter(o => o.orderId !== orderId));
      }
      toast.success('Đã chấp nhận đơn hàng!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể nhận đơn hàng. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject an offer
  const handleRejectOffer = async (orderId: string) => {
    setActionLoading(`reject-${orderId}`);
    try {
      await shipperService.rejectOffer({ orderId });
      setAvailableOffers(prev => prev.filter(o => o.orderId !== orderId));
      toast.success('Đã từ chối đơn hàng');
    } catch (err) {
      toast.error('Không thể từ chối đơn hàng.');
    } finally {
      setActionLoading(null);
    }
  };

  // Progress delivery steps
  const handleProgressDelivery = async () => {
    if (!activeDelivery) return;

    setActionLoading('progress');
    try {
      if (activeDelivery.step === 'accepted') {
        await shipperService.confirmArrived({
          orderId: activeDelivery.orderId,
          latitude: coords.lat,
          longitude: coords.lng
        });
        setActiveDelivery({ ...activeDelivery, step: 'arrived' });
        toast.success('Đã xác nhận đến cửa hàng!');
      } else if (activeDelivery.step === 'arrived') {
        // For confirm picked up, we need verification code from restaurant
        // For now, prompt user or use a default
        const verificationCode = prompt('Nhập mã xác nhận từ nhà hàng:');
        if (!verificationCode) {
          setActionLoading(null);
          return;
        }
        await shipperService.confirmPickedUp({
          orderId: activeDelivery.orderId,
          verificationCode,
          latitude: coords.lat,
          longitude: coords.lng
        });
        setActiveDelivery({ ...activeDelivery, step: 'picked_up' });
        toast.success('Đã lấy hàng thành công! Bắt đầu giao hàng.');
      }
    } catch (err) {
      toast.error('Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  // Complete delivery
  const handleDeliverySuccess = () => {
    if (!activeDelivery) return;
    setIsSuccessModalOpen(true);
  };

  const handleDeliverySuccessComplete = () => {
    setActiveDelivery(null);
    fetchIncomeReport();
    fetchAvailableOffers();
  };

  // Failed delivery
  const handleDeliveryFailed = async () => {
    if (!activeDelivery) return;

    const reason = prompt('Nhập lý do giao hàng thất bại:');
    if (!reason) return;

    setActionLoading('failed');
    try {
      await shipperService.confirmFailed({
        orderId: activeDelivery.orderId,
        reason,
        latitude: coords.lat,
        longitude: coords.lng
      });
      setActiveDelivery(null);
      toast.error('Đã báo cáo giao hàng thất bại.');
      fetchAvailableOffers();
    } catch (err) {
      toast.error('Không thể báo cáo giao thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Đang tải bảng điều khiển...</p>
        </div>
      </div>
    );
  }

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
              disabled={togglingOnline}
              className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              {togglingOnline ? (
                <Loader2 className="w-5 h-5 text-white animate-spin mx-auto" />
              ) : (
                <span className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-300 ${isOnline ? 'translate-x-8' : 'translate-x-1'}`} />
              )}
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
            <h2 className="text-2xl font-extrabold">{formatCurrency(incomeReport?.totalIncome ?? 0)}</h2>
            <div className="mt-2 flex items-center gap-1 text-xs opacity-90">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Hôm nay</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-md shadow-orange-500/10">
            <div className="flex items-center justify-between opacity-80 mb-3">
              <span className="text-sm font-medium">Đơn đã giao</span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold">{incomeReport?.completedOrdersCount ?? 0} đơn</h2>
            <p className="mt-2 text-xs opacity-95">Thu nhập cơ bản: {formatCurrency(incomeReport?.totalBaseFees ?? 0)}</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-5 text-white shadow-md shadow-indigo-500/10">
            <div className="flex items-center justify-between opacity-80 mb-3">
              <span className="text-sm font-medium">Tiền thưởng</span>
              <Star className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold">{formatCurrency(incomeReport?.totalBonuses ?? 0)}</h2>
            <p className="mt-2 text-xs opacity-95">Bonus hôm nay</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-5 text-white shadow-md shadow-pink-500/10">
            <div className="flex items-center justify-between opacity-80 mb-3">
              <span className="text-sm font-medium">Đơn chờ nhận</span>
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold">{availableOffers.length} đơn</h2>
            <p className="mt-2 text-xs opacity-95">Trong khu vực của bạn</p>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left section: Active delivery */}
          <div className="lg:col-span-2 space-y-6">

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
                      <h3 className="font-bold text-gray-900 text-lg">#{activeDelivery.orderId.slice(0, 8)} - {activeDelivery.restaurantName}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Khách hàng:</strong> {activeDelivery.contactName} • {activeDelivery.contactPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Thu nhập của bạn</span>
                      <span className="font-extrabold text-lg text-emerald-600">{formatCurrency(activeDelivery.totalIncome)}</span>
                    </div>
                  </div>

                  {/* Progress tracker */}
                  <div className="relative py-4 px-2">
                    <div className="absolute left-[20px] top-[30px] bottom-[30px] w-0.5 bg-gray-200"></div>

                    <div className="relative flex items-start gap-4 mb-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 font-bold text-sm ${activeDelivery.step === 'accepted' || activeDelivery.step === 'arrived' || activeDelivery.step === 'picked_up'
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 font-bold text-sm ${activeDelivery.step === 'arrived' || activeDelivery.step === 'picked_up'
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 font-bold text-sm ${activeDelivery.step === 'picked_up'
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
                    {activeDelivery.note && (
                      <p><strong>Ghi chú:</strong> {activeDelivery.note}</p>
                    )}
                    <p><strong>Khoảng cách:</strong> {activeDelivery.distanceInKm.toFixed(1)} km</p>
                    <p><strong>Tổng tiền thu hộ (COD):</strong> <span className="font-bold text-orange-600">{formatCurrency(activeDelivery.totalAmount)}</span></p>
                    {activeDelivery.googleMapNavigationUrl && (
                      <div className="pt-2">
                        <a
                          href={activeDelivery.googleMapNavigationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors bg-orange-50 px-3.5 py-2 rounded-xl border border-orange-100 hover:bg-orange-100/50"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Xem bản đồ dẫn đường (Google Maps)
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action buttons based on steps */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {activeDelivery.step !== 'picked_up' ? (
                      <button
                        onClick={handleProgressDelivery}
                        disabled={actionLoading === 'progress'}
                        className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading === 'progress' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {activeDelivery.step === 'accepted' ? 'Đã đến cửa hàng' : 'Đã lấy đồ ăn'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleDeliverySuccess}
                          disabled={actionLoading === 'success'}
                          className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {actionLoading === 'success' && <Loader2 className="w-4 h-4 animate-spin" />}
                          Giao thành công
                        </button>
                        <button
                          onClick={handleDeliveryFailed}
                          disabled={actionLoading === 'failed'}
                          className="py-3 px-6 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {actionLoading === 'failed' && <Loader2 className="w-4 h-4 animate-spin" />}
                          Thất bại
                        </button>
                      </>
                    )}
                  </div>

                  {/* Báo cáo sự cố */}
                  <div className="pt-3 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-600 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Báo cáo sự cố (Khách hàng/Nhà hàng)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center">
                  <PackageOpen className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Bạn chưa nhận đơn hàng nào</p>
                  <p className="text-gray-400 text-xs mt-1">Nhận đơn từ danh sách bên phải để bắt đầu giao hàng</p>
                </div>
              )}
            </div>
          </div>

          {/* Right section: Available offers */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-500 animate-bounce" /> Đơn hàng xung quanh
                </h2>
                <button
                  onClick={fetchAvailableOffers}
                  className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                  title="Làm mới"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {availableOffers.map(offer => (
                  <div
                    key={offer.orderId}
                    onClick={() => setProposalPopupOffer(offer)}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/10 transition-all space-y-3 group cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{offer.restaurantName}</h4>
                        <span className="text-[11px] text-gray-400 block mt-0.5">{offer.distanceInKm.toFixed(1)} km • Giao trong khu vực</span>
                      </div>
                      <span className="font-extrabold text-sm text-emerald-600">{formatCurrency(offer.totalIncome)}</span>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1.5 bg-white p-2.5 rounded-xl border border-gray-100">
                      <p className="truncate flex items-start gap-1">
                        <Store className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                        <span><strong>Lấy:</strong> {offer.restaurantAddress}</span>
                      </p>
                      <p className="truncate flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                        <span><strong>Giao:</strong> {offer.deliveryAddress}</span>
                      </p>
                      <p className="text-gray-400">
                        <strong>Khách:</strong> {offer.contactName} • COD: {formatCurrency(offer.totalAmount)}
                      </p>
                    </div>

                    {offer.countdownSeconds > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Hết hạn sau {offer.countdownSeconds}s</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptOffer(offer.orderId);
                        }}
                        disabled={actionLoading === offer.orderId || !!activeDelivery}
                        className="flex-1 py-2 bg-white hover:bg-orange-500 hover:text-white border border-gray-200 hover:border-orange-500 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {actionLoading === offer.orderId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>Nhận đơn ngay <ArrowRight className="w-3.5 h-3.5" /></>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectOffer(offer.orderId)}
                        disabled={actionLoading === `reject-${offer.orderId}`}
                        className="py-2 px-3 bg-white hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {actionLoading === `reject-${offer.orderId}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Bỏ qua'
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {availableOffers.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Hết đơn hàng chờ trong khu vực</p>
                    <button
                      onClick={fetchAvailableOffers}
                      className="mt-3 text-xs text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Tải lại
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {activeDelivery && (
        <>
          <ReportIncidentModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            orderId={activeDelivery.orderId}
          />
          <SuccessDeliveryModal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            orderId={activeDelivery.orderId}
            latitude={coords?.lat || 0}
            longitude={coords?.lng || 0}
            onSuccess={handleDeliverySuccessComplete}
          />
        </>
      )}

      {/* Popup Đề xuất đơn hàng */}
      {proposalPopupOffer && (
        <OrderProposalPopup
          offer={proposalPopupOffer}
          onAccept={handleAcceptProposal}
          onReject={handleRejectProposal}
          onTimeout={handleTimeoutProposal}
        />
      )}
    </div>
  );
}
