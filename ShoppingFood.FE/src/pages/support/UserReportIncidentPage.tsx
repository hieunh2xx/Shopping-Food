import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Plus, Edit } from 'lucide-react';
import { Button, Loading } from '../../components/common';
import { supportService, orderService, authService } from '../../services';
import type { ISubmitOrderComplaintRequest, IOrderSummary } from '../../interfaces';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function UserReportIncidentPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<IOrderSummary[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    setIsUploading(true);
    try {
      const res = await authService.uploadImage(file);
      if (!res.error && res.data?.imageUrl) {
        setEvidenceUrl(res.data.imageUrl);
        toast.success('Tải ảnh lên thành công');
      } else {
        toast.error(res.message || 'Lỗi khi tải ảnh lên');
      }
    } catch {
      toast.error('Tải ảnh lên thất bại do lỗi kết nối mạng.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getMyOrders();
        if (!res.error && res.data) {
          setOrders(res.data);
        }
      } catch {
        toast.error('Lỗi tải danh sách đơn hàng');
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast.error('Vui lòng chọn đơn hàng');
      return;
    }
    if (!reason) {
      toast.error('Vui lòng chọn lý do khiếu nại');
      return;
    }
    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ISubmitOrderComplaintRequest = {
        orderId: orderId,
        reason,
        description: description.trim(),
        evidenceImageUrl: evidenceUrl.trim(),
      };
      const res = await supportService.submitOrderComplaint(payload);
      if (!res.error) {
        toast.success('Gửi khiếu nại thành công! Chúng tôi sẽ xem xét trong 24h.');
        navigate(-1);
      } else {
        toast.error(res.message || 'Gửi khiếu nại thất bại, vui lòng kiểm tra lại');
      }
    } catch (error: any) {
      const rawMessage = error?.response?.data?.message || 'Lỗi kết nối đến máy chủ, không thể gửi khiếu nại.';
      toast.error(rawMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo cáo sự cố đơn hàng</h1>
          <p className="text-gray-600">
            Chúng tôi rất tiếc về trải nghiệm không tốt của bạn. Vui lòng cung cấp thông tin để được hỗ trợ.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          {isLoadingOrders ? (
            <div className="flex justify-center py-12"><Loading size="md" /></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-base font-medium text-gray-700">
                  Mã đơn hàng <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">-- Chọn đơn hàng --</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      Mã: {order.id.split('-')[0].toUpperCase()} - {new Date(order.createdAt).toLocaleDateString('vi-VN')} ({order.totalAmount.toLocaleString()}đ)
                    </option>
                  ))}
                </select>
                {orders.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">Bạn chưa có đơn hàng nào để báo cáo.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-base font-medium text-gray-700">
                  Lý do khiếu nại <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="Giao hàng quá chậm so với dự kiến">Giao hàng quá chậm so với dự kiến</option>
                  <option value="Đồ ăn bị thiếu / Không đúng món">Đồ ăn bị thiếu / Không đúng món</option>
                  <option value="Chất lượng đồ ăn kém (Nguội, ôi thiu...)">Chất lượng đồ ăn kém (Nguội, ôi thiu...)</option>
                  <option value="Thái độ của Shipper không tốt">Thái độ của Shipper không tốt</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-base font-medium text-gray-700">
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-y min-h-[120px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết sự việc xảy ra..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-base font-medium text-gray-700">
                  Bằng chứng (ảnh/video link)
                </label>
                <div className="flex gap-4">
                  <div className="relative w-28 h-28 flex-shrink-0 rounded-2xl border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center overflow-hidden bg-white group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      title="Chọn ảnh từ máy"
                      disabled={isSubmitting || isUploading}
                    />
                    
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin z-10"></div>
                    ) : evidenceUrl ? (
                      <>
                        <img src={evidenceUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-10 text-white pointer-events-none">
                          <Edit className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-medium">Đổi ảnh</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 pointer-events-none z-10 group-hover:text-orange-500">
                        <Plus className="w-7 h-7 mb-1" />
                        <span className="text-xs font-medium text-center">Tải ảnh lên</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <label className="block text-sm text-gray-500 mb-1.5 font-medium">Hoặc nhập link ảnh trực tiếp (nếu có):</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="Nhập link ảnh hoặc video minh chứng..."
                      disabled={isSubmitting || isUploading}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 text-orange-800">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-sm">
                  Khiếu nại sẽ được xem xét trong vòng 24 giờ. Vui lòng cung cấp thông tin chính xác để được hỗ trợ nhanh nhất.
                </p>
              </div>

              <Button type="submit" className="w-full py-3" disabled={isSubmitting || orders.length === 0}>
                {isSubmitting ? <Loading size="sm" /> : 'Gửi khiếu nại'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
