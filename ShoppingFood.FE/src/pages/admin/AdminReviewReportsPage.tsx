import { useState, useEffect } from 'react';
import { adminService } from '../../services/AdminService';
import { Button, Loading, Modal } from '../../components/common';
import { AlertTriangle, CheckCircle, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Trang Kiểm Duyệt Báo Cáo Đánh Giá & Bình Luận (AdminReviewReportsPage).
 * Tiếp nhận khiếu nại về các bình luận khiếm nhã, sai sự thật từ người dùng:
 * - Xem nội dung bình luận và lý do người dùng báo cáo
 * - Xử lý báo cáo: Bỏ qua (Dismiss), Xóa bình luận (DeleteReview), hoặc Cảnh cáo người dùng (WarnUser).
 */
export function AdminReviewReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [moderateModal, setModerateModal] = useState({ isOpen: false, reportId: '', reviewContent: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getReviewReports({ skip: 0, take: 100 });
      if (!res.error && res.data) {
        setReports(res.data.items || res.data); // Assuming paginated response or flat array
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (action: number) => {
    // action: 0 = Dismiss, 1 = DeleteReview, 2 = WarnUser
    setIsSubmitting(true);
    try {
      await adminService.moderateReviewReport(moderateModal.reportId, action);
      toast.success('Đã xử lý báo cáo thành công');
      setModerateModal({ isOpen: false, reportId: '', reviewContent: '', reason: '' });
      fetchReports();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading text="Đang tải danh sách báo cáo..." />;
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt Bình luận</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và xử lý các báo cáo vi phạm từ người dùng</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Người báo cáo</th>
                <th className="px-6 py-4">Lý do</th>
                <th className="px-6 py-4 w-1/3">Nội dung bình luận bị báo cáo</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Không có báo cáo vi phạm nào cần xử lý.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{report.reporterName || 'Ẩn danh'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {report.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 line-clamp-2" title={report.reviewContent}>
                      {report.reviewContent || 'Nội dung bình luận...'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'Pending' ? (
                        <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md text-xs font-medium">Chờ xử lý</span>
                      ) : (
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium">Đã xử lý</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.status === 'Pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setModerateModal({ 
                            isOpen: true, 
                            reportId: report.id, 
                            reviewContent: report.reviewContent || 'Nội dung bình luận...',
                            reason: report.reason 
                          })}
                        >
                          <Eye className="w-4 h-4 mr-1.5" /> Xử lý
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={moderateModal.isOpen} onClose={() => setModerateModal(prev => ({ ...prev, isOpen: false }))} title="Xử lý báo cáo vi phạm" size="lg">
        <div className="space-y-6">
          <div className="bg-rose-50 p-4 rounded-xl">
            <h4 className="text-sm font-semibold text-rose-800 mb-1">Lý do báo cáo:</h4>
            <p className="text-rose-700 text-sm">{moderateModal.reason}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Nội dung bình luận:</h4>
            <p className="text-gray-700 text-sm italic">"{moderateModal.reviewContent}"</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Quyết định xử lý:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => handleModerate(0)} 
                disabled={isSubmitting}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200 focus:outline-none"
              >
                <CheckCircle className="w-6 h-6 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Bỏ qua báo cáo</span>
                <span className="text-xs text-gray-400 text-center">Bình luận hợp lệ, không vi phạm</span>
              </button>
              
              <button 
                onClick={() => handleModerate(1)} 
                disabled={isSubmitting}
                className="flex flex-col items-center gap-2 p-4 border border-rose-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-colors focus:ring-2 focus:ring-rose-200 focus:outline-none bg-rose-50/30"
              >
                <Trash2 className="w-6 h-6 text-rose-500" />
                <span className="text-sm font-medium text-rose-700">Xóa bình luận</span>
                <span className="text-xs text-rose-500/70 text-center">Gỡ bỏ bình luận này khỏi hệ thống</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
