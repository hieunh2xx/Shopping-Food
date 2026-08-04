import { useState } from 'react';
import { Plus, Edit, FileText } from 'lucide-react';
import { Button, Input, Loading, Modal } from '../../../components/common';
import { adminService, authService } from '../../../services';
import type { ICreateSupportTicketRequest } from '../../../interfaces';
import toast from 'react-hot-toast';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [orderId, setOrderId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setOrderId('');
    setCustomerId('');
    setReason('');
    setDescription('');
    setEvidenceUrl('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
        toast.error(res.message);
      }
    } catch {
      toast.error('Tải ảnh lên thất bại do lỗi kết nối mạng.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng');
      return;
    }
    if (!reason) {
      toast.error('Vui lòng chọn lý do');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ICreateSupportTicketRequest = {
        orderId: orderId.trim(),
        customerId: customerId.trim() || undefined,
        reason,
        description: description.trim() || undefined,
        evidenceImageUrl: evidenceUrl.trim() || undefined,
      };
      
      const res = await adminService.createSupportTicket(payload);
      if (!res.error) {
        toast.success('Tạo phiếu hỗ trợ thành công!');
        onSuccess();
        handleClose();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Tạo phiếu hỗ trợ thất bại do lỗi mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo phiếu hỗ trợ thủ công" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Mã đơn hàng (GUID)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Nhập mã đơn hàng..."
            required
            disabled={isSubmitting}
          />

          <Input
            label="Mã khách hàng (GUID - Không bắt buộc)"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="Nhập mã khách hàng nếu có..."
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Lý do khiếu nại <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none text-sm"
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

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Mô tả chi tiết
          </label>
          <textarea
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-y min-h-[80px] text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết sự việc..."
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Bằng chứng (ảnh/video)
          </label>
          <div className="flex gap-3">
            <div className="relative w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center overflow-hidden bg-white group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                title="Chọn ảnh"
                disabled={isSubmitting || isUploading}
              />
              
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin z-10"></div>
              ) : evidenceUrl ? (
                <>
                  <img src={evidenceUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-10 text-white pointer-events-none">
                    <Edit className="w-3 h-3 mb-1" />
                    <span className="text-[9px] font-medium">Đổi ảnh</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 pointer-events-none z-10 group-hover:text-orange-500">
                  <Plus className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-medium text-center">Tải ảnh</span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-sm"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="Hoặc nhập link trực tiếp..."
                disabled={isSubmitting || isUploading}
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2 text-blue-800">
          <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs">
            Phiếu hỗ trợ sẽ được tạo với trạng thái Chờ xử lý.
          </p>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loading size="sm" /> : 'Tạo phiếu'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
