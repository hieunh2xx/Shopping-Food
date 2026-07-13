import { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button, Modal } from '../common';
import { useAuth } from '../../hooks';
import { productService } from '../../services';
import type { IProductReviewDto } from '../../interfaces';
import toast from 'react-hot-toast';

export function ProductReviews({ productId, restaurantId }: { productId: string; restaurantId?: string }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<IProductReviewDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Report Modal states
  const [reportModal, setReportModal] = useState({ isOpen: false, reviewId: '', reason: '' });
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getProductReviews(productId);
      if (!res.error && res.data) {
        setReviews(res.data);
      }
    } catch {
      // silently fail — reviews are non-critical
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const res = await productService.reviewProduct({ productId, rating, comment });
      if (!res.error) {
        toast.success('Đánh giá của bạn đã được gửi!');
        setComment('');
        setRating(5);
        fetchReviews(); // reload
      } else {
        toast.error(res.message || 'Lỗi khi gửi đánh giá');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gửi đánh giá thất bại do lỗi mạng.');
    }
  };

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyContent.trim()) return;

    try {
      const res = await productService.replyReview(reviewId, replyContent);
      if (!res.error) {
        toast.success('Phản hồi đã được gửi');
        setReplyingTo(null);
        setReplyContent('');
        fetchReviews();
      } else {
        toast.error(res.message || 'Lỗi khi gửi phản hồi');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gửi phản hồi thất bại do lỗi mạng.');
    }
  };

  const handleReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModal.reason.trim()) {
      toast.error('Vui lòng nhập lý do');
      return;
    }
    setIsReporting(true);
    try {
      const res = await productService.reportReview(reportModal.reviewId, reportModal.reason);
      if (!res.error) {
        toast.success('Đã gửi báo cáo vi phạm thành công');
        setReportModal({ isOpen: false, reviewId: '', reason: '' });
      } else {
        toast.error(res.message || 'Lỗi khi báo cáo bình luận');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Báo cáo bình luận thất bại do lỗi mạng.');
    } finally {
      setIsReporting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 mt-12 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Đánh giá & Bình luận
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
              {reviews.length} đánh giá
            </span>
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-5 h-5 ${star <= Math.round(Number(avgRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="font-bold text-gray-900">{avgRating} / 5</span>
              <span className="text-gray-500 text-sm">Trung bình</span>
            </div>
          )}
        </div>
      </div>

      {/* Write Review Section */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Gửi đánh giá của bạn</h3>
        {!isAuthenticated ? (
          <p className="text-sm text-gray-600">
            Vui lòng đăng nhập để đánh giá món ăn này.
          </p>
        ) : (
          <form onSubmit={handleSubmitReview}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600 mr-2">Chất lượng:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <Button type="submit" className="shrink-0">
                Gửi đánh giá
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Đang tải đánh giá...</div>
      ) : (
        <div className="space-y-6">
          {reviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</div>
          )}
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex gap-4">
                {/* Avatar */}
                {review.avatarUrl ? (
                  <img src={review.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-orange-600 font-bold text-lg">
                      {(review.userName || '?').charAt(0)}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mt-3 text-sm leading-relaxed">
                    {review.comment || '(Không có bình luận)'}
                  </p>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-4">
                    {isAuthenticated && user?.role === 'Seller' && user?.sellerInfo?.restaurantId === restaurantId && !review.sellerReply && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                        className="text-xs font-medium text-gray-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Phản hồi
                      </button>
                    )}
                    {isAuthenticated && (
                      <button
                        onClick={() => setReportModal({ isOpen: true, reviewId: review.id, reason: '' })}
                        className="text-xs font-medium text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Báo cáo
                      </button>
                    )}
                  </div>

                  {/* Reply Form (Seller only) */}
                  {replyingTo === review.id && (
                    <div className="mt-4 flex gap-3 items-start bg-gray-50 p-3 rounded-xl">
                      <div className="flex-1">
                        <input
                          autoFocus
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Viết câu trả lời..."
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmitReply(review.id);
                          }}
                        />
                      </div>
                      <Button size="sm" onClick={() => handleSubmitReply(review.id)}>
                        Gửi
                      </Button>
                    </div>
                  )}

                  {/* Seller Reply Display */}
                  {review.sellerReply && (
                    <div className="mt-4 pl-4 border-l-2 border-orange-200">
                      <div className="bg-orange-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                            Chủ quán
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          {review.sellerReply}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
        title="Báo cáo bình luận"
      >
        <form onSubmit={handleReportReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do báo cáo</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              rows={3}
              placeholder="Ví dụ: Spam, từ ngữ phản cảm, không liên quan..."
              value={reportModal.reason}
              onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })}
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setReportModal(prev => ({ ...prev, isOpen: false }))} disabled={isReporting}>Hủy</Button>
            <Button type="submit" isLoading={isReporting} disabled={isReporting} className="bg-red-600 hover:bg-red-700 text-white border-transparent">
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
