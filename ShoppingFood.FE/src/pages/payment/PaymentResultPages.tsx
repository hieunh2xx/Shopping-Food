import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { paymentService } from '../../services/PaymentService';
import type { IPaymentSessionStatusDto } from '../../services/PaymentService';
import { ROUTES } from '../../routes/routeConfig';
import { formatCurrency, getPaymentDisplayStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';

type PageState = 'confirming' | 'success' | 'timeout';

/**
 * Trang Kết Quả Thanh Toán Thành Công (PaymentSuccessPage).
 * Kiểm tra trạng thái giao dịch từ SePay:
 * - Trạng thái `confirming`: Đang chờ xác nhận giao dịch qua Webhook / Polling
 * - Trạng thái `timeout`: Hết thời gian chờ, cung cấp nút đối soát thủ công (Reconcile)
 * - Trạng thái `success`: Xác nhận đã thanh toán thành công, hiển thị chi tiết hóa đơn.
 */
export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const invoice = searchParams.get('invoice') ?? '';
  const sessionId = searchParams.get('sessionId') ?? '';
  const [pageState, setPageState] = useState<PageState>('confirming');
  const [status, setStatus] = useState<IPaymentSessionStatusDto | null>(null);
  const [reconciling, setReconciling] = useState(false);

  /**
   * Gọi API đối soát thủ công với SePay khi thanh toán chưa được xác nhận tự động.
   */
  const handleReconcile = async () => {
    setReconciling(true);
    const res = await paymentService.reconcileSepayPayment({
      sessionId: sessionId || undefined,
      invoiceNumber: invoice || undefined,
    });
    setReconciling(false);

    if (!res.error && res.data?.success) {
      setPageState('success');
      toast.success(res.data.message || 'Đã đồng bộ thanh toán từ SePay');
      return;
    }

    toast.error(res.data?.message || res.message);
  };

  useEffect(() => {
    let stopped = false;

    const checkStatus = async () => {
      const res = await paymentService.getPaymentSessionStatus({
        sessionId: sessionId || undefined,
        invoiceNumber: invoice || undefined,
      });

      if (!res.error && res.data) {
        setStatus(res.data);
        if (res.data.isPaid) {
          setPageState('success');
          return true;
        }
        if (res.data.isExpired || res.data.displayStatus === 'expired' || res.data.status === 'expired') {
          setPageState('timeout');
          return true;
        }
      }
      return false;
    };

    const runInit = async () => {
      await checkStatus();
    };
    runInit();

    const fallbackTimeout = setTimeout(() => {
      if (!stopped) setPageState('timeout');
    }, 30000); // 30s timeout fallback

    const handleNotification = async (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const n = customEvent.detail;
      if (
        n &&
        (n.notificationType === 'Payment' ||
          (sessionId && n.targetId === sessionId) ||
          (invoice && n.message?.includes(invoice)))
      ) {
        const isFinished = await checkStatus();
        if (isFinished) {
          clearTimeout(fallbackTimeout);
        }
      }
    };

    window.addEventListener('ON_REALTIME_NOTIFICATION', handleNotification);

    return () => {
      stopped = true;
      clearTimeout(fallbackTimeout);
      window.removeEventListener('ON_REALTIME_NOTIFICATION', handleNotification);
    };
  }, [invoice, sessionId]);

  if (pageState === 'confirming') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
        <Loader2 className="w-14 h-14 text-orange-500 animate-spin mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang xác nhận thanh toán</h1>
        <p className="text-gray-600 max-w-md mb-2">
          {status?.statusLabel ?? getPaymentDisplayStatusLabel(status?.displayStatus ?? status?.status ?? 'processing')}
        </p>
        <p className="text-sm text-gray-400">
          {status?.message ?? 'Vui lòng không đóng trang này...'}
        </p>
        {invoice && <p className="text-xs text-gray-400 mt-4">Mã CK: {invoice}</p>}
      </div>
    );
  }

  if (pageState === 'timeout') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
        <Clock className="w-14 h-14 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chưa nhận được xác nhận</h1>
        <p className="text-gray-600 max-w-md mb-4">
          Chưa thấy webhook từ SePay. Nếu bạn đã chuyển khoản, hệ thống có thể đồng bộ trực tiếp từ SePay API.
        </p>
        {invoice && <p className="text-sm text-gray-400 mb-4">Mã CK: {invoice}</p>}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <button
            type="button"
            onClick={handleReconcile}
            disabled={reconciling}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl font-medium disabled:opacity-60"
          >
            {reconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Kiểm tra lại từ SePay
          </button>
        </div>
        <div className="flex gap-3">
          <Link to={ROUTES.ORDERS} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-medium">
            Xem đơn hàng
          </Link>
          <Link to={ROUTES.HOME} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công</h1>
      <p className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full mb-4">
        {status?.statusLabel ?? getPaymentDisplayStatusLabel(status?.displayStatus ?? status?.status ?? 'paid')}
      </p>

      {(status?.itemsSubtotal != null || status?.shippingFee != null) && (
        <div className="w-full max-w-xs text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 mb-4 space-y-1.5 text-left">
          {status.itemsSubtotal != null && (
            <div className="flex justify-between">
              <span>Tạm tính món</span>
              <span className="font-medium">{formatCurrency(status.itemsSubtotal)}</span>
            </div>
          )}
          {status.shippingFee != null && status.shippingFee > 0 && (
            <div className="flex justify-between">
              <span>Phí giao hàng</span>
              <span className="font-medium">{formatCurrency(status.shippingFee)}</span>
            </div>
          )}
          {status.amount != null && (
            <div className="flex justify-between pt-1.5 border-t border-gray-200 font-semibold text-gray-900">
              <span>Tổng thanh toán</span>
              <span className="text-orange-600">{formatCurrency(status.amount)}</span>
            </div>
          )}
        </div>
      )}

      {status?.amount != null && status.itemsSubtotal == null && (
        <p className="text-gray-600 mb-2">Số tiền: <strong>{formatCurrency(status.amount)}</strong></p>
      )}

      {status?.externalTransactionId && (
        <p className="text-xs text-gray-400 mb-2">Mã giao dịch: {status.externalTransactionId}</p>
      )}
      {invoice && <p className="text-sm text-gray-400 mb-6">Mã hóa đơn: {invoice}</p>}

      <div className="flex gap-3">
        <Link to={ROUTES.ORDERS} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700">
          Xem đơn hàng
        </Link>
        <Link to={ROUTES.HOME} className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

/**
 * Trang Thông Báo Thanh Toán Thất Bại (PaymentErrorPage).
 */
export function PaymentErrorPage() {
  const [searchParams] = useSearchParams();
  const invoice = searchParams.get('invoice');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
      <p className="text-gray-600 text-center max-w-md mb-2">
        Giao dịch không hoàn tất. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
      </p>
      {invoice && <p className="text-sm text-gray-400 mb-6">Mã hóa đơn: {invoice}</p>}
      <Link to={ROUTES.ORDERS} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-medium">
        Quay lại đơn hàng
      </Link>
    </div>
  );
}

/**
 * Trang Thông Báo Đã Hủy Thanh Toán (PaymentCancelPage).
 */
export function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const invoice = searchParams.get('invoice');


  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Đã hủy thanh toán</h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        Bạn đã hủy giao dịch. Đơn hàng vẫn được lưu với trạng thái chờ thanh toán.
      </p>
      {invoice && <p className="text-sm text-gray-400 mb-6">Mã hóa đơn: {invoice}</p>}
      <Link to={ROUTES.ORDERS} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl font-medium">
        Xem đơn hàng
      </Link>
    </div>
  );
}
