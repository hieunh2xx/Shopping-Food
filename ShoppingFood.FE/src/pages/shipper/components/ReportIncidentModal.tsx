import React, { useState } from 'react';
import { Modal, Button } from '../../../components/common';
import { shipperService } from '../../../services/ShipperService';
import toast from 'react-hot-toast';

/** ReportTargetType: Order = 1, Restaurant = 4 */
export const SHIPPER_CANCEL_REASONS = [
  { code: 'customer_unreachable', label: 'Không liên lạc được khách', targetType: 1 },
  { code: 'wrong_address', label: 'Địa chỉ sai / khó tìm', targetType: 1 },
  { code: 'customer_refuse', label: 'Khách từ chối nhận hàng', targetType: 1 },
  { code: 'cod_issue', label: 'Không thu được tiền (COD)', targetType: 1 },
  { code: 'unsafe', label: 'Không thể giao an toàn', targetType: 1 },
  { code: 'restaurant_slow', label: 'Nhà hàng chuẩn bị quá lâu', targetType: 4 },
  { code: 'restaurant_wrong', label: 'Sai/thiếu món từ nhà hàng', targetType: 4 },
  { code: 'vehicle', label: 'Sự cố phương tiện', targetType: 1 },
  { code: 'other', label: 'Lý do khác', targetType: 1 },
] as const;

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onReported?: (orderId: string) => void;
  title?: string;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onReported,
  title = 'Báo cáo giao hàng không thành công',
}) => {
  const [selectedCode, setSelectedCode] = useState<string>(SHIPPER_CANCEL_REASONS[0].code);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = SHIPPER_CANCEL_REASONS.find((r) => r.code === selectedCode) ?? SHIPPER_CANCEL_REASONS[0];
  const noteRequired = selected.code === 'other';

  const resetAndClose = () => {
    setSelectedCode(SHIPPER_CANCEL_REASONS[0].code);
    setContent('');
    onClose();
  };

  const handleSubmit = async () => {
    if (noteRequired && !content.trim()) {
      toast.error('Vui lòng mô tả lý do khác');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await shipperService.reportOrderIncident(orderId, {
        targetType: selected.targetType,
        title: selected.label,
        content: content.trim(),
      });

      if (!res.error) {
        toast.success('Đã hủy đơn và gửi báo cáo. Nhà hàng sẽ thấy lý do; khách chỉ được thông báo đơn đã hủy.');
        onReported?.(orderId);
        resetAndClose();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi báo cáo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Chọn lý do phù hợp. Đơn sẽ bị <strong>hủy</strong>; nhà hàng và điều phối nhận được báo cáo đầy đủ.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {SHIPPER_CANCEL_REASONS.map((reason) => (
              <label
                key={reason.code}
                className={`flex items-start gap-2 cursor-pointer p-3 border rounded-xl transition-colors ${
                  selectedCode === reason.code
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason.code}
                  checked={selectedCode === reason.code}
                  onChange={() => setSelectedCode(reason.code)}
                  className="mt-0.5 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-800 leading-snug">{reason.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ghi chú thêm {noteRequired ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(tuỳ chọn)</span>}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              noteRequired
                ? 'Mô tả ngắn gọn lý do...'
                : 'Thêm chi tiết nếu cần (không bắt buộc)'
            }
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={resetAndClose} disabled={isSubmitting}>
            Đóng
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting || (noteRequired && !content.trim())}
          >
            Xác nhận hủy đơn
          </Button>
        </div>
      </div>
    </Modal>
  );
};
