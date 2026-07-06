import React, { useState } from 'react';
import { Button } from '../../../components/common';
import { coordinatorService } from '../../../services/coordinatorService';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import type { IMonitorShipperDto } from '../../../interfaces';

interface AdjustReputationModalProps {
  shipper: IMonitorShipperDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdjustReputationModal: React.FC<AdjustReputationModalProps> = ({ shipper, onClose, onSuccess }) => {
  const [points, setPoints] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!shipper) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPoints = parseInt(points);
    if (isNaN(parsedPoints) || parsedPoints === 0) {
      toast.error('Số điểm thay đổi phải khác 0');
      return;
    }
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do');
      return;
    }

    try {
      setLoading(true);
      const res = await coordinatorService.adjustShipperReputation(shipper.shipperId, { points: parsedPoints, reason });
      if (!res.error) {
        toast.success(`Đã thay đổi điểm uy tín thành công`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Lỗi khi thay đổi điểm');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">Điều chỉnh điểm uy tín</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm mb-4">
              Tài xế: <strong>{shipper.fullName}</strong> <br/>
              Điểm hiện tại: <strong>{shipper.reputationScore} ⭐</strong>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Điểm điều chỉnh (+/-)
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Ví dụ: -10, +5"
              />
              <p className="text-xs text-gray-500 mt-1">Nhập số âm để trừ điểm, số dương để cộng điểm.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all min-h-[100px]"
                placeholder="Nhập lý do điều chỉnh điểm..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl shadow-md shadow-primary-500/20"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
