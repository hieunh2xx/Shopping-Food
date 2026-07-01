import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Send, Users, BellRing } from 'lucide-react';
import { adminService } from '../../services/AdminService';
import { Button, Input } from '../../components/common';

export function AdminNotificationsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userIds: '',
    title: '',
    message: '',
    type: 0 // 0 = Info, 1 = Warning, 2 = Success, 3 = Promotion, etc.
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('Vui lòng nhập tiêu đề và nội dung thông báo');
      return;
    }

    // Split userIds by comma
    const userIdsArray = formData.userIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (userIdsArray.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 User ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.broadcastNotification({
        userIds: userIdsArray,
        title: formData.title,
        message: formData.message,
        type: formData.type
      });

      if (!res.error) {
        toast.success('Gửi thông báo thành công');
        setFormData({ ...formData, title: '', message: '' }); // Clear form
      } else {
        toast.error(res.message || 'Lỗi khi gửi thông báo');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống khi gửi thông báo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BellRing className="w-6 h-6 text-orange-500" />
          Gửi thông báo
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gửi thông báo khuyến mãi, tin tức đến người dùng cụ thể</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Danh sách User IDs nhận thông báo
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
              rows={4}
              value={formData.userIds}
              onChange={(e) => setFormData({ ...formData, userIds: e.target.value })}
              placeholder="Nhập User ID, cách nhau bằng dấu phẩy (VD: id1, id2, ...)"
            />
            <p className="text-xs text-gray-500 mt-1">Gửi đến một nhóm khách hàng cụ thể hoặc một user cá nhân.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề thông báo</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Chúc mừng sinh nhật bạn!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại thông báo</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
              >
                <option value={0}>Thông tin chung (Info)</option>
                <option value={3}>Khuyến mãi (Promotion)</option>
                <option value={1}>Cảnh báo (Warning)</option>
                <option value={2}>Thành công (Success)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung chi tiết</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Nhập nội dung chi tiết của thông báo..."
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi...' : 'Gửi thông báo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
