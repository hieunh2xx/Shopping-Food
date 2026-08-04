import { useState, useEffect } from 'react';
import { Card, Loading, Pagination } from '../../components/common';
import { userService } from '../../services';
import { AlertCircle, Store, XCircle, FileText, ChevronRight, Upload } from 'lucide-react';

import toast from 'react-hot-toast';
import { Modal, Input, Button } from '../../components/common';
import { authService } from '../../services/AuthService';
import { notificationRealtimeService } from '../../services/NotificationRealtimeService';

export function SellerMallApplicationPage() {

  const [loading, setLoading] = useState(true);
  const [mallApps, setMallApps] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const limit = 5;

  // Update modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatingApp, setUpdatingApp] = useState<any | null>(null);
  
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [businessLicenseUrl, setBusinessLicenseUrl] = useState('');
  const [shopImageUrl, setShopImageUrl] = useState('');
  
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingShop, setIsUploadingShop] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await userService.getMyApplications();
      if (!res.error && res.data) {
        const sellers = res.data.sellerApplications || [];
        const upgradeApps = sellers.filter((app: any) => app.type === 'UpgradeToMall');
        setMallApps(upgradeApps);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể lấy thông tin đăng ký lên Mall');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    
    const handleNotification = () => {
      fetchApplications();
    };

    notificationRealtimeService.onNotification(handleNotification);
    return () => {
      notificationRealtimeService.offNotification(handleNotification);
    };
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'NeedsInfo': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending': return 'Đang chờ duyệt';
      case 'NeedsInfo': return 'Cần bổ sung';
      case 'Approved': return 'Đã được duyệt';
      case 'Rejected': return 'Bị từ chối';
      default: return status;
    }
  };

  const isValidUrl = (url: string | undefined | null) => {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/');
  };

  const openUpdateModal = (app: any) => {
    setUpdatingApp(app);
    setBusinessName(app.businessName || '');
    setBusinessAddress(app.businessAddress || '');
    setContactInfo(app.contactInfo || '');
    setBusinessLicenseUrl(isValidUrl(app.businessLicenseUrl) ? app.businessLicenseUrl : '');
    setShopImageUrl(isValidUrl(app.shopImageUrl) ? app.shopImageUrl : '');
    setIsUpdateModalOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'shop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'license') setIsUploadingLicense(true);
    else setIsUploadingShop(true);

    try {
      const res = await authService.uploadImage(file);
      if (!res.error && res.data?.imageUrl) {
        if (type === 'license') setBusinessLicenseUrl(res.data.imageUrl);
        else setShopImageUrl(res.data.imageUrl);
        toast.success('Tải ảnh lên thành công!');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi kết nối khi tải ảnh');
    } finally {
      if (type === 'license') setIsUploadingLicense(false);
      else setIsUploadingShop(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingApp) return;

    if (!businessName || !businessAddress || !contactInfo || !businessLicenseUrl || !shopImageUrl) {
      toast.error('Vui lòng điền đầy đủ thông tin và tải lên các ảnh yêu cầu.');
      return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        id: updatingApp.id,
        businessName,
        businessAddress,
        contactInfo,
        businessLicenseUrl,
        shopImageUrl
      };
      
      const res = await userService.updateSellerApplication(payload);
      if (!res.error) {
        toast.success('Cập nhật và gửi lại đơn thành công!');
        setIsUpdateModalOpen(false);
        fetchApplications();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <Loading />;

  // Pagination calculations
  const totalItems = mallApps.length;
  const startIndex = (page - 1) * limit;
  const currentApps = mallApps.slice(startIndex, startIndex + limit);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử đăng ký lên Mall</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi trạng thái xét duyệt các yêu cầu trở thành đối tác Mall</p>
        </div>
      </div>

      {mallApps.length === 0 ? (
        <Card className="p-12 text-center bg-white border border-gray-100 flex flex-col items-center justify-center">
          <Store className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa có yêu cầu nào</h3>
          <p className="text-sm text-gray-500">Bạn chưa gửi yêu cầu đăng ký lên Mall nào hoặc yêu cầu không tồn tại.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentApps.map((app) => (
            <Card key={app.id} className="p-0 overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-start justify-between bg-gray-50/50 p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      Đơn đăng ký #{app.id?.substring(0, 8).toUpperCase()}
                      <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">Lên Mall</span>
                    </h3>
                    <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4" /> Ngày gửi: {new Date(app.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${getStatusColor(app.status)}`}>
                  {getStatusText(app.status)}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 text-sm mb-6">
                  <div>
                    <span className="block text-gray-500 mb-1">Tên cửa hàng</span>
                    <span className="font-semibold text-gray-900 text-base">{app.businessName}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">Thông tin liên hệ</span>
                    <span className="font-semibold text-gray-900 text-base">{app.contactInfo}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-gray-500 mb-1">Địa chỉ</span>
                    <span className="font-semibold text-gray-900 text-base">{app.businessAddress}</span>
                  </div>
                </div>

                {(app.status === 'NeedsInfo' || app.status === 'Rejected') && app.rejectionReason && (
                  <div className={`p-4 rounded-xl flex gap-3 ${
                    app.status === 'NeedsInfo' ? 'bg-orange-50 text-orange-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {app.status === 'NeedsInfo' ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold mb-1 text-sm">
                        {app.status === 'NeedsInfo' ? 'Yêu cầu từ Quản trị viên:' : 'Lý do từ chối:'}
                      </p>
                      <p className="text-sm opacity-90">{app.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {app.status === 'NeedsInfo' && (
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => openUpdateModal(app)}
                      className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                      Bổ sung thông tin
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {totalItems > limit && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(totalItems / limit)}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Update Application Modal */}
      <Modal 
        isOpen={isUpdateModalOpen} 
        onClose={() => !isUpdating && setIsUpdateModalOpen(false)} 
        title="Bổ sung thông tin đơn đăng ký" 
        size="lg"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-5">
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl flex gap-3 text-sm border border-orange-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Vui lòng cập nhật đầy đủ thông tin bên dưới để Admin có thể xét duyệt lại yêu cầu của bạn.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên cửa hàng <span className="text-red-500">*</span></label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nhập tên cửa hàng..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Thông tin liên hệ (SĐT) <span className="text-red-500">*</span></label>
              <Input
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Số điện thoại liên hệ..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ kinh doanh <span className="text-red-500">*</span></label>
            <Input
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Địa chỉ cụ thể..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Business License Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giấy phép kinh doanh <span className="text-red-500">*</span></label>
              <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50 flex items-center justify-center overflow-hidden transition-colors">
                {businessLicenseUrl && (businessLicenseUrl.startsWith('http') || businessLicenseUrl.startsWith('data:') || businessLicenseUrl.startsWith('blob:') || businessLicenseUrl.startsWith('/')) ? (
                  <img src={businessLicenseUrl} alt="Giấy phép kinh doanh" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Nhấn để tải lên giấy phép</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleUploadImage(e, 'license')}
                  disabled={isUploadingLicense || isUpdating}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                {isUploadingLicense && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">Đang tải...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shop Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh mặt tiền quán <span className="text-red-500">*</span></label>
              <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50 flex items-center justify-center overflow-hidden transition-colors">
                {shopImageUrl && (shopImageUrl.startsWith('http') || shopImageUrl.startsWith('data:') || shopImageUrl.startsWith('blob:') || shopImageUrl.startsWith('/')) ? (
                  <img src={shopImageUrl} alt="Hình ảnh mặt tiền quán" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Nhấn để tải lên hình mặt tiền</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleUploadImage(e, 'shop')}
                  disabled={isUploadingShop || isUpdating}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                {isUploadingShop && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">Đang tải...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsUpdateModalOpen(false)} disabled={isUpdating}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isUpdating} disabled={isUpdating}>
              Gửi lại yêu cầu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
