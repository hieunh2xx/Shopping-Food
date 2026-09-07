import { useState, useEffect } from 'react';
import { supportService } from '../../services/SupportService';
import { Loading } from '../../components/common';

/**
 * Trang Chính Sách Bảo Mật (PrivacyPolicyPage).
 * Hiển thị toàn văn các điều khoản chính sách bảo vệ thông tin và dữ liệu cá nhân của người dùng do ban quản trị cập nhật động từ hệ thống.
 */
export function PrivacyPolicyPage() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Tải nội dung văn bản chính sách bảo mật từ cài đặt pháp lý hệ thống.
     */
    const fetchContent = async () => {
      try {
        const response = await supportService.getLegalSettings();
        if (!response.error && response.data && response.data.privacyPolicy) {
          setContent(response.data.privacyPolicy);
        } else {
          // Văn bản dự phòng nếu chưa có
          setContent('<h2>Chính sách bảo mật</h2><p>Hệ thống đang cập nhật nội dung. Vui lòng quay lại sau.</p>');
        }
      } catch (error) {
        setContent('<h2>Chính sách bảo mật</h2><p>Lỗi khi tải nội dung. Vui lòng thử lại sau.</p>');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);


  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loading size="lg" />
          </div>
        ) : (
          <div
            className="prose prose-orange max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  );
}
