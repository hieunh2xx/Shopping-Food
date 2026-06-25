import { useState, useEffect, useCallback } from 'react';
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
  Save
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { shipperService } from '../../services';
import type { IShipperScheduleAndAreaDto, IWorkingScheduleItemDto } from '../../interfaces/IShipper';

export function ShipperProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Schedule and area from API
  const [scheduleData, setScheduleData] = useState<IShipperScheduleAndAreaDto | null>(null);
  const [editSchedule, setEditSchedule] = useState<IWorkingScheduleItemDto[]>([]);
  const [editRadius, setEditRadius] = useState<number>(5);

  const fetchScheduleAndArea = useCallback(async () => {
    try {
      const res = await shipperService.getScheduleAndArea();
      if (res.data) {
        setScheduleData(res.data);
        setEditSchedule(res.data.workingSchedule || []);
        setEditRadius(res.data.operatingRadiusKm ?? 5);
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
        operatingLatitude: scheduleData?.operatingLatitude ?? undefined,
        operatingLongitude: scheduleData?.operatingLongitude ?? undefined,
        operatingRadiusKm: editRadius,
        workingSchedule: editSchedule
      });
      toast.success('Cập nhật lịch làm việc thành công!');
      fetchScheduleAndArea();
    } catch (err) {
      toast.error('Không thể cập nhật. Vui lòng thử lại.');
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



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
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
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Địa chỉ Email</span>
                <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{user?.email || 'N/A'}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Vĩ độ</span>
                  <p className="text-sm font-medium text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200">
                    {scheduleData?.operatingLatitude?.toFixed(6) ?? 'Chưa thiết lập'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Kinh độ</span>
                  <p className="text-sm font-medium text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200">
                    {scheduleData?.operatingLongitude?.toFixed(6) ?? 'Chưa thiết lập'}
                  </p>
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
                        value={item.from}
                        onChange={e => updateScheduleItem(idx, 'from', e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      />
                      <span className="text-gray-400 text-sm font-bold">→</span>
                      <input
                        type="time"
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

      </div>

    </div>
  );
}
