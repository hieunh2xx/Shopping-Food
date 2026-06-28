import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Store, Bike, UtensilsCrossed, CheckCircle, XCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { Button, Modal, Loading } from '../../components/common';
import { adminService, productService } from '../../services';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

type TabType = 'sellers' | 'shippers' | 'products';

export function AdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('sellers');
  const [isLoading, setIsLoading] = useState(true);

  // Lists
  const [sellers, setSellers] = useState<any[]>([]);
  const [shippers, setShippers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Action/Reason Modal state
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    targetTab: TabType;
    targetId: string;
    targetName: string;
  }>({
    isOpen: false,
    type: 'approve',
    targetTab: 'sellers',
    targetId: '',
    targetName: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo Viewer Modal
  const [photoModal, setPhotoModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'sellers') {
        const res = await adminService.getSellerApplications({ status: 'Pending' });
        if (!res.error && res.data) {
          setSellers(res.data);
        }
      } else if (activeTab === 'shippers') {
        const res = await adminService.getShipperApplications({ status: 'Pending' });
        if (!res.error && res.data) {
          setShippers(res.data);
        }
      } else if (activeTab === 'products') {
        const res = await productService.search({ status: 'Pending' });
        if (!res.error && res.data) {
          setProducts(res.data);
        }
      }
    } catch {
      toast.error('Không thể tải danh sách phê duyệt');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openActionModal = (type: 'approve' | 'reject', tab: TabType, id: string, name: string) => {
    setRejectionReason('');
    setActionModal({
      isOpen: true,
      type,
      targetTab: tab,
      targetId: id,
      targetName: name
    });
  };

  const handleActionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const { type, targetTab, targetId } = actionModal;
    const isApproved = type === 'approve';

    if (!isApproved && !rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsSubmitting(true);
    try {
      let res: any;
      if (targetTab === 'sellers') {
        res = await adminService.approveSellerApplication({
          applicationId: targetId,
          isApproved,
          rejectionReason: isApproved ? undefined : rejectionReason.trim()
        });
      } else if (targetTab === 'shippers') {
        res = await adminService.approveShipperApplication({
          applicationId: targetId,
          isApproved,
          rejectionReason: isApproved ? undefined : rejectionReason.trim()
        });
      } else if (targetTab === 'products') {
        res = await adminService.approveProduct({
          productId: targetId,
          isApproved,
          rejectionReason: isApproved ? undefined : rejectionReason.trim()
        });
      }

      if (!res.error) {
        toast.success(isApproved ? 'Đã phê duyệt thành công!' : 'Đã từ chối đơn đăng ký.');
        setActionModal(prev => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        toast.error(res.message || 'Thao tác thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra trong quá trình phê duyệt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPhoto = (url: string, title: string) => {
    setPhotoModal({ isOpen: true, url, title });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-orange-500" />
          Phê duyệt yêu cầu hệ thống
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Duyệt tài khoản đối tác Cửa hàng, Tài xế đăng ký mới và phê duyệt Món ăn mới được tải lên
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 bg-gray-50 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('sellers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'sellers'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Store className="w-4 h-4" />
          Cửa hàng ({sellers.length})
        </button>
        <button
          onClick={() => setActiveTab('shippers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'shippers'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <Bike className="w-4 h-4" />
          Tài xế ({shippers.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'products'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Món ăn mới ({products.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Tab 1: Sellers */}
          {activeTab === 'sellers' && (
            sellers.length === 0 ? (
              <div className="text-center py-16 text-gray-500">Chưa có hồ sơ cửa hàng nào chờ phê duyệt.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 font-medium">
                      <th className="py-4 px-6">Thông tin cá nhân</th>
                      <th className="py-4 px-6">Thông tin kinh doanh</th>
                      <th className="py-4 px-6 text-center">Giấy tờ & Hình ảnh</th>
                      <th className="py-4 px-6 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sellers.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{app.fullName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{app.email}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{app.phone}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-orange-600">{app.businessName}</div>
                          <div className="text-xs text-gray-600 mt-1 max-w-xs">{app.businessAddress}</div>
                          <div className="text-[11px] text-gray-400 mt-1 italic">{app.contactInfo}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-3">
                            {app.businessLicenseUrl && (
                              <button
                                onClick={() => viewPhoto(app.businessLicenseUrl, `GPKD: ${app.businessName}`)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" /> GPKD
                              </button>
                            )}
                            {app.shopImageUrl && (
                              <button
                                onClick={() => viewPhoto(app.shopImageUrl, `Ảnh quán: ${app.businessName}`)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                              >
                                <ImageIcon className="w-3.5 h-3.5" /> Mặt tiền
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openActionModal('approve', 'sellers', app.id, app.businessName)}
                              className="inline-flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" /> Duyệt
                            </button>
                            <button
                              onClick={() => openActionModal('reject', 'sellers', app.id, app.businessName)}
                              className="inline-flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                            >
                              <XCircle className="w-4 h-4 text-red-600" /> Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Tab 2: Shippers */}
          {activeTab === 'shippers' && (
            shippers.length === 0 ? (
              <div className="text-center py-16 text-gray-500">Chưa có hồ sơ tài xế nào chờ phê duyệt.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 font-medium">
                      <th className="py-4 px-6">Họ tên & Liên hệ</th>
                      <th className="py-4 px-6">Phương tiện vận chuyển</th>
                      <th className="py-4 px-6 text-center">CCCD & Bằng lái</th>
                      <th className="py-4 px-6 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shippers.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{app.fullName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{app.email}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{app.phone}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-800">Loại: {app.vehicleType}</div>
                          <div className="text-xs font-bold text-orange-600 mt-1">Biển số: {app.vehiclePlateNumber}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {app.identityCardFrontUrl && (
                              <button
                                onClick={() => viewPhoto(app.identityCardFrontUrl, `CCCD Mặt trước: ${app.fullName}`)}
                                className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200"
                              >
                                CCCD Trước
                              </button>
                            )}
                            {app.identityCardBackUrl && (
                              <button
                                onClick={() => viewPhoto(app.identityCardBackUrl, `CCCD Mặt sau: ${app.fullName}`)}
                                className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200"
                              >
                                CCCD Sau
                              </button>
                            )}
                            {app.driverLicenseUrl && (
                              <button
                                onClick={() => viewPhoto(app.driverLicenseUrl, `GPLX: ${app.fullName}`)}
                                className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100"
                              >
                                GPLX
                              </button>
                            )}
                            {app.vehicleRegistrationUrl && (
                              <button
                                onClick={() => viewPhoto(app.vehicleRegistrationUrl, `Đăng ký xe: ${app.fullName}`)}
                                className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded hover:bg-purple-100"
                              >
                                Cà vẹt xe
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openActionModal('approve', 'shippers', app.id, app.fullName)}
                              className="inline-flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" /> Duyệt
                            </button>
                            <button
                              onClick={() => openActionModal('reject', 'shippers', app.id, app.fullName)}
                              className="inline-flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                            >
                              <XCircle className="w-4 h-4 text-red-600" /> Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Tab 3: Products */}
          {activeTab === 'products' && (
            products.length === 0 ? (
              <div className="text-center py-16 text-gray-500">Chưa có món ăn nào chờ duyệt.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 font-medium">
                      <th className="py-4 px-6">Món ăn</th>
                      <th className="py-4 px-6">Cửa hàng đăng bán</th>
                      <th className="py-4 px-6">Đơn giá niêm yết</th>
                      <th className="py-4 px-6 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                              {prod.primaryImageUrl ? (
                                <img src={prod.primaryImageUrl} alt={prod.itemName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">🍜</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{prod.itemName}</div>
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xs">{prod.description || 'Không có mô tả.'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-700">
                          {prod.restaurantName || 'Chưa xác định'}
                        </td>
                        <td className="py-4 px-6 font-bold text-orange-600">
                          {formatCurrency(prod.price)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openActionModal('approve', 'products', prod.id, prod.itemName)}
                              className="inline-flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" /> Duyệt
                            </button>
                            <button
                              onClick={() => openActionModal('reject', 'products', prod.id, prod.itemName)}
                              className="inline-flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
                            >
                              <XCircle className="w-4 h-4 text-red-600" /> Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* Approval Confirm & Rejection Reason Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
        title={actionModal.type === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
        size="md"
      >
        <form onSubmit={handleActionConfirm} className="space-y-4">
          <div className="py-2 text-center sm:text-left">
            <p className="text-gray-700">
              Bạn đang chuẩn bị {actionModal.type === 'approve' ? 'phê duyệt' : 'từ chối'} hồ sơ/món ăn:
            </p>
            <p className="font-bold text-gray-900 text-lg mt-1">"{actionModal.targetName}"</p>
          </div>

          {actionModal.type === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do từ chối <span className="text-red-500">*</span></label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do từ chối đơn ứng tuyển/món ăn (VD: Giấy phép KD hết hạn, thông tin không trùng khớp...)"
                rows={3}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={actionModal.type === 'approve' ? 'primary' : 'danger'}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {actionModal.type === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Large Image Viewer Modal */}
      <Modal
        isOpen={photoModal.isOpen}
        onClose={() => setPhotoModal(prev => ({ ...prev, isOpen: false }))}
        title={photoModal.title}
        size="lg"
      >
        <div className="flex justify-center bg-gray-950 p-2 rounded-2xl overflow-hidden max-h-[80vh]">
          <img src={photoModal.url} alt={photoModal.title} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
        </div>
      </Modal>
    </div>
  );
}
