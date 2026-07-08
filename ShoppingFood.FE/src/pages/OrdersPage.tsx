import { useState, useEffect } from 'react';
import { orderService } from '../services/OrderService';
import { supportService } from '../services/SupportService';
import { shipperService } from '../services/ShipperService';
import { authService } from '../services/AuthService';
import type { IOrderSummary } from '../interfaces';
import toast from 'react-hot-toast';
import { PackageOpen, XCircle, RefreshCw, AlertTriangle, Star, MessageCircle } from 'lucide-react';
import { Button, Input, Modal } from '../components/common';
import { OrderSellerChatModal } from '../components/chat/OrderSellerChatModal';
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel, getPaymentMethodLabel, getPaymentStatusColor, getPaymentStatusLabel } from '../utils/formatters';

export function OrdersPage() {
  const [orders, setOrders] = useState<IOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Modal States
  const [orderComplaintModal, setOrderComplaintModal] = useState({ isOpen: false, orderId: '', reason: '', description: '', evidenceImageUrl: '' });
  const [shipperComplaintModal, setShipperComplaintModal] = useState({ isOpen: false, orderId: '', reason: '', description: '', evidenceImageUrl: '' });
  const [shipperReviewModal, setShipperReviewModal] = useState({ isOpen: false, orderId: '', rating: 5, comment: '' });
  const [sellerChat, setSellerChat] = useState<{
    isOpen: boolean;
    orderId: string;
    sessionId?: string;
    restaurantId?: string;
    restaurantName?: string;
  }>({ isOpen: false, orderId: '' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getMyOrders();
      if (!res.error && res.data) {
        setOrders(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải danh sách đơn hàng');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const formatOrderDate = (dateString: string) => formatDate(dateString);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    try {
      await orderService.cancelOrder({ orderId });
      toast.success('Hủy đơn hàng thành công');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi hủy đơn hàng');
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      await orderService.reorder({ orderId });
      toast.success('Đã thêm lại các món vào giỏ hàng');
      // Should ideally refresh cart context here or redirect to cart
      // window.dispatchEvent(new Event('cart_updated')); // naive approach if context needs trigger
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi đặt lại đơn hàng');
    }
  };

  const handleSubmitOrderComplaint = async () => {
    if (!orderComplaintModal.reason.trim()) {
      toast.error('Vui lòng nhập lý do khiếu nại');
      return;
    }
    try {
      await supportService.submitOrderComplaint({
        orderId: orderComplaintModal.orderId,
        reason: orderComplaintModal.reason,
        description: orderComplaintModal.description,
        evidenceImageUrl: orderComplaintModal.evidenceImageUrl || 'https://via.placeholder.com/150' // Default fallback if not required, but API makes it string.Empty if not provided
      });
      toast.success('Gửi khiếu nại đơn hàng thành công');
      setOrderComplaintModal({ isOpen: false, orderId: '', reason: '', description: '', evidenceImageUrl: '' });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gửi khiếu nại');
    }
  };

  const handleSubmitShipperComplaint = async () => {
    if (!shipperComplaintModal.reason.trim()) {
      toast.error('Vui lòng nhập lý do khiếu nại');
      return;
    }
    try {
      await supportService.submitShipperComplaint({
        orderId: shipperComplaintModal.orderId,
        reason: shipperComplaintModal.reason,
        description: shipperComplaintModal.description,
        evidenceImageUrl: shipperComplaintModal.evidenceImageUrl || 'https://via.placeholder.com/150'
      });
      toast.success('Gửi khiếu nại tài xế thành công');
      setShipperComplaintModal({ isOpen: false, orderId: '', reason: '', description: '', evidenceImageUrl: '' });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gửi khiếu nại');
    }
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>, target: 'order' | 'shipper') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh lên...');
    
    try {
      const res = await authService.uploadImage(file);
      if (!res.error && res.data?.imageUrl) {
        toast.success('Tải ảnh lên thành công', { id: toastId });
        if (target === 'order') {
          setOrderComplaintModal(prev => ({ ...prev, evidenceImageUrl: res.data!.imageUrl }));
        } else {
          setShipperComplaintModal(prev => ({ ...prev, evidenceImageUrl: res.data!.imageUrl }));
        }
      } else {
        toast.error(res.message || 'Lỗi tải ảnh', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải ảnh', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitShipperReview = async () => {
    try {
      await shipperService.reviewShipper({
        orderId: shipperReviewModal.orderId,
        rating: shipperReviewModal.rating,
        comment: shipperReviewModal.comment
      });
      toast.success('Đánh giá tài xế thành công');
      setShipperReviewModal({ isOpen: false, orderId: '', rating: 5, comment: '' });
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gửi đánh giá');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Đơn hàng của tôi</h1>

      {isLoading ? (
        <div className="flex justify-center p-10">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-sm border border-gray-100 text-center flex flex-col items-center">
          <PackageOpen className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Chưa có đơn hàng nào</h3>
          <p className="text-gray-500">Bạn chưa thực hiện bất kỳ giao dịch nào trên hệ thống.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800">Đơn hàng #{order.id.substring(0, 8)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                  {order.paymentStatus && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Ngày đặt: {formatOrderDate(order.createdAt)}</p>
                <p className="text-sm text-gray-500 mb-4">Thanh toán: {getPaymentMethodLabel(order.paymentMethod)}</p>
                
                <div className="flex flex-wrap gap-2">
                  {(order.canCancel ?? order.status === 'Pending') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Hủy đơn
                    </Button>
                  )}
                  {(order.canMessageSeller) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSellerChat({
                        isOpen: true,
                        orderId: order.id,
                        sessionId: order.orderChatSessionId,
                        restaurantId: order.restaurantId,
                        restaurantName: order.restaurantName,
                      })}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5" />
                      Nhắn {order.restaurantName ? order.restaurantName : 'người bán'}
                    </Button>
                  )}
                  {['Delivered', 'Cancelled'].includes(order.status) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReorder(order.id)}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" /> Đặt lại
                    </Button>
                  )}
                  {order.status !== 'Pending' && !order.canMessageSeller && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setOrderComplaintModal({ isOpen: true, orderId: order.id, reason: '', description: '', evidenceImageUrl: '' })}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1.5" /> Hỗ trợ đơn
                    </Button>
                  )}
                  {['Shipping', 'Delivered'].includes(order.status) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShipperComplaintModal({ isOpen: true, orderId: order.id, reason: '', description: '', evidenceImageUrl: '' })}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1.5 text-orange-500" /> Báo cáo TX
                    </Button>
                  )}
                  {order.status === 'Delivered' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShipperReviewModal({ isOpen: true, orderId: order.id, rating: 5, comment: '' })}
                    >
                      <Star className="w-4 h-4 mr-1.5 text-yellow-500" /> Đánh giá TX
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-right sm:mt-0 mt-4 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
                <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <OrderSellerChatModal
        isOpen={sellerChat.isOpen}
        onClose={() => setSellerChat({ isOpen: false, orderId: '' })}
        orderId={sellerChat.orderId}
        sessionId={sellerChat.sessionId}
        restaurantId={sellerChat.restaurantId}
        title={sellerChat.restaurantName ? `Chat với ${sellerChat.restaurantName}` : undefined}
      />

      {/* Modals */}
      <Modal
        isOpen={orderComplaintModal.isOpen}
        onClose={() => setOrderComplaintModal(prev => ({ ...prev, isOpen: false }))}
        title="Khiếu nại / Hỗ trợ đơn hàng"
      >
        <div className="space-y-4">
          <Input 
            label="Lý do" 
            placeholder="Ví dụ: Thiếu món, sai món, chất lượng kém..."
            value={orderComplaintModal.reason}
            onChange={(e) => setOrderComplaintModal({ ...orderComplaintModal, reason: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea 
              className="w-full px-4 py-2.5 bg-gray-100/50 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all"
              rows={4}
              value={orderComplaintModal.description}
              onChange={(e) => setOrderComplaintModal({ ...orderComplaintModal, description: e.target.value })}
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh chứng minh</label>
            <input 
              type="file" 
              accept="image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              onChange={(e) => handleUploadEvidence(e, 'order')}
              disabled={isUploading}
            />
            {orderComplaintModal.evidenceImageUrl && (
              <img src={orderComplaintModal.evidenceImageUrl} alt="Evidence" className="mt-2 h-20 object-cover rounded-lg border border-gray-200" />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOrderComplaintModal(prev => ({ ...prev, isOpen: false }))}>Hủy</Button>
            <Button onClick={handleSubmitOrderComplaint}>Gửi khiếu nại</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={shipperComplaintModal.isOpen}
        onClose={() => setShipperComplaintModal(prev => ({ ...prev, isOpen: false }))}
        title="Báo cáo tài xế"
      >
        <div className="space-y-4">
          <Input 
            label="Lý do báo cáo" 
            placeholder="Ví dụ: Thái độ không tốt, trễ giờ, không liên lạc được..."
            value={shipperComplaintModal.reason}
            onChange={(e) => setShipperComplaintModal({ ...shipperComplaintModal, reason: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea 
              className="w-full px-4 py-2.5 bg-gray-100/50 border border-gray-300/50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all"
              rows={4}
              value={shipperComplaintModal.description}
              onChange={(e) => setShipperComplaintModal({ ...shipperComplaintModal, description: e.target.value })}
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh chứng minh</label>
            <input 
              type="file" 
              accept="image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              onChange={(e) => handleUploadEvidence(e, 'shipper')}
              disabled={isUploading}
            />
            {shipperComplaintModal.evidenceImageUrl && (
              <img src={shipperComplaintModal.evidenceImageUrl} alt="Evidence" className="mt-2 h-20 object-cover rounded-lg border border-gray-200" />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShipperComplaintModal(prev => ({ ...prev, isOpen: false }))}>Hủy</Button>
            <Button onClick={handleSubmitShipperComplaint} className="bg-red-600 hover:bg-red-700 text-white border-transparent">Gửi báo cáo</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={shipperReviewModal.isOpen}
        onClose={() => setShipperReviewModal(prev => ({ ...prev, isOpen: false }))}
        title="Đánh giá tài xế giao hàng"
      >
        <div className="space-y-4">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setShipperReviewModal({ ...shipperReviewModal, rating: star })}
                className={`focus:outline-none transition-colors ${star <= shipperReviewModal.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
              >
                <Star className="w-10 h-10 fill-current" />
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lời nhắn (Tùy chọn)</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn với tài xế này..."
              value={shipperReviewModal.comment}
              onChange={(e) => setShipperReviewModal({ ...shipperReviewModal, comment: e.target.value })}
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShipperReviewModal(prev => ({ ...prev, isOpen: false }))}>Hủy</Button>
            <Button onClick={handleSubmitShipperReview}>Gửi đánh giá</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

