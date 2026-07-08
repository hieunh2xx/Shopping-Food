import React, { useState, useEffect } from 'react';
import { Button, Loading, Input, Card } from '../../components/common';
import { Save, Settings, Percent, Truck, Clock, Store } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

export function AdminFinanceOperationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullConfig, setFullConfig] = useState<any>(null);

  // Platform config state
  const [commissionRate, setCommissionRate] = useState<number | ''>('');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<number | ''>('');
  const [feePerKm, setFeePerKm] = useState<number | ''>('');
  const [shipperBaseFee, setShipperBaseFee] = useState<number | ''>('');
  const [shipperFeePerKm, setShipperFeePerKm] = useState<number | ''>('');
  const [rushHourMultiplier, setRushHourMultiplier] = useState<number | ''>('');
  const [shipperRushHourBonus, setShipperRushHourBonus] = useState<number | ''>('');
  const [rushHourStartTime, setRushHourStartTime] = useState<string>('');
  const [rushHourEndTime, setRushHourEndTime] = useState<string>('');

  // Restaurants config state
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restLoading, setRestLoading] = useState(false);

  const fetchPlatformConfig = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getPlatformFinanceConfig();
      if (!res.error && res.data) {
        setFullConfig(res.data);
        setCommissionRate(res.data.commissionRate === 0.1 ? '' : (res.data.commissionRate ? res.data.commissionRate * 100 : ''));
        setBaseDeliveryFee(res.data.baseDeliveryFee === 15000 ? '' : (res.data.baseDeliveryFee || ''));
        setFeePerKm(res.data.feePerKm === 5000 ? '' : (res.data.feePerKm || ''));
        setShipperBaseFee(res.data.shipperBaseFee === 12000 ? '' : (res.data.shipperBaseFee || ''));
        setShipperFeePerKm(res.data.shipperFeePerKm === 4000 ? '' : (res.data.shipperFeePerKm || ''));
        setRushHourMultiplier(res.data.rushHourMultiplier === 1.2 ? '' : (res.data.rushHourMultiplier || ''));
        setShipperRushHourBonus(res.data.shipperRushHourBonus === 5000 || res.data.shipperRushHourBonus === 10 ? '' : (res.data.shipperRushHourBonus || ''));
        setRushHourStartTime(res.data.rushHourStartTime);
        setRushHourEndTime(res.data.rushHourEndTime);
      }
    } catch {
      toast.error('Lỗi tải cấu hình tài chính');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    setRestLoading(true);
    try {
      const res = await adminService.getRestaurantCommissions({ take: 50 });
      if (!res.error && res.data) {
        setRestaurants(res.data.items || []);
      }
    } finally {
      setRestLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformConfig();
    fetchRestaurants();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const payload = {
        config: {
          ...fullConfig,
          commissionRate: commissionRate !== '' ? Number(commissionRate) / 100 : 0.1,
          baseDeliveryFee: Number(baseDeliveryFee) || 0,
          feePerKm: Number(feePerKm) || 0,
          shipperBaseFee: Number(shipperBaseFee) || 0,
          shipperFeePerKm: Number(shipperFeePerKm) || 0,
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
        toast.error(res.message || 'Lỗi lưu cấu hình');
      }
    } catch {
      toast.error('Lỗi kết nối khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRestaurantCommission = async (id: string, rate: number | null) => {
    try {
      const res = await adminService.updateRestaurantCommission(id, rate);
      if (!res.error) {
        toast.success('Cập nhật chiết khấu nhà hàng thành công');
        fetchRestaurants();
      } else {
        toast.error(res.message || 'Lỗi cập nhật');
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phí Giao Hàng & Thu Nhập Shipper */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Truck className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">Cấu hình Giao hàng & Shipper</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phí vận chuyển cơ bản (VNĐ)</label>
                <Input
                  type="number"
                  value={baseDeliveryFee}
                  onChange={(e) => setBaseDeliveryFee(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="VD: 15000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phí theo Km (VNĐ)</label>
                <Input
                  type="number"
                  value={feePerKm}
                  onChange={(e) => setFeePerKm(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="VD: 5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thu nhập Shipper cơ bản (VNĐ)</label>
                <Input
                  type="number"
                  value={shipperBaseFee}
                  onChange={(e) => setShipperBaseFee(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="VD: 12000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thu nhập Shipper / Km (VNĐ)</label>
                <Input
                  type="number"
                  value={shipperFeePerKm}
                  onChange={(e) => setShipperFeePerKm(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="VD: 4000"
                />
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

        {/* Chiết khấu Nhà Hàng */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Store className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-800">Tùy chỉnh Chiết Khấu Nhà Hàng</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chiết khấu sàn mặc định (%)</label>
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
              <p className="text-xs text-gray-500 mt-2">Mức này áp dụng cho toàn bộ nhà hàng chưa được cài đặt chiết khấu riêng bên dưới.</p>
            </div>
            
            <p className="text-sm font-medium text-gray-800">Cài đặt riêng từng nhà hàng (Ghi đè mặc định)</p>
            
            {restLoading ? (
              <div className="text-center py-4 text-gray-500">Đang tải...</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {restaurants.map(rest => (
                  <div key={rest.restaurantId} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-gray-900">{rest.restaurantName}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Chiết khấu hiện tại: <span className="font-medium text-gray-700">{rest.customCommissionRate !== null ? rest.customCommissionRate + '%' : 'Mặc định'}</span>
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
          </div>
        </Card>
      </div>
    </div>
  );
}
