import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Layers, ArrowUpDown } from 'lucide-react';
import { Button, Input, Modal, Loading } from '../../components/common';
import { adminService, authService } from '../../services';
import toast from 'react-hot-toast';

/**
 * Trang Quản Lý Danh Mục Món Ăn Toàn Sàn (AdminSettingsPage).
 * Cho phép ban quản trị xây dựng cây phân loại ẩm thực toàn hệ thống:
 * - Thêm mới danh mục món ăn (Tên, mô tả, ảnh đại diện, thứ tự sắp xếp)
 * - Chỉnh sửa thông tin danh mục
 * - Bật/tắt hiển thị danh mục trên ứng dụng
 * - Xóa danh mục toàn sàn.
 */
export function AdminSettingsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showHidden, setShowHidden] = useState(true);
  const [isLoading, setIsLoading] = useState(true);


  // Form Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    setIsUploading(true);
    try {
      const res = await authService.uploadImage(file);
      if (!res.error && res.data?.imageUrl) {
        setImageUrl(res.data.imageUrl);
        toast.success('Tải ảnh lên thành công');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi kết nối khi tải ảnh');
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getGlobalMenuCategories(showHidden);
      if (!res.error && res.data) {
        setCategories(res.data.sort((a: any, b: any) => a.sortOrder - b.sortOrder));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi tải danh mục');
    } finally {
      setIsLoading(false);
    }
  }, [showHidden]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setSortOrder(categories.length);
    setIsOpen(true);
  };

  const handleEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setSortOrder(cat.sortOrder);
    setIsOpen(true);
  };

  const handleDeleteClick = (cat: any) => {
    setDeletingCategory(cat);
    setIsDeleteOpen(true);
  };

  const handleToggleVisibility = async (cat: any) => {
    try {
      const res = await adminService.toggleGlobalMenuCategoryVisibility(cat.id);
      if (!res.error) {
        toast.success(`Đã ${cat.isHidden ? 'hiện' : 'ẩn'} danh mục: ${cat.name}`);
        loadCategories();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await adminService.updateGlobalMenuCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          sortOrder
        });

        if (!res.error) {
          toast.success('Cập nhật danh mục thành công!');
          setIsOpen(false);
          loadCategories();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await adminService.createGlobalMenuCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          sortOrder
        });

        if (!res.error) {
          toast.success('Thêm danh mục thành công!');
          setIsOpen(false);
          loadCategories();
        } else {
          toast.error(res.message);
        }
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi lưu danh mục');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await adminService.deleteGlobalMenuCategory(deletingCategory.id);
      if (!res.error) {
        toast.success('Xóa danh mục thành công!');
        setIsDeleteOpen(false);
        setDeletingCategory(null);
        loadCategories();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục toàn sàn</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập các danh mục món ăn chính (Global Menu Categories) trên toàn sàn thương mại điện tử
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-all">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-4 h-4"
            />
            Hiển thị danh mục ẩn
          </label>
          <Button onClick={handleAdd}>
            <Plus className="w-5 h-5 mr-1" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <Loading />
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-20 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Chưa có danh mục toàn sàn nào</h3>
          <p className="text-sm text-gray-500 mb-6">Tạo các danh mục gốc như Cơm, Phở, Trà Sữa để người dùng dễ tìm kiếm</p>
          <Button onClick={handleAdd}>
            <Plus className="w-5 h-5 mr-1" /> Tạo danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md flex flex-col ${
                cat.isHidden ? 'opacity-70 border-gray-200 bg-gray-50/50' : 'border-gray-200'
              }`}
            >
              {/* Thumbnail Header */}
              <div className="relative h-44 bg-gray-100 flex-shrink-0">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-orange-50 text-orange-500">
                    🍔
                  </div>
                )}
                {cat.isHidden && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-gray-900/90 text-white font-bold text-xs flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5" /> Đang ẩn
                    </span>
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur shadow px-2.5 py-1 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  Thứ tự: {cat.sortOrder}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 flex items-center gap-1.5">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {cat.description || 'Không có mô tả cho danh mục này.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleVisibility(cat)}
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      cat.isHidden
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={cat.isHidden ? 'Hiện danh mục' : 'Ẩn danh mục'}
                  >
                    {cat.isHidden ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Hiện danh mục
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Ẩn danh mục
                      </>
                    )}
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                      title="Sửa thông tin"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(cat)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục gốc mới'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên danh mục gốc <span className="text-red-500">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bún/Phở, Cơm Tấm, Đồ ăn vặt, Lẩu & Nướng" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả danh mục này cho người dùng..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh sản phẩm</label>
            <div className="flex gap-4">
              {/* Left side: Upload Button / Preview */}
              <div className="relative w-28 h-28 flex-shrink-0 rounded-2xl border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center overflow-hidden bg-white group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  title="Chọn ảnh từ máy"
                />
                
                {isUploading ? (
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin z-10"></div>
                ) : imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-10 text-white pointer-events-none">
                      <Edit className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium">Đổi ảnh</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 pointer-events-none z-10 group-hover:text-orange-500">
                    <Plus className="w-7 h-7 mb-1" />
                    <span className="text-xs font-medium">Chọn ảnh</span>
                  </div>
                )}
              </div>

              {/* Right side: URL Input */}
              <div className="flex-1 flex flex-col justify-center">
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Nhập URL ảnh trực tiếp (nếu có):</label>
                <Input 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg" 
                  className="bg-gray-50"
                />
              </div>
            </div>
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
          <p className="text-gray-700 mb-1">Bạn có chắc chắn muốn xóa danh mục toàn sàn</p>
          <p className="font-semibold text-gray-900 mb-6">"{deletingCategory?.name}"?</p>
          <p className="text-xs text-red-500 font-medium mb-6">Cảnh báo: Hành động này có thể ảnh hưởng đến hiển thị sản phẩm trên toàn sàn!</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Hủy</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isDeleting} disabled={isDeleting}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
