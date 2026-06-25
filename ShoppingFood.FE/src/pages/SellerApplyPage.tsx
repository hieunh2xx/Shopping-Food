import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { toast } from 'react-hot-toast';
import { ROUTES } from '../routes/routeConfig';
import { Store, MapPin, Phone, FileText, Image as ImageIcon } from 'lucide-react';

export function SellerApplyPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    contactInfo: ''
  });
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [shopImageFile, setShopImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessLicenseFile) {
      toast.error('Vui lòng tải lên giấy phép kinh doanh');
      return;
    }
    if (!shopImageFile) {
      toast.error('Vui lòng tải lên logo/ảnh đại diện cửa hàng');
      return;
    }

    const allowedLicenseExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
    const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    const licenseExt = businessLicenseFile.name.substring(businessLicenseFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedLicenseExtensions.includes(licenseExt)) {
      toast.error('Giấy phép kinh doanh phải là tệp ảnh hoặc tài liệu (.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx).');
      return;
    }
    if (businessLicenseFile.size > 5 * 1024 * 1024) {
      toast.error('Giấy phép kinh doanh không được vượt quá 5MB');
      return;
    }

    const shopExt = shopImageFile.name.substring(shopImageFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedImageExtensions.includes(shopExt)) {
      toast.error('Logo/ảnh đại diện cửa hàng phải là tệp ảnh (.jpg, .jpeg, .png, .webp).');
      return;
    }
    if (shopImageFile.size > 5 * 1024 * 1024) {
      toast.error('Logo/ảnh đại diện cửa hàng không được vượt quá 5MB');
      return;
    }

    setLoading(true);

    try {
      const licenseRes = await authService.uploadImage(businessLicenseFile);
      if (licenseRes.error || !licenseRes.data) throw new Error('Lỗi tải giấy phép kinh doanh');
      const licenseUrl = licenseRes.data.imageUrl;

      const shopImageRes = await authService.uploadImage(shopImageFile);
      if (shopImageRes.error || !shopImageRes.data) throw new Error('Lỗi tải logo cửa hàng');
      const shopUrl = shopImageRes.data.imageUrl;

      const res = await authService.applySeller({
        ...formData,
        businessLicenseUrl: licenseUrl,
        shopImageUrl: shopUrl
      });

      if (res.error) {
        toast.error(res.message || 'Có lỗi xảy ra');
      } else {
        toast.success('Đăng ký thành công! Vui lòng chờ phê duyệt.');
        navigate(ROUTES.PROFILE);
      }
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 mb-4">
            <Store className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký trở thành Người Bán</h1>
          <p className="mt-2 text-gray-500">Mở cửa hàng và bắt đầu kinh doanh trên Shopping Food</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên cửa hàng</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Store className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-50 border p-3 text-sm"
                placeholder="Nhập tên cửa hàng của bạn"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ cửa hàng</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={formData.businessAddress}
                onChange={e => setFormData({ ...formData, businessAddress: e.target.value })}
                className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-50 border p-3 text-sm"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại liên hệ</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={formData.contactInfo}
                onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
                className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-50 border p-3 text-sm"
                placeholder="Số điện thoại của cửa hàng"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giấy phép kinh doanh (Hình ảnh/PDF)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                required
                onChange={e => setBusinessLicenseFile(e.target.files?.[0] || null)}
                className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-50 border p-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo / Ảnh đại diện cửa hàng</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ImageIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="file"
                accept="image/*"
                required
                onChange={e => setShopImageFile(e.target.files?.[0] || null)}
                className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-50 border p-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
