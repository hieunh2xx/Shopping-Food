import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Send, Users, BellRing, Zap } from 'lucide-react';
import { adminService } from '../../services/AdminService';
import { flashSaleService } from '../../services/FlashSaleService';
import type { IFlashSale } from '../../services/FlashSaleService';
import { Button, Input } from '../../components/common';

export function AdminNotificationsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashSales, setFlashSales] = useState<IFlashSale[]>([]);
  const [formData, setFormData] = useState({
    flashSaleId: '',
    customMessage: '',
    targetAudience: 0, // 0 = AllCustomers, 1 = ByTier, 2 = SpecificCustomers
    targetTier: 0, // 0 = Bronze, 1 = Silver, 2 = Gold, 3 = Diamond
    targetUserIds: ''
  });

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const res = await flashSaleService.getAllFlashSales();
        if (!res.error && res.data) {
          setFlashSales(res.data);
          if (res.data.length > 0) {
            setFormData(prev => ({ ...prev, flashSaleId: res.data[0].id }));
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchFlashSales();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flashSaleId) {
      toast.error('Vui lòng chọn chương trình Flash Sale');
      return;
    }
    if (!formData.customMessage) {
      toast.error('Vui lòng nhập nội dung thông báo');
      return;
    }

    let userIdsArray: string[] | undefined = undefined;
    if (formData.targetAudience === 2) {
      userIdsArray = formData.targetUserIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (userIdsArray.length === 0) {
        toast.error('Vui lòng nhập ít nhất 1 User ID');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.broadcastNotification({
        flashSaleId: formData.flashSaleId,
        customMessage: formData.customMessage,
        targetAudience: formData.targetAudience,
        targetTier: formData.targetAudience === 1 ? formData.targetTier : undefined,
        targetUserIds: userIdsArray
      });

      if (!res.error) {
        toast.success('Gửi thông báo thành công');
        setFormData({ ...formData, customMessage: '', targetUserIds: '' }); // Clear text inputs
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
          Truyền thông Flash Sale
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gửi thông báo về chương trình Flash Sale đến khách hàng</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                Chọn chương trình Flash Sale
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.flashSaleId}
                onChange={(e) => setFormData({ ...formData, flashSaleId: e.target.value })}
              >
                {flashSales.length === 0 && <option value="">Không có chương trình nào</option>}
                {flashSales.map(sale => (
                  <option key={sale.id} value={sale.id}>{sale.title} ({sale.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tùy chỉnh</label>
              <Input
                value={formData.customMessage}
                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                placeholder="VD: Nhanh tay săn deal sốc lúc 12H!"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đối tượng nhận thông báo</label>
            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="audience" 
                  checked={formData.targetAudience === 0} 
                  onChange={() => setFormData({ ...formData, targetAudience: 0 })} 
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Tất cả khách hàng</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="audience" 
                  checked={formData.targetAudience === 1} 
                  onChange={() => setFormData({ ...formData, targetAudience: 1 })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Theo hạng thành viên</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="audience" 
                  checked={formData.targetAudience === 2} 
                  onChange={() => setFormData({ ...formData, targetAudience: 2 })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Khách hàng cụ thể</span>
              </label>
            </div>
          </div>

          {formData.targetAudience === 1 && (
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Hạng thành viên</label>
              <select
                className="w-full md:w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.targetTier}
                onChange={(e) => setFormData({ ...formData, targetTier: parseInt(e.target.value) })}
              >
                <option value={0}>Đồng (Bronze)</option>
                <option value={1}>Bạc (Silver)</option>
                <option value={2}>Vàng (Gold)</option>
                <option value={3}>Kim cương (Diamond)</option>
              </select>
            </div>
          )}

          {formData.targetAudience === 2 && (
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Danh sách User IDs
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                rows={3}
                value={formData.targetUserIds}
                onChange={(e) => setFormData({ ...formData, targetUserIds: e.target.value })}
                placeholder="Nhập User ID, cách nhau bằng dấu phẩy (VD: id1, id2, ...)"
              />
              <p className="text-xs text-gray-500 mt-1">Hệ thống sẽ gửi thông báo đến chính xác các user này.</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi...' : 'Phát sóng thông báo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
