import { useState, useEffect } from 'react';
import { Button, Loading } from '../../components/common';
import { Save, FileText, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/AdminService';
import { supportService } from '../../services/SupportService';
import toast from 'react-hot-toast';

/**
 * Trang Cài Đặt Điều Khoản & Chính Sách Pháp Lý (AdminLegalSettingsPage).
 * Cho phép quản trị viên soạn thảo và cập nhật các văn bản quy định hệ thống:
 * - Điều khoản sử dụng dành cho Khách hàng
 * - Điều khoản sử dụng dành cho Người bán
 * - Điều khoản sử dụng dành cho Tài xế
 * - Chính sách bảo mật thông tin cá nhân.
 */
export function AdminLegalSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [termsOfUseCustomer, setTermsOfUseCustomer] = useState('');

  const [termsOfUseSeller, setTermsOfUseSeller] = useState('');
  const [termsOfUseShipper, setTermsOfUseShipper] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await supportService.getLegalSettings();
      if (!response.error && response.data) {
        setTermsOfUseCustomer(response.data.termsOfUseCustomer || '');
        setTermsOfUseSeller(response.data.termsOfUseSeller || '');
        setTermsOfUseShipper(response.data.termsOfUseShipper || '');
        setPrivacyPolicy(response.data.privacyPolicy || '');
      }
    } catch (error) {
      toast.error('Lỗi khi tải cấu hình pháp lý');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await adminService.updateLegalSettings({
        termsOfUseCustomer,
        termsOfUseSeller,
        termsOfUseShipper,
        privacyPolicy
      });
      if (!response.error) {
        toast.success('Cập nhật chính sách thành công!');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu thay đổi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cấu hình Chính sách & Điều khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý nội dung pháp lý của hệ thống</p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Điều khoản sử dụng (Khách hàng)</h2>
              <p className="text-sm text-gray-500">Nội dung hiển thị tại trang đăng ký Khách hàng.</p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow resize-y"
              value={termsOfUseCustomer}
              onChange={(e) => setTermsOfUseCustomer(e.target.value)}
              placeholder="<h1>Điều khoản Khách hàng</h1><p>Nội dung...</p>"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Điều khoản sử dụng (Người bán)</h2>
              <p className="text-sm text-gray-500">Nội dung hiển thị tại trang đăng ký Đối tác bán hàng.</p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow resize-y"
              value={termsOfUseSeller}
              onChange={(e) => setTermsOfUseSeller(e.target.value)}
              placeholder="<h1>Điều khoản Đối tác bán hàng</h1><p>Nội dung...</p>"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Điều khoản sử dụng (Tài xế)</h2>
              <p className="text-sm text-gray-500">Nội dung hiển thị tại trang đăng ký Đối tác giao hàng.</p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow resize-y"
              value={termsOfUseShipper}
              onChange={(e) => setTermsOfUseShipper(e.target.value)}
              placeholder="<h1>Điều khoản Đối tác giao hàng</h1><p>Nội dung...</p>"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Chính sách bảo mật</h2>
              <p className="text-sm text-gray-500">Nội dung hiển thị tại trang Chính sách bảo mật. Hỗ trợ HTML.</p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow resize-y"
              value={privacyPolicy}
              onChange={(e) => setPrivacyPolicy(e.target.value)}
              placeholder="<h1>Chính sách bảo mật</h1><p>Nội dung...</p>"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
