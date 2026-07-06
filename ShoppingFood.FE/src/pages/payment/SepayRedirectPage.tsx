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
  const [open, setOpen] = useState(!!sessionId);

  const handlePaid = useCallback((invoiceNumber: string) => {
    navigate(`${ROUTES.PAYMENT_SUCCESS}?invoice=${invoiceNumber}&sessionId=${sessionId}`);
  }, [navigate, sessionId]);

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
        onClose={() => navigate(ROUTES.ORDERS)}
        onPaid={handlePaid}
      />
      {!open && <p>Đang chuyển hướng...</p>}
    </div>
  );
}
