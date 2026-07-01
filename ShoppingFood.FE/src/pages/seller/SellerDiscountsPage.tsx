import { useState, useEffect } from 'react';
import { Tag, Search, Plus, Trash2, Edit2, BarChart3 } from 'lucide-react';
import { Button, Input, Modal } from '../../components/common';
import toast from 'react-hot-toast';
import { discountService } from '../../services/DiscountService';
import type { IDiscountDto, ICreateDiscountRequest, IUpdateDiscountRequest } from '../../interfaces';
import { useAuth } from '../../hooks';

export function SellerDiscountsPage() {
  const { user } = useAuth();
  const restaurantId = user?.sellerInfo?.restaurantId;

  const [discounts, setDiscounts] = useState<IDiscountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const take = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<IDiscountDto | null>(null);

  // Form State
  const [formData, setFormData] = useState<ICreateDiscountRequest>({
    code: '',
    title: '',
    description: '',
    type: 'Percentage',
    value: '' as any,
    minOrderAmount: '' as any,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    quantity: '' as any,
    maxUsagePerUser: '' as any,
    maxDiscountAmount: '' as any
  });

  useEffect(() => {
    if (restaurantId) fetchDiscounts();
  }, [page, restaurantId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1 && restaurantId) fetchDiscounts();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      const res = await discountService.getDiscounts({ skip, take, filter: searchTerm, restaurantId, includeAll: true } as any);
      if (!res.error && res.data) {
        setDiscounts(res.data);
        setTotal(res.total || 0);
      }
    } catch {
      toast.error('Lỗi tải danh sách mã giảm giá');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (discount?: IDiscountDto) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code,
        title: discount.title,
        description: discount.description || '',
        type: discount.type,
        value: discount.value,
        minOrderAmount: discount.minOrderAmount,
        startDate: new Date(discount.startDate).toISOString().slice(0, 16),
        endDate: new Date(discount.endDate).toISOString().slice(0, 16),
        quantity: discount.quantity,
        maxUsagePerUser: discount.maxUsagePerUser,
        maxDiscountAmount: discount.maxDiscountAmount || 0
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '',
        title: '',
        description: '',
        type: 'Percentage',
        value: 0,
        minOrderAmount: 0,
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
        quantity: 100,
        maxUsagePerUser: 1,
        maxDiscountAmount: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      if (editingDiscount) {
        const updateData: IUpdateDiscountRequest = {
          title: formData.title,
          description: formData.description,
          value: Number(formData.value) || 0,
          minOrderAmount: Number(formData.minOrderAmount) || 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          quantity: Number(formData.quantity) || 0,
          maxUsagePerUser: Number(formData.maxUsagePerUser) || 0,
          maxDiscountAmount: Number(formData.maxDiscountAmount) || 0,
          status: 'Active'
        };
        const res = await discountService.updateDiscount(editingDiscount.id, updateData);
        if (!res.error) {
          toast.success('Đã cập nhật mã giảm giá');
          setIsModalOpen(false);
          fetchDiscounts();
        } else {
          toast.error(res.message || 'Lỗi cập nhật');
        }
      } else {
        const createData: ICreateDiscountRequest = {
          ...formData,
          value: Number(formData.value) || 0,
          maxDiscountAmount: Number(formData.maxDiscountAmount) || 0,
          minOrderAmount: Number(formData.minOrderAmount) || 0,
          quantity: Number(formData.quantity) || 0,
          maxUsagePerUser: Number(formData.maxUsagePerUser) || 0,
          restaurantId
        };
        const res = await discountService.createDiscount(createData);
        if (!res.error) {
          toast.success('Đã tạo mã giảm giá mới');
          setIsModalOpen(false);
          fetchDiscounts();
        } else {
          toast.error(res.message || 'Lỗi tạo mã');
        }
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      const res = await discountService.deleteDiscount(id);
      if (!res.error) {
        toast.success('Đã xóa mã giảm giá');
        fetchDiscounts();
      } else {
        toast.error(res.message || 'Lỗi xóa mã');
      }
    } catch {
      toast.error('Lỗi khi xóa mã');
    }
  };

  const handleShowStats = async () => {
    try {
      const res = await discountService.getDiscountStats();
      if (!res.error && res.data) {
        setStats(res.data);
        setIsStatsModalOpen(true);
      } else {
        toast.error(res.message || 'Lỗi tải thống kê');
      }
    } catch {
      toast.error('Lỗi khi tải thống kê mã giảm giá');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mã giảm giá cửa hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Phát hành mã khuyến mãi riêng để thu hút khách hàng</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleShowStats} className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Thống kê
          </Button>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo mã giảm giá
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex items-center gap-4">
        <div className="w-full sm:w-96 relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã, tên..."
            className="pl-10"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Mã KM</th>
                <th className="py-4 px-6 font-medium">Chi tiết</th>
                <th className="py-4 px-6 font-medium">Thời hạn</th>
                <th className="py-4 px-6 font-medium text-center">Đã dùng / Tổng</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-orange-50/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-gray-900">{discount.code}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium text-gray-900">{discount.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Giảm {discount.type === 'Percentage' ? `${discount.value}%` : `${discount.value.toLocaleString()}đ`}
                      {discount.minOrderAmount > 0 && ` (Đơn tối thiểu ${discount.minOrderAmount.toLocaleString()}đ)`}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    <div>Từ: {new Date(discount.startDate).toLocaleDateString()}</div>
                    <div>Đến: {new Date(discount.endDate).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-gray-900">
                    {discount.usedCount} / {discount.quantity}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(discount)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(discount.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">Bạn chưa tạo mã giảm giá nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDiscount ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã (Code) *</label>
              <Input required value={formData.code} disabled={!!editingDiscount} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VD: TET2024" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
              <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="Percentage">Phần trăm (%)</option>
                <option value="FixedAmount">Số tiền cố định (VNĐ)</option>
                <option value="FreeShipping">Miễn phí vận chuyển</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
              <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="VD: Giảm 20% cho đơn từ 100k" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
              <textarea className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            
            {formData.type !== 'FreeShipping' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm *</label>
                <Input type="number" required min="0" max={formData.type === 'Percentage' ? 100 : undefined} value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value === '' ? ('' as any) : Number(e.target.value) })} />
              </div>
            )}
            
            {formData.type === 'Percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (VNĐ)</label>
                <Input type="number" min="0" value={formData.maxDiscountAmount} onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value === '' ? ('' as any) : Number(e.target.value) })} />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VNĐ) *</label>
              <Input type="number" required min="0" value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value === '' ? ('' as any) : Number(e.target.value) })} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số lượng phát hành *</label>
              <Input type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? ('' as any) : Number(e.target.value) })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn số lần dùng/User *</label>
              <Input type="number" required min="1" value={formData.maxUsagePerUser} onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value === '' ? ('' as any) : Number(e.target.value) })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
              <Input type="datetime-local" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
              <Input type="datetime-local" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu mã giảm giá</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} title="Thống kê mã giảm giá">
        {stats ? (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Tổng số mã đã dùng</div>
              <div className="text-2xl font-bold text-orange-600">{stats.totalUsedCount || 0}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Tổng số tiền đã giảm</div>
              <div className="text-2xl font-bold text-green-600">{(stats.totalDiscountAmount || 0).toLocaleString()}đ</div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">Đang tải dữ liệu...</div>
        )}
      </Modal>
    </div>
  );
}
