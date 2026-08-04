import React, { useState, useEffect } from 'react';
import { Store, Bike, AlertCircle, FileText, XCircle } from 'lucide-react';
import { userService } from '../../services';
import { Button, Modal, Loading } from '../common';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/AuthService';
import { Input } from '../common';
import { ChevronRight, Upload } from 'lucide-react';
import { notificationRealtimeService } from '../../services/NotificationRealtimeService';

export function CustomerApplications() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  // Update Modal State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatingApp, setUpdatingApp] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form State (Unified)
  const [formData, setFormData] = useState<any>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await userService.getMyApplications();
      if (!res.error && res.data) {
        // Combine seller and shipper applications
        const sellers = (res.data.sellerApplications || []).map((app: any) => ({ ...app, appType: 'Seller' }));
        const shippers = (res.data.shipperApplications || []).map((app: any) => ({ ...app, appType: 'Shipper' }));
        const combined = [...sellers, ...shippers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setApplications(combined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    const handleNotification = () => {
      // Whenever there's a notification, fetch again to get latest status
      fetchApplications();
    };

    notificationRealtimeService.onNotification(handleNotification);
    return () => {
      notificationRealtimeService.offNotification(handleNotification);
    };
  }, []);

  const isValidUrl = (url: string | undefined | null) => {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/');
  };

  const openUpdateModal = (app: any) => {
    setUpdatingApp(app);
    if (app.appType === 'Seller') {
      setFormData({
        businessName: app.businessName || '',
        businessAddress: app.businessAddress || '',
        contactInfo: app.contactInfo || '',
        businessLicenseUrl: isValidUrl(app.businessLicenseUrl) ? app.businessLicenseUrl : '',
        shopImageUrl: isValidUrl(app.shopImageUrl) ? app.shopImageUrl : ''
      });
    } else {
      setFormData({
        identityCardNumber: app.identityCardNumber || '',
        vehicleType: app.vehicleType || 'Motorcycle',
        vehiclePlateNumber: app.vehiclePlateNumber || '',
        identityCardFrontUrl: isValidUrl(app.identityCardFrontUrl) ? app.identityCardFrontUrl : '',
        identityCardBackUrl: isValidUrl(app.identityCardBackUrl) ? app.identityCardBackUrl : '',
        driverLicenseUrl: isValidUrl(app.driverLicenseUrl) ? app.driverLicenseUrl : '',
        vehicleRegistrationUrl: isValidUrl(app.vehicleRegistrationUrl) ? app.vehicleRegistrationUrl : ''
      });
    }
    setIsUpdateModalOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      const res = await authService.uploadImage(file);
      if (!res.error && res.data?.imageUrl) {
        setFormData((prev: any) => ({ ...prev, [fieldName]: res.data.imageUrl }));
        toast.success('Tải ảnh lên thành công!');
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi kết nối khi tải ảnh');
    } finally {
      setUploadingField(null);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingApp) return;

    setIsUpdating(true);
    try {
      let res;
      if (updatingApp.appType === 'Seller') {
        const payload = {
          id: updatingApp.id,
          ...formData
        };
        res = await userService.updateSellerApplication(payload);
      } else {
        const payload = {
          id: updatingApp.id,
          ...formData
        };
        res = await userService.updateShipperApplication(payload);
      }

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
      case 'Approved': return 'Đã phê duyệt';
      case 'Rejected': return 'Bị từ chối';
      default: return status;
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>Bạn chưa có yêu cầu đăng ký nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="border border-gray-200 rounded-2xl p-5 hover:border-orange-300 transition-all bg-white relative overflow-hidden">
          {app.status === 'NeedsInfo' && (
            <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-bl-xl font-medium border-l border-b border-orange-200 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Chú ý
            </div>
          )}
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.appType === 'Seller' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {app.appType === 'Seller' ? <Store className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {app.appType === 'Seller' ? 'Đăng ký bán hàng' : 'Đăng ký giao hàng'}
                  {app.type === 'UpgradeToMall' && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Lên Mall</span>}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(app.createdAt).toLocaleDateString('vi-VN', {
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getStatusColor(app.status)}`}>
              {getStatusText(app.status)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
            {app.appType === 'Seller' ? (
              <>
                <div><span className="text-gray-500">Tên cửa hàng:</span> <span className="font-medium text-gray-900">{app.businessName}</span></div>
                <div><span className="text-gray-500">Liên hệ:</span> <span className="font-medium text-gray-900">{app.contactInfo}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Địa chỉ:</span> <span className="font-medium text-gray-900">{app.businessAddress}</span></div>
              </>
            ) : (
              <>
                <div><span className="text-gray-500">Họ tên:</span> <span className="font-medium text-gray-900">{app.fullName}</span></div>
                <div><span className="text-gray-500">Biển số xe:</span> <span className="font-medium text-gray-900">{app.vehiclePlateNumber}</span></div>
                <div><span className="text-gray-500">Loại xe:</span> <span className="font-medium text-gray-900">{app.vehicleType === 'Motorcycle' ? 'Xe máy' : app.vehicleType === 'ElectricMotorbike' ? 'Xe điện' : 'Ô tô'}</span></div>
                <div><span className="text-gray-500">CMND/CCCD:</span> <span className="font-medium text-gray-900">{app.identityCardNumber}</span></div>
              </>
            )}
          </div>

          {(app.status === 'NeedsInfo' || app.status === 'Rejected') && app.rejectionReason && (
            <div className={`mt-4 p-4 rounded-xl text-sm border flex gap-3 ${app.status === 'NeedsInfo' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <div className="shrink-0 mt-0.5">
                {app.status === 'NeedsInfo' ? <AlertCircle className="w-5 h-5 text-orange-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              </div>
              <div>
                <p className="font-bold">{app.status === 'NeedsInfo' ? 'Yêu cầu từ quản trị viên:' : 'Lý do từ chối:'}</p>
                <p className="mt-1 whitespace-pre-line">{app.rejectionReason}</p>
              </div>
            </div>
          )}

          {app.status === 'NeedsInfo' && (
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => openUpdateModal(app)}
                variant="primary"
                className="!py-2 flex items-center gap-2"
              >
                Bổ sung thông tin
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Update Application Modal */}
      <Modal 
        isOpen={isUpdateModalOpen} 
        onClose={() => !isUpdating && setIsUpdateModalOpen(false)} 
        title={`Bổ sung thông tin - ${updatingApp?.appType === 'Seller' ? 'Đăng ký Bán hàng' : 'Đăng ký Giao hàng'}`}
        size="lg"
      >
        {updatingApp && (
          <form onSubmit={handleUpdateSubmit} className="space-y-5">
            <div className="bg-orange-50 text-orange-800 p-4 rounded-xl flex gap-3 text-sm border border-orange-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Vui lòng cập nhật đầy đủ thông tin bên dưới để Admin có thể xét duyệt lại yêu cầu của bạn.</p>
            </div>

            {updatingApp.appType === 'Seller' ? (
              // Seller Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên cửa hàng <span className="text-red-500">*</span></label>
                    <Input
                      value={formData.businessName || ''}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">SĐT liên hệ <span className="text-red-500">*</span></label>
                    <Input
                      value={formData.contactInfo || ''}
                      onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ kinh doanh <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.businessAddress || ''}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {[
                    { field: 'businessLicenseUrl', label: 'Giấy phép kinh doanh' },
                    { field: 'shopImageUrl', label: 'Hình ảnh mặt tiền quán' }
                  ].map(({ field, label }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{label} <span className="text-red-500">*</span></label>
                      <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50 flex items-center justify-center overflow-hidden transition-colors">
                        {formData[field] && (formData[field].startsWith('http') || formData[field].startsWith('data:') || formData[field].startsWith('blob:') || formData[field].startsWith('/')) ? (
                          <img src={formData[field]} alt={label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Nhấn để tải lên</p>
                          </div>
                        )}
                        <input 
                          type="file" accept="image/*" required={!formData[field]}
                          onChange={(e) => handleUploadImage(e, field)}
                          disabled={uploadingField === field || isUpdating}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        {uploadingField === field && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">Đang tải...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Shipper Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">CCCD/CMND <span className="text-red-500">*</span></label>
                    <Input
                      value={formData.identityCardNumber || ''}
                      onChange={(e) => setFormData({ ...formData, identityCardNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại xe <span className="text-red-500">*</span></label>
                    <select
                      value={formData.vehicleType || 'Motorcycle'}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white outline-none transition-all"
                    >
                      <option value="Motorcycle">Xe máy</option>
                      <option value="ElectricMotorbike">Xe điện</option>
                      <option value="Car">Ô tô</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Biển số xe <span className="text-red-500">*</span></label>
                    <Input
                      value={formData.vehiclePlateNumber || ''}
                      onChange={(e) => setFormData({ ...formData, vehiclePlateNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  {[
                    { field: 'identityCardFrontUrl', label: 'CCCD (Mặt trước)' },
                    { field: 'identityCardBackUrl', label: 'CCCD (Mặt sau)' },
                    { field: 'driverLicenseUrl', label: 'Bằng lái xe' },
                    { field: 'vehicleRegistrationUrl', label: 'Giấy tờ xe' }
                  ].map(({ field, label }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{label} <span className="text-red-500">*</span></label>
                      <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50 flex items-center justify-center overflow-hidden transition-colors">
                        {formData[field] && (formData[field].startsWith('http') || formData[field].startsWith('data:') || formData[field].startsWith('blob:') || formData[field].startsWith('/')) ? (
                          <img src={formData[field]} alt={label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Tải lên</p>
                          </div>
                        )}
                        <input 
                          type="file" accept="image/*" required={!formData[field]}
                          onChange={(e) => handleUploadImage(e, field)}
                          disabled={uploadingField === field || isUpdating}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        {uploadingField === field && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">Đang tải...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
              <Button type="button" variant="secondary" onClick={() => setIsUpdateModalOpen(false)} disabled={isUpdating}>
                Hủy
              </Button>
              <Button type="submit" isLoading={isUpdating} disabled={isUpdating}>
                Gửi lại yêu cầu
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
