import { useState } from 'react';
import { Star, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '../common';
import { useAuth } from '../../hooks';

interface IReply {
  id: string;
  userName: string;
  content: string;
  createdAt: string;
  isSeller?: boolean;
}

interface IReview {
  id: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
  replies: IReply[];
}

// Mock Data
const MOCK_REVIEWS: IReview[] = [
  {
    id: '1',
    userName: 'Nguyễn Văn A',
    rating: 5,
    content: 'Món ăn rất ngon, giao hàng siêu nhanh. Sẽ ủng hộ quán dài dài!',
    createdAt: '2 ngày trước',
    replies: [
      {
        id: 'r1',
        userName: 'Chủ quán (Seller)',
        content: 'Cảm ơn bạn đã ủng hộ quán nhé! Hẹn gặp lại bạn lần sau.',
        createdAt: '1 ngày trước',
        isSeller: true,
      }
    ]
  },
  {
    id: '2',
    userName: 'Trần Thị B',
    rating: 4,
    content: 'Vị đậm đà nhưng hơi cay so với mình. Lần sau sẽ ghi chú ít cay.',
    createdAt: '5 ngày trước',
    replies: []
  }
];

export function ProductReviews({ productId: _productId }: { productId: string }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<IReview[]>(MOCK_REVIEWS);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newReview: IReview = {
      id: Date.now().toString(),
      userName: user?.fullName || 'Khách hàng',
      rating,
      content: comment,
      createdAt: 'Vừa xong',
      replies: []
    };

    setReviews([newReview, ...reviews]);
    setComment('');
    setRating(5);
  };

  const handleSubmitReply = (reviewId: string) => {
    if (!replyContent.trim()) return;

    const newReply: IReply = {
      id: Date.now().toString(),
      userName: user?.fullName || 'Người dùng',
      content: replyContent,
      createdAt: 'Vừa xong',
      isSeller: user?.role === 'Seller'
    };

    setReviews(reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, replies: [...r.replies, newReply] };
      }
      return r;
    }));

    setReplyingTo(null);
    setReplyContent('');
  };

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
          <div className="flex items-center gap-2 mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="font-bold text-gray-900">4.8 / 5</span>
            <span className="text-gray-500 text-sm">Trung bình</span>
          </div>
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
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..."
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
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <span className="text-orange-600 font-bold text-lg">
                  {review.userName.charAt(0)}
                </span>
              </div>
              
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
                      <span className="text-xs text-gray-500">{review.createdAt}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mt-3 text-sm leading-relaxed">
                  {review.content}
                </p>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-4">
                  <button 
                    onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                    className="text-xs font-medium text-gray-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Phản hồi
                  </button>
                </div>

                {/* Reply Form */}
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

                {/* Replies List */}
                {review.replies.length > 0 && (
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
                    {review.replies.map(reply => (
                      <div key={reply.id} className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${reply.isSeller ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <span className={`font-bold text-xs ${reply.isSeller ? 'text-white' : 'text-gray-600'}`}>
                            {reply.userName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                              {reply.userName}
                              {reply.isSeller && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                            </span>
                            <span className="text-xs text-gray-500">{reply.createdAt}</span>
                          </div>
                          <p className="text-gray-700 text-sm">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
