import React, { useState } from 'react';
import { ShieldAlert, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { httpClient } from '../../services/base/HttpClient';
import { API_ENDPOINTS } from '../../config/endpoints';

/**
 * Trang Gửi Khiếu Nại Yêu Cầu Mở Khóa Cửa Hàng (SellerAppealPage).
 * Cho phép đối tác người bán bị khóa tài khoản hoặc tạm ngưng gửi giải trình lên Admin để xin xem xét mở lại quán.
 */
export default function SellerAppealPage() {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Gửi đơn khiếu nại lên ban quản trị hệ thống.
   * @param e - Sự kiện FormEvent
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do khiếu nại.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Assuming targetType for Restaurant is 1, and targetId is not strictly needed for this command or we can just send the reason
      // If the backend `SubmitAppealCommand` requires `Reason`
      const res = await httpClient.post<any>(API_ENDPOINTS.SUPPORT.APPEAL, {
        content: reason
      });
      
      if (!res.error) {
        toast.success('Đã gửi khiếu nại thành công! Vui lòng chờ Admin xử lý.');
        setReason('');
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const rawMessage = err?.response?.data?.message;
      toast.error(rawMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gửi khiếu nại</h1>
          <p className="text-gray-500 text-sm mt-1">Yêu cầu xem xét mở khóa nhà hàng</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do khiếu nại <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Vui lòng giải thích chi tiết lý do nhà hàng của bạn không vi phạm chính sách hoặc đã khắc phục vi phạm..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
