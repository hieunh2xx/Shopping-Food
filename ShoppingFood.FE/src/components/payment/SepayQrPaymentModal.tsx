import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Clock, Copy, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export interface SepayQrPaymentModalProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onPaid: (invoiceNumber: string) => void;
}

export function SepayQrPaymentModal({ isOpen, sessionId, onClose, onPaid }: SepayQrPaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{
    qrImageUrl: string;
    invoiceNumber: string;
    transferContent: string;
    amount: number;
    itemsSubtotal?: number;
    shippingFee?: number;
    remainingSeconds: number;
    isPaid: boolean;
    isExpired: boolean;
    bankName?: string;
    bankAccountNumber?: string;
    accountHolder?: string;
  } | null>(null);

  const paidNotifiedRef = useRef(false);

  const notifyPaid = useCallback((invoiceNumber: string) => {
    if (paidNotifiedRef.current) return;
    paidNotifiedRef.current = true;
    toast.success('SePay đã xác nhận thanh toán qua webhook!');
    onPaid(invoiceNumber);
  }, [onPaid]);

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
      setQrData({
        qrImageUrl: res.data.qrImageUrl,
        invoiceNumber: res.data.invoiceNumber,
        transferContent: res.data.transferContent ?? res.data.invoiceNumber,
        amount: res.data.amount,
        itemsSubtotal: res.data.itemsSubtotal,
        shippingFee: res.data.shippingFee,
        remainingSeconds: res.data.remainingSeconds,
        isPaid: res.data.isPaid,
        isExpired: res.data.isExpired,
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
          return { ...prev, remainingSeconds: 0, isExpired: true };
        }
        return { ...prev, remainingSeconds: next };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isOpen, qrData?.isPaid, qrData?.isExpired]);

  useEffect(() => {
    if (!isOpen || !sessionId || !qrData || qrData.isPaid || qrData.isExpired) return;
    const poll = setInterval(async () => {
      const res = await paymentService.getPaymentSessionStatus({ sessionId });
      if (!res.error && res.data?.isPaid) {
        notifyPaid(res.data.invoiceNumber);
      }
    }, 1000);
    return () => clearInterval(poll);
  }, [isOpen, sessionId, qrData, notifyPaid]);

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
          {qrData.isExpired ? (
            <p className="text-center text-red-600 font-medium py-6">Mã QR đã hết hạn. Vui lòng tạo đơn mới.</p>
          ) : qrData.isPaid ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-2xl font-bold text-green-600">Thanh toán thành công</p>
              <p className="text-gray-600 text-sm">SePay đã xác nhận chuyển khoản. Đơn hàng sẽ được xử lý sớm nhất.</p>
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
                  <div className="mt-3 flex items-center justify-center gap-2 text-amber-700 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Trạng thái: Chờ thanh toán...
                  </div>
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
                Hệ thống kiểm tra trạng thái mỗi giây — chờ webhook SePay xác nhận (giống demo payment-gateway-demo.sepay.dev)
              </p>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
