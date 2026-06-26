import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Package, AlertTriangle, X, Loader2, UtensilsCrossed } from 'lucide-react';
import { Button, Input, Modal, Pagination, Loading } from '../../components/common';
import { useProducts } from '../../hooks/useProducts';
import { productService, menuCategoryService } from '../../services';
import { authService } from '../../services/AuthService';
import type { IProductDto, IAddProductRequest, IUpdateProductRequest, IProductSizeDto, IMenuCategoryDto } from '../../interfaces';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// ─── Product Form Modal ───────────────────────────────────────────────────────
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: IProductDto | null; // null = creating new
  restaurantId: string;
  categories: { id: string; title: string }[];
  onSaved: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}

function ProductFormModal({ isOpen, onClose, product, restaurantId, categories, onSaved, isSubmitting, setIsSubmitting }: ProductFormModalProps) {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sizes, setSizes] = useState<IProductSizeDto[]>([]);

  const isEditing = !!product;

  // Populate form on open
  useEffect(() => {
    if (product) {
      setItemName(product.itemName);
      setDescription(product.description || '');
      setPrice(product.price);
      setCategoryId(product.categoryId);
      setImageUrl(product.primaryImageUrl || '');
      setSizes(product.sizes || []);
    } else {
      setItemName('');
      setDescription('');
      setPrice(0);
      setCategoryId(categories[0]?.id || '');
      setImageUrl('');
      setSizes([]);
    }
  }, [product, isOpen, categories]);

  const addSize = () => {
    setSizes([...sizes, { id: crypto.randomUUID(), name: '', priceAdjustment: 0 }]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof IProductSizeDto, value: string | number) => {
    const updated = [...sizes];
    updated[index] = { ...updated[index], [field]: value };
    setSizes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (price <= 0) {
      toast.error('Giá phải lớn hơn 0');
      return;
    }
    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && product) {
        const payload: IUpdateProductRequest = {
          id: product.id,
          itemName: itemName.trim(),
          description: description.trim() || undefined,
          price,
          categoryId,
          imageUrls: imageUrl.trim() ? [imageUrl.trim()] : undefined,
          sizes: sizes.filter(s => s.name.trim()),
        };
        const res = await productService.update(product.id, payload);
        if (!res.error) {
          toast.success('Cập nhật sản phẩm thành công!');
          onSaved();
          onClose();
        } else {
          toast.error(res.message || 'Lỗi cập nhật sản phẩm');
        }
      } else {
        const payload: IAddProductRequest = {
          restaurantId,
          itemName: itemName.trim(),
          description: description.trim() || undefined,
          price,
          categoryId,
          imageUrls: imageUrl.trim() ? [imageUrl.trim()] : undefined,
          sizes: sizes.filter(s => s.name.trim()),
        };
        const res = await productService.create(payload);
        if (!res.error) {
          toast.success('Thêm sản phẩm thành công!');
          onSaved();
          onClose();
        } else {
          toast.error(res.message || 'Lỗi thêm sản phẩm');
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Product name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
          <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="VD: Phở bò tái nạm" />
        </div>

        {/* Price & Category row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
            <Input type="number" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} placeholder="55000" min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục <span className="text-red-500">*</span></label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn gọn về sản phẩm..."
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh sản phẩm (URL)</label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          {imageUrl && (
            <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>

        {/* Sizes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Kích cỡ / Size</label>
            <button type="button" onClick={addSize} className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Thêm size
            </button>
          </div>
          {sizes.length === 0 && (
            <p className="text-xs text-gray-400 italic">Chưa có size nào. Sản phẩm sẽ dùng giá mặc định.</p>
          )}
          <div className="space-y-2">
            {sizes.map((size, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={size.name}
                  onChange={(e) => updateSize(idx, 'name', e.target.value)}
                  placeholder="VD: Lớn, Nhỏ, Vừa"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={size.priceAdjustment || ''}
                  onChange={(e) => updateSize(idx, 'priceAdjustment', Number(e.target.value))}
                  placeholder="+/- giá"
                  className="w-28"
                />
                <button type="button" onClick={() => removeSize(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            {isEditing ? 'Cập nhật' : 'Thêm sản phẩm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  product: IProductDto | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

function DeleteConfirmModal({ isOpen, onClose, product, onConfirm, isDeleting }: DeleteConfirmProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận xóa" size="sm">
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <p className="text-gray-700 mb-1">Bạn có chắc chắn muốn xóa sản phẩm</p>
        <p className="font-semibold text-gray-900 mb-6">"{product?.itemName}"?</p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>Hủy</Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting} disabled={isDeleting}>Xóa</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Stock Status Badge ───────────────────────────────────────────────────────
function StockBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    InStock: { label: 'Còn hàng', className: 'bg-emerald-100 text-emerald-700' },
    OutOfStock: { label: 'Hết hàng', className: 'bg-red-100 text-red-700' },
    LowStock: { label: 'Sắp hết', className: 'bg-amber-100 text-amber-700' },
  };
  const info = map[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SellerProductsPage() {
  const { products, total, isLoading, searchProducts, deleteProduct } = useProducts();
  const [categories, setCategories] = useState<IMenuCategoryDto[]>([]);

  const [restaurantId, setRestaurantId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProductDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<IProductDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggling loading state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Load restaurantId from profile and then categories
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.getProfile();
        if (!res.error && res.data?.sellerInfo?.restaurantId) {
          const rid = res.data.sellerInfo.restaurantId;
          setRestaurantId(rid);
          // Load categories by restaurant
          const catRes = await menuCategoryService.getByRestaurant(rid);
          if (!catRes.error && catRes.data) {
            setCategories(catRes.data);
          }
        }
      } catch {
        // Fail silently
      }
    };
    loadProfile();
  }, []);

  // Reload categories helper
  const reloadCategories = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const catRes = await menuCategoryService.getByRestaurant(restaurantId);
      if (!catRes.error && catRes.data) {
        setCategories(catRes.data);
      }
    } catch { /* silent */ }
  }, [restaurantId]);

  // Load products when restaurantId, search, category, or page changes
  const loadProducts = useCallback(() => {
    if (!restaurantId) return;
    searchProducts({
      restaurantId,
      filter: search.trim() || undefined,
      categoryId: selectedCategory || undefined,
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  }, [restaurantId, search, selectedCategory, currentPage, searchProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    loadProducts();
  };

  const handleCategoryFilter = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: IProductDto) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: IProductDto) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    const ok = await deleteProduct(deletingProduct.id);
    setIsDeleting(false);
    if (ok) {
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      loadProducts();
    }
  };

  const handleToggleVisibility = async (product: IProductDto) => {
    setTogglingId(product.id);
    try {
      const res = await productService.toggleVisibility({ id: product.id, isHidden: !product.isHidden });
      if (!res.error) {
        toast.success(product.isHidden ? 'Đã hiện sản phẩm' : 'Đã ẩn sản phẩm');
        loadProducts();
      } else {
        toast.error(res.message || 'Lỗi thay đổi trạng thái');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleStock = async (product: IProductDto) => {
    setTogglingId(product.id);
    const newStatus = product.stockStatus === 'InStock' ? 'OutOfStock' : 'InStock';
    try {
      const res = await productService.updateStockStatus({ id: product.id, stockStatus: newStatus });
      if (!res.error) {
        toast.success(newStatus === 'InStock' ? 'Đã mở bán lại' : 'Đã đánh dấu hết hàng');
        loadProducts();
      } else {
        toast.error(res.message || 'Lỗi cập nhật trạng thái kho');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Empty state ────────────────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
        <UtensilsCrossed className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Chưa có sản phẩm nào</h3>
      <p className="text-sm text-gray-500 mb-6">Bắt đầu thêm món ăn đầu tiên cho cửa hàng của bạn</p>
      <Button onClick={handleAdd}>
        <Plus className="w-5 h-5 mr-1" /> Thêm món mới
      </Button>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thực đơn</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thêm, sửa, xóa các món ăn của cửa hàng
            {total > 0 && <span className="ml-2 text-orange-600 font-medium">· {total} sản phẩm</span>}
          </p>
        </div>
        <Button className="shrink-0 shadow-lg shadow-orange-500/20" onClick={handleAdd}>
          <Plus className="w-5 h-5 mr-2" />
          Thêm món mới
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Tìm kiếm tên món ăn..."
            className="pl-10"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200">
          <EmptyState />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                    <th className="py-4 px-6 font-medium">Sản phẩm</th>
                    <th className="py-4 px-6 font-medium">Danh mục</th>
                    <th className="py-4 px-6 font-medium">Giá bán</th>
                    <th className="py-4 px-6 font-medium text-center">Kho</th>
                    <th className="py-4 px-6 font-medium text-center">Hiển thị</th>
                    <th className="py-4 px-6 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-orange-50/50 transition-colors group">
                      {/* Product info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                            {product.primaryImageUrl ? (
                              <img src={product.primaryImageUrl} alt={product.itemName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🍜</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.itemName}</p>
                            {product.description && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">{product.categoryName}</span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                        {product.price.toLocaleString('vi-VN')} đ
                      </td>

                      {/* Stock status */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleStock(product)}
                          disabled={togglingId === product.id}
                          className="inline-block cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                          title="Nhấn để thay đổi trạng thái kho"
                        >
                          {togglingId === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                          ) : (
                            <StockBadge status={product.stockStatus} />
                          )}
                        </button>
                      </td>

                      {/* Visibility */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleVisibility(product)}
                          disabled={togglingId === product.id}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            product.isHidden
                              ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={product.isHidden ? 'Sản phẩm đang ẩn — nhấn để hiện' : 'Sản phẩm đang hiện — nhấn để ẩn'}
                        >
                          {product.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Pagination footer */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Hiển thị {Math.min((currentPage - 1) * PAGE_SIZE + 1, total)} – {Math.min(currentPage * PAGE_SIZE, total)} trong số {total} món
              </span>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        </>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingProduct(null); }}
        product={editingProduct}
        restaurantId={restaurantId}
        categories={categories.map(c => ({ id: c.id, title: c.title }))}
        onSaved={loadProducts}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeletingProduct(null); }}
        product={deletingProduct}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
