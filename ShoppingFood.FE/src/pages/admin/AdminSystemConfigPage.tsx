import React, { useState, useEffect } from 'react';
import { Button, Loading, Input } from '../../components/common';
import { ShieldAlert, Save, Clock, ServerCog } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

export function AdminSystemConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getMaintenanceSettings();
      if (!res.error && res.data) {
        setIsMaintenanceMode(res.data.isMaintenanceMode || false);
        setNotificationTitle(res.data.notificationTitle || '');
        setNotificationBody(res.data.notificationBody || '');
        if (res.data.scheduledStartTime) {
          const date = new Date(res.data.scheduledStartTime);
          const tzoffset = date.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
          setScheduledStartTime(localISOTime);
        } else {
          setScheduledStartTime('');
        }
      }
    } catch {
      toast.error('Không thể tải cấu hình bảo trì');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        isMaintenanceMode,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime).toISOString() : null,
        notificationTitle,
        notificationBody
      };
      const res = await adminService.updateMaintenanceSettings(payload);
      if (!res.error) {
        toast.success(res.message || 'Cập nhật cài đặt bảo trì thành công');
        fetchSettings();
      } else {
        toast.error(res.message || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật cài đặt');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thiết Lập Hệ Thống</h1>
          <p className="text-sm text-gray-500 mt-1">Cấu hình bảo trì, JWT và các cài đặt cốt lõi</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ShieldAlert className="w-5 h-5 text-red-500" /> 
            Cấu hình bảo trì hệ thống
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Toggle Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
            <div>
              <h3 className="font-semibold text-red-900">Chế độ bảo trì khẩn cấp</h3>
              <p className="text-sm text-red-700">Bật chế độ này sẽ ngay lập tức chặn tất cả người dùng truy cập vào hệ thống trừ Admin.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isMaintenanceMode}
                onChange={(e) => setIsMaintenanceMode(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Lên lịch bảo trì
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  disabled={isMaintenanceMode}
                />
                <p className="text-xs text-gray-500 mt-1">Hệ thống sẽ tự động chuyển sang chế độ bảo trì vào thời điểm này.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Thông báo (Email & In-app)</h3>
              
              <Input
                label="Tiêu đề thông báo"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="VD: Thông báo bảo trì hệ thống"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung thông báo</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  rows={4}
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="Nhập nội dung chi tiết thông báo cho người dùng..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button 
              onClick={handleSave} 
              isLoading={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu Cấu Hình
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
