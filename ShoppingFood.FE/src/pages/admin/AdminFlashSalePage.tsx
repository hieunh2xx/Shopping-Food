import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Zap, CheckCircle2, XCircle, Package } from 'lucide-react';
import { flashSaleService } from '../../services/FlashSaleService';
import type { IFlashSale, ICreateFlashSaleRequest, IFlashSaleProduct } from '../../interfaces';
import { Button, Input, Modal, PromptModal } from '../../components/common';
import { formatDate } from '../../utils/formatters';

export function AdminFlashSalePage() {
  const [flashSales, setFlashSales] = useState<IFlashSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ICreateFlashSaleRequest>({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  // Review Products Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState<IFlashSale | null>(null);
  const [flashSaleProducts, setFlashSaleProducts] = useState<IFlashSaleProduct[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingProductId, setRejectingProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      const res = await flashSaleService.getAllFlashSales();
      if (!res.error && res.data) {
        setFlashSales(res.data);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách Flash Sale');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      startDate: '',
      endDate: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (sale: IFlashSale) => {
    setEditingId(sale.id);
    setFormData({
      title: sale.title,
      startDate: sale.startDate.slice(0, 16),
      endDate: sale.endDate.slice(0, 16),
      description: sale.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    try {
      if (editingId) {
        const res = await flashSaleService.updateFlashSale(editingId, formData);
        if (!res.error) {
          toast.success('Cập nhật chương trình Flash Sale thành công!');
          setIsModalOpen(false);
          fetchFlashSales();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await flashSaleService.createFlashSale(formData);
        if (!res.error) {
          toast.success('Tạo sự kiện Flash Sale thành công!');
          setIsModalOpen(false);
          fetchFlashSales();
        } else {
          toast.error(res.message);
        }
      }
    } catch (error) {
      toast.error('Lỗi hệ thống khi lưu Flash Sale');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương trình này?')) return;
    
    try {
      const res = await flashSaleService.deleteFlashSale(id);
      if (!res.error) {
        toast.success('Đã xóa thành công');
        fetchFlashSales();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Lỗi hệ thống khi xóa');
    }
  };

  const handleOpenReviewModal = async (sale: IFlashSale) => {
    setSelectedFlashSale(sale);
    setIsReviewModalOpen(true);
    setIsReviewing(true);
    try {
      const res = await flashSaleService.getFlashSaleProducts(sale.id);
      if (!res.error && res.data) {
        setFlashSaleProducts(res.data.data);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReviewProduct = async (productId: string, isApproved: boolean, rejectionReason?: string) => {
    try {
      const res = await flashSaleService.reviewFlashSaleProduct({
        flashSaleProductId: productId,
        isApproved,
        rejectionReason
      });
      if (!res.error) {
        toast.success(isApproved ? 'Đã duyệt sản phẩm' : 'Đã từ chối sản phẩm');
        // Refresh product list
        if (selectedFlashSale) {
          const productsRes = await flashSaleService.getFlashSaleProducts(selectedFlashSale.id);
          if (!productsRes.error && productsRes.data) {
            setFlashSaleProducts(productsRes.data.data);
          }
        }
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Cấu hình Flash Sale
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các chương trình Flash Sale giờ vàng</p>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo chương trình mới
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Tên chương trình</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Thời gian bắt đầu</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Thời gian kết thúc</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : flashSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Chưa có chương trình Flash Sale nào</td>
                </tr>
              ) : (
                flashSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{sale.title}</td>
                    <td className="p-4 text-gray-600">{formatDate(sale.startDate)}</td>
                    <td className="p-4 text-gray-600">{formatDate(sale.endDate)}</td>
                    <td className="p-4">
                      {(() => {
                        const now = new Date().getTime();
                        const start = new Date(sale.startDate).getTime();
                        const end = new Date(sale.endDate).getTime();
                        
                        let dynamicStatus = sale.status;
                        if (now > end) dynamicStatus = 'Ended';
                        else if (now >= start && now <= end) dynamicStatus = 'Active';
                        else if (now < start) dynamicStatus = 'Pending';

                        return (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            dynamicStatus === 'Active' ? 'bg-green-100 text-green-700' :
                            dynamicStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {dynamicStatus === 'Active' ? 'Đang diễn ra' : 
                             dynamicStatus === 'Pending' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenReviewModal(sale)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1"
                          title="Duyệt sản phẩm"
                        >
                          <Package className="w-4 h-4" />
                          <span className="text-xs font-medium">Duyệt SP</span>
                        </button>
                        <button
                          onClick={() => handleEdit(sale)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Cập nhật chương trình Flash Sale" : "Tạo chương trình Flash Sale"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Flash Sale Giờ Vàng"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="!pr-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="!pr-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chương trình..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? "Cập nhật" : "Tạo chương trình"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Duyệt sản phẩm - ${selectedFlashSale?.title}`}
      >
        <div className="space-y-4">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3 text-sm font-semibold text-gray-600">Sản phẩm</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Giá Flash Sale</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Số lượng</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Trạng thái</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isReviewing ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Đang tải...</td>
                  </tr>
                ) : flashSaleProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Chưa có sản phẩm đăng ký</td>
                  </tr>
                ) : (
                  flashSaleProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-gray-900 line-clamp-2">{p.productName}</div>
                        <div className="text-xs text-gray-500">{p.restaurantName}</div>
                        <div className="text-xs text-gray-400 line-through mt-1">{p.originalPrice.toLocaleString()}đ</div>
                      </td>
                      <td className="p-3 font-medium text-orange-600">{p.flashSalePrice.toLocaleString()}đ</td>
                      <td className="p-3 text-gray-600">
                        {p.soldQuantity} / {p.quantityLimit}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          p.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          p.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.status === 'Approved' ? 'Đã duyệt' : 
                           p.status === 'Rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                        </span>
                        {p.status === 'Rejected' && p.rejectReason && (
                          <div className="text-[10px] text-red-500 mt-1 max-w-[120px] truncate" title={p.rejectReason}>
                            Lý do: {p.rejectReason}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {p.status === 'Pending' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleReviewProduct(p.id, true)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Duyệt"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setRejectingProductId(p.id);
                                setIsRejectModalOpen(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Từ chối"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Product Prompt Modal */}
      <PromptModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectingProductId(null);
        }}
        onConfirm={(reason) => {
          if (rejectingProductId) {
            handleReviewProduct(rejectingProductId, false, reason);
          }
          setIsRejectModalOpen(false);
          setRejectingProductId(null);
        }}
        title="Từ chối sản phẩm"
        description="Vui lòng cung cấp lý do từ chối sản phẩm này khỏi Flash Sale."
        placeholder="Nhập lý do từ chối..."
        confirmLabel="Từ chối"
        confirmVariant="danger"
      />
    </div>
  );
}
