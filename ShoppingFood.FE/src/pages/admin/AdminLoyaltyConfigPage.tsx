import { useState, useEffect } from 'react';
import { Gift, Award, Plus, Trash2, Edit2, Play } from 'lucide-react';
import { Button, Input, Modal } from '../../components/common';
import toast from 'react-hot-toast';
import { pointGiftConfigService } from '../../services/PointGiftConfigService';
import { loyaltyPointService } from '../../services/LoyaltyPointService';
import { discountService } from '../../services/DiscountService';
import type { IPointGiftConfigDto, IMemberTierConfig, IDiscountDto } from '../../interfaces';

export function AdminLoyaltyConfigPage() {
  const [activeTab, setActiveTab] = useState<'gifts' | 'tiers'>('gifts');
  
  // Point Gift State
  const [gifts, setGifts] = useState<IPointGiftConfigDto[]>([]);
  const [discounts, setDiscounts] = useState<IDiscountDto[]>([]);
  const [isLoadingGifts, setIsLoadingGifts] = useState(true);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<IPointGiftConfigDto | null>(null);
  const [giftFormData, setGiftFormData] = useState({
    discountId: '',
    pointRequired: '' as any,
    isActive: true
  });

  // Tier State
  const [tiers, setTiers] = useState<IMemberTierConfig[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<IMemberTierConfig | null>(null);
  const [tierFormData, setTierFormData] = useState({
    tier: '',
    minPoints: '' as any
  });

  useEffect(() => {
    if (activeTab === 'gifts') {
      fetchGifts();
      fetchDiscounts();
    } else {
      fetchTiers();
    }
  }, [activeTab]);

  const fetchGifts = async () => {
    setIsLoadingGifts(true);
    try {
      const res = await pointGiftConfigService.getConfigs();
      if (!res.error && res.data) setGifts(res.data);
    } catch {
      toast.error('Lỗi tải danh sách quà tặng');
    } finally {
      setIsLoadingGifts(false);
    }
  };

  const fetchDiscounts = async () => {
    try {
      // Fetch global discounts to bind to gifts
      const res = await discountService.getDiscounts({ take: 100 });
      if (!res.error && res.data) {
        setDiscounts(res.data.filter(d => !d.restaurantId && d.status === 'Active'));
      }
    } catch {
      //
    }
  };

  const fetchTiers = async () => {
    setIsLoadingTiers(true);
    try {
      const res = await loyaltyPointService.getTierConfigs();
      if (!res.error && res.data) setTiers(res.data);
    } catch {
      toast.error('Lỗi tải danh sách hạng thành viên');
    } finally {
      setIsLoadingTiers(false);
    }
  };

  // --- Gift Handlers ---
  const handleOpenGiftModal = (gift?: IPointGiftConfigDto) => {
    if (gift) {
      setEditingGift(gift);
      setGiftFormData({ discountId: gift.discountId, pointRequired: gift.pointRequired, isActive: gift.isActive });
    } else {
      setEditingGift(null);
      setGiftFormData({ discountId: discounts[0]?.id || '', pointRequired: 100, isActive: true });
    }
    setIsGiftModalOpen(true);
  };

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGift) {
        const res = await pointGiftConfigService.updateConfig(editingGift.id, {
          pointRequired: Number(giftFormData.pointRequired) || 0,
          isActive: giftFormData.isActive
        });
        if (!res.error) {
          toast.success('Đã cập nhật quà tặng');
          setIsGiftModalOpen(false);
          fetchGifts();
        } else {
          toast.error(res.message || 'Lỗi cập nhật');
        }
      } else {
        const res = await pointGiftConfigService.createConfig({
          discountId: giftFormData.discountId,
          pointRequired: Number(giftFormData.pointRequired) || 0,
          isActive: giftFormData.isActive
        });
        if (!res.error) {
          toast.success('Đã tạo quà tặng đổi điểm');
          setIsGiftModalOpen(false);
          fetchGifts();
        } else {
          toast.error(res.message || 'Lỗi tạo mới');
        }
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (!confirm('Chắc chắn muốn xóa quà tặng này?')) return;
    try {
      const res = await pointGiftConfigService.deleteConfig(id);
      if (!res.error) {
        toast.success('Đã xóa quà tặng');
        fetchGifts();
      } else toast.error(res.message);
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  // --- Tier Handlers ---
  const handleEvaluateTiers = async () => {
    if (!confirm('Tiến hành chạy trình đánh giá hạng cho toàn bộ thành viên? Thao tác này có thể mất nhiều thời gian.')) return;
    setIsEvaluating(true);
    try {
      const res = await loyaltyPointService.evaluateTiers();
      if (!res.error) toast.success(`Hoàn tất đánh giá. Cập nhật ${res.data} tài khoản.`);
      else toast.error(res.message || 'Lỗi khi chạy đánh giá');
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleOpenTierModal = (tier: IMemberTierConfig) => {
    setEditingTier(tier);
    setTierFormData({ tier: tier.tier, minPoints: tier.minPoints });
    setIsTierModalOpen(true);
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    try {
      const res = await loyaltyPointService.updateTierConfig(editingTier.tier, Number(tierFormData.minPoints) || 0);
      if (!res.error) {
        toast.success('Đã cập nhật cấu hình hạng');
        setIsTierModalOpen(false);
        fetchTiers();
      } else {
        toast.error(res.message || 'Lỗi cập nhật');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Khách hàng thân thiết</h1>
        <p className="text-sm text-gray-500 mt-1">Cấu hình điểm thưởng, quà tặng và hạng thành viên</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 mb-6 p-2 flex gap-2">
        <button
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'gifts' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('gifts')}
        >
          <Gift className="w-4 h-4" /> Quà tặng đổi điểm
        </button>
        <button
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'tiers' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('tiers')}
        >
          <Award className="w-4 h-4" /> Cấu hình Hạng
        </button>
      </div>

      {activeTab === 'gifts' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách quà tặng</h2>
            <Button onClick={() => handleOpenGiftModal()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Thêm Quà tặng
            </Button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-4 font-medium">Mã khuyến mãi</th>
                <th className="py-4 px-4 font-medium">Tiêu đề</th>
                <th className="py-4 px-4 font-medium text-center">Điểm cần thiết</th>
                <th className="py-4 px-4 font-medium text-center">Trạng thái</th>
                <th className="py-4 px-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gifts.map(gift => (
                <tr key={gift.id} className="hover:bg-orange-50/50">
                  <td className="py-4 px-4 font-medium text-gray-900">{gift.discountCode}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{gift.discountTitle}</td>
                  <td className="py-4 px-4 text-center font-bold text-orange-500">{gift.pointRequired}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${gift.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {gift.isActive ? 'Đang bật' : 'Đã tắt'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenGiftModal(gift)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeleteGift(gift.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {gifts.length === 0 && !isLoadingGifts && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">Chưa có quà tặng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tiers' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cấu hình Hạng thành viên</h2>
              <p className="text-sm text-gray-500">Mức điểm tối thiểu để đạt được các hạng Đồng, Bạc, Vàng, Kim Cương.</p>
            </div>
            <Button onClick={handleEvaluateTiers} disabled={isEvaluating} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4" /> {isEvaluating ? 'Đang chạy...' : 'Đánh giá Hạng tự động'}
            </Button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-4 font-medium">Hạng</th>
                <th className="py-4 px-4 font-medium text-center">Mốc điểm tối thiểu</th>
                <th className="py-4 px-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tiers.map(tier => (
                <tr key={tier.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 font-bold text-gray-900 uppercase">{tier.tier}</td>
                  <td className="py-4 px-4 text-center font-bold text-blue-600">{tier.minPoints.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right">
                    {tier.tier !== 'Bronze' && ( 
                      <Button variant="outline" size="sm" onClick={() => handleOpenTierModal(tier)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Gift Modal */}
      <Modal isOpen={isGiftModalOpen} onClose={() => setIsGiftModalOpen(false)} title={editingGift ? 'Cập nhật quà tặng' : 'Thêm quà tặng mới'}>
        <form onSubmit={handleGiftSubmit} className="space-y-4">
          {!editingGift && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã khuyến mãi *</label>
              <select 
                required 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" 
                value={giftFormData.discountId} 
                onChange={(e) => setGiftFormData({...giftFormData, discountId: e.target.value})}
              >
                <option value="" disabled>-- Chọn mã KM --</option>
                {discounts.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.title}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Điểm yêu cầu *</label>
            <Input type="number" min="0" required value={giftFormData.pointRequired} onChange={e => setGiftFormData({...giftFormData, pointRequired: e.target.value === '' ? ('' as any) : Number(e.target.value)})} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={giftFormData.isActive} onChange={e => setGiftFormData({...giftFormData, isActive: e.target.checked})} />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Kích hoạt hiển thị</label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsGiftModalOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu cấu hình</Button>
          </div>
        </form>
      </Modal>

      {/* Tier Modal */}
      <Modal isOpen={isTierModalOpen} onClose={() => setIsTierModalOpen(false)} title="Cập nhật mốc điểm">
        <form onSubmit={handleTierSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hạng thành viên</label>
            <Input disabled value={tierFormData.tier.toUpperCase()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Điểm tối thiểu lên hạng *</label>
            <Input type="number" min="0" required value={tierFormData.minPoints} onChange={e => setTierFormData({...tierFormData, minPoints: e.target.value === '' ? ('' as any) : Number(e.target.value)})} />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsTierModalOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
