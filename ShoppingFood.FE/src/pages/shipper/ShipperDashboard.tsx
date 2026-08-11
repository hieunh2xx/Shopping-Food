import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  RefreshCw,
  Phone,
  Utensils,
  ChevronLeft,
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { shipperService } from '../../services';
import type { IProposedDeliveryOfferDto, IShipperIncomeReportDto } from '../../interfaces/IShipper';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { SuccessDeliveryModal } from './components/SuccessDeliveryModal';
import { OrderProposalPopup } from './components/OrderProposalPopup';
import { PickupCodeModal } from './components/PickupCodeModal';
import { Modal, Button } from '../../components/common';

export function ShipperDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Real state from API (persisted locally across page changes)
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem('shipper_is_online') === 'true';
  });
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [availableOffers, setAvailableOffers] = useState<IProposedDeliveryOfferDto[]>([]);
  const [reportModalOrderId, setReportModalOrderId] = useState<string | null>(null);
  const [successModalOrderId, setSuccessModalOrderId] = useState<string | null>(null);
  const [explanationOrderId, setExplanationOrderId] = useState<string | null>(null);
  const [explanationRequest, setExplanationRequest] = useState<{ id: string; requestMessage: string } | null>(null);
  const [explanationReply, setExplanationReply] = useState('');
  const [submittingExplanation, setSubmittingExplanation] = useState(false);

  // Modals for prompt replacement
  const [isPickupCodeModalOpen, setIsPickupCodeModalOpen] = useState(false);
  const [pendingPickupOrderId, setPendingPickupOrderId] = useState<string | null>(null);

  // State cho Popup đề xuất 60s
  const [proposalPopupOffer, setProposalPopupOffer] = useState<IProposedDeliveryOfferDto | null>(null);

  const [activeDeliveries, setActiveDeliveries] = useState<(IProposedDeliveryOfferDto & { 
    step?: 'accepted' | 'arrived' | 'picked_up', 
    googleMapNavigationUrl?: string,
    customerLatitude?: number,
    customerLongitude?: number 
  })[]>(() => {
    const saved = localStorage.getItem('shipper_active_deliveries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Chi tiết đơn đang xem (null = danh sách)
  const [selectedActiveOrderId, setSelectedActiveOrderId] = useState<string | null>(null);
  const prevActiveCountRef = useRef(0);

  // Save activeDeliveries to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shipper_active_deliveries', JSON.stringify(activeDeliveries));
  }, [activeDeliveries]);

  // Deep-link yêu cầu giải trình từ thông báo
  useEffect(() => {
    const oid = searchParams.get('explanationOrderId');
    if (!oid) return;
    setExplanationOrderId(oid);
    setExplanationReply('');
    setExplanationRequest(null);
    shipperService.getExplanation(oid).then((res) => {
      if (!res.error && Array.isArray(res.data)) {
        const pending = (res.data as any[]).find((e) => e.status === 'Pending');
        if (pending) {
          setExplanationRequest({ id: pending.id, requestMessage: pending.requestMessage });
        } else {
          toast.error('Không có yêu cầu giải trình đang chờ cho đơn này.');
          setExplanationOrderId(null);
        }
      }
    }).catch(() => {
      toast.error('Không tải được yêu cầu giải trình.');
      setExplanationOrderId(null);
    });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('explanationOrderId');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  // 1 đơn (mới nhận / còn lại) → mở chi tiết; vừa nhận thêm ≥2 → về danh sách
  useEffect(() => {
    const count = activeDeliveries.length;
    const prev = prevActiveCountRef.current;

    if (count === 0) {
      setSelectedActiveOrderId(null);
    } else if (count === 1 && (prev === 0 || prev > 1)) {
      setSelectedActiveOrderId(activeDeliveries[0].orderId);
    } else if (count > 1 && prev <= 1) {
      setSelectedActiveOrderId(null);
    } else if (selectedActiveOrderId && !activeDeliveries.some(d => d.orderId === selectedActiveOrderId)) {
      setSelectedActiveOrderId(null);
    }

    prevActiveCountRef.current = count;
  }, [activeDeliveries, selectedActiveOrderId]);

  const selectedActiveDelivery = selectedActiveOrderId
    ? activeDeliveries.find(d => d.orderId === selectedActiveOrderId) ?? null
    : null;

  const getStepLabel = (step?: string) => {
    switch (step) {
      case 'arrived': return 'Đã đến quán';
      case 'picked_up': return 'Đang giao';
      default: return 'Đã nhận đơn';
    }
  };

  // Income report from API
  const [incomeReport, setIncomeReport] = useState<IShipperIncomeReportDto | null>(null);

  // GPS Coordinates (starts with HCM/Hanoi default, then grabs real Geolocation)
  const [coords, setCoords] = useState({ lat: 10.7769, lng: 106.7009 });

  const formatCurrency = (amount: number | undefined | null) => {
    const validAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(validAmount);
  };

  const getDynamicMapLink = (delivery: any) => {
    // If heading to restaurant (accepted / arrived)
    if (delivery.step === 'accepted' || delivery.step === 'arrived') {
      if (delivery.restaurantLatitude && delivery.restaurantLongitude) {
        return `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${delivery.restaurantLatitude},${delivery.restaurantLongitude}&travelmode=driving`;
      }
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.restaurantAddress)}`;
    }
    // If heading to customer (picked_up)
    if (delivery.step === 'picked_up') {
      if (delivery.customerLatitude && delivery.customerLongitude) {
        return `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${delivery.customerLatitude},${delivery.customerLongitude}&travelmode=driving`;
      }
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.deliveryAddress)}`;
    }
    // Fallback
    return delivery.googleMapNavigationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.deliveryAddress)}`;
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
      // Validate active deliveries stored in localStorage
      const saved = localStorage.getItem('shipper_active_deliveries');
      if (saved) {
        try {
          const deliveries = JSON.parse(saved);
          if (deliveries.length > 0) {
            const promises = deliveries.map(async (d: any) => {
              try {
                const routeRes = await shipperService.getDeliveryRoute(d.orderId);
                return { 
                  valid: true, 
                  id: d.orderId, 
                  googleMapNavigationUrl: routeRes.data?.googleMapNavigationUrl,
                  restaurantLatitude: routeRes.data?.restaurantLatitude,
                  restaurantLongitude: routeRes.data?.restaurantLongitude,
                  customerLatitude: routeRes.data?.customerLatitude,
                  customerLongitude: routeRes.data?.customerLongitude
                };
              } catch (err: any) {
                const status = err.response?.status;
                if (status === 403 || status === 404) {
                  return { valid: false, id: d.orderId, googleMapNavigationUrl: undefined };
                }
                // Keep it if it's 400 (e.g., missing GPS) or 500
                return { valid: true, id: d.orderId, googleMapNavigationUrl: undefined };
              }
            });
            const results = await Promise.all(promises);
            const invalidIds = results.filter(r => !r.valid).map(r => r.id);
            if (invalidIds.length > 0) {
              setActiveDeliveries(prev => prev.filter(d => !invalidIds.includes(d.orderId)));
              toast.error("Một số đơn hàng đã hoàn thành hoặc bị thu hồi và được gỡ khỏi danh sách.");
            }
            // Update activeDeliveries with googleMapNavigationUrl and coordinates
            setActiveDeliveries(prev => prev.map(d => {
              const res = results.find(r => r.id === d.orderId);
              if (res) {
                return { 
                  ...d, 
                  googleMapNavigationUrl: res.googleMapNavigationUrl || d.googleMapNavigationUrl,
                  restaurantLatitude: res.restaurantLatitude || d.restaurantLatitude,
                  restaurantLongitude: res.restaurantLongitude || d.restaurantLongitude,
                  customerLatitude: res.customerLatitude || d.customerLatitude,
                  customerLongitude: res.customerLongitude || d.customerLongitude
                };
              }
              return d;
            }));
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      if (loading) {
        await Promise.all([
          fetchAvailableOffers(),
          fetchIncomeReport()
        ]);
        setLoading(false);
      } else {
        await Promise.all([
          fetchAvailableOffers(),
          fetchIncomeReport()
        ]);
      }
    };
    loadData();
  }, [fetchAvailableOffers, fetchIncomeReport]);



  // Lắng nghe sự kiện thông báo hệ thống real-time để hiển thị popup hoặc nhận đơn Force Assign / Hủy đơn
  useEffect(() => {
    const handleNotification = async (e: Event) => {
      const n = (e as CustomEvent).detail;
      const titleLower = (n.title || '').toLowerCase();
      const msgLower = (n.message || '').toLowerCase();

      // 1. Nếu có đề xuất giao hàng mới
      if (n.title === 'Đề xuất giao hàng mới' && n.message) {
        const match = n.message.match(/'([a-fA-F0-9\-]{36})'/);
        if (match && match[1]) {
          const orderId = match[1];
          try {
            fetchAvailableOffers(); // Sync list as well
            const res = await shipperService.getProposedOffer(orderId, coords.lat, coords.lng);
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
        toast.success(`Nhận được thông báo Force Assign!`, { duration: 5000 });
        const match = n.message.match(/'([a-fA-F0-9\-]{36})'/);
        if (match && match[1]) {
          const orderId = match[1];
          try {
            const res = await shipperService.getProposedOffer(orderId, coords.lat, coords.lng);
            if (res.data) {
              // Tự động gán vào danh sách active deliveries
              setActiveDeliveries(prev => [...prev, {
                ...res.data,
                step: 'accepted'
              }]);
              toast.success('Bạn vừa được điều phối viên gán trực tiếp một đơn hàng mới!');
              // Ẩn popup đề xuất nếu đang hiển thị cho đơn này
              setProposalPopupOffer(prev => prev?.orderId === orderId ? null : prev);
            }
          } catch (err: any) {
            console.error('Lỗi khi lấy thông tin force assign:', err);
          }
        }
      }
      // 3. Nếu đơn hàng bị hủy, bị thu hồi hoặc chuyển giao cho người khác
      else if (titleLower.includes('hủy') || titleLower.includes('cancel') || titleLower.includes('thu hồi') || titleLower.includes('chuyển giao') || msgLower.includes('hủy')) {
        let orderId = n.targetId;
        if (!orderId && n.message) {
          const match = n.message.match(/'([a-fA-F0-9\-]{36})'/);
          if (match && match[1]) {
            orderId = match[1];
          }
        }

        if (orderId) {
          setActiveDeliveries(prev => prev.filter(d => d.orderId !== orderId && !d.orderId.startsWith(orderId)));
          setAvailableOffers(prev => prev.filter(o => o.orderId !== orderId && !o.orderId.startsWith(orderId)));
          setProposalPopupOffer(prev => prev?.orderId === orderId ? null : prev);
          toast.error(`Đơn hàng #${orderId.slice(0, 8)} đã bị hủy hoặc thu hồi.`, { duration: 5000 });
        } else {
          toast.error(n.message || 'Đơn hàng đã bị hủy hoặc thu hồi.', { duration: 5000 });
        }
        fetchAvailableOffers();
      }
    };

    window.addEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
    return () => window.removeEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
  }, [fetchAvailableOffers, coords.lat, coords.lng]);

  // Tự động làm mới danh sách đề xuất đơn hàng mỗi 10 giây khi Online để đồng bộ real-time
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      fetchAvailableOffers();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOnline, fetchAvailableOffers]);

  // Handlers cho Proposal Popup
  const handleAcceptProposal = async (orderId: string) => {
    if (!proposalPopupOffer) return;
    try {
      const res = await shipperService.acceptOffer({
        orderId,
        latitude: coords.lat,
        longitude: coords.lng
      });
      if (res.error) {
        toast.error(res.message || 'Đơn hàng đã được tài xế khác nhận.');
        setProposalPopupOffer(null);
        fetchAvailableOffers();
        return;
      }
      setActiveDeliveries(prev => [...prev, {
        ...proposalPopupOffer,
        step: 'accepted'
      }]);
      setProposalPopupOffer(null);
      toast.success('Nhận đơn thành công!');
      fetchAvailableOffers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đơn hàng đã được tài xế khác nhận.');
      setProposalPopupOffer(null);
      fetchAvailableOffers();
    }
  };

    const handleRejectProposal = async (orderId: string) => {
    try {
      await shipperService.rejectOffer({ orderId, isExpired: false });
      toast.success('Đã bỏ qua đề xuất đơn hàng');
    } catch (e) { } // ignore
    setProposalPopupOffer(null);
  };

  const handleTimeoutProposal = async (orderId: string) => {
    try {
      await shipperService.rejectOffer({ orderId, isExpired: true });
    } catch (e) { } // ignore
    setProposalPopupOffer(null);
    toast.error('Hết thời gian phản hồi. Đề xuất đơn hàng đã được chuyển cho Shipper khác.');
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

  // Load routing details cho tất cả các đơn hàng chưa có link Map
  useEffect(() => {
    const fetchRoutes = async () => {
      const deliveriesToUpdate = activeDeliveries.filter(d => !d.googleMapNavigationUrl);
      if (deliveriesToUpdate.length === 0) return;

      try {
        const promises = deliveriesToUpdate.map(async (delivery) => {
          const res = await shipperService.getDeliveryRoute(delivery.orderId);
          if (res.data) {
            return { orderId: delivery.orderId, url: res.data.googleMapNavigationUrl };
          }
          return null;
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null) as { orderId: string, url: string }[];

        if (validResults.length > 0) {
          setActiveDeliveries(prev => prev.map(d => {
            const match = validResults.find(r => r.orderId === d.orderId);
            if (match) {
              return { ...d, googleMapNavigationUrl: match.url };
            }
            return d;
          }));
        }
      } catch (e) {
        console.error("Lỗi khi fetch routing:", e);
      }
    };
    fetchRoutes();
  }, [activeDeliveries]);

  // Toggle online/offline
  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const newStatus = !isOnline;
      const res = await shipperService.toggleOnline({ isOnline: newStatus });

      if (res && res.error) {
        toast.error(res.message);
        return;
      }

      setIsOnline(newStatus);

      localStorage.setItem('shipper_is_online', newStatus ? 'true' : 'false');
      toast.success(newStatus ? 'Trạng thái đã chuyển sang đang hoạt động.' : 'Trạng thái đã chuyển sang ngừng hoạt động. Bạn sẽ không nhận được đề xuất đơn hàng mới.');
      if (newStatus) {
        // Refresh offers when going online
        fetchAvailableOffers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setTogglingOnline(false);
    }
  };

  // Accept an available offer
  const handleStepTransition = async (orderId: string) => {
    const activeDelivery = activeDeliveries.find(d => d.orderId === orderId);
    if (!activeDelivery) return;

    setActionLoading(activeDelivery.orderId);
    try {
      if (activeDelivery.step === 'accepted') {
        const res = await shipperService.confirmArrived({
          orderId: activeDelivery.orderId,
          latitude: coords.lat,
          longitude: coords.lng
        });
        if (!res.error) {
          toast.success(res.message || 'Đã xác nhận đến nhà hàng thành công!');
          setActiveDeliveries(prev => prev.map(d => d.orderId === orderId ? { ...d, step: 'arrived' } : d));
        } else {
          toast.error(res.message);
        }
      } else if (activeDelivery.step === 'arrived') {
        setPendingPickupOrderId(activeDelivery.orderId);
        setIsPickupCodeModalOpen(true);
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 403 || status === 404) {
        setActiveDeliveries(prev => prev.filter(d => d.orderId !== orderId));
        toast.error('Đơn hàng không còn hợp lệ hoặc đã bị thu hồi.');
      } else {
        toast.error(err.response?.data?.message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPickup = async (code: string) => {
    if (!pendingPickupOrderId) return;
    setIsPickupCodeModalOpen(false);
    setActionLoading(pendingPickupOrderId);
    try {
      const res = await shipperService.confirmPickedUp({
        orderId: pendingPickupOrderId,
        verificationCode: code,
        latitude: coords.lat,
        longitude: coords.lng
      });
      if (!res.error) {
        toast.success(res.message || 'Đã xác nhận lấy hàng thành công!');
        setActiveDeliveries(prev => prev.map(d => d.orderId === pendingPickupOrderId ? { ...d, step: 'picked_up' } : d));
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 403 || status === 404) {
        setActiveDeliveries(prev => prev.filter(d => d.orderId !== pendingPickupOrderId));
        toast.error('Đơn hàng không còn hợp lệ hoặc đã bị thu hồi.');
      } else {
        toast.error(err.response?.data?.message);
      }
    } finally {
      setActionLoading(null);
      setPendingPickupOrderId(null);
    }
  };

  const handleAcceptOffer = async (orderId: string) => {
    if (!isOnline) {
      toast.error('Vui lòng bật trạng thái trực tuyến để nhận đơn');
      return;
    }


    setActionLoading(orderId);
    try {
      const res = await shipperService.acceptOffer({
        orderId,
        latitude: coords.lat,
        longitude: coords.lng
      });
      if (res.error) {
        toast.error(res.message || 'Đơn hàng đã được tài xế khác nhận. Vui lòng chọn đơn khác.');
        setAvailableOffers(prev => prev.filter(o => o.orderId !== orderId));
        fetchAvailableOffers();
        return;
      }

      const offer = availableOffers.find(o => o.orderId === orderId);
      if (offer) {
        let routeData: any = undefined;
        try {
          const routeRes = await shipperService.getDeliveryRoute(orderId);
          routeData = routeRes.data;
        } catch {
          // ignore error if unable to fetch route
        }

        setActiveDeliveries(prev => [...prev, {
          ...offer,
          step: 'accepted',
          googleMapNavigationUrl: routeData?.googleMapNavigationUrl,
          restaurantLatitude: routeData?.restaurantLatitude || offer.restaurantLatitude,
          restaurantLongitude: routeData?.restaurantLongitude || offer.restaurantLongitude,
          customerLatitude: routeData?.customerLatitude,
          customerLongitude: routeData?.customerLongitude
        }]);
        setAvailableOffers(prev => prev.filter(o => o.orderId !== orderId));
      }
      toast.success('Đã chấp nhận đơn hàng. Vui lòng di chuyển đến cửa hàng để nhận món.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đơn hàng đã được tài xế khác nhận. Vui lòng chọn đơn khác.');
      setAvailableOffers(prev => prev.filter(o => o.orderId !== orderId));
      fetchAvailableOffers();
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

  // Complete delivery
  const handleSuccessCallback = () => {
    if (!successModalOrderId) return;
    setActiveDeliveries(prev => prev.filter(d => d.orderId !== successModalOrderId));
    setSuccessModalOrderId(null);
    fetchAvailableOffers();
    fetchIncomeReport();
  };

  // Failed delivery / incident — cùng modal chọn lý do
  const handleDeliveryFailedClick = (orderId: string) => {
    setReportModalOrderId(orderId);
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
              <div className="flex items-center justify-between mb-6 gap-3">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-orange-500" /> Đơn hàng đang thực hiện
                  {activeDeliveries.length > 0 && (
                    <span className="ml-1 px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                      {activeDeliveries.length}
                    </span>
                  )}
                </h2>
                {selectedActiveDelivery && activeDeliveries.length >= 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedActiveOrderId(null)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Danh sách
                  </button>
                )}
              </div>

              {activeDeliveries.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center">
                  <PackageOpen className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Bạn chưa nhận đơn hàng nào</p>
                  <p className="text-gray-400 text-xs mt-1">Nhận đơn từ danh sách bên phải để bắt đầu giao hàng</p>
                </div>
              ) : selectedActiveDelivery ? (
                /* ===== DETAIL VIEW ===== */
                (() => {
                  const activeDelivery = selectedActiveDelivery;
                  const index = activeDeliveries.findIndex(d => d.orderId === activeDelivery.orderId);
                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 gap-3">
                        <div>
                          <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">Đơn hàng #{index + 1}</span>
                          <h3 className="font-bold text-gray-900 text-lg">#{activeDelivery.orderId.slice(0, 8)} - {activeDelivery.restaurantName}</h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <p className="text-xs text-gray-500 flex-1 min-w-[140px]">
                              <strong>Khách hàng:</strong> {activeDelivery.contactName} • {activeDelivery.contactPhone}
                            </p>
                            <a
                              href={`tel:${(activeDelivery.contactPhone || '').replace(/[^\d+]/g, '')}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" /> Gọi Khách
                            </a>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    (activeDelivery.contactPhone || '').replace(/[^\d+]/g, '') || activeDelivery.contactPhone
                                  );
                                  toast.success('Đã sao chép SĐT khách');
                                } catch {
                                  toast.error('Không sao chép được số điện thoại');
                                }
                              }}
                            >
                              Sao chép SĐT
                            </button>
                          </div>
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

                      <div className="border-t border-gray-100 pt-4 space-y-3 text-sm text-gray-600">
                        {activeDelivery.note && (
                          <p><strong>Ghi chú:</strong> {activeDelivery.note}</p>
                        )}
                        <p><strong>Khoảng cách đến quán:</strong>{' '}
                          {typeof activeDelivery.distanceInKm === 'number' && !Number.isNaN(activeDelivery.distanceInKm)
                            ? `${activeDelivery.distanceInKm.toFixed(1)} km`
                            : '—'}
                        </p>
                        <p><strong>Quãng đường giao khách:</strong>{' '}
                          {typeof activeDelivery.deliveryDistanceInKm === 'number' && !Number.isNaN(activeDelivery.deliveryDistanceInKm)
                            ? `${activeDelivery.deliveryDistanceInKm.toFixed(1)} km`
                            : '—'}
                        </p>
                        <p><strong>Tổng tiền đơn:</strong> <span className="font-bold text-gray-900">{formatCurrency(activeDelivery.totalAmount)}</span></p>
                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 space-y-1 text-xs">
                          <p className="font-bold text-gray-700 uppercase">Chi tiết giá trị đơn</p>
                          <div className="flex justify-between"><span>Tiền món (ước tính)</span><span className="font-bold">{formatCurrency(Math.max(0, (activeDelivery.totalAmount || 0) - ((activeDelivery as any).shippingFee || 0)))}</span></div>
                          <div className="flex justify-between"><span>Tổng thanh toán</span><span className="font-bold text-orange-600">{formatCurrency(activeDelivery.totalAmount)}</span></div>
                        </div>
                        <div className="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-100 space-y-1">
                          <p className="text-xs font-bold text-emerald-800 uppercase">Chi tiết thu nhập</p>
                          <div className="flex justify-between text-xs text-emerald-900"><span>Phí cơ bản</span><span className="font-bold">{formatCurrency(activeDelivery.baseFee || 0)}</span></div>
                          <div className="flex justify-between text-xs text-emerald-900"><span>Phí km</span><span className="font-bold">{formatCurrency(activeDelivery.distanceFee || 0)}</span></div>
                          {(activeDelivery.peakBonus || 0) > 0 && (
                            <div className="flex justify-between text-xs text-emerald-900"><span>Thưởng giờ cao điểm</span><span className="font-bold">{formatCurrency(activeDelivery.peakBonus)}</span></div>
                          )}
                          <div className="flex justify-between text-sm font-extrabold text-emerald-700 pt-1 border-t border-emerald-200/60">
                            <span>Tổng thu nhập</span>
                            <span>{formatCurrency(activeDelivery.totalIncome)}</span>
                          </div>
                        </div>
                        <p><strong>Tổng tiền thu hộ (COD):</strong> <span className="font-bold text-orange-600">{formatCurrency(activeDelivery.totalAmount)}</span></p>

                        {activeDelivery.items && activeDelivery.items.length > 0 && (
                          <div className="bg-orange-50/70 rounded-2xl p-3 border border-orange-100/80">
                            <p className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                              <Utensils className="w-3.5 h-3.5 text-orange-500" />
                              <span>Danh sách món ăn ({activeDelivery.items.reduce((sum, item) => sum + item.quantity, 0)} món):</span>
                            </p>
                            <div className="space-y-1.5 text-xs">
                              {activeDelivery.items.map((item, i) => {
                                const isGift = !!(item as any).isGift || String(item.itemName || '').startsWith('[Tặng]');
                                const displayName = String(item.itemName || '').replace(/^\[Tặng\]\s*/, '');
                                return (
                                <div key={i} className="flex justify-between items-center bg-white/80 px-2.5 py-1.5 rounded-xl border border-orange-100/50">
                                  <span className="font-medium text-gray-800">
                                    <strong className="text-orange-600 font-bold mr-1">{item.quantity}x</strong>
                                    {displayName}
                                    {isGift && (
                                      <span className="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                                        Tặng
                                      </span>
                                    )}
                                  </span>
                                  <span className={`font-semibold ml-2 ${isGift ? 'text-emerald-600' : 'text-gray-700'}`}>
                                    {isGift ? 'Miễn phí' : formatCurrency(item.totalPrice)}
                                  </span>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="pt-1">
                          <a
                            href={getDynamicMapLink(activeDelivery)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors bg-orange-50 px-3.5 py-2 rounded-xl border border-orange-100 hover:bg-orange-100/50"
                          >
                            <Navigation className="w-3.5 h-3.5" /> {activeDelivery.step === 'picked_up' ? 'Bản đồ đến Khách hàng' : 'Bản đồ đến Cửa hàng'}
                          </a>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        {activeDelivery.step !== 'picked_up' ? (
                          <button
                            onClick={() => handleStepTransition(activeDelivery.orderId)}
                            disabled={actionLoading === activeDelivery.orderId}
                            className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {actionLoading === activeDelivery.orderId && <Loader2 className="w-4 h-4 animate-spin" />}
                            {activeDelivery.step === 'accepted' ? 'Đã đến cửa hàng' : 'Đã lấy đồ ăn'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setSuccessModalOrderId(activeDelivery.orderId)}
                              disabled={actionLoading === activeDelivery.orderId}
                              className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              Giao thành công
                            </button>
                            <button
                              onClick={() => handleDeliveryFailedClick(activeDelivery.orderId)}
                              disabled={actionLoading === activeDelivery.orderId}
                              className="py-3 px-6 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              Thất bại
                            </button>
                          </>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 mt-2">
                        <button
                          onClick={() => setReportModalOrderId(activeDelivery.orderId)}
                          className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-600 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Báo cáo sự cố / hủy đơn
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* ===== LIST VIEW ===== */
                <div className="space-y-3">
                  {activeDeliveries.map((delivery, index) => (
                    <div
                      key={delivery.orderId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/80 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Đơn #{index + 1}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            delivery.step === 'picked_up'
                              ? 'bg-purple-100 text-purple-700'
                              : delivery.step === 'arrived'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getStepLabel(delivery.step)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 truncate">
                          #{delivery.orderId.slice(0, 8)} — {delivery.restaurantName}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          <MapPin className="w-3 h-3 inline mr-1 text-orange-400" />
                          {delivery.step === 'picked_up' ? delivery.deliveryAddress : delivery.restaurantAddress}
                        </p>
                        <p className="text-xs text-gray-500">
                          KH: {delivery.contactName} • {delivery.contactPhone}
                        </p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">Thu nhập</p>
                          <p className="font-extrabold text-emerald-600">{formatCurrency(delivery.totalIncome)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedActiveOrderId(delivery.orderId)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-orange-500/20 transition-all active:scale-[0.98]"
                        >
                          <Eye className="w-4 h-4" /> Chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
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
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {typeof offer.distanceInKm === 'number' && !Number.isNaN(offer.distanceInKm)
                            ? `${offer.distanceInKm.toFixed(1)} km đến quán`
                            : 'Đang tính khoảng cách'}
                          {typeof offer.deliveryDistanceInKm === 'number' && !Number.isNaN(offer.deliveryDistanceInKm)
                            ? ` • Giao ${offer.deliveryDistanceInKm.toFixed(1)} km`
                            : ''}
                        </span>
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

                      {/* Items list for offer proposal card */}
                      {offer.items && offer.items.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 text-xs">
                          <p className="font-bold text-gray-700 mb-1 flex items-center gap-1 text-[11px]">
                            <Utensils className="w-3 h-3 text-orange-500" /> Các món cần lấy:
                          </p>
                          <div className="space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            {offer.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-[11px]">
                                <span className="text-gray-700 truncate">
                                  <strong className="text-orange-600 font-bold mr-1">{item.quantity}x</strong>
                                  {item.itemName}
                                </span>
                                <span className="font-semibold text-gray-600 ml-2 shrink-0">{formatCurrency(item.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                        disabled={actionLoading === offer.orderId || activeDeliveries.length >= 100}
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
      {reportModalOrderId && (
        <ReportIncidentModal
          isOpen={!!reportModalOrderId}
          onClose={() => setReportModalOrderId(null)}
          orderId={reportModalOrderId}
          onReported={(oid) => {
            setActiveDeliveries(prev => prev.filter(d => d.orderId !== oid));
            fetchAvailableOffers();
          }}
        />
      )}
      {successModalOrderId && (
        <SuccessDeliveryModal
          isOpen={!!successModalOrderId}
          onClose={() => setSuccessModalOrderId(null)}
          orderId={successModalOrderId}
          latitude={coords?.lat || 0}
          longitude={coords?.lng || 0}
          onSuccess={handleSuccessCallback}
        />
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

      {/* Pickup Code Modal */}
      <PickupCodeModal
        isOpen={isPickupCodeModalOpen}
        onClose={() => {
          setIsPickupCodeModalOpen(false);
          setPendingPickupOrderId(null);
        }}
        onConfirm={handleConfirmPickup}
        isLoading={actionLoading === pendingPickupOrderId}
      />

      <Modal
        isOpen={!!explanationOrderId && !!explanationRequest}
        onClose={() => {
          setExplanationOrderId(null);
          setExplanationRequest(null);
          setExplanationReply('');
        }}
        title="Gửi giải trình"
      >
        {explanationRequest && explanationOrderId && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Đơn <span className="font-mono font-semibold text-gray-800">#{explanationOrderId.slice(0, 8).toUpperCase()}</span>
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-gray-800">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Yêu cầu từ điều phối</p>
              <p className="whitespace-pre-wrap">{explanationRequest.requestMessage}</p>
            </div>
            <textarea
              value={explanationReply}
              onChange={(e) => setExplanationReply(e.target.value)}
              rows={4}
              placeholder="Nhập giải trình của bạn..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => {
                  setExplanationOrderId(null);
                  setExplanationRequest(null);
                }}
                disabled={submittingExplanation}
              >
                Để sau
              </Button>
              <Button
                isLoading={submittingExplanation}
                disabled={submittingExplanation || !explanationReply.trim()}
                onClick={async () => {
                  if (!explanationReply.trim() || !explanationOrderId) return;
                  setSubmittingExplanation(true);
                  try {
                    const res = await shipperService.submitExplanation(explanationOrderId, explanationReply.trim());
                    if (!res.error) {
                      toast.success('Đã gửi giải trình');
                      setExplanationOrderId(null);
                      setExplanationRequest(null);
                      setExplanationReply('');
                    } else {
                      toast.error(res.message);
                    }
                  } catch {
                    toast.error('Không gửi được giải trình');
                  } finally {
                    setSubmittingExplanation(false);
                  }
                }}
              >
                Gửi giải trình
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
