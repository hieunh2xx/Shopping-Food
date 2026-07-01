import { useState, useEffect } from 'react';
import { Gift, Search, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button, Input, Modal } from '../../components/common';
import toast from 'react-hot-toast';
import { promotionService } from '../../services/PromotionService';
import { productService } from '../../services/ProductService';
import type { IBuyXGetYPromotionDto, ICreatePromotionRequest, IProductDto, IUpdatePromotionRequest } from '../../interfaces';
import { useAuth } from '../../hooks';

export function SellerPromotionsPage() {
  const { user } = useAuth();
  const restaurantId = user?.sellerInfo?.restaurantId;

  const [promotions, setPromotions] = useState<IBuyXGetYPromotionDto[]>([]);
  const [products, setProducts] = useState<IProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<IBuyXGetYPromotionDto | null>(null);

  // Form State
  const [formData, setFormData] = useState<ICreatePromotionRequest>({
    triggerProductId: '',
    buyQuantity: '' as any,
    giftProductId: '',
    giftQuantity: '' as any,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    isActive: true
  });

  useEffect(() => {
    if (restaurantId) {
      fetchPromotions();
      fetchProducts();
    }
  }, [restaurantId]);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await promotionService.getPromotions({ restaurantId });
      if (!res.error && res.data) {
        setPromotions(res.data);
      }
    } catch {
      toast.error('Lỗi tải danh sách khuyến mãi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!restaurantId) return;
    try {
      const res = await productService.search({ restaurantId, take: 100 });
      if (!res.error && res.data) {
        setProducts(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleOpenModal = (promo?: IBuyXGetYPromotionDto) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        triggerProductId: promo.triggerProductId,
        buyQuantity: promo.buyQuantity,
        giftProductId: promo.giftProductId,
        giftQuantity: promo.giftQuantity,
        startDate: new Date(promo.startDate).toISOString().slice(0, 16),
        endDate: new Date(promo.endDate).toISOString().slice(0, 16),
        isActive: promo.isActive
      });
    } else {
      setEditingPromo(null);
      setFormData({
        triggerProductId: '',
        buyQuantity: '' as any,
        giftProductId: '',
        giftQuantity: '' as any,
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const payload = {
        ...formData,
        buyQuantity: Number(formData.buyQuantity) || 0,
        giftQuantity: Number(formData.giftQuantity) || 0,
      };

      if (editingPromo) {
        const updateData: IUpdatePromotionRequest = {
          id: editingPromo.id,
          ...payload
        };
        const res = await promotionService.updatePromotion(editingPromo.id, updateData);
        if (!res.error) {
          toast.success('Đã cập nhật khuyến mãi');
          setIsModalOpen(false);
          fetchPromotions();
        } else {
          toast.error(res.message || 'Lỗi cập nhật');
        }
      } else {
        const res = await promotionService.createPromotion(formData);
        if (!res.error) {
          toast.success('Đã tạo khuyến mãi mới');
          setIsModalOpen(false);
          fetchPromotions();
        } else {
          toast.error(res.message || 'Lỗi tạo mới');
        }
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;
    try {
      const res = await promotionService.deletePromotion(id);
      if (!res.error) {
        toast.success('Đã xóa khuyến mãi');
        fetchPromotions();
      } else {
        toast.error(res.message || 'Lỗi xóa');
      }
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mua X Tặng Y</h1>
          <p className="text-sm text-gray-500 mt-1">Thiết lập các chương trình Mua món X tặng món Y</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo chương trình
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Chương trình</th>
                <th className="py-4 px-6 font-medium">Thời hạn</th>
                <th className="py-4 px-6 font-medium text-center">Trạng thái</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-orange-50/50">
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Mua {promo.buyQuantity} <span className="text-orange-600">{promo.triggerProductName}</span></div>
                        <div className="font-medium text-gray-600 mt-0.5">Tặng {promo.giftQuantity} <span className="text-green-600">{promo.giftProductName}</span></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    <div>Từ: {new Date(promo.startDate).toLocaleDateString()}</div>
                    <div>Đến: {new Date(promo.endDate).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${promo.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {promo.isActive ? 'Đang bật' : 'Đã tắt'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(promo)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(promo.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">Chưa có chương trình Mua X Tặng Y nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPromo ? 'Cập nhật khuyến mãi' : 'Thêm Mua X Tặng Y'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mua Món *</label>
              <select required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" value={formData.triggerProductId} onChange={(e) => setFormData({ ...formData, triggerProductId: e.target.value })}>
                <option value="" disabled>-- Chọn món ăn --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.itemName}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng mua *</label>
              <Input type="number" required min="1" value={formData.buyQuantity} onChange={e => setFormData({ ...formData, buyQuantity: e.target.value === '' ? ('' as any) : Number(e.target.value) })} />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tặng Món *</label>
              <select required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" value={formData.giftProductId} onChange={(e) => setFormData({ ...formData, giftProductId: e.target.value })}>
                <option value="" disabled>-- Chọn món tặng --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.itemName}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tặng *</label>
              <Input type="number" required min="1" value={formData.giftQuantity} onChange={e => setFormData({ ...formData, giftQuantity: e.target.value === '' ? ('' as any) : Number(e.target.value) })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
              <Input type="datetime-local" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
              <Input type="datetime-local" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>

            <div className="col-span-2 flex items-center gap-2 mt-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Kích hoạt ngay</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu chương trình</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
