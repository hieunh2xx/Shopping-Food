import { useState, useEffect } from 'react';
import { adminService, productService } from '../../services';
import { Button, Loading, Modal } from '../../components/common';
import { AlertTriangle, CheckCircle, ShieldAlert, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminProductReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [moderateModal, setModerateModal] = useState({ isOpen: false, report: null as any });
  const [productModal, setProductModal] = useState({ isOpen: false, product: null as any, isLoading: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adminNote, setAdminNote] = useState('');
  const [hideProduct, setHideProduct] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getProductReports();
      if (!res.error && res.data) {
        setReports(res.data);
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProduct = async (productId: string) => {
    setProductModal({ isOpen: true, product: null, isLoading: true });
    try {
      const res = await productService.getById(productId);
      if (!res.error && res.data) {
        setProductModal({ isOpen: true, product: res.data, isLoading: false });
      } else {
        toast.error('Không thể tải thông tin sản phẩm');
        setProductModal({ isOpen: false, product: null, isLoading: false });
      }
    } catch (error) {
      toast.error('Lỗi khi tải thông tin sản phẩm');
      setProductModal({ isOpen: false, product: null, isLoading: false });
    }
  };

  const handleModerate = async (isApproved: boolean) => {
    if (!adminNote.trim()) {
      toast.error('Vui lòng nhập ghi chú xử lý (lý do)');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.moderateProductReport(moderateModal.report.id, {
        isApproved,
        hideProduct: isApproved ? hideProduct : false,
        adminNote
      });
      toast.success('Đã xử lý báo cáo thành công');
      setModerateModal({ isOpen: false, report: null });
      setAdminNote('');
      fetchReports();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (report: any) => {
    setModerateModal({ isOpen: true, report });
    setAdminNote('');
    setHideProduct(true);
  };

  if (isLoading) {
    return <Loading text="Đang tải danh sách báo cáo..." />;
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và xử lý các báo cáo vi phạm sản phẩm từ người dùng</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Người báo cáo</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Nội dung báo cáo</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Không có báo cáo vi phạm nào cần xử lý.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{report.reporterName || 'Ẩn danh'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <button 
                        onClick={() => handleViewProduct(report.targetId)}
                        className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:underline font-medium"
                        title="Xem chi tiết sản phẩm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        ID: {report.targetId?.substring(0, 8)}...
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {report.content}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => openModal(report)}>
                        <ShieldAlert className="w-4 h-4 mr-1.5" />
                        Xử lý
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={moderateModal.isOpen}
        onClose={() => !isSubmitting && setModerateModal({ isOpen: false, report: null })}
        title="Xử lý báo cáo sản phẩm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Chi tiết báo cáo:</h4>
            <p className="text-gray-600 text-sm">{moderateModal.report?.content}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú của Admin (Lý do xử lý) <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-orange-500 focus:border-orange-500 bg-white"
              rows={3}
              placeholder="Nhập lý do xử lý báo cáo này (Sẽ gửi cho chủ quán nếu sản phẩm bị ẩn)"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            ></textarea>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hideProduct"
              checked={hideProduct}
              onChange={(e) => setHideProduct(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="hideProduct" className="text-sm text-gray-700">
              Tự động ẩn sản phẩm nếu báo cáo hợp lệ
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => handleModerate(false)}
              disabled={isSubmitting}
              className="text-gray-600 hover:text-gray-900"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Bác bỏ (Báo cáo sai)
            </Button>
            <Button
              onClick={() => handleModerate(true)}
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Duyệt (Báo cáo đúng)
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={productModal.isOpen}
        onClose={() => setProductModal({ isOpen: false, product: null, isLoading: false })}
        title="Thông tin Sản phẩm"
      >
        {productModal.isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : productModal.product ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {productModal.product.primaryImageUrl ? (
                  <img src={productModal.product.primaryImageUrl} alt={productModal.product.itemName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-lg text-gray-900">{productModal.product.itemName}</h4>
                <p className="text-orange-600 font-bold mt-1">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(productModal.product.price)}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{productModal.product.categoryName}</span>
                </div>
              </div>
            </div>
            {productModal.product.description && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-1">Mô tả:</h5>
                <p className="text-sm text-gray-600">{productModal.product.description}</p>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <Button onClick={() => setProductModal({ isOpen: false, product: null, isLoading: false })}>Đóng</Button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">Không tìm thấy thông tin sản phẩm</div>
        )}
      </Modal>
    </div>
  );
}
