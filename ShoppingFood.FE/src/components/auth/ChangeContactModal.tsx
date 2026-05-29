import { useState, type FormEvent } from 'react';
import { X, Mail, KeyRound } from 'lucide-react';
import { Button } from '../common';
import { authService } from '../../services/AuthService';
import toast from 'react-hot-toast';

interface ChangeContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangeContactModal({ isOpen, onClose, onSuccess }: ChangeContactModalProps) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.requestUpdateContact({ newEmail: email });
      if (!res.error) {
        toast.success('Mã OTP đã được gửi đến email của bạn');
        setStep(2);
      } else {
        setError(res.message || 'Lỗi khi gửi OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      setError('Vui lòng nhập mã OTP hợp lệ');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.verifyUpdateContact({ newEmail: email, otpCode });
      if (!res.error) {
        toast.success('Cập nhật email thành công!');
        onSuccess();
        handleClose();
      } else {
        setError(res.message || 'Mã OTP không đúng hoặc đã hết hạn');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtpCode('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Thay đổi Email</h3>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="text-sm text-gray-500 mb-4">
                Vui lòng nhập địa chỉ email mới. Chúng tôi sẽ gửi một mã xác nhận gồm 6 chữ số đến email này.
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email mới"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm bg-white text-gray-900"
                />
              </div>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
              
              <Button type="submit" isLoading={isLoading} className="w-full mt-4">
                Nhận mã OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-sm text-gray-500 mb-4">
                Mã xác nhận đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác).
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã OTP 6 số"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm bg-white text-gray-900 tracking-widest text-center"
                />
              </div>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
              
              <Button type="submit" isLoading={isLoading} className="w-full mt-4">
                Xác nhận
              </Button>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-500 hover:text-orange-600 mt-2 transition-colors"
              >
                Nhập lại email khác
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
