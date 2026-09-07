import React, { useState } from 'react';
import { Modal, Button } from '../../../components/common';
import { shipperService } from '../../../services/ShipperService';
import { authService } from '../../../services/AuthService';
import toast from 'react-hot-toast';
import { Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';

interface SuccessDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  latitude: number;
  longitude: number;
  onSuccess: (orderId: string) => void;
}

/**
 * Modal Xác Nhận Giao Hàng Thành Công (SuccessDeliveryModal).
 * Yêu cầu tài xế tải lên hình ảnh chụp bằng chứng đã giao đồ ăn tận tay khách hàng kèm tọa độ GPS.
 */
export const SuccessDeliveryModal: React.FC<SuccessDeliveryModalProps> = ({
  isOpen,
  onClose,
  orderId,
  latitude,
  longitude,
  onSuccess
}) => {
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!proofImageFile) {
      toast.error('Vui lòng tải lên ảnh chứng minh giao hàng thành công');
      return;
    }
    if (isSubmitting) return;

    const confirmingOrderId = orderId;
    setIsSubmitting(true);
    try {
      // 1. Upload image
      const uploadRes = await authService.uploadImage(proofImageFile);
      if (uploadRes.error) {
        toast.error('Lỗi tải ảnh lên. Vui lòng thử lại.');
        setIsSubmitting(false);
        return;
      }

      const imageUrl = uploadRes.data.imageUrl;

      // 2. Confirm delivery
      const res = await shipperService.confirmDelivered({
        orderId: confirmingOrderId,
        latitude,
        longitude,
        deliveryProofImageUrl: imageUrl
      });

      if (!res.error) {
        toast.success(
          (res.data as any)?.alreadyCompleted
            ? 'Đơn này đã được xác nhận giao trước đó.'
            : 'Chúc mừng! Giao hàng thành công.'
        );
        onSuccess(confirmingOrderId);
        onClose();
        setProofImageFile(null);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || '';
      // Đơn đã Delivered trên BE nhưng FE còn giữ → gỡ khỏi danh sách active
      if (
        typeof apiMsg === 'string' &&
        apiMsg.toLowerCase().includes('delivered')
      ) {
        toast.success('Đơn này đã hoàn thành trên hệ thống.');
        onSuccess(confirmingOrderId);
        onClose();
        setProofImageFile(null);
      } else {
        toast.error(apiMsg || 'Xác nhận giao hàng thất bại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận giao hàng thành công"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Vui lòng chụp ảnh món hàng đã được giao đến tay khách hàng (hoặc để tại vị trí khách hàng yêu cầu) để làm bằng chứng.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 relative overflow-hidden group">
          <input 
            type="file" 
            accept="image/*"
            capture="environment" // Hint for mobile devices to open camera directly
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          {proofImageFile ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-sm font-medium text-gray-700">Đã chọn ảnh: {proofImageFile.name}</p>
              <p className="text-xs text-orange-500 underline z-20" onClick={(e) => {
                e.stopPropagation();
                const input = e.currentTarget.parentElement?.parentElement?.querySelector('input');
                if (input) input.click();
              }}>Nhấn để thay đổi</p>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-gray-400 mb-2 group-hover:text-orange-500 transition-colors" />
              <p className="text-sm font-medium text-gray-700">Nhấn để chụp/chọn ảnh</p>
              <p className="text-xs text-gray-500 mt-1">Hỗ trợ JPG, PNG</p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !proofImageFile} className="flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác nhận
          </Button>
        </div>
      </div>
    </Modal>
  );
};
