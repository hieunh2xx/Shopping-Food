import { useState, useEffect } from 'react';
import { Button, Loading, Input, Card } from '../../components/common';
import { Save, Settings, Truck, Clock, Store, ChevronLeft, ChevronRight, Search, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

function formatVnd(n: number | '' | null | undefined) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return '—';
  return formatCurrency(v);
}

export function AdminFinanceOperationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullConfig, setFullConfig] = useState<any>(null);

  // Platform config state
  const [commissionRate, setCommissionRate] = useState<number | ''>('');
  const [sellerMaintenanceFee, setSellerMaintenanceFee] = useState<number | ''>('');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<number | ''>('');
  const [feePerKm, setFeePerKm] = useState<number | ''>('');
  const [shipperBaseFee, setShipperBaseFee] = useState<number | ''>('');
  const [shipperFeePerKm, setShipperFeePerKm] = useState<number | ''>('');
  const [rushHourMultiplier, setRushHourMultiplier] = useState<number | ''>('');
  const [shipperRushHourBonus, setShipperRushHourBonus] = useState<number | ''>('');
  const [rushHourStartTime, setRushHourStartTime] = useState<string>('');
  const [rushHourEndTime, setRushHourEndTime] = useState<string>('');

  // Tabs state
  const [activeTab, setActiveTab] = useState<'delivery' | 'shipper' | 'restaurant'>('delivery');

  // Delivery Settings state
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState<number | ''>('');
  const [freeDeliveryRadiusKm, setFreeDeliveryRadiusKm] = useState<number | ''>('');
  const [freeShippingMinimumOrder, setFreeShippingMinimumOrder] = useState<number | ''>('');
  const [shippingFee, setShippingFee] = useState<number | ''>('');
  const [includedKmInBaseFee, setIncludedKmInBaseFee] = useState<number | ''>(5);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  // Restaurants config state
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restLoading, setRestLoading] = useState(false);
  const [restaurantPage, setRestaurantPage] = useState(1);
  const [restaurantTotal, setRestaurantTotal] = useState(0);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(restaurantSearch);
      setRestaurantPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [restaurantSearch]);

  const fetchPlatformConfig = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPlatformFinanceConfig();
      if (!res.error && res.data) {
        setFullConfig(res.data);
        // Always show actual saved values (never blank "default" placeholders)
        setCommissionRate(
          res.data.commissionRate != null ? Number((res.data.commissionRate * 100).toFixed(2)) : ''
        );
        setSellerMaintenanceFee(res.data.sellerMaintenanceFee ?? '');
        setBaseDeliveryFee(res.data.baseDeliveryFee ?? '');
        setFeePerKm(res.data.feePerKm ?? '');
        setShipperBaseFee(res.data.shipperBaseFee ?? '');
        setShipperFeePerKm(res.data.shipperFeePerKm ?? '');
        setRushHourMultiplier(res.data.rushHourMultiplier ?? '');
        setShipperRushHourBonus(res.data.shipperRushHourBonus ?? '');
        setRushHourStartTime(res.data.rushHourStartTime || '');
        setRushHourEndTime(res.data.rushHourEndTime || '');
      }
    } catch {
      toast.error('Lỗi tải cấu hình tài chính');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliverySettings = async () => {
    try {
      const delRes = await adminService.getDeliverySettings();
      if (!delRes.error && delRes.data) {
        setMaxDeliveryRadiusKm(delRes.data.maxDeliveryRadiusKm ?? '');
        setFreeDeliveryRadiusKm(delRes.data.freeDeliveryRadiusKm ?? '');
        setFreeShippingMinimumOrder(delRes.data.freeShippingMinimumOrder ?? '');
        setShippingFee(delRes.data.shippingFee ?? '');
        setIncludedKmInBaseFee(delRes.data.includedKmInBaseFee ?? 5);
        if (delRes.data.feePerKm != null) setFeePerKm(delRes.data.feePerKm);
      }
    } catch {
      toast.error('Lỗi tải cấu hình giao hàng');
    }
  };

  const fetchRestaurants = async () => {
    setRestLoading(true);
    try {
      const res = await adminService.getRestaurantCommissions({ 
        skip: (restaurantPage - 1) * 10, 
        take: 10,
        filter: debouncedSearch
      });
      if (!res.error && res.data) {
        setRestaurants(res.data.items || []);
        setRestaurantTotal(res.data.totalCount || 0);
      }
    } finally {
      setRestLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformConfig();
    fetchDeliverySettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'restaurant') {
      fetchRestaurants();
    }
  }, [activeTab, restaurantPage, debouncedSearch]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const payload = {
        config: {
          ...fullConfig,
          commissionRate: commissionRate !== '' ? Number(commissionRate) / 100 : 0.1,
          sellerMaintenanceFee: Number(sellerMaintenanceFee) || 0,
          feePerKm: Number(feePerKm) || 0,
          shipperBaseFee: Number(shipperBaseFee) || 0,
          shipperFeePerKm: Number(shipperFeePerKm) || 0,
          baseDeliveryFee: Number(baseDeliveryFee) || 0,
          rushHourMultiplier: Number(rushHourMultiplier) || 0,
          shipperRushHourBonus: Number(shipperRushHourBonus) || 0,
          rushHourStartTime,
          rushHourEndTime
        }
      };
      const res = await adminService.updatePlatformFinanceConfig(payload);
      if (!res.error) {
        toast.success('Lưu cấu hình thành công');
        fetchPlatformConfig();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi kết nối khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDeliverySettings = async () => {
    setIsSavingDelivery(true);
    try {
      const payload = {
        maxDeliveryRadiusKm: maxDeliveryRadiusKm === '' ? null : Number(maxDeliveryRadiusKm),
        freeDeliveryRadiusKm: Number(freeDeliveryRadiusKm) || 0,
        freeShippingMinimumOrder: Number(freeShippingMinimumOrder) || 0,
        shippingFee: Number(shippingFee) || 0,
        includedKmInBaseFee: Number(includedKmInBaseFee) || 5,
      };
      const res = await adminService.updateDeliverySettings(payload);
      // FeePerKm khách nằm ở PlatformFinanceConfig — lưu kèm khi admin đổi tab giao hàng
      if (fullConfig) {
        await adminService.updatePlatformFinanceConfig({
          config: {
            ...fullConfig,
            feePerKm: Number(feePerKm) || 0,
          },
        });
      }
      if (!res.error) {
        toast.success(res.message || 'Đã lưu cấu hình giao hàng');
        await Promise.all([fetchDeliverySettings(), fetchPlatformConfig()]);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật cấu hình giao hàng');
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleUpdateRestaurantCommission = async (id: string, rate: number | null) => {
    try {
      const res = await adminService.updateRestaurantCommission(id, rate);
      if (!res.error) {
        toast.success('Cập nhật chiết khấu nhà hàng thành công');
        fetchRestaurants();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cấu Hình Tài Chính & Vận Hành</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý phí giao hàng, thu nhập Shipper, và chiết khấu nhà hàng</p>
        </div>
      </div>

      {/* Live summary of what is currently applied */}
      <Card className="p-5 mb-6 border border-emerald-100 bg-emerald-50/60">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-emerald-900">Đang áp dụng trên hệ thống</h2>
            <p className="text-xs text-emerald-700/80 mt-0.5 mb-3">
              Đây là giá trị đã lưu — khách/checkout &amp; shipper dùng các số này.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white/80 rounded-xl px-3 py-2 border border-emerald-100">
                <p className="text-[11px] text-gray-500">Phí ship khách (Platform)</p>
                <p className="font-bold text-gray-900">{formatVnd(shippingFee)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Từ Cấu hình Giao hàng</p>
              </div>
              <div className="bg-white/80 rounded-xl px-3 py-2 border border-emerald-100">
                <p className="text-[11px] text-gray-500">Freeship trong bán kính</p>
                <p className="font-bold text-gray-900">
                  {freeDeliveryRadiusKm === '' || freeDeliveryRadiusKm == null
                    ? '—'
                    : `${freeDeliveryRadiusKm} km`}
                </p>
              </div>
              <div className="bg-white/80 rounded-xl px-3 py-2 border border-emerald-100">
                <p className="text-[11px] text-gray-500">Đơn tối thiểu freeship</p>
                <p className="font-bold text-gray-900">{formatVnd(freeShippingMinimumOrder)}</p>
              </div>
              <div className="bg-white/80 rounded-xl px-3 py-2 border border-emerald-100">
                <p className="text-[11px] text-gray-500">Shipper base / km</p>
                <p className="font-bold text-gray-900">
                  {formatVnd(shipperBaseFee)} · {formatVnd(shipperFeePerKm)}/km
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 bg-gray-50 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'delivery'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Settings className="w-4 h-4" />
          Cấu hình Giao Hàng
        </button>
        <button
          onClick={() => setActiveTab('shipper')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'shipper'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Truck className="w-4 h-4" />
          Thu nhập Shipper
        </button>
        <button
          onClick={() => setActiveTab('restaurant')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'restaurant'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Store className="w-4 h-4" />
          Chiết khấu Nhà hàng
        </button>
      </div>

      <div className="w-full">
        {activeTab === 'shipper' && (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Truck className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">Thu nhập Shipper</h2>
          </div>
          
          <div className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thu nhập Shipper cơ bản (VNĐ)</label>
                <Input
                  type="number"
                  value={shipperBaseFee}
                  onChange={(e) => setShipperBaseFee(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="VD: 12000"
                />
                <p className="text-xs text-gray-500 mt-1">Số shipper nhận (không phải phí khách trả).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thu nhập Shipper / Km (VNĐ)</label>
                <Input
                  type="number"
                  value={shipperFeePerKm}
                  onChange={(e) => setShipperFeePerKm(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="VD: 4000"
                />
                <p className="text-xs text-gray-500 mt-1">Cộng thêm khi quãng đường &gt; 5km.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800">Giờ Cao Điểm</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ giờ</label>
                  <Input
                    type="time"
                    value={rushHourStartTime}
                    onChange={(e) => setRushHourStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến giờ</label>
                  <Input
                    type="time"
                    value={rushHourEndTime}
                    onChange={(e) => setRushHourEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hệ số nhân phí giao hàng</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rushHourMultiplier}
                    onChange={(e) => setRushHourMultiplier(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="VD: 1.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Shipper (%)</label>
                  <Input
                    type="number"
                    value={shipperRushHourBonus}
                    onChange={(e) => setShipperRushHourBonus(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="VD: 10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveConfig} isLoading={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Save className="w-4 h-4 mr-2" /> Lưu cấu hình
              </Button>
            </div>
          </div>
        </Card>
        )}

        {activeTab === 'delivery' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Settings className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">Cấu hình Giao Hàng (Nền tảng)</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Bán kính giao hàng tối đa (km)"
              type="number"
              value={maxDeliveryRadiusKm}
              onChange={(e) => setMaxDeliveryRadiusKm(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="VD: 15 (Để trống nếu không giới hạn)"
            />
            <Input
              label="Phí giao hàng mặc định (VNĐ) — khách trả trên checkout"
              type="number"
              value={shippingFee}
              onChange={(e) => setShippingFee(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="VD: 15000"
            />
            <p className="text-xs text-gray-500 -mt-2 mb-2">
              Phí cơ bản trong số km đã gồm. Quãng đường xa hơn sẽ cộng thêm phí / km bên dưới.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Số km đã gồm trong phí cơ bản"
                type="number"
                value={includedKmInBaseFee}
                onChange={(e) => setIncludedKmInBaseFee(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="VD: 5"
              />
              <Input
                label="Phí khách / km vượt (VNĐ)"
                type="number"
                value={feePerKm}
                onChange={(e) => setFeePerKm(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="VD: 5000"
              />
            </div>
            <p className="text-xs text-gray-500 -mt-2 mb-2">
              Công thức: phí = cơ bản + max(0, km − km gồm) × phí/km. Không phải thu nhập shipper (tab riêng).
            </p>
            <Input
              label="Bán kính miễn phí giao hàng (km)"
              type="number"
              value={freeDeliveryRadiusKm}
              onChange={(e) => setFreeDeliveryRadiusKm(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="VD: 3"
            />
            <Input
              label="Đơn tối thiểu để freeship (VNĐ)"
              type="number"
              value={freeShippingMinimumOrder}
              onChange={(e) => setFreeShippingMinimumOrder(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="VD: 150000"
            />
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
            <Button 
              onClick={handleSaveDeliverySettings} 
              isLoading={isSavingDelivery}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu Cấu Hình Giao Hàng
            </Button>
          </div>
        </Card>
        )}

        {activeTab === 'restaurant' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Store className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-800">Tùy chỉnh Chiết Khấu Nhà Hàng</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột 1: Chiết khấu mặc định */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chiết khấu sàn mặc định (%)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ví dụ: 10"
                  />
                  <Button onClick={handleSaveConfig} isLoading={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                    Lưu
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Mức này áp dụng cho toàn bộ nhà hàng chưa được cài đặt chiết khấu riêng.</p>
              </div>

              {/* Cột 2: Phí duy trì nhà hàng */}
              <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                <label className="block text-sm font-medium text-emerald-900 mb-2">Phí duy trì nhà hàng / tháng (VNĐ)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={sellerMaintenanceFee}
                    onChange={(e) => setSellerMaintenanceFee(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="VD: 200000"
                  />
                  <Button onClick={handleSaveConfig} isLoading={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                    Lưu
                  </Button>
                </div>
                <p className="text-xs text-emerald-700 mt-2">Thu khi duyệt đăng ký và hàng tháng. Trừ ví duy trì (cho phép âm — nhà hàng cần nạp bù).</p>
              </div>

              {/* Cột 3: Tìm kiếm nhà hàng — full width on md */}
              <div className="md:col-span-2 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col justify-center">
                <label className="block text-sm font-medium text-blue-900 mb-2">Tìm kiếm & Cài đặt riêng từng nhà hàng</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-blue-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="Nhập tên nhà hàng..."
                    value={restaurantSearch}
                    onChange={(e) => setRestaurantSearch(e.target.value)}
                  />
                </div>
                <p className="text-xs text-blue-600 mt-2">Cài đặt riêng sẽ ghi đè lên mức chiết khấu mặc định.</p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Danh sách nhà hàng</span>
                <span className="text-xs text-gray-500">Tổng cộng {restaurantTotal} nhà hàng</span>
              </div>
              
              {restLoading ? (
                <div className="text-center py-10 text-gray-500">
                  <Loading />
                  <div className="mt-2 text-sm">Đang tải dữ liệu...</div>
                </div>
              ) : restaurants.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">Không tìm thấy nhà hàng nào phù hợp.</div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {restaurants.map(rest => (
                    <div key={rest.restaurantId} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div>
                        <h4 className="font-medium text-gray-900">{rest.restaurantName}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Chiết khấu hiện tại: <span className="font-semibold text-gray-700">{rest.customCommissionRate !== null ? rest.customCommissionRate + '%' : 'Theo Mặc định'}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number"
                          placeholder="%"
                          className="w-20 text-center"
                          defaultValue={rest.customCommissionRate || ''}
                          onBlur={(e) => {
                            const val = e.target.value;
                            const num = val === '' ? null : Number(val);
                            if (num !== rest.customCommissionRate) {
                              handleUpdateRestaurantCommission(rest.restaurantId, num);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Phân trang */}
              {restaurantTotal > 10 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Hiển thị <span className="font-medium">{(restaurantPage - 1) * 10 + 1}</span> đến <span className="font-medium">{Math.min(restaurantPage * 10, restaurantTotal)}</span> trong số <span className="font-medium">{restaurantTotal}</span> kết quả
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setRestaurantPage(p => Math.max(1, p - 1))}
                          disabled={restaurantPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Trang {restaurantPage} / {Math.ceil(restaurantTotal / 10)}
                        </span>
                        <button
                          onClick={() => setRestaurantPage(p => Math.min(Math.ceil(restaurantTotal / 10), p + 1))}
                          disabled={restaurantPage >= Math.ceil(restaurantTotal / 10)}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        )}
      </div>
    </div>
  );
}
