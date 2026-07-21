import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SepayQrPaymentModal } from '../../components/payment/SepayQrPaymentModal';
import { ROUTES } from '../../routes/routeConfig';
import toast from 'react-hot-toast';

/** Trang deep-link thanh toán SePay (từ email/link). Checkout dùng modal trực tiếp. */
export function SepayRedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId') ?? '';
  const returnUrl = searchParams.get('returnUrl');
  const [open] = useState(!!sessionId);

  const handlePaid = useCallback(() => {
    // Không tự động điều hướng nữa, để Modal hiển thị trạng thái Thành công cho người dùng
  }, []);

  useEffect(() => {
    if (!sessionId) {
      toast.error('Thiếu mã phiên thanh toán');
      navigate(ROUTES.HOME);
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-gray-500 text-sm">
      <SepayQrPaymentModal
        isOpen={open}
        sessionId={sessionId}
        onClose={() => navigate(returnUrl ?? ROUTES.ORDERS)}
        onPaid={handlePaid}
      />
      {!open && <p>Đang chuyển hướng...</p>}
    </div>
  );
}
