import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  User, 
  Bike, 
  FileText, 
  ShieldCheck, 
  Navigation,
  CheckCircle2,
  Loader2,
  MapPin,
  Clock,
  Save,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { shipperService } from '../../services';
import type { IShipperScheduleAndAreaDto, IWorkingScheduleItemDto } from '../../interfaces/IShipper';
import { ShipperReputationTab } from './components/ShipperReputationTab';
import { ChangeContactModal } from '../../components/auth/ChangeContactModal';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
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

export function ShipperProfilePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("Info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isChangeContactOpen, setIsChangeContactOpen] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'reputation') {
      setActiveTab('Reputation');
    }
  }, [location.search]);
  
  // Schedule and area from API
  const [scheduleData, setScheduleData] = useState<IShipperScheduleAndAreaDto | null>(null);
  const [editSchedule, setEditSchedule] = useState<IWorkingScheduleItemDto[]>([]);
  const [editRadius, setEditRadius] = useState<number>(5);
  const [editLocation, setEditLocation] = useState<[number, number] | null>(null);
  const [addressText, setAddressText] = useState('');

  useEffect(() => {
    if (editLocation) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${editLocation[0]}&lon=${editLocation[1]}&accept-language=vi`);
          const data = await res.json();
          if (data && data.display_name) {
            let parts = data.display_name.split(',').map((p: string) => p.trim());
            // Filter out Vietnam
            parts = parts.filter((p: string) => p.toLowerCase() !== 'việt nam' && p.toLowerCase() !== 'vietnam');
            // Filter out postal codes (typically 5 or 6 digits)
            parts = parts.filter((p: string) => !/^\d{5,6}$/.test(p));
            setAddressText(parts.join(', '));
          }
        } catch {
          // ignore
        }
      };
      // Debounce slightly to prevent spam if dragging map rapidly (though we use click)
      const timer = setTimeout(fetchAddress, 500);
      return () => clearTimeout(timer);
    }
  }, [editLocation]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading("Đang lấy vị trí...", { id: 'geo' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEditLocation([position.coords.latitude, position.coords.longitude]);
          toast.success("Đã lấy vị trí hiện tại!", { id: 'geo' });
        },
        () => {
          toast.error("Không thể lấy vị trí. Vui lòng bấm vào biểu tượng 🔒 (ổ khóa) trên thanh địa chỉ trình duyệt để cấp quyền vị trí.", { id: 'geo' });
        }
      );
    } else {
      toast.error("Trình duyệt không hỗ trợ định vị.");
    }
  };

  const fetchScheduleAndArea = useCallback(async () => {
    try {
      const res = await shipperService.getScheduleAndArea();
      if (!res.error && res.data) {
        setScheduleData(res.data);
        setEditRadius(res.data.operatingRadiusKm || 5);
        if (res.data.operatingLatitude && res.data.operatingLongitude) {
          setEditLocation([res.data.operatingLatitude, res.data.operatingLongitude]);
        }
        if (res.data.workingSchedule) {
          const daysStr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          setEditSchedule(res.data.workingSchedule.map(s => ({
            ...s,
            dayOfWeek: typeof s.dayOfWeek === 'string' ? daysStr.indexOf(s.dayOfWeek as string) : s.dayOfWeek
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduleAndArea();
  }, [fetchScheduleAndArea]);

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      await shipperService.updateScheduleAndArea({
        operatingLatitude: editLocation?.[0] ?? undefined,
        operatingLongitude: editLocation?.[1] ?? undefined,
        operatingRadiusKm: editRadius,
        workingSchedule: editSchedule
      });
      toast.success('Lịch làm việc và khu vực hoạt động đã được đăng ký thành công.');
      fetchScheduleAndArea();
    } catch {
      toast.error('Cập nhật trạng thái hoạt động thất bại do lỗi kết nối mạng.');
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  const addScheduleItem = () => {
    setEditSchedule(prev => [...prev, { dayOfWeek: 1, from: '08:00', to: '17:00' }]);
  };

  const removeScheduleItem = (idx: number) => {
    setEditSchedule(prev => prev.filter((_, i) => i !== idx));
  };

  const updateScheduleItem = (idx: number, field: keyof IWorkingScheduleItemDto, value: string | number) => {
    setEditSchedule(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Profile Card Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-24 h-24 rounded-3xl bg-orange-100 flex items-center justify-center border-4 border-orange-50 shrink-0 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-orange-600 font-black text-3xl">{(user?.fullName || 'S').charAt(0)}</span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-2xl font-bold text-gray-900">{user?.fullName || 'Tài xế'}</h2>
              <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Hoạt động tốt
              </span>
            </div>
            <p className="text-sm text-gray-500">{user?.email || ''}</p>
            <p className="text-xs text-gray-400">{user?.phone || ''}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center sm:text-right shrink-0">
          <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Trạng thái hồ sơ</span>
          <span className="text-green-600 font-extrabold text-base mt-0.5 block flex items-center justify-center sm:justify-end gap-1">
            <ShieldCheck className="w-5 h-5 text-green-500" /> Đã duyệt
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("Info")}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'Info' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Thông tin cá nhân
          {activeTab === 'Info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
        </button>
        <button
          onClick={() => setActiveTab("Schedule")}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'Schedule' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Lịch & Khu vực
          {activeTab === 'Schedule' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
        </button>
        <button
          onClick={() => setActiveTab("Reputation")}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'Reputation' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Điểm Uy Tín
          {activeTab === 'Reputation' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        
        {/* Info Tab */}
        {activeTab === 'Info' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" /> Chi tiết thông tin cá nhân
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Họ và tên</span>
                <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{user?.fullName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Số điện thoại</span>
                <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{user?.phone || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Địa chỉ Email</span>
                  <button 
                    onClick={() => setIsChangeContactOpen(true)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline"
                  >
                    {user?.isEmailActive ? 'Thay đổi' : 'Xác thực / Thay đổi'}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
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
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Khu vực hoạt động</span>
                <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {scheduleData?.operatingRadiusKm 
                    ? `Bán kính ${scheduleData.operatingRadiusKm} km`
                    : 'Chưa thiết lập'
                  }
                </p>
              </div>
            </div>

            {/* Vehicle info (read-only from user context) */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bike className="w-5 h-5 text-orange-500" /> Phương tiện giao hàng
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <span className="text-sm font-bold text-gray-800">Căn cước công dân (CCCD)</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">Đã xác minh</span>
                </div>
                
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <span className="text-sm font-bold text-gray-800">Giấy phép lái xe (GPLX)</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">Đã xác minh</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-500" />
                    <div>
                      <span className="text-sm font-bold text-gray-800">Chứng nhận đăng ký xe</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">Đã xác minh</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule & Area Tab */}
        {activeTab === 'Schedule' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Lịch làm việc & Khu vực hoạt động
            </h3>

            {/* Operating Area */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" /> Khu vực hoạt động
              </h4>
              <p className="text-xs text-gray-500 mb-2">Bấm vào bản đồ để chọn tâm khu vực hoạt động (vị trí thường xuyên nhận đơn).</p>

              <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
                <MapContainer 
                  center={editLocation || [21.0285, 105.8542]} // Hanoi as default
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationMarker position={editLocation} setPosition={setEditLocation} />
                  {editLocation && editRadius && (
                    <Circle 
                      center={editLocation} 
                      radius={editRadius * 1000} // km to meters
                      pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.2 }}
                    />
                  )}
                </MapContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100 items-end">
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Địa chỉ (Vị trí ghim)</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={addressText || (editLocation ? `${editLocation[0].toFixed(5)}, ${editLocation[1].toFixed(5)}` : 'Chưa thiết lập')}
                      placeholder="Chọn vị trí trên bản đồ..."
                      className="w-full text-sm font-medium text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bán kính (km)</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    step={0.5}
                    value={editRadius}
                    onChange={e => setEditRadius(parseFloat(e.target.value) || 5)}
                    className="w-full text-sm font-medium text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <button
                    onClick={handleGetCurrentLocation}
                    className="w-full py-2.5 px-3 bg-orange-100 hover:bg-orange-200 text-orange-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Navigation className="w-4 h-4" /> Vị trí hiện tại
                  </button>
                </div>
              </div>
            </div>

            {/* Working Schedule */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-orange-500" /> Ca làm việc
                </h4>
                <button
                  onClick={addScheduleItem}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                >
                  + Thêm ca
                </button>
              </div>

              {editSchedule.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Chưa có lịch làm việc nào</p>
                  <button
                    onClick={addScheduleItem}
                    className="mt-2 text-xs text-orange-500 font-semibold hover:text-orange-600"
                  >
                    + Thêm ca làm việc
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {editSchedule.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <select
                        value={item.dayOfWeek}
                        onChange={e => updateScheduleItem(idx, 'dayOfWeek', parseInt(e.target.value))}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      >
                        {dayNames.map((name, i) => (
                          <option key={i} value={i}>{name}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        lang="en-US"
                        value={item.from}
                        onChange={e => updateScheduleItem(idx, 'from', e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                      <span className="text-gray-400 text-sm font-bold">→</span>
                      <input
                        type="time"
                        lang="en-US"
                        value={item.to}
                        onChange={e => updateScheduleItem(idx, 'to', e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                      <button
                        onClick={() => removeScheduleItem(idx)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold ml-auto transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Reputation' && (
          <ShipperReputationTab />
        )}
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
