import { useState, useEffect } from 'react';
import { Tag, Search, Plus, Trash2, Edit2, BarChart3 } from 'lucide-react';
import { Button, Input, Modal, Pagination, ConfirmModal } from '../../components/common';
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
  const [take, setTake] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<IDiscountDto | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, desc: string, action: () => void}>({
    isOpen: false,
    title: '',
    desc: '',
    action: () => {}
  });

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
      toast.error('Tải danh sách mã giảm giá thất bại do lỗi kết nối mạng.');
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
      const handleApiError = (res: any, defaultMsg: string) => {
        if (res.message === 'Validation failed.' && Array.isArray(res.data)) {
          res.data.forEach((err: any) => {
            let errMsg = err.error;
            if (errMsg.includes('is required')) errMsg = `${err.property} không được để trống.`;
            else if (errMsg.includes('already exists')) errMsg = `${err.property} đã tồn tại.`;
            else if (errMsg.includes('cannot be in the past')) errMsg = `${err.property} không được ở trong quá khứ.`;
            else if (errMsg.includes('must not exceed')) errMsg = `${err.property} vượt quá giới hạn cho phép.`;
            else if (errMsg.includes('greater than')) errMsg = `${err.property} không hợp lệ.`;
            toast.error(errMsg);
          });
          return;
        }
        let msg = res.message || defaultMsg;
        if (msg.includes('Value must not exceed 100%')) {
          msg = 'Giá trị giảm không được vượt quá 100%.';
        } else if (msg.includes('Value must not exceed the minimum order amount')) {
          msg = 'Giá trị giảm không được vượt quá đơn hàng tối thiểu.';
        } else if (msg.includes('Code already exists')) {
          msg = 'Mã giảm giá này đã tồn tại.';
        }
        toast.error(msg);
      };

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
          toast.success('Cập nhật giới hạn sử dụng mã giảm giá thành công!');
          setIsModalOpen(false);
          fetchDiscounts();
        } else {
          handleApiError(res, 'Lỗi cập nhật');
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
          toast.success('Tạo mã giảm giá thành công!');
          setIsModalOpen(false);
          fetchDiscounts();
        } else {
          handleApiError(res, 'Lỗi tạo mã');
        }
      }
    } catch {
      toast.error('Lưu mã giảm giá thất bại do lỗi kết nối mạng.');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa mã giảm giá',
      desc: 'Bạn có chắc chắn muốn xóa mã giảm giá này?',
      action: async () => {
        try {
          const res = await discountService.deleteDiscount(id);
          if (!res.error) {
            toast.success('Mã giảm giá đã được vô hiệu hóa thành công!');
            fetchDiscounts();
          } else {
            toast.error(res.message);
          }
        } catch {
          toast.error('Lỗi khi xóa mã');
        }
      }
    });
  };

  const handleShowStats = async () => {
    try {
      const res = await discountService.getDiscountStats();
      if (!res.error && res.data) {
        setStats(res.data);
        setIsStatsModalOpen(true);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Tải thống kê mã giảm giá thất bại do lỗi kết nối mạng.');
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
                <th className="py-4 px-6 font-medium text-center">Phạm vi</th>
                <th className="py-4 px-6 font-medium">Thời hạn</th>
                <th className="py-4 px-6 font-medium text-center">Đã dùng / Tổng</th>
                <th className="py-4 px-6 font-medium text-center">Trạng thái</th>
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
                  <td className="py-4 px-6 text-center">
                    {discount.restaurantId ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 truncate max-w-[150px] inline-block" title={discount.restaurantName}>
                        Cửa hàng: {discount.restaurantName}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Hệ thống</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    <div>Từ: {new Date(discount.startDate).toLocaleDateString()}</div>
                    <div>Đến: {new Date(discount.endDate).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 px-6 text-center text-sm font-medium text-gray-900">
                    {discount.usedCount} / {discount.quantity}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {(() => {
                      const isExpired = new Date(discount.endDate) < new Date();
                      const isOutOfStock = discount.usedCount >= discount.quantity;
                      if (discount.status === 'Inactive' || discount.status === 'Cancelled') {
                        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Đã khóa</span>;
                      }
                      if (isExpired) {
                        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Hết hạn</span>;
                      }
                      if (isOutOfStock) {
                        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">Hết lượt</span>;
                      }
                      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Đang hoạt động</span>;
                    })()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {discount.restaurantId && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(discount)} className="px-4 py-1.5 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-3xl transition-all" title="Sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(discount.id)} className="px-4 py-1.5 border border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-300 rounded-3xl transition-all" title="Khóa / Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
        
        {total > 0 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-500">
              Hiển thị {Math.min((page - 1) * take + 1, total)} – {Math.min(page * take, total)} trong số {total} mã giảm giá
            </span>
            <Pagination 
              currentPage={page} 
              totalPages={Math.ceil(total / take)} 
              onPageChange={setPage}
              pageSize={take}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={(size) => { setTake(size); setPage(1); }} 
            />
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDiscount ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
                <Input type="number" required min="0" max={formData.type === 'Percentage' ? 100 : (formData.type === 'FixedAmount' ? formData.minOrderAmount : undefined)} value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value === '' ? ('' as any) : Number(e.target.value) })} />
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

            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
                <Input type="datetime-local" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                <Input type="datetime-local" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmModal.action();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        title={confirmModal.title}
        description={confirmModal.desc}
        confirmLabel="Đồng ý"
        cancelLabel="Hủy"
      />
    </div>
  );
}
