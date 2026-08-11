import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store, MapPin, Phone, User, Mail, ShieldCheck, ArrowLeft, Loader2, X } from 'lucide-react';
import { useCart, useAuth } from '../hooks';
import { Button, Input } from '../components/common';
import { ROUTES } from '../routes/routeConfig';
import { formatCurrency } from '../utils/formatters';
import { orderService } from '../services/OrderService';
import { discountService } from '../services/DiscountService';
import { cartService } from '../services/CartService';
import { paymentService, type IPaymentMethod } from '../services/PaymentService';
import { restaurantService } from '../services/RestaurantService';
import { userAddressService } from '../services/UserAddressService';
import { supportService } from '../services/SupportService';
import type { IDiscountDto, IUserAddressDto } from '../interfaces';
import toast from 'react-hot-toast';
import { Modal } from '../components/common/Modal';
import { SepayQrPaymentModal } from '../components/payment/SepayQrPaymentModal';
import { Tag } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.flyTo(center, zoom, { duration: 1.5 });
  return null;
}

function MapEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [searchParams] = useSearchParams();
  
  // Always send guest id when present so BE can merge guest → user cart after login
  const guestUserId = localStorage.getItem('sf_guest_id') || undefined;

  const urlRestaurantId = searchParams.get('restaurantId');
  const fallbackRestaurantId = items.length > 0 ? items[0].product.restaurantId : null;
  const restaurantId = urlRestaurantId || fallbackRestaurantId;
  
  const firstItemOfRestaurant = items.find(i => i.product.restaurantId === restaurantId);
  const restaurantName = firstItemOfRestaurant ? firstItemOfRestaurant.product.restaurantName : '';
  const checkoutItems = items.filter(i => i.product.restaurantId === restaurantId);
  const paidCheckoutItems = checkoutItems.filter(i => !i.isGift);
  
  const checkoutTotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      if (item.isGift) return sum;
      if (typeof item.priceAtAdded === 'number') {
        return sum + item.priceAtAdded * item.quantity;
      }
      let itemPrice = item.product.flashSalePrice ?? item.product.price;
      if (item.selectedSize) {
        const sizeOpt = item.product.sizes?.find(s => s.sizeName === item.selectedSize);
        if (sizeOpt) itemPrice += sizeOpt.extraPrice;
      }
      if (item.selectedToppings && item.selectedToppings.length > 0) {
        item.selectedToppings.forEach(topName => {
          const topOpt = item.product.toppings?.find(t => t.name === topName || (t as any).toppingName === topName);
          if (topOpt) itemPrice += topOpt.price;
        });
      }
      return sum + (itemPrice * item.quantity);
    }, 0);
  }, [checkoutItems]);

  const [formData, setFormData] = useState({
    contactName: user?.fullName || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    deliveryAddress: '',
    deliveryLatitude: null as number | null,
    deliveryLongitude: null as number | null,
    note: '',
    paymentMethod: 'COD' as 'COD' | 'CreditCard' | 'EWallet' | 'SystemWallet' | 'Sepay',
    eWalletProvider: 'Momo' as 'Momo' | 'ZaloPay' | 'VNPay',
    cardLastFour: '',
    cardBrand: 'Visa',
    discountCode: ''
  });

  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [eWalletProviders, setEWalletProviders] = useState<{ code: string; name: string }[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [availableDiscounts, setAvailableDiscounts] = useState<IDiscountDto[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<IDiscountDto | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Info, 2: OTP (if guest)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sepaySessionId, setSepaySessionId] = useState<string | null>(null);
  const [isSepayModalOpen, setIsSepayModalOpen] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
  const [platformDelivery, setPlatformDelivery] = useState<{
    freeDeliveryRadiusKm: number;
    freeShippingMinimumOrder: number;
    shippingFee: number;
    feePerKm: number;
  } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<IUserAddressDto[]>([]);
  const [saveAddress, setSaveAddress] = useState(true);

  useEffect(() => {
    if (items.length === 0 && !isSepayModalOpen && !sepaySessionId) {
      toast('Giỏ hàng trống, quay lại trang chủ');
      navigate(ROUTES.HOME);
    }
  }, [items, navigate, isSepayModalOpen, sepaySessionId]);

  useEffect(() => {
    if (restaurantId) {
      discountService.getDiscounts({ restaurantId, take: 50 }).then(res => {
        if (!res.error && res.data) {
          setAvailableDiscounts(res.data.filter(d => d.status === 'Active'));
        }
      });
    }
  }, [restaurantId, checkoutTotal]);

  const hasFreeshipItem = useMemo(
    () => checkoutItems.some(item => item.product.isFreeship),
    [checkoutItems]
  );

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 +
      c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
  };

  const shippingFee = useMemo(() => {
    if (hasFreeshipItem) return 0;
    if (!restaurantInfo) return 0;

    const isPlatform = restaurantInfo.deliveryType === 'PlatformDelivery';
    const freeMinOrder = isPlatform
      ? (platformDelivery?.freeShippingMinimumOrder || 0)
      : (restaurantInfo.freeShippingMinimumOrder || 0);
    if (checkoutTotal >= freeMinOrder && freeMinOrder > 0) return 0;

    // Platform fee must come from Admin DeliverySettings — never hardcode 15k
    const flatCap = isPlatform
      ? (platformDelivery?.shippingFee ?? restaurantInfo.shippingFee ?? 0)
      : (restaurantInfo.shippingFee || 0);

    const hasCoords = !!(
      formData.deliveryLatitude &&
      formData.deliveryLongitude &&
      restaurantInfo.latitude &&
      restaurantInfo.longitude
    );

    // No destination coords → charge flat fee (do not treat as 0km free-ship)
    if (!hasCoords) return flatCap;

    const distanceKm = calculateDistance(
      formData.deliveryLatitude!,
      formData.deliveryLongitude!,
      restaurantInfo.latitude!,
      restaurantInfo.longitude!
    );

    const freeRadius = isPlatform
      ? (platformDelivery?.freeDeliveryRadiusKm ?? 3)
      : (restaurantInfo.freeDeliveryRadiusKm ?? 0);
    if (distanceKm <= freeRadius) return 0;

    if (isPlatform) {
      const feePerKm = platformDelivery?.feePerKm || 3000;
      const excessKm = Math.max(0, distanceKm - freeRadius);
      const distanceBased = Math.max(feePerKm, Math.ceil(excessKm) * feePerKm);
      return Math.min(flatCap || distanceBased, distanceBased);
    }

    return flatCap;
  }, [hasFreeshipItem, restaurantInfo, platformDelivery, formData.deliveryLatitude, formData.deliveryLongitude, checkoutTotal]);

  useEffect(() => {
    if (!restaurantId) return;
    restaurantService.getDetail(restaurantId).then(res => {
      if (!res.error && res.data) {
        setRestaurantInfo(res.data);
      }
    });
  }, [restaurantId]);

  useEffect(() => {
    supportService.getDeliverySettings().then(res => {
      if (!res.error && res.data) {
        setPlatformDelivery({
          freeDeliveryRadiusKm: Number(res.data.freeDeliveryRadiusKm ?? 3),
          freeShippingMinimumOrder: Number(res.data.freeShippingMinimumOrder ?? 0),
          shippingFee: Number(res.data.shippingFee ?? 0),
          feePerKm: 3000, // matches BE default when finance ShipperFeePerKm unset
        });
      }
    }).catch(() => { /* keep null → FE will show restaurant fee / 0 until loaded */ });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    userAddressService.getAddresses().then(res => {
      if (!res.error && res.data?.length) {
        setSavedAddresses(res.data);
        const defaultAddr = res.data.find(a => a.isDefault) ?? res.data[0];
        if (defaultAddr && !formData.deliveryAddress) {
          setFormData(prev => ({
            ...prev,
            contactName: prev.contactName || defaultAddr.contactName,
            contactPhone: prev.contactPhone || defaultAddr.contactPhone,
            deliveryAddress: defaultAddr.addressLine,
          }));
        }
      }
    });
  }, [isAuthenticated]);

  useEffect(() => {
    paymentService.getPaymentMethods().then(res => {
      if (!res.error && res.data) {
        setPaymentMethods(res.data.methods || []);
        setEWalletProviders(res.data.eWalletProviders || []);
      }
    });
    if (isAuthenticated) {
      paymentService.getWallet().then(res => {
        if (!res.error && res.data) setWalletBalance(res.data.balance);
      });
    }
  }, [isAuthenticated]);

  const discountAmount = useMemo(() => {
    if (!selectedDiscount) return 0;
    if (selectedDiscount.type === 'FreeShipping') return shippingFee;
    if (selectedDiscount.type === 'Percentage') {
      let amt = (checkoutTotal * selectedDiscount.value) / 100;
      if (selectedDiscount.maxDiscountAmount && amt > selectedDiscount.maxDiscountAmount) {
        amt = selectedDiscount.maxDiscountAmount;
      }
      return amt;
    }
    if (selectedDiscount.type === 'FixedAmount') return selectedDiscount.value;
    return 0;
  }, [checkoutTotal, selectedDiscount, shippingFee]);

  const finalTotal = useMemo(() => {
    // FreeShipping: discountAmount === shippingFee → total = items only
    return Math.max(0, checkoutTotal + shippingFee - discountAmount);
  }, [checkoutTotal, shippingFee, discountAmount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = async () => {
    if (!formData.contactName || !formData.contactPhone || !formData.deliveryAddress || !formData.contactEmail) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    if (!isAuthenticated) {
      setIsSubmitting(true);
      try {
        await orderService.sendCheckoutOtp({
          fullName: formData.contactName,
          phone: formData.contactPhone,
          email: formData.contactEmail,
          deliveryAddress: formData.deliveryAddress,
          guestUserId
        });
        toast.success('Mã OTP đã được gửi đến email của bạn');
        setStep(2);
      } catch (error: any) {
        toast.error(error.response?.data?.message);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // If authenticated, maybe skip OTP or directly checkout
      handleCheckout();
    }
  };

  const handleApplyCode = async () => {
    if (!formData.discountCode) return;
    try {
      const res = await discountService.applyDiscount({
        code: formData.discountCode,
        restaurantId: restaurantId ?? undefined,
        cartAmount: checkoutTotal
      });
      if (!res.error && res.data) {
        toast.success('Áp dụng mã giảm giá thành công!');
        setSelectedDiscount({
          id: res.data.discountId,
          code: res.data.code,
          type: 'FixedAmount', // Force FixedAmount so frontend logic simply subtracts the value
          value: res.data.discountAmount,
        } as IDiscountDto);
        setIsDiscountModalOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi áp mã');
    }
  };

  const persistDeliveryAddress = async () => {
    if (!isAuthenticated || !saveAddress) return;
    const exists = savedAddresses.some(
      a => a.addressLine.trim().toLowerCase() === formData.deliveryAddress.trim().toLowerCase()
        && a.contactPhone === formData.contactPhone
    );
    if (exists) return;
    try {
      await userAddressService.addAddress({
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        addressLine: formData.deliveryAddress,
        isDefault: savedAddresses.length === 0,
      });
    } catch {
      // không chặn luồng đặt hàng
    }
  };

  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`);
      const data = await response.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',').map((p: string) => p.trim());
        const filteredParts = parts.filter((p: string) => {
          const lower = p.toLowerCase();
          if (lower === 'việt nam' || lower === 'vietnam') return false;
          if (/^\d+$/.test(p)) return false; // Loại bỏ mã bưu điện (các con số)
          return true;
        });

        setFormData(prev => ({
          ...prev,
          deliveryAddress: filteredParts.join(', ')
        }));
      }
    } catch (error) {
      console.error("Lỗi khi chuyển đổi tọa độ thành địa chỉ", error);
    }
  };

  const handleLocationSelected = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      deliveryLatitude: lat,
      deliveryLongitude: lng
    }));
    fetchAddressFromCoordinates(lat, lng);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationSelected(position.coords.latitude, position.coords.longitude);
          toast.success('Đã lấy vị trí hiện tại');
        },
        () => {
          toast.error('Không thể lấy vị trí. Vui lòng bấm vào biểu tượng 🔒 (ổ khóa) trên thanh địa chỉ trình duyệt để cấp quyền vị trí.');
        }
      );
    } else {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị.');
    }
  };

  const handleSelectSavedAddress = (addr: IUserAddressDto) => {
    setFormData(prev => ({
      ...prev,
      contactName: addr.contactName,
      contactPhone: addr.contactPhone,
      deliveryAddress: addr.addressLine,
      deliveryLatitude: addr.latitude ?? null,
      deliveryLongitude: addr.longitude ?? null
    }));
  };

  const handleCheckout = async () => {
    if (!isAuthenticated && !otpCode) {
      toast.error('Vui lòng nhập mã OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      const guestId = localStorage.getItem('sf_guest_id') || undefined;
      // Snapshot UI cart before sync (refresh may clear React state asynchronously)
      const localSnapshot = checkoutItems.map((i) => ({ ...i, product: i.product }));

      let serverItems = await refreshCart();
      const serverHasItems = Array.isArray(serverItems) && serverItems.length > 0;

      // Ghost local cart: UI has items but server cart empty → push to API then checkout
      if (!serverHasItems && localSnapshot.length > 0) {
        for (const item of localSnapshot) {
          await cartService.addToCart({
            productId: item.product.id,
            quantity: item.quantity,
            guestUserId: guestId,
            selectedSize: item.selectedSize,
            selectedToppings: item.selectedToppings,
          });
        }
        serverItems = await refreshCart();
      }

      if (!serverItems || serverItems.length === 0) {
        toast.error('Giỏ hàng trên máy chủ đang trống. Vui lòng thêm lại món.');
        return;
      }

      const checkoutPayload: any = {
        ...formData,
        otpCode: isAuthenticated ? '' : otpCode,
        guestUserId: guestId,
        discountCode: selectedDiscount?.code || formData.discountCode,
        eWalletProvider: formData.paymentMethod === 'EWallet' ? formData.eWalletProvider : undefined,
        cardLastFour: formData.paymentMethod === 'CreditCard' ? formData.cardLastFour : undefined,
        cardBrand: formData.paymentMethod === 'CreditCard' ? formData.cardBrand : undefined,
      };
      const res = await orderService.checkout(checkoutPayload);
      const orderId = res.data?.orderId || res.data?.OrderId || '';
      const sessionId = res.data?.paymentSessionId || res.data?.PaymentSessionId || '';
      const requiresSepay = res.data?.requiresSepayRedirect === true || res.data?.RequiresSepayRedirect === true;
      const requiresConfirm = res.data?.requiresPaymentConfirmation === true || res.data?.RequiresPaymentConfirmation === true;

      if (requiresSepay && sessionId) {
        await persistDeliveryAddress();
        setSepaySessionId(sessionId);
        setIsSepayModalOpen(true);
        toast.success('Đơn hàng đã tạo. Quét mã QR bên dưới để thanh toán.');
        return;
      }

      if (requiresConfirm && sessionId) {
        await paymentService.confirmPayment(sessionId);
      }

      await persistDeliveryAddress();
      clearCart();
      if (isAuthenticated) {
        toast.success(`Đặt hàng thành công! Mã đơn hàng của bạn là: ${orderId.substring(0, 8).toUpperCase()}.`);
        navigate(`${ROUTES.HOME}?track=true&orderId=${orderId}`);
      } else {
        toast.success(
          `Đặt hàng thành công! Mã đơn hàng của bạn là: ${orderId.substring(0, 8).toUpperCase()}. Vui lòng lưu lại mã này.`,
          { duration: 10000 }
        );
        navigate(`${ROUTES.HOME}?track=true&orderId=${orderId}`);
      }
    } catch (error: any) {
      const data = error.response?.data;
      const validationMsg =
        data?.errors && typeof data.errors === 'object'
          ? Object.values(data.errors).flat().filter(Boolean).join(' ')
          : '';
      toast.error(data?.message || validationMsg || error.message || 'Đặt hàng thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Store className="w-6 h-6 mr-3 text-orange-500" />
                Thông tin giao hàng
              </h2>

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <User className="w-4 h-4 mr-1.5 text-gray-400" /> Họ và tên
                      </label>
                      <Input 
                        name="contactName" 
                        value={formData.contactName} 
                        onChange={handleInputChange} 
                        placeholder="VD: Nguyễn Văn A" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <Phone className="w-4 h-4 mr-1.5 text-gray-400" /> Số điện thoại
                      </label>
                      <Input 
                        name="contactPhone" 
                        value={formData.contactPhone} 
                        onChange={handleInputChange} 
                        placeholder="VD: 0901234567" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Mail className="w-4 h-4 mr-1.5 text-gray-400" /> Email
                    </label>
                    <Input 
                      name="contactEmail" 
                      type="email"
                      value={formData.contactEmail} 
                      onChange={handleInputChange} 
                      placeholder="VD: email@example.com" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-gray-400" /> Địa chỉ giao hàng
                    </label>
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div className="mb-3">
                        <select
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                          value={savedAddresses.find(a => a.addressLine === formData.deliveryAddress && a.contactName === formData.contactName)?.id || ''}
                          onChange={(e) => {
                            const addr = savedAddresses.find(a => a.id === e.target.value);
                            if (addr) handleSelectSavedAddress(addr);
                          }}
                        >
                          <option value="" disabled>-- Chọn địa chỉ đã lưu --</option>
                          {savedAddresses.map(addr => (
                            <option key={addr.id} value={addr.id}>
                              {addr.contactName} - {addr.addressLine}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <Input 
                      name="deliveryAddress" 
                      value={formData.deliveryAddress} 
                      onChange={handleInputChange} 
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." 
                    />
                    
                    <div className="mt-4 mb-2 border rounded-xl overflow-hidden bg-gray-50">
                      <div className="p-3 border-b flex justify-between items-center bg-white">
                        <span className="text-sm font-medium text-gray-700">Chọn vị trí giao hàng trên bản đồ</span>
                        <Button type="button" variant="outline" size="sm" onClick={handleGetLocation}>
                          <MapPin className="w-4 h-4 mr-1" /> Vị trí hiện tại
                        </Button>
                      </div>
                      <div className="h-[250px] w-full relative z-0">
                        <MapContainer 
                          center={[formData.deliveryLatitude || 10.762622, formData.deliveryLongitude || 106.660172]} 
                          zoom={15} 
                          style={{ height: '100%', width: '100%' }}
                        >
                          {(formData.deliveryLatitude && formData.deliveryLongitude) ? (
                            <ChangeView center={[formData.deliveryLatitude, formData.deliveryLongitude]} zoom={16} />
                          ) : null}
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <MapEvents onLocationSelected={handleLocationSelected} />
                          {formData.deliveryLatitude && formData.deliveryLongitude && (
                            <Marker 
                              position={[formData.deliveryLatitude, formData.deliveryLongitude]} 
                              draggable={true}
                              eventHandlers={{
                                dragend: (e) => {
                                  const marker = e.target;
                                  const position = marker.getLatLng();
                                  handleLocationSelected(position.lat, position.lng);
                                }
                              }}
                            />
                          )}
                        </MapContainer>
                      </div>
                      {(!formData.deliveryLatitude || !formData.deliveryLongitude) && (
                        <div className="p-2 text-xs text-orange-600 bg-orange-50 text-center">
                          Vui lòng chọn vị trí trên bản đồ để shipper tìm đến dễ dàng hơn!
                        </div>
                      )}
                    </div>

                    {isAuthenticated && (
                      <label className="mt-2 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={e => setSaveAddress(e.target.checked)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        Lưu địa chỉ này để dùng lại lần sau
                      </label>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
                    <textarea 
                      name="note" 
                      value={formData.note} 
                      onChange={handleInputChange} 
                      placeholder="Ghi chú thêm cho nhà hàng hoặc tài xế..." 
                      className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none min-h-[100px] p-4 text-base transition-all"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Phương thức thanh toán</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {(paymentMethods.length > 0 ? paymentMethods : [
                        { code: 'COD', name: 'Tiền mặt', requiresAuth: false },
                        { code: 'CreditCard', name: 'Thẻ tín dụng', requiresAuth: true },
                        { code: 'EWallet', name: 'Ví điện tử', requiresAuth: true },
                        { code: 'SystemWallet', name: 'Ví tích lũy', requiresAuth: true },
                      ] as IPaymentMethod[]).filter(m => !m.requiresAuth || isAuthenticated).map((method) => (
                        <label 
                          key={method.code}
                          className={`flex-1 flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                            formData.paymentMethod === method.code 
                              ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500' 
                              : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={method.code} 
                            checked={formData.paymentMethod === method.code}
                            onChange={handleInputChange}
                            className="sr-only" 
                          />
                          <span className="font-medium text-sm">{method.name}</span>
                        </label>
                      ))}
                    </div>
                    {formData.paymentMethod === 'SystemWallet' && walletBalance !== null && (
                      <p className="text-sm text-gray-500 mt-2">Số dư ví: {formatCurrency(walletBalance)}</p>
                    )}
                    {formData.paymentMethod === 'EWallet' && (
                      <div className="mt-3 flex gap-2">
                        {eWalletProviders.map(p => (
                          <label key={p.code} className={`px-3 py-2 border rounded-lg cursor-pointer text-sm ${formData.eWalletProvider === p.code ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                            <input type="radio" name="eWalletProvider" value={p.code} checked={formData.eWalletProvider === p.code} onChange={handleInputChange} className="sr-only" />
                            {p.name}
                          </label>
                        ))}
                      </div>
                    )}
                    {formData.paymentMethod === 'CreditCard' && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <Input name="cardBrand" value={formData.cardBrand} onChange={handleInputChange} placeholder="Loại thẻ (Visa/Mastercard)" />
                        <Input name="cardLastFour" value={formData.cardLastFour} onChange={handleInputChange} placeholder="4 số cuối thẻ" maxLength={4} />
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleNextStep} 
                    disabled={isSubmitting}
                    className="w-full mt-6 h-12 text-lg font-semibold rounded-xl bg-orange-600 hover:bg-orange-700"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isAuthenticated ? 'Đặt hàng ngay' : 'Tiếp tục')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Xác thực Email</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Chúng tôi đã gửi một mã OTP gồm 6 số đến email <strong>{formData.contactEmail}</strong>. 
                        Vui lòng kiểm tra hộp thư và nhập mã vào bên dưới để hoàn tất đặt hàng.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã xác thực OTP</label>
                    <Input 
                      value={otpCode} 
                      onChange={(e) => setOtpCode(e.target.value)} 
                      placeholder="Nhập mã OTP..." 
                      className="text-center tracking-widest text-lg font-bold"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep(1)} 
                      className="flex-1 rounded-xl h-12"
                    >
                      Quay lại
                    </Button>
                    <Button 
                      onClick={handleCheckout} 
                      disabled={isSubmitting || otpCode.length < 4}
                      className="flex-1 rounded-xl h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Xác nhận Đặt hàng'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                Tóm tắt đơn hàng
                <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full">
                  {paidCheckoutItems.length} món
                </span>
              </h2>
              
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                <Store className="w-5 h-5 text-gray-400" />
                <span className="font-semibold text-gray-800">{restaurantName}</span>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {paidCheckoutItems.map((item, idx) => {
                  const giftChildren = item.buyXGetYPromotionId
                    ? checkoutItems.filter(
                        (g) =>
                          g.isGift &&
                          (g.parentCartItemId === item.id ||
                            g.buyXGetYPromotionId === item.buyXGetYPromotionId)
                      )
                    : [];

                  let itemUnitPrice =
                    typeof item.priceAtAdded === 'number'
                      ? item.priceAtAdded
                      : (item.product.flashSalePrice ?? item.product.price);
                  if (typeof item.priceAtAdded !== 'number') {
                    if (item.selectedSize) {
                      const sizeOpt = item.product.sizes?.find(s => s.sizeName === item.selectedSize);
                      if (sizeOpt) itemUnitPrice += sizeOpt.extraPrice;
                    }
                    if (item.selectedToppings && item.selectedToppings.length > 0) {
                      item.selectedToppings.forEach(topName => {
                        const topOpt = item.product.toppings?.find(t => t.name === topName || (t as any).toppingName === topName);
                        if (topOpt) itemUnitPrice += topOpt.price;
                      });
                    }
                  }

                  return (
                    <div key={item.id || idx} className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                         {item.product.primaryImageUrl ? (
                          <img src={item.product.primaryImageUrl} alt={item.product.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🍜</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.product.itemName}</h4>
                        {item.promotionLabel && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                            {item.promotionLabel}
                          </span>
                        )}
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {item.selectedSize && <div>Size: {item.selectedSize}</div>}
                          {item.selectedToppings?.length ? <div>Thêm: {item.selectedToppings.join(', ')}</div> : null}
                        </div>
                        {giftChildren.length > 0 && (
                          <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-1.5 space-y-0.5">
                            {giftChildren.map((g) => (
                              <p key={g.id || g.product.id} className="text-[11px] text-emerald-700 font-medium">
                                Tặng {g.quantity}× {g.product.itemName}
                              </p>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-semibold text-gray-600">x{item.quantity}</span>
                          <span className="font-bold text-gray-900">{formatCurrency(itemUnitPrice * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-gray-700 cursor-pointer" onClick={() => setIsDiscountModalOpen(true)}>
                    <Tag className="w-5 h-5 text-orange-500" />
                    <span className="font-medium text-sm">Khuyến mãi</span>
                  </div>
                  <div className="text-sm font-semibold text-orange-600 flex items-center gap-1 cursor-pointer">
                    {selectedDiscount ? (
                      <div className="flex items-center gap-2 bg-orange-50 pl-3 pr-1.5 py-1 rounded-full border border-orange-100">
                        <span onClick={() => setIsDiscountModalOpen(true)}>{selectedDiscount.code}</span>
                        <div 
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDiscount(null);
                            setFormData({...formData, discountCode: ''});
                            toast.success('Đã gỡ mã giảm giá');
                          }}
                        >
                          <X className="w-3 h-3 text-orange-600" />
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setIsDiscountModalOpen(true)} className="flex items-center gap-1">
                        <span>Chọn mã</span>
                        <span className="text-gray-400 text-xs ml-1">›</span>
                      </div>
                    )} 
                  </div>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium">{formatCurrency(checkoutTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí giao hàng</span>
                  <span className="font-medium">
                    {hasFreeshipItem ? (
                      <span className="text-green-600">Miễn phí</span>
                    ) : (
                      formatCurrency(shippingFee)
                    )}
                  </span>
                </div>
                {selectedDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Giảm giá ({selectedDiscount.code}
                      {selectedDiscount.type === 'FreeShipping' ? ' — miễn ship' : ''})
                    </span>
                    <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Tổng cộng</span>
                  <span className="text-orange-600 text-2xl">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Modal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Mã giảm giá">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input name="discountCode" placeholder="Nhập mã giảm giá..." value={formData.discountCode} onChange={(e) => { handleInputChange(e); setSelectedDiscount(null); }} className="flex-1" />
            <Button onClick={handleApplyCode}>Áp dụng</Button>
          </div>
          <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
            {availableDiscounts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Chưa có mã giảm giá phù hợp cho đơn hàng này.</p>
            ) : (
              availableDiscounts.map(discount => {
                const isEligible = checkoutTotal >= discount.minOrderAmount;
                return (
                <div key={discount.id} onClick={() => { 
                  if (!isEligible) return;
                  setSelectedDiscount(discount); setFormData({...formData, discountCode: discount.code}); setIsDiscountModalOpen(false); 
                }} className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${isEligible ? 'border-gray-200 cursor-pointer hover:border-orange-500 hover:bg-orange-50' : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-gray-900">{discount.code}</span>
                        {discount.restaurantId ? (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100 truncate max-w-[100px]" title={discount.restaurantName}>
                            {discount.restaurantName}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold border border-purple-100">
                            Hệ thống
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-800 font-medium mb-1 line-clamp-1">{discount.title}</div>
                      <div className="text-[11px] text-gray-500">
                        Giảm {discount.type === 'Percentage' ? `${discount.value}%` : `${discount.value.toLocaleString()}đ`}
                        {discount.maxDiscountAmount ? ` (Tối đa ${discount.maxDiscountAmount.toLocaleString()}đ)` : ''}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Đơn tối thiểu {discount.minOrderAmount.toLocaleString()}đ
                      </div>
                    </div>
                  </div>
                  {isEligible ? (
                    <div className="text-orange-600 text-sm font-semibold shrink-0">Chọn</div>
                  ) : (
                    <div className="text-red-500 text-[10px] font-semibold text-right shrink-0">
                      Mua thêm<br/>{(discount.minOrderAmount - checkoutTotal).toLocaleString()}đ
                    </div>
                  )}
                </div>
              )})
            )}
          </div>
        </div>
      </Modal>

      <SepayQrPaymentModal
        isOpen={isSepayModalOpen}
        sessionId={sepaySessionId ?? ''}
        onClose={() => {
          setIsSepayModalOpen(false);
          setSepaySessionId(null);
          void refreshCart();
          navigate(ROUTES.ORDERS);
        }}
        onAbandoned={() => {
          void refreshCart();
        }}
        onPaid={() => {
          clearCart();
        }}
      />
    </div>
  );
}
