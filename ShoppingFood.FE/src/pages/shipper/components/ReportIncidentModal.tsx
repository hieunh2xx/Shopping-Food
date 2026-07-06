import React, { useState } from 'react';
import { Modal, Button, Input } from '../../../components/common';
import { shipperService } from '../../../services/ShipperService';
import toast from 'react-hot-toast';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const [reportType, setReportType] = useState<number>(1); // 1 = Order (Khách hàng), 4 = Restaurant
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Vui lòng nhập chi tiết sự cố');
      return;
    }

    setIsSubmitting(true);
    try {
      const title = reportType === 1 
        ? "Báo cáo Khách hàng quấy rối / Không thanh toán" 
        : "Báo cáo Nhà hàng chuẩn bị món quá lâu";
        
      const res = await shipperService.reportOrderIncident(orderId, {
        targetType: reportType,
        title,
        content
      });

      if (!res.error) {
        toast.success('Gửi báo cáo sự cố thành công. Coordinator sẽ xem xét sớm nhất có thể.');
        onClose();
        setContent('');
      } else {
        toast.error(res.message || 'Lỗi gửi báo cáo');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Báo cáo sự cố đơn hàng"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Nếu bạn gặp vấn đề trong quá trình giao hàng, hãy gửi báo cáo để Ban Quản Trị (Coordinator) hỗ trợ.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại sự cố</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50 transition-colors">
              <input 
                type="radio" 
                name="reportType" 
                value={1} 
                checked={reportType === 1}
                onChange={() => setReportType(1)}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Khách hàng đe dọa, quấy rối hoặc từ chối nhận/thanh toán</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50 transition-colors">
              <input 
                type="radio" 
                name="reportType" 
                value={4} 
                checked={reportType === 4}
                onChange={() => setReportType(4)}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Nhà hàng chuẩn bị món quá lâu, om đơn gây trễ giờ giao</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả chi tiết <span className="text-red-500">*</span></label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Vui lòng mô tả chi tiết sự cố bạn đang gặp phải..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
          <Button 
            onClick={handleSubmit} 
            isLoading={isSubmitting} 
            disabled={isSubmitting || !content.trim()}
          >
            Gửi Báo Cáo
          </Button>
        </div>
      </div>
    </Modal>
  );
};
