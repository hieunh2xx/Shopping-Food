import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, FolderOpen, ArrowUpDown } from 'lucide-react';
import { Button, Input, Modal, Loading, Pagination } from '../../components/common';
import { menuCategoryService } from '../../services';
import { authService } from '../../services/AuthService';
import type { IMenuCategoryDto } from '../../interfaces';
import toast from 'react-hot-toast';

export function SellerCategoriesPage() {
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [categories, setCategories] = useState<IMenuCategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [take, setTake] = useState(10);
  const paginatedCategories = categories.slice((currentPage - 1) * take, currentPage * take);
  const total = categories.length;
  const totalPages = Math.ceil(total / take);

  // Form Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IMenuCategoryDto | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<IMenuCategoryDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = useCallback(async (rid: string) => {
    setIsLoading(true);
    try {
      const res = await menuCategoryService.getByRestaurant(rid);
      if (!res.error && res.data) {
        setCategories(res.data.sort((a, b) => a.sortOrder - b.sortOrder));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Tải danh mục thất bại do lỗi kết nối mạng. Vui lòng kiểm tra lại.');
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
          loadCategories(rid);
        }
      } catch {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [loadCategories]);

  const handleAdd = () => {
    setEditingCategory(null);
    setTitle('');
    setDescription('');
    setSortOrder(categories.length);
    setIsOpen(true);
  };

  const handleEdit = (cat: IMenuCategoryDto) => {
    setEditingCategory(cat);
    setTitle(cat.title);
    setDescription(cat.description || '');
    setSortOrder(cat.sortOrder);
    setIsOpen(true);
  };

  const handleDeleteClick = (cat: IMenuCategoryDto) => {
    setDeletingCategory(cat);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await menuCategoryService.update(editingCategory.id, {
          id: editingCategory.id,
          restaurantId,
          title: title.trim(),
          description: description.trim() || undefined,
          sortOrder
        } as any);

        if (!res.error) {
          toast.success('Cập nhật danh mục thành công!');
          setIsOpen(false);
          loadCategories(restaurantId);
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await menuCategoryService.create({
          restaurantId,
          title: title.trim(),
          description: description.trim() || undefined,
          sortOrder
        } as any);

        if (!res.error) {
          toast.success('Thêm danh mục thành công!');
          setIsOpen(false);
          loadCategories(restaurantId);
        } else {
          toast.error(res.message);
        }
      }
    } catch {
      toast.error('Lưu danh mục thất bại do lỗi kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await menuCategoryService.remove(deletingCategory.id);
      if (!res.error) {
        toast.success('Xóa danh mục thành công!');
        setIsDeleteOpen(false);
        setDeletingCategory(null);
        loadCategories(restaurantId);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Xóa danh mục thất bại do lỗi kết nối mạng.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục thực đơn</h1>
          <p className="text-sm text-gray-500 mt-1">
            Phân loại thực đơn của cửa hàng để khách hàng dễ dàng tìm kiếm
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-5 h-5 mr-1" />
          Thêm danh mục
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <Loading />
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Chưa có danh mục nào</h3>
          <p className="text-sm text-gray-500 mb-6">Tạo danh mục để bắt đầu phân loại các món ăn của bạn</p>
          <Button onClick={handleAdd}>
            <Plus className="w-5 h-5 mr-1" /> Thêm danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                  <th className="py-4 px-6 font-medium">Tên danh mục</th>
                  <th className="py-4 px-6 font-medium">Mô tả</th>
                  <th className="py-4 px-6 font-medium text-center">Thứ tự</th>
                  <th className="py-4 px-6 font-medium text-center">Số lượng món</th>
                  <th className="py-4 px-6 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-orange-50/50 transition-colors group">
                    <td className="py-4 px-6 text-sm font-semibold text-gray-900">{cat.title}</td>
                    <td className="py-4 px-6 text-sm text-gray-500 max-w-xs truncate">{cat.description || '-'}</td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-gray-700">
                      <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-md text-xs">
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                        {cat.sortOrder}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-sm text-gray-600 font-medium">
                      {cat.productCount || 0} món
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="px-4 py-1.5 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-3xl transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(cat)}
                          disabled={cat.productCount > 0}
                          className={`px-4 py-1.5 border rounded-3xl transition-all ${
                            cat.productCount > 0
                              ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                              : 'border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-300'
                          }`}
                          title={cat.productCount > 0 ? 'Không thể xóa danh mục có chứa món ăn' : 'Xóa'}
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
                Hiển thị {Math.min((currentPage - 1) * take + 1, total)} – {Math.min(currentPage * take, total)} trong số {total} danh mục
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
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên danh mục <span className="text-red-500">*</span></label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Món khai vị, Lẩu, Hải sản" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về danh mục..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thứ tự hiển thị</label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} placeholder="0" min={0} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              {editingCategory ? 'Cập nhật' : 'Thêm danh mục'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Xác nhận xóa danh mục" size="sm">
        <div className="text-center py-2">
          <p className="text-gray-700 mb-1">Bạn có chắc chắn muốn xóa danh mục</p>
          <p className="font-semibold text-gray-900 mb-6">"{deletingCategory?.title}"?</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Hủy</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isDeleting} disabled={isDeleting}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
