import { useState, useEffect } from 'react';
import { Package, MapPin, CreditCard, Clock, QrCode, XCircle, MessageCircle, RefreshCw, AlertTriangle, Star } from 'lucide-react';
import { Modal, Button, Input, ConfirmModal } from '../common';
import { orderService } from '../../services/OrderService';
import { supportService } from '../../services/SupportService';
import { shipperService } from '../../services/ShipperService';
import { authService } from '../../services/AuthService';
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel, getOrderStatusColor } from '../../utils/formatters';
import { notificationRealtimeService } from '../../services/NotificationRealtimeService';
import type { INotificationDto } from '../../interfaces';
import { OrderSellerChatModal } from '../chat/OrderSellerChatModal';
import { SepayQrPaymentModal } from '../payment/SepayQrPaymentModal';
import { useAuth, useCart } from '../../hooks';
import toast from 'react-hot-toast';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export function CustomerOrderDetailModal({ isOpen, onClose, orderId }: OrderDetailModalProps) {
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modals inside details
  const [orderComplaintModal, setOrderComplaintModal] = useState({ isOpen: false, orderId: '', reason: '', description: '', evidenceImageUrl: '' });
  const [shipperComplaintModal, setShipperComplaintModal] = useState({ isOpen: false, orderId: '', reason: '', description: '', evidenceImageUrl: '' });
  const [shipperReviewModal, setShipperReviewModal] = useState({ isOpen: false, orderId: '', rating: 5, comment: '' });
  const [cancelConfirmModal, setCancelConfirmModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, sessionId: '' });
  const [sellerChat, setSellerChat] = useState<{
    isOpen: boolean;
    orderId: string;
    sessionId?: string;
    restaurantId?: string;
    restaurantName?: string;
  }>({ isOpen: false, orderId: '' });

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    } else {
      setOrderData(null);
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    const handleNotification = (notif: INotificationDto) => {
      if (notif.targetId === orderId && isOpen) {
        loadOrderDetails();
      }
    };
    notificationRealtimeService.onNotification(handleNotification);
    return () => {
      notificationRealtimeService.offNotification(handleNotification);
    };
  }, [orderId, isOpen]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderDetails(orderId);
      if (!res.error && res.data) {
        setOrderData(res.data);
      } else {
        toast.error(res.message || 'Lỗi tải chi tiết đơn hàng');
        onClose();
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const confirmCancelOrder = async () => {
    try {
      await orderService.cancelOrder({ orderId });
      toast.success('Hủy đơn hàng thành công');
      setCancelConfirmModal(false);
      loadOrderDetails();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Lỗi khi hủy đơn hàng';
      toast.error(msg);
    }
  };

  const handleReorder = async () => {
    try {
      await orderService.reorder({ orderId });
      await refreshCart();
      window.dispatchEvent(new CustomEvent('openCartTab'));
      toast.success('Đã thêm lại các món vào giỏ hàng');
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Lỗi khi đặt lại đơn hàng';
      toast.error(msg);
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
      const msg = err.response?.data?.message || err.message || 'Lỗi tải ảnh';
      toast.error(msg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const translateError = (msg: string) => {
    if (!msg) return 'Lỗi kết nối đến máy chủ, không thể gửi khiếu nại.';
    if (msg.includes('Unauthorized')) return 'Không có quyền truy cập.';
    if (msg.includes('Only customers')) return 'Chỉ khách hàng mới có quyền gửi khiếu nại.';
    if (msg.includes('Order not found')) return 'Không tìm thấy đơn hàng.';
    if (msg.includes('your own orders')) return 'Bạn chỉ có thể khiếu nại đơn hàng của chính mình.';
    if (msg.includes('delivered order')) return 'Bạn chỉ có thể gửi khiếu nại cho đơn hàng đã giao thành công.';
    if (msg.includes('within 24 hours')) return 'Thời gian gửi khiếu nại phải trong vòng 24 giờ sau khi nhận hàng. Đơn hàng này đã quá hạn.';
    if (msg.includes('already been submitted')) return 'Đơn hàng này đã được gửi khiếu nại trước đó.';
    return msg;
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
        evidenceImageUrl: orderComplaintModal.evidenceImageUrl || 'https://via.placeholder.com/150'
      });
      toast.success('Gửi khiếu nại đơn hàng thành công');
      setOrderComplaintModal({ isOpen: false, orderId: '', reason: '', description: '', evidenceImageUrl: '' });
    } catch (error: any) {
      const rawMessage = error?.response?.data?.message;
      toast.error(translateError(rawMessage));
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
      toast.success('Gửi báo cáo tài xế thành công');
      setShipperComplaintModal({ isOpen: false, orderId: '', reason: '', description: '', evidenceImageUrl: '' });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Lỗi kết nối đến máy chủ, không thể gửi báo cáo.';
      toast.error(errorMessage);
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
      const errorMessage = error?.response?.data?.message || 'Lỗi kết nối đến máy chủ, không thể gửi đánh giá.';
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết đơn hàng #${(orderData?.id || orderId).substring(0, 8).toUpperCase()}`}>
        {loading ? (
          <div className="py-12 flex justify-center text-gray-500">Đang tải chi tiết...</div>
        ) : orderData ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Đặt lúc: {formatDate(orderData.createdAt)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(orderData.status)}`}>
                {getOrderStatusLabel(orderData.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-orange-500" /> Thông tin giao hàng</h4>
                <p className="text-sm"><strong>Tên:</strong> {orderData.contactName}</p>
                <p className="text-sm"><strong>SĐT:</strong> {orderData.contactPhone}</p>
                <p className="text-sm"><strong>Địa chỉ:</strong> {orderData.deliveryAddress}</p>
                {orderData.note && <p className="text-sm text-amber-600 mt-2 italic">Ghi chú: {orderData.note}</p>}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><CreditCard className="w-4 h-4 text-emerald-500" /> Thanh toán</h4>
                <p className="text-sm"><strong>Phương thức:</strong> {getPaymentMethodLabel(orderData.paymentMethod)}</p>
                <p className="text-sm"><strong>Tổng tiền:</strong> <span className="text-orange-600 font-bold">{formatCurrency(orderData.totalAmount)}</span></p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-blue-500" /> Sản phẩm đã đặt</h4>
              <div className="border rounded-xl divide-y">
                {orderData.items?.map((item: any) => (
                  <div key={item.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><Package className="w-6 h-6" /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                        
                        {(item.size || item.topping) && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            {item.size ? `Size: ${item.size}` : ''}
                            {item.size && item.topping ? ' | ' : ''}
                            {item.topping ? `Topping: ${item.topping}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-gray-800">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
              <div className="flex flex-wrap items-center gap-2">
                {orderData.paymentMethod === 'Sepay' && orderData.paymentStatus === 'Pending' && orderData.status === 'Pending' && orderData.paymentSessionId && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => setPaymentModal({ isOpen: true, sessionId: orderData.paymentSessionId! })}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <QrCode className="w-4 h-4 mr-1.5" /> Thanh toán
                  </Button>
                )}
                {(orderData.canCancel ?? orderData.status === 'Pending') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCancelConfirmModal(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Hủy đơn
                  </Button>
                )}
                {(orderData.canMessageSeller) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSellerChat({
                      isOpen: true,
                      orderId: orderData.id,
                      sessionId: orderData.orderChatSessionId,
                      restaurantId: orderData.restaurantId,
                      restaurantName: orderData.restaurantName,
                    })}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" /> Nhắn người bán
                  </Button>
                )}
                {['Delivered', 'Cancelled'].includes(orderData.status) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleReorder}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Đặt lại
                  </Button>
                )}
                {isAuthenticated && orderData.status !== 'Pending' && !orderData.canMessageSeller && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setOrderComplaintModal({ isOpen: true, orderId: orderData.id, reason: '', description: '', evidenceImageUrl: '' })}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Hỗ trợ
                  </Button>
                )}
                {isAuthenticated && ['Shipping', 'Delivered'].includes(orderData.status) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShipperComplaintModal({ isOpen: true, orderId: orderData.id, reason: '', description: '', evidenceImageUrl: '' })}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5 text-orange-500" /> Báo cáo TX
                  </Button>
                )}
                {isAuthenticated && orderData.status === 'Delivered' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShipperReviewModal({ isOpen: true, orderId: orderData.id, rating: 5, comment: '' })}
                  >
                    <Star className="w-4 h-4 mr-1.5 text-yellow-500" /> Đánh giá TX
                  </Button>
                )}
              </div>
              <Button onClick={onClose} variant="outline" size="sm">Đóng</Button>
            </div>
          </div>
        ) : (
          <div className="py-12 flex justify-center text-gray-500">Không có thông tin chi tiết</div>
        )}
      </Modal>

      {/* Nested Modals */}
      <OrderSellerChatModal
        isOpen={sellerChat.isOpen}
        onClose={() => setSellerChat({ isOpen: false, orderId: '' })}
        orderId={sellerChat.orderId}
        sessionId={sellerChat.sessionId}
        restaurantId={sellerChat.restaurantId}
        title={sellerChat.restaurantName ? `Chat với ${sellerChat.restaurantName}` : undefined}
      />

      {paymentModal.sessionId && (
        <SepayQrPaymentModal
          isOpen={paymentModal.isOpen}
          sessionId={paymentModal.sessionId}
          onClose={() => setPaymentModal({ isOpen: false, sessionId: '' })}
          onPaid={() => {
            setPaymentModal({ isOpen: false, sessionId: '' });
            loadOrderDetails();
          }}
        />
      )}

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

      {sellerChat.isOpen && (
        <OrderSellerChatModal
          isOpen={sellerChat.isOpen}
          onClose={() => setSellerChat(prev => ({ ...prev, isOpen: false }))}
          orderId={sellerChat.orderId}
          sessionId={sellerChat.sessionId}
          restaurantId={sellerChat.restaurantId}
          title={`Chat với ${sellerChat.restaurantName || 'Nhà hàng'}`}
          isSeller={false}
          sessionStatus={orderData?.orderChatSessionStatus}
        />
      )}

      <ConfirmModal
        isOpen={cancelConfirmModal}
        onClose={() => setCancelConfirmModal(false)}
        onConfirm={confirmCancelOrder}
        title="Hủy đơn hàng"
        description="Bạn có chắc chắn muốn hủy đơn hàng này không?"
        confirmVariant="danger"
        confirmLabel="Hủy đơn"
      />
    </>
  );
}
