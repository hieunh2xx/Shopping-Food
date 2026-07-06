import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { paymentService } from '../../services/PaymentService';
import type { IPaymentSessionStatusDto } from '../../services/PaymentService';
import { ROUTES } from '../../routes/routeConfig';
import { formatCurrency } from '../../utils/formatters';

type PageState = 'confirming' | 'success' | 'timeout';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const invoice = searchParams.get('invoice') ?? '';
  const sessionId = searchParams.get('sessionId') ?? '';
  const [pageState, setPageState] = useState<PageState>('confirming');
  const [status, setStatus] = useState<IPaymentSessionStatusDto | null>(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 40;

    const poll = async () => {
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

        if (res.data.isExpired && !res.data.isPaid) {
          setPageState('timeout');
          return true;
        }
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        setPageState('timeout');
        return true;
      }
      return false;
    };

    let stopped = false;
    const run = async () => {
      if (await poll()) return;
      const interval = setInterval(async () => {
        if (stopped) return;
        if (await poll()) clearInterval(interval);
      }, 1000);
    };

    run();
    return () => { stopped = true; };
  }, [invoice, sessionId]);

  if (pageState === 'confirming') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
        <Loader2 className="w-14 h-14 text-orange-500 animate-spin mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang xác nhận thanh toán</h1>
        <p className="text-gray-600 max-w-md mb-2">
          Hệ thống đang chờ SePay/ngân hàng gửi webhook xác nhận giao dịch.
        </p>
        <p className="text-sm text-gray-400">Vui lòng không đóng trang này...</p>
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
          Chưa thấy webhook từ SePay. Nếu bạn đã chuyển khoản, hệ thống sẽ cập nhật trong vài phút.
        </p>
        {invoice && <p className="text-sm text-gray-400 mb-6">Mã CK: {invoice}</p>}
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
        {status?.message ?? 'Đã xác nhận qua webhook SePay'}
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
