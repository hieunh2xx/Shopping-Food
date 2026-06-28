import { useState, useEffect } from 'react';
import { authService } from '../../services/AuthService';
import { restaurantService } from '../../services/RestaurantService';
import type { IUserDto } from '../../interfaces';
import { Card, Button, Input } from '../../components/common';
import toast from 'react-hot-toast';
import { 
  Store, 
  Clock, 
  Navigation, 
  Activity, 
  Save, 
  Info,
  ShieldAlert
} from 'lucide-react';

export function SellerSettingsPage() {
  const [profile, setProfile] = useState<IUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Forms state
  const [basicInfo, setBasicInfo] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: ''
  });

  const [operatingHours, setOperatingHours] = useState({
    openingTime: '08:00',
    closingTime: '22:00'
  });

  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [deliveryRadius, setDeliveryRadius] = useState<number>(5);
  const [shippingFee, setShippingFee] = useState<number>(15000);

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
              logoUrl: rest.logoUrl || ''
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
            setDeliveryRadius((rest as any).maxDeliveryRadiusKm || 5);
            setShippingFee((rest as any).shippingFee || 0);
          }
        }
      } else {
        toast.error(res.message || 'Lỗi khi tải thông tin cá nhân');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basicInfo.restaurantName || !basicInfo.address || !basicInfo.phone) {
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Đang cập nhật thông tin cửa hàng...');
    try {
      const res = await restaurantService.updateBasicInfo({
        restaurantName: basicInfo.restaurantName,
        phone: basicInfo.phone,
        logoUrl: basicInfo.logoUrl || undefined,
        latitude: 0,
        longitude: 0,
      });
      if (!res.error) {
        toast.success('Đã cập nhật thông tin thành công!', { id: toastId });
        fetchProfile();
      } else {
        toast.error(res.message || 'Lỗi khi cập nhật', { id: toastId });
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ', { id: toastId });
    } finally {
      setIsSaving(false);
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
        toast.error(res.message || 'Lỗi khi cập nhật', { id: toastId });
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ', { id: toastId });
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
        toast.error(res.message || 'Lỗi khi cập nhật', { id: toastId });
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryRadius <= 0) {
      toast.error('Bán kính giao hàng phải lớn hơn 0');
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading('Đang cập nhật khu vực vận chuyển...');
    try {
      const res = await restaurantService.updateDeliveryRadius({ maxDeliveryRadiusKm: deliveryRadius });
      if (!res.error) {
        toast.success('Đã cập nhật bán kính giao hàng!', { id: toastId });
        fetchProfile();
      } else {
        toast.error(res.message || 'Lỗi khi cập nhật', { id: toastId });
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateShippingFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shippingFee < 0) {
      toast.error('Phí vận chuyển không hợp lệ');
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading('Đang cập nhật phí vận chuyển...');
    try {
      const res = await restaurantService.updateShippingFee({ shippingFee });
      if (!res.error) {
        toast.success('Đã cập nhật phí vận chuyển thành công!', { id: toastId });
        fetchProfile();
      } else {
        toast.error(res.message || 'Lỗi khi cập nhật', { id: toastId });
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ', { id: toastId });
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cấu hình Cửa hàng</h1>
        <p className="text-gray-500">Thiết lập thông tin hoạt động, phí vận chuyển và thời gian hoạt động của quán</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Số điện thoại liên hệ *"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                  placeholder="Ví dụ: 0987654321"
                />
                <Input
                  label="Email cửa hàng"
                  type="email"
                  value={basicInfo.email}
                  onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                  placeholder="Ví dụ: contact@restaurant.com"
                />
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
                className={`w-full py-3 px-4 rounded-xl font-semibold border flex items-center justify-center gap-2 transition-all ${
                  status === 'Active'
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
                className={`w-full py-3 px-4 rounded-xl font-semibold border flex items-center justify-center gap-2 transition-all ${
                  status === 'Inactive'
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full ${status === 'Inactive' ? 'bg-white' : 'bg-red-500'}`}></div>
                TẠM NGHỈ BÁN
              </button>
            </div>
          </Card>

          {/* Delivery & Shipping Radius Settings */}
          <Card className="p-6 bg-white border border-gray-100 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-500" />
              Bán kính & Vận chuyển
            </h3>

            {/* Delivery Radius Form */}
            <form onSubmit={handleUpdateDelivery} className="space-y-3 pb-4 border-b border-gray-100">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Bán kính giao hàng tối đa (km)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors pr-12"
                    value={deliveryRadius}
                    onChange={(e) => setDeliveryRadius(parseFloat(e.target.value))}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">km</span>
                </div>
              </div>
              <Button type="submit" disabled={isSaving} className="w-full">
                <Save className="w-4 h-4 mr-2 inline" /> Cập nhật bán kính
              </Button>
            </form>

            {/* Shipping Fee Form */}
            <form onSubmit={handleUpdateShippingFee} className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Phí giao hàng cơ bản (đ)</label>
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
              <Button type="submit" disabled={isSaving} className="w-full">
                <Save className="w-4 h-4 mr-2 inline" /> Cập nhật phí ship
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
    </div>
  );
}
