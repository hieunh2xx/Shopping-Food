import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SepayQrPaymentModal } from '../../components/payment/SepayQrPaymentModal';
import { ROUTES } from '../../routes/routeConfig';
import toast from 'react-hot-toast';

/**
 * Trang Điều Hướng & Mở Thanh Toán SePay Bằng Deep Link (SepayRedirectPage).
 * Được sử dụng khi người dùng mở liên kết thanh toán từ email hoặc thông báo:
 * - Trích xuất `sessionId` và `returnUrl` từ URL query params
 * - Kích hoạt Modal quét mã QR chuyển khoản VietQR SePay (`SepayQrPaymentModal`).
 */
export function SepayRedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId') ?? '';
  const returnUrl = searchParams.get('returnUrl');
  const [open] = useState(!!sessionId);

  const handlePaid = useCallback(() => {
    // Không tự động điều hướng ngay, để Modal hiển thị trạng thái Thành công cho người dùng
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
        onAbandoned={() => navigate(returnUrl ?? ROUTES.ORDERS)}
        onPaid={handlePaid}
      />
      {!open && <p>Đang chuyển hướng...</p>}
    </div>
  );
}
