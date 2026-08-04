import { useState, useEffect } from 'react';
import { authService } from '../../services/AuthService';
import { restaurantService } from '../../services/RestaurantService';
import type { IUserDto } from '../../interfaces';
import { Card, Button, Input } from '../../components/common';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';
import { ChangeContactModal } from '../../components/auth/ChangeContactModal';
import {
  Store,
  Clock,
  Navigation,
  Activity,
  Save,
  Info,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Edit
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (p: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}



export function SellerSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<IUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangeContactOpen, setIsChangeContactOpen] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });

  const [operatingHours, setOperatingHours] = useState({
    openingTime: '08:00',
    closingTime: '22:00'
  });

  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [deliveryType, setDeliveryType] = useState<'PlatformDelivery' | 'SelfDelivery'>('PlatformDelivery');
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState<number>(5);
  const [freeDeliveryRadiusKm, setFreeDeliveryRadiusKm] = useState<number>(0);
  const [freeShippingMinimumOrder, setFreeShippingMinimumOrder] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(15000);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await authService.getProfile();
      if (!res.error && res.data) {
        setProfile(res.data);
        const seller = res.data.sellerInfo;
        if (seller?.restaurantId) {
          const restRes = await restaurantService.getDetail(seller.restaurantId);
          if (!restRes.error && restRes.data) {
            const rest = restRes.data;
            setBasicInfo({
              restaurantName: rest.restaurantName || '',
              address: rest.address || '',
              phone: rest.phone || '',
              email: rest.email || '',
              logoUrl: rest.logoUrl || '',
              latitude: rest.latitude,
              longitude: rest.longitude
            });

            // Format TimeSpan (e.g., "08:00:00" -> "08:00")
            const formatTime = (timeStr?: string) => {
              if (!timeStr) return '08:00';
              const parts = timeStr.split(':');
              if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
              return '08:00';
            };

            setOperatingHours({
              openingTime: formatTime((rest as any).openingTime),
              closingTime: formatTime((rest as any).closingTime)
            });

            setStatus((rest.status === 'Active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive');
            setDeliveryType(rest.deliveryType || 'PlatformDelivery');
            setMaxDeliveryRadiusKm(rest.maxDeliveryRadiusKm || 5);
            setFreeDeliveryRadiusKm(rest.freeDeliveryRadiusKm || 0);
            setFreeShippingMinimumOrder(rest.freeShippingMinimumOrder || 0);
            setShippingFee(rest.shippingFee || 15000);
          }
        }
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Không thể lấy thông tin cấu hình cửa hàng. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basicInfo.restaurantName || !basicInfo.address || !basicInfo.phone || !basicInfo.logoUrl) {
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc và tải lên ảnh đại diện cửa hàng');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Đang cập nhật thông tin cửa hàng...');
    try {
      const res = await restaurantService.updateBasicInfo({
        restaurantName: basicInfo.restaurantName,
        phone: basicInfo.phone,
        address: basicInfo.address,
        logoUrl: basicInfo.logoUrl || undefined,
        latitude: basicInfo.latitude,
        longitude: basicInfo.longitude,
      });
      if (!res.error) {
        toast.success('Đã cập nhật thông tin thành công!', { id: toastId });
        fetchProfile();
      } else {
        toast.error(res.message , { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      toast.loading('Đang tự động lấy địa chỉ...', { id: 'geocode' });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
      const data = await res.json();
      if (data && data.address) {
        const ignoreKeys = ['postcode', 'country', 'country_code', 'ISO3166-2-lvl4'];
        const addressParts = [];
        for (const key in data.address) {
          if (!ignoreKeys.includes(key) && data.address[key]) {
            // Check if it's not already in the array to prevent duplication
            if (!addressParts.includes(data.address[key])) {
              addressParts.push(data.address[key]);
            }
          }
        }
        const formattedAddress = addressParts.join(', ');
        setBasicInfo(prev => ({ ...prev, address: formattedAddress }));
        toast.success('Đã điền tự động địa chỉ', { id: 'geocode' });
      } else if (data && data.display_name) {
        toast.dismiss('geocode');
      }
    } catch (e) {
      console.error('Reverse geocoding error', e);
      toast.dismiss('geocode');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ');
      return;
    }

    setIsUploadingLogo(true);
    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const res = await authService.uploadImage(file);
      if (!res.error && res.data?.imageUrl) {
        setBasicInfo(prev => ({ ...prev, logoUrl: res.data.imageUrl }));
        toast.success('Tải ảnh lên thành công', { id: toastId });
      } else {
        toast.error(res.message , { id: toastId });
      }
    } catch {
      toast.error('Tải ảnh lên thất bại. Vui lòng thử lại.', { id: toastId });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleUpdateHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading('Đang cập nhật giờ hoạt động...');
    try {
      // BE expects "HH:mm" format (e.g. "08:00")
      const res = await restaurantService.updateOperatingHours({
        openingTime: operatingHours.openingTime,
        closingTime: operatingHours.closingTime
      });
      if (!res.error) {
        toast.success('Đã cập nhật giờ hoạt động thành công!', { id: toastId });
        fetchProfile();
      } else {
        toast.error(res.message , { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'Active' | 'Inactive') => {
    setIsSaving(true);
    const toastId = toast.loading('Đang cập nhật trạng thái hoạt động...');
    try {
      const res = await restaurantService.updateStatus({ isTemporarilyClosed: newStatus !== 'Active' });
      if (!res.error) {
        toast.success(`Cửa hàng đã ${newStatus === 'Active' ? 'mở cửa' : 'tạm đóng cửa'}!`, { id: toastId });
        setStatus(newStatus);
        fetchProfile();
      } else {
        toast.error(res.message , { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDeliveryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryType === 'SelfDelivery' && maxDeliveryRadiusKm <= 0) {
      toast.error('Bán kính giao hàng phải lớn hơn 0');
      return;
    }
    if (deliveryType === 'SelfDelivery' && shippingFee < 0) {
      toast.error('Phí vận chuyển không hợp lệ');
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading('Đang cập nhật cấu hình giao hàng...');
    try {
      const res = await restaurantService.updateDeliveryConfig({
        deliveryType,
        maxDeliveryRadiusKm,
        freeDeliveryRadiusKm,
        freeShippingMinimumOrder,
        shippingFee
      });
      if (!res.error) {
        toast.success('Đã cập nhật cấu hình giao hàng thành công!', { id: toastId });
        fetchProfile();
      } else {
        toast.error(res.message , { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Đang tải cấu hình cửa hàng...</div>;
  }

  if (!profile?.sellerInfo) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-16 h-16 mx-auto text-red-500" />
        <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy thông tin cửa hàng</h2>
        <p className="text-gray-500">Tài khoản này chưa đăng ký làm Seller hoặc chưa cấu hình cửa hàng.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cấu hình Cửa hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Thiết lập thông tin hoạt động, phí vận chuyển và thời gian hoạt động của quán</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Basic Info & Hours */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info Card */}
          <Card className="p-6 bg-white border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-500" />
              Thông tin cửa hàng
            </h3>
            <form onSubmit={handleUpdateBasicInfo} className="space-y-4">
              {/* Logo Upload Section */}
              <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="relative w-28 h-28 flex-shrink-0 rounded-2xl border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center overflow-hidden bg-white group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    title="Chọn ảnh từ máy"
                  />
                  
                  {isUploadingLogo ? (
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin z-10"></div>
                  ) : basicInfo.logoUrl ? (
                    <>
                      <img src={basicInfo.logoUrl} alt="Store Logo" className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-10 text-white pointer-events-none">
                        <Edit className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">Đổi ảnh</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 pointer-events-none z-10 group-hover:text-orange-500">
                      <ImageIcon className="w-8 h-8 mb-2" strokeWidth={1.5} />
                      <span className="text-[10px] font-medium">Tải logo lên</span>
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Ảnh đại diện cửa hàng <span className="text-red-500">*</span></h4>
                  <p className="text-xs text-gray-500 mb-3">Hình ảnh rõ nét, kích thước vuông (1:1), tối đa 2MB. Ảnh sẽ hiển thị trên trang chủ và danh sách quán ăn.</p>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    className="relative overflow-hidden group"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      title="Chọn ảnh từ máy"
                    />
                    <Upload className="w-4 h-4 mr-2" />
                    <span>{basicInfo.logoUrl ? 'Thay đổi ảnh' : 'Chọn ảnh'}</span>
                  </Button>
                </div>
              </div>

              <Input
                label="Tên nhà hàng/quán ăn *"
                value={basicInfo.restaurantName}
                onChange={(e) => setBasicInfo({ ...basicInfo, restaurantName: e.target.value })}
                placeholder="Ví dụ: Cơm Tấm Sài Gòn"
              />
              <Input
                label="Địa chỉ chi tiết *"
                value={basicInfo.address}
                onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                placeholder="Số nhà, Tên đường, Quận/Huyện..."
              />
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-gray-500" />
                    Vị trí trên bản đồ
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        toast.loading('Đang lấy vị trí...', { id: 'gps' });
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setBasicInfo(prev => ({
                              ...prev,
                              latitude: pos.coords.latitude,
                              longitude: pos.coords.longitude
                            }));
                            toast.success('Đã lấy vị trí hiện tại', { id: 'gps' });
                            reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                          },
                          () => {
                            toast.error('Không thể lấy vị trí. Vui lòng cấp quyền vị trí cho trình duyệt.', { id: 'gps' });
                          }
                        );
                      } else {
                        toast.error('Trình duyệt không hỗ trợ lấy vị trí');
                      }
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors border border-orange-100"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Lấy vị trí hiện tại
                  </button>
                </div>
                <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 relative z-0">
                  <MapContainer
                    center={basicInfo.latitude && basicInfo.longitude ? [basicInfo.latitude, basicInfo.longitude] : [10.762622, 106.660172]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                      position={basicInfo.latitude && basicInfo.longitude ? [basicInfo.latitude, basicInfo.longitude] : null}
                      setPosition={(p) => {
                        setBasicInfo(prev => ({ ...prev, latitude: p[0], longitude: p[1] }));
                        reverseGeocode(p[0], p[1]);
                      }}
                    />
                  </MapContainer>
                </div>
                <p className="text-xs text-gray-500 italic">Click vào bản đồ để chọn vị trí chính xác của nhà hàng.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Số điện thoại liên hệ *"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                  placeholder="Ví dụ: 0987654321"
                />
                <Input
                  label="Email cửa hàng (Hiển thị cho khách)"
                  type="email"
                  value={basicInfo.email}
                  onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                  placeholder="Ví dụ: contact@restaurant.com"
                />
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Tài khoản chủ cửa hàng</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Đăng Nhập</span>
                  <button 
                    type="button"
                    onClick={() => setIsChangeContactOpen(true)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline"
                  >
                    {user?.isEmailActive ? 'Thay đổi' : 'Xác thực / Thay đổi'}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 mt-1">
                  <span className="text-sm font-bold text-gray-800">{user?.email || 'N/A'}</span>
                  {user?.email && (
                    user.isEmailActive ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5" /> Chưa xác thực
                      </span>
                    )
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2 inline" /> Lưu thông tin
                </Button>
              </div>
            </form>
          </Card>

          {/* Operating Hours Card */}
          <Card className="p-6 bg-white border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Giờ hoạt động
            </h3>
            <form onSubmit={handleUpdateHours} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ mở cửa</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    value={operatingHours.openingTime}
                    onChange={(e) => setOperatingHours({ ...operatingHours, openingTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ đóng cửa</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                    value={operatingHours.closingTime}
                    onChange={(e) => setOperatingHours({ ...operatingHours, closingTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2 inline" /> Lưu giờ hoạt động
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Side: Status, Delivery and Info details */}
        <div className="lg:col-span-1 space-y-8">
          {/* Active status card */}
          <Card className="p-6 bg-white border border-gray-100 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Trạng thái hoạt động
            </h3>
            <p className="text-sm text-gray-500">
              Chuyển đổi trạng thái để khách hàng biết cửa hàng có đang bán hay tạm nghỉ.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('Active')}
                className={`w-full py-3 px-4 rounded-xl font-semibold border flex items-center justify-center gap-2 transition-all ${status === 'Active'
                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full ${status === 'Active' ? 'bg-white animate-pulse' : 'bg-green-500'}`}></div>
                MỞ CỬA BÁN HÀNG
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Inactive')}
                className={`w-full py-3 px-4 rounded-xl font-semibold border flex items-center justify-center gap-2 transition-all ${status === 'Inactive'
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full ${status === 'Inactive' ? 'bg-white' : 'bg-red-500'}`}></div>
                TẠM NGHỈ BÁN
              </button>
            </div>
          </Card>

          {/* Delivery Config Settings */}
          <Card className="p-6 bg-white border border-gray-100 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-500" />
              Cấu hình giao hàng
            </h3>

            <form onSubmit={handleUpdateDeliveryConfig} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Loại hình giao hàng</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as 'PlatformDelivery' | 'SelfDelivery')}
                >
                  <option value="PlatformDelivery">Hệ thống tìm Shipper</option>
                  <option value="SelfDelivery">Nhà hàng tự giao</option>
                </select>
                <p className="text-xs text-gray-500">
                  {deliveryType === 'PlatformDelivery' ? 'Sử dụng mạng lưới Shipper của hệ thống. Phí ship theo cấu hình của sàn.' : 'Tự quản lý đội ngũ giao hàng. Tùy chỉnh phí ship.'}
                </p>
              </div>

              {deliveryType === 'SelfDelivery' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Bán kính giao hàng tối đa (km)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors pr-12"
                        value={maxDeliveryRadiusKm}
                        onChange={(e) => setMaxDeliveryRadiusKm(parseFloat(e.target.value))}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">km</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Phí giao hàng (đ)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors pr-12 font-semibold"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(parseInt(e.target.value))}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">đ</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Bán kính miễn phí ship (km)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors pr-12"
                        value={freeDeliveryRadiusKm}
                        onChange={(e) => setFreeDeliveryRadiusKm(parseFloat(e.target.value))}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">km</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Đơn tối thiểu để freeship (đ)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors pr-12"
                        value={freeShippingMinimumOrder}
                        onChange={(e) => setFreeShippingMinimumOrder(parseInt(e.target.value))}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">đ</span>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" disabled={isSaving} className="w-full mt-4">
                <Save className="w-4 h-4 mr-2 inline" /> Cập nhật cấu hình
              </Button>
            </form>
          </Card>

          {/* Quick tips panel */}
          <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex gap-3 text-sm text-orange-700">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Mẹo nhỏ:</strong> Khách hàng chỉ có thể đặt đơn hàng nếu vị trí địa lý của họ nằm trong bán kính giao hàng tối đa và trong giờ hoạt động của cửa hàng.
            </p>
          </div>
        </div>
      </div>
      <ChangeContactModal 
        isOpen={isChangeContactOpen} 
        onClose={() => setIsChangeContactOpen(false)} 
        onSuccess={() => window.location.reload()}
        initialEmail={user?.email}
      />
    </div>
  );
}
