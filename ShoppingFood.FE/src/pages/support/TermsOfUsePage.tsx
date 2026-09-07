import { useState, useEffect } from 'react';
import { supportService } from '../../services/SupportService';
import { Loading } from '../../components/common';

/**
 * Trang Điều Khoản Sử Dụng (TermsOfUsePage).
 * Hiển thị toàn văn các quy định, quyền lợi và nghĩa vụ của khách hàng khi tham gia nền tảng.
 */
export function TermsOfUsePage() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Tải nội dung điều khoản sử dụng khách hàng từ máy chủ.
     */
    const fetchContent = async () => {
      try {
        const response = await supportService.getLegalSettings();
        if (!response.error && response.data && response.data.termsOfUseCustomer) {
          setContent(response.data.termsOfUseCustomer);
        } else {
          // Văn bản dự phòng nếu chưa có
          setContent('<h2>Điều khoản sử dụng</h2><p>Hệ thống đang cập nhật nội dung. Vui lòng quay lại sau.</p>');
        }
      } catch (error) {
        setContent('<h2>Điều khoản sử dụng</h2><p>Lỗi khi tải nội dung. Vui lòng thử lại sau.</p>');
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
