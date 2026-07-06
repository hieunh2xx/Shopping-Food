import React, { useState, useEffect } from 'react';
import { Button, Loading } from '../../components/common';
import { Save, FileText, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/AdminService';
import { supportService } from '../../services/SupportService';
import toast from 'react-hot-toast';

export function AdminLegalSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [termsOfUse, setTermsOfUse] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await supportService.getLegalSettings();
      if (!response.error && response.data) {
        setTermsOfUse(response.data.termsOfUse || '');
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
        termsOfUse,
        privacyPolicy
      });
      if (!response.error) {
        toast.success('Cập nhật chính sách thành công!');
      } else {
        toast.error(response.message || 'Cập nhật thất bại');
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
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">Cấu hình Chính sách & Điều khoản</h1>
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
              <h2 className="text-lg font-bold text-gray-900">Điều khoản sử dụng</h2>
              <p className="text-sm text-gray-500">Nội dung hiển thị tại trang Điều khoản sử dụng. Hỗ trợ HTML.</p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow resize-y"
              value={termsOfUse}
              onChange={(e) => setTermsOfUse(e.target.value)}
              placeholder="<h1>Điều khoản sử dụng</h1><p>Nội dung...</p>"
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
