import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Clock, Copy, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency, getPaymentDisplayStatusColor, getPaymentDisplayStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';

export interface SepayQrPaymentModalProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onPaid: (invoiceNumber: string) => void;
}

type QrData = {
  qrImageUrl: string;
  invoiceNumber: string;
  transferContent: string;
  amount: number;
  itemsSubtotal?: number;
  shippingFee?: number;
  remainingSeconds: number;
  isPaid: boolean;
  isExpired: boolean;
  displayStatus: string;
  statusLabel: string;
  bankName?: string;
  bankAccountNumber?: string;
  accountHolder?: string;
};

function StatusBadge({ displayStatus, statusLabel }: { displayStatus: string; statusLabel: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${getPaymentDisplayStatusColor(displayStatus)}`}>
      {displayStatus === 'processing' || displayStatus === 'awaiting_payment' ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : displayStatus === 'paid' ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : null}
      {getPaymentDisplayStatusLabel(displayStatus, statusLabel)}
    </span>
  );
}

export function SepayQrPaymentModal({ isOpen, sessionId, onClose, onPaid }: SepayQrPaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QrData | null>(null);

  const paidNotifiedRef = useRef(false);

  const markPaid = useCallback(() => {
    setQrData(prev => prev ? {
      ...prev,
      isPaid: true,
      displayStatus: 'paid',
      statusLabel: 'Đã thanh toán',
    } : prev);
  }, []);

  const notifyPaid = useCallback((invoiceNumber: string) => {
    if (paidNotifiedRef.current) return;
    paidNotifiedRef.current = true;
    markPaid();
    toast.success('SePay đã xác nhận thanh toán qua webhook!');
    onPaid(invoiceNumber);
  }, [onPaid, markPaid]);

  const applySessionStatus = useCallback((data: {
    isPaid: boolean;
    isExpired?: boolean;
    displayStatus?: string;
    statusLabel?: string;
    status?: string;
    invoiceNumber: string;
    remainingSeconds?: number;
  }) => {
    const displayStatus = data.displayStatus ?? data.status ?? 'pending';
    const statusLabel = data.statusLabel ?? getPaymentDisplayStatusLabel(displayStatus);

    setQrData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        isPaid: data.isPaid,
        isExpired: data.isExpired ?? prev.isExpired,
        displayStatus,
        statusLabel,
        remainingSeconds: data.remainingSeconds ?? prev.remainingSeconds,
      };
    });

    if (data.isPaid) {
      notifyPaid(data.invoiceNumber);
    }
  }, [notifyPaid]);

  const loadQr = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    const res = await paymentService.getSepayQr(sessionId);

    if (res.code === 410) {
      setError('Mã QR đã hết hạn (10 phút). Vui lòng tạo đơn mới.');
      setLoading(false);
      return;
    }

    if (!res.error && res.data?.qrImageUrl) {
      const displayStatus = res.data.displayStatus ?? res.data.status ?? 'awaiting_payment';
      const statusLabel = res.data.statusLabel ?? getPaymentDisplayStatusLabel(displayStatus);

      setQrData({
        qrImageUrl: res.data.qrImageUrl,
        invoiceNumber: res.data.invoiceNumber,
        transferContent: res.data.transferContent ?? res.data.invoiceNumber,
        amount: res.data.amount,
        itemsSubtotal: res.data.itemsSubtotal,
        shippingFee: res.data.shippingFee,
        remainingSeconds: res.data.remainingSeconds,
        isPaid: res.data.isPaid,
        isExpired: res.data.isExpired || displayStatus === 'expired',
        displayStatus,
        statusLabel,
        bankName: res.data.bankName,
        bankAccountNumber: res.data.bankAccountNumber,
        accountHolder: res.data.accountHolder,
      });
      setLoading(false);

      if (res.data.isPaid) {
        notifyPaid(res.data.invoiceNumber);
      }
      return;
    }

    setError(res.message || 'Không thể tạo mã QR thanh toán.');
    setLoading(false);
  }, [sessionId, notifyPaid]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    loadQr();
  }, [isOpen, sessionId, loadQr]);

  useEffect(() => {
    if (!isOpen || !qrData || qrData.isPaid || qrData.isExpired) return;
    const t = setInterval(() => {
      setQrData(prev => {
        if (!prev || prev.remainingSeconds <= 0) return prev;
        const next = prev.remainingSeconds - 1;
        if (next <= 0) {
          toast.error('Mã QR đã hết hạn');
          return {
            ...prev,
            remainingSeconds: 0,
            isExpired: true,
            displayStatus: 'expired',
            statusLabel: 'Hết hạn thanh toán',
          };
        }
        return { ...prev, remainingSeconds: next };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isOpen, qrData?.isPaid, qrData?.isExpired]);

  useEffect(() => {
    if (!isOpen || !sessionId || !qrData || qrData.isPaid || qrData.isExpired) return;
    
    const handleNotification = async (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const n = customEvent.detail;
      if (n && (n.targetId === sessionId || n.notificationType === 'Payment')) {
        const res = await paymentService.getPaymentSessionStatus({ sessionId });
        if (!res.error && res.data) {
          applySessionStatus({
            isPaid: res.data.isPaid,
            isExpired: res.data.isExpired,
            displayStatus: res.data.displayStatus ?? res.data.status,
            statusLabel: res.data.statusLabel,
            invoiceNumber: res.data.invoiceNumber,
            remainingSeconds: res.data.remainingSeconds,
          });
        }
      }
    };

    window.addEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
    return () => window.removeEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
  }, [isOpen, sessionId, qrData, applySessionStatus]);

  useEffect(() => {
    if (!isOpen) {
      setQrData(null);
      setError(null);
      setLoading(true);
      paidNotifiedRef.current = false;
    }
  }, [isOpen]);

  const copyTransferContent = () => {
    if (qrData?.transferContent) {
      navigator.clipboard.writeText(qrData.transferContent);
      toast.success('Đã sao chép nội dung chuyển khoản');
    }
  };

  const handleManualReconcile = async () => {
    if (!sessionId) return;
    const toastId = toast.loading('Đang đồng bộ từ SePay...');
    const res = await paymentService.reconcileSepayPayment({ sessionId });
    toast.dismiss(toastId);

    if (!res.error && res.data?.success) {
      applySessionStatus({
        isPaid: true,
        displayStatus: 'paid',
        statusLabel: 'Đã thanh toán',
        invoiceNumber: qrData?.invoiceNumber ?? '',
      });
      toast.success(res.data.message || 'Đã xác nhận thanh toán từ SePay');
      return;
    }

    toast.error(res.data?.message || res.message || 'Chưa thấy giao dịch khớp trên SePay');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thanh toán chuyển khoản ngân hàng"
      size="lg"
      closeOnBackdrop={false}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-gray-600 text-sm">Đang tạo mã QR...</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center space-y-4 py-6">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-sm text-gray-700">{error}</p>
          <button type="button" onClick={loadQr} className="text-orange-600 text-sm font-medium hover:underline">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && qrData && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <StatusBadge displayStatus={qrData.displayStatus} statusLabel={qrData.statusLabel} />
          </div>

          {qrData.isExpired ? (
            <p className="text-center text-red-600 font-medium py-6">Mã QR đã hết hạn. Vui lòng tạo đơn mới.</p>
          ) : qrData.isPaid ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công</h3>
              <p className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full mb-6">Đã xác nhận thanh toán</p>
              
              <div className="w-full max-w-xs text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-4 space-y-2 text-left border border-gray-100 shadow-sm">
                {qrData.itemsSubtotal != null && (
                  <div className="flex justify-between">
                    <span>Tạm tính món</span>
                    <span className="font-medium">{formatCurrency(qrData.itemsSubtotal)}</span>
                  </div>
                )}
                {qrData.shippingFee != null && qrData.shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span>Phí giao hàng</span>
                    <span className="font-medium">{formatCurrency(qrData.shippingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                  <span>Tổng tiền</span>
                  <span className="text-orange-600 text-base">{formatCurrency(qrData.amount)}</span>
                </div>
              </div>
              
              {qrData.invoiceNumber && (
                <p className="text-xs text-gray-400 mt-4 font-mono">Mã HĐ: {qrData.invoiceNumber}</p>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-10 py-2.5 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 shadow-sm transition-colors"
                >
                  Xong
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-gray-500 border-b pb-2">
                Hướng dẫn thanh toán qua chuyển khoản ngân hàng (theo chuẩn SePay VietQR)
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4 text-center">
                  <p className="font-semibold text-sm mb-3">Cách 1: Mở app ngân hàng và quét mã QR</p>
                  <img
                    src={qrData.qrImageUrl}
                    alt="Mã QR VietQR"
                    className="w-52 h-52 object-contain mx-auto rounded-lg border border-gray-100"
                  />
                </div>

                <div className="border rounded-xl p-4">
                  <p className="font-semibold text-sm mb-3">Cách 2: Chuyển khoản thủ công</p>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {qrData.bankName && (
                        <tr>
                          <td className="py-2 text-gray-500">Ngân hàng</td>
                          <td className="py-2 text-right font-semibold">{qrData.bankName}</td>
                        </tr>
                      )}
                      {qrData.accountHolder && (
                        <tr>
                          <td className="py-2 text-gray-500">Chủ TK</td>
                          <td className="py-2 text-right font-semibold">{qrData.accountHolder}</td>
                        </tr>
                      )}
                      {qrData.bankAccountNumber && (
                        <tr>
                          <td className="py-2 text-gray-500">Số TK</td>
                          <td className="py-2 text-right font-semibold">{qrData.bankAccountNumber}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-2 text-gray-500">Số tiền</td>
                        <td className="py-2 text-right font-bold text-orange-600">{formatCurrency(qrData.amount)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500">Nội dung CK</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={copyTransferContent}
                            className="inline-flex items-center gap-1 font-mono font-semibold text-gray-800 hover:text-orange-600"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {qrData.transferContent}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5 border border-amber-100">
                    Giữ nguyên nội dung <strong>{qrData.transferContent}</strong> để SePay tự động xác nhận qua webhook.
                  </p>
                </div>
              </div>

              {(qrData.itemsSubtotal != null || qrData.shippingFee != null) && (
                <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-xl px-4 py-2.5">
                  {qrData.itemsSubtotal != null && (
                    <div className="flex justify-between">
                      <span>Tạm tính món</span>
                      <span>{formatCurrency(qrData.itemsSubtotal)}</span>
                    </div>
                  )}
                  {qrData.shippingFee != null && qrData.shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span>Phí giao hàng</span>
                      <span>{formatCurrency(qrData.shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t">
                    <span>Tổng thanh toán</span>
                    <span className="text-orange-600">{formatCurrency(qrData.amount)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-amber-800 bg-amber-50 rounded-xl py-2.5 border border-amber-100">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold text-lg">{formatTime(qrData.remainingSeconds)}</span>
                <span className="text-sm">hết hạn</span>
              </div>

              <p className="text-center text-xs text-gray-400">
                {qrData.displayStatus === 'processing'
                  ? 'Đã nhận webhook — hệ thống đang xác nhận giao dịch...'
                  : 'Quét QR hoặc chuyển khoản — hệ thống tự cập nhật khi SePay gửi webhook'}
              </p>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleManualReconcile}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
                >
                  Đã chuyển khoản? Kiểm tra lại từ SePay
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
