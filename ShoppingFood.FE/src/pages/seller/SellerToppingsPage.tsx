import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ListPlus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Button, Input, Modal, Loading, Pagination } from '../../components/common';
import { toppingService } from '../../services';
import { authService } from '../../services/AuthService';
import type { IToppingDto } from '../../interfaces';
import toast from 'react-hot-toast';

export function SellerToppingsPage() {
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [toppings, setToppings] = useState<IToppingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [take, setTake] = useState(10);
  const paginatedToppings = toppings.slice((currentPage - 1) * take, currentPage * take);
  const total = toppings.length;
  const totalPages = Math.ceil(total / take);

  // Form Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<IToppingDto | null>(null);
  const [toppingName, setToppingName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const res = await authService.uploadImage(file);
      if (!res.error && res.data?.imageUrl) {
        setImageUrl(res.data.imageUrl);
        toast.success('Tải ảnh lên thành công!', { id: toastId });
      } else {
        toast.error(res.message || 'Không thể tải ảnh lên', { id: toastId });
      }
    } catch {
      toast.error('Lỗi khi tải ảnh lên', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTopping, setDeletingTopping] = useState<IToppingDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadToppings = useCallback(async (rid: string) => {
    setIsLoading(true);
    try {
      const res = await toppingService.getByRestaurantId(rid);
      if (!res.error && res.data) {
        setToppings(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải danh sách toppings');
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi tải toppings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.getProfile();
        if (!res.error && res.data?.sellerInfo?.restaurantId) {
          const rid = res.data.sellerInfo.restaurantId;
          setRestaurantId(rid);
          loadToppings(rid);
        }
      } catch {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [loadToppings]);

  const handleAdd = () => {
    setEditingTopping(null);
    setToppingName('');
    setPrice(0);
    setIsAvailable(true);
    setImageUrl('');
    setIsOpen(true);
  };

  const handleEdit = (top: IToppingDto) => {
    setEditingTopping(top);
    setToppingName(top.toppingName);
    setPrice(top.price);
    setIsAvailable(top.isAvailable);
    setImageUrl(top.imageUrl || '');
    setIsOpen(true);
  };

  const handleDeleteClick = (top: IToppingDto) => {
    setDeletingTopping(top);
    setIsDeleteOpen(true);
  };

  const handleToggleAvailable = async (top: IToppingDto) => {
    try {
      const res = await toppingService.update(top.id, {
        id: top.id,
        restaurantId,
        toppingName: top.toppingName,
        price: top.price,
        imageUrl: top.imageUrl,
        isAvailable: !top.isAvailable
      });

      if (!res.error) {
        toast.success(`Đã chuyển trạng thái: ${!top.isAvailable ? 'Còn hàng' : 'Hết hàng'}`);
        loadToppings(restaurantId);
      } else {
        toast.error(res.message || 'Không thể cập nhật trạng thái');
      }
    } catch {
      toast.error('Đã xảy ra lỗi');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toppingName.trim()) {
      toast.error('Vui lòng nhập tên topping');
      return;
    }
    if (price < 0) {
      toast.error('Giá bán không hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTopping) {
        const res = await toppingService.update(editingTopping.id, {
          id: editingTopping.id,
          restaurantId,
          toppingName: toppingName.trim(),
          price,
          imageUrl: imageUrl.trim() || undefined,
          isAvailable
        });

        if (!res.error) {
          toast.success('Cập nhật topping thành công!');
          setIsOpen(false);
          loadToppings(restaurantId);
        } else {
          toast.error(res.message || 'Lỗi khi cập nhật topping');
        }
      } else {
        const res = await toppingService.create({
          restaurantId,
          toppingName: toppingName.trim(),
          price,
          imageUrl: imageUrl.trim() || undefined,
          isAvailable
        });

        if (!res.error) {
          toast.success('Thêm topping thành công!');
          setIsOpen(false);
          loadToppings(restaurantId);
        } else {
          toast.error(res.message || 'Lỗi khi thêm topping');
        }
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi lưu topping');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTopping) return;
    setIsDeleting(true);
    try {
      const res = await toppingService.delete(deletingTopping.id);
      if (!res.error) {
        toast.success('Xóa topping thành công!');
        setIsDeleteOpen(false);
        setDeletingTopping(null);
        loadToppings(restaurantId);
      } else {
        toast.error(res.message || 'Lỗi khi xóa topping');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Topping</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập các tùy chọn thêm (toppings) đi kèm cho món ăn của cửa hàng
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-5 h-5 mr-1" />
          Thêm Topping
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <Loading />
      ) : toppings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <ListPlus className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Chưa có topping nào</h3>
          <p className="text-sm text-gray-500 mb-6">Tạo topping để khách hàng có thêm nhiều lựa chọn kèm theo món ăn</p>
          <Button onClick={handleAdd}>
            <Plus className="w-5 h-5 mr-1" /> Thêm topping đầu tiên
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                  <th className="py-4 px-6 font-medium">Tên Topping</th>
                  <th className="py-4 px-6 font-medium">Giá bán</th>
                  <th className="py-4 px-6 font-medium text-center">Trạng thái</th>
                  <th className="py-4 px-6 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedToppings.map((top) => (
                  <tr key={top.id} className="hover:bg-orange-50/50 transition-colors group">
                    <td className="py-4 px-6 text-sm font-semibold text-gray-900">{top.toppingName}</td>
                    <td className="py-4 px-6 text-sm font-bold text-orange-600">
                      {top.price.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleAvailable(top)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
                          top.isAvailable
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {top.isAvailable ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-green-600" />
                            Còn hàng
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-red-600" />
                            Hết hàng
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => handleEdit(top)}
                          className="px-4 py-1.5 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-3xl transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(top)}
                          className="px-4 py-1.5 border border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-300 rounded-3xl transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {total > 0 && (
            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-500">
                Hiển thị {Math.min((currentPage - 1) * take + 1, total)} – {Math.min(currentPage * take, total)} trong số {total} topping
              </span>
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage}
                pageSize={take}
                pageSizeOptions={[10, 20, 50]}
                onPageSizeChange={(size) => { setTake(size); setCurrentPage(1); }} 
              />
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingTopping ? 'Chỉnh sửa Topping' : 'Thêm Topping mới'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên Topping <span className="text-red-500">*</span></label>
            <Input value={toppingName} onChange={(e) => setToppingName(e.target.value)} placeholder="VD: Trứng ốp la, Phô mai lát, Trân châu đen" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
            <Input type="number" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} placeholder="5000" min={0} />
          </div>

          {/* Topping Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh minh họa</label>
            <div className="flex gap-4 items-center">
              {imageUrl ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group bg-gray-50 flex-shrink-0">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-xs font-semibold"
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50/20 cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 transition-all flex-shrink-0">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-medium">Tải ảnh</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1.5">Nhập URL trực tiếp:</p>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/topping.jpg"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 cursor-pointer">
              Sẵn sàng phục vụ (Còn hàng)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              {editingTopping ? 'Cập nhật' : 'Thêm Topping'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Xác nhận xóa topping" size="sm">
        <div className="text-center py-2">
          <p className="text-gray-700 mb-1">Bạn có chắc chắn muốn xóa topping</p>
          <p className="font-semibold text-gray-900 mb-6">"{deletingTopping?.toppingName}"?</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Hủy</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isDeleting} disabled={isDeleting}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
