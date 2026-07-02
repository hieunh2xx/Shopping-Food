import { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';
import { Button, Loading, Modal } from '../../components/common';
import { productService } from '../../services';
import type { IProductReviewDto } from '../../interfaces';
import toast from 'react-hot-toast';

export function SellerReviewsPage() {
  const [reviews, setReviews] = useState<IProductReviewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [replyModal, setReplyModal] = useState({ isOpen: false, reviewId: '', content: '' });
  const [reportModal, setReportModal] = useState({ isOpen: false, reviewId: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getSellerReviews(0, 100);
      if (!res.error && res.data) {
        setReviews(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải danh sách đánh giá');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải đánh giá');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(r =>
    (r.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReplyReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModal.content.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await productService.replyReview(replyModal.reviewId, replyModal.content);
      if (!res.error) {
        toast.success('Gửi phản hồi thành công');
        setReplyModal({ isOpen: false, reviewId: '', content: '' });
        fetchReviews(); // reload to show updated reply
      } else {
        toast.error(res.message || 'Lỗi khi gửi phản hồi');
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModal.reason.trim()) {
      toast.error('Vui lòng nhập lý do báo cáo');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await productService.reportReview(reportModal.reviewId, reportModal.reason);
      if (!res.error) {
        toast.success('Báo cáo đánh giá thành công. Quản trị viên sẽ xem xét.');
        setReportModal({ isOpen: false, reviewId: '', reason: '' });
      } else {
        toast.error(res.message || 'Lỗi khi gửi báo cáo');
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  if (isLoading) {
    return <Loading text="Đang tải đánh giá..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đánh giá</h1>
          <p className="text-sm text-gray-500 mt-1">Xem phản hồi từ khách hàng và tương tác lại ({reviews.length} đánh giá)</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm đánh giá..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'Không tìm thấy đánh giá phù hợp.' : 'Chưa có đánh giá nào.'}
            </div>
          ) : (
            filteredReviews.map(review => (
              <div key={review.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {review.avatarUrl ? (
                        <img src={review.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <span className="text-orange-600 font-bold">{(review.userName || '?').charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{review.userName}</h3>
                        <p className="text-xs text-gray-500">Sản phẩm: <span className="font-medium text-gray-700">{review.productName}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 mb-2 ml-13">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                    </div>

                    <p className="text-sm text-gray-700 ml-13">{review.comment || '(Không có bình luận)'}</p>

                    {/* Seller Reply */}
                    {review.sellerReply && (
                      <div className="mt-3 ml-13 pl-4 border-l-2 border-orange-200">
                        <div className="bg-orange-50 rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-1 font-medium text-orange-800 mb-1">
                            Chủ quán <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-orange-900">{review.sellerReply}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {!review.sellerReply && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReplyModal({ isOpen: true, reviewId: review.id, content: '' })}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Trả lời
                      </Button>
                    )}
                    <button
                      onClick={() => setReportModal({ isOpen: true, reviewId: review.id, reason: '' })}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center justify-center py-1 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" /> Báo cáo vi phạm
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={replyModal.isOpen} onClose={() => setReplyModal(prev => ({ ...prev, isOpen: false }))} title="Trả lời đánh giá">
        <form onSubmit={handleReplyReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung trả lời</label>
            <textarea
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              rows={4}
              placeholder="Cảm ơn bạn đã ủng hộ..."
              value={replyModal.content}
              onChange={e => setReplyModal({ ...replyModal, content: e.target.value })}
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setReplyModal(prev => ({ ...prev, isOpen: false }))} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>Gửi câu trả lời</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={reportModal.isOpen} onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))} title="Báo cáo bình luận xấu">
        <form onSubmit={handleReportReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do báo cáo</label>
            <textarea
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              rows={3}
              placeholder="Spam, phỉ báng, chứa từ ngữ thô tục..."
              value={reportModal.reason}
              onChange={e => setReportModal({ ...reportModal, reason: e.target.value })}
            ></textarea>
            <p className="text-xs text-gray-500 mt-2">Bình luận này sẽ được gửi đến Quản trị viên để kiểm duyệt.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setReportModal(prev => ({ ...prev, isOpen: false }))} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" isLoading={isSubmitting} disabled={isSubmitting}>Gửi báo cáo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
