import { useState, type FormEvent } from 'react';
import { X, Mail, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '../common';
import { authService } from '../../services/AuthService';
import toast from 'react-hot-toast';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateEmail = () => {
    if (!email) {
      setErrors({ email: 'Vui lòng nhập email' });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrors({ email: 'Email không hợp lệ' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword({ email });
      if (!response.error) {
        toast.success(response.message || 'Mã OTP đã được gửi đến email của bạn');
        setStep(2);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setErrors({ otpCode: 'Vui lòng nhập mã OTP' });
      return;
    }
    if (otpCode.length !== 6) {
      setErrors({ otpCode: 'Mã OTP phải gồm 6 số' });
      return;
    }
    setErrors({});
    
    setIsLoading(true);
    try {
      const response = await authService.verifyResetOtp({ email, otpCode });
      if (!response.error) {
        toast.success(response.message || 'Mã OTP hợp lệ');
        setStep(3); // Proceed to enter new password
      } else {
        toast.error(response.message);
        setErrors({ otpCode: response.message || 'Mã OTP không hợp lệ' });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(msg);
      setErrors({ otpCode: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!newPassword) newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (newPassword.length < 6) newErrors.newPassword = 'Mật khẩu phải từ 6 ký tự';
    
    if (!confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (confirmPassword !== newPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({ email, otpCode, newPassword });
      if (!response.error) {
        toast.success(response.message || 'Đặt lại mật khẩu thành công!');
        handleClose();
      } else {
        toast.error(response.message);
        setErrors({ newPassword: response.message || 'Có lỗi xảy ra' });
      }
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(msg);
      setErrors({ newPassword: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex items-center justify-between p-6 pb-2">
          <h3 className="text-xl font-bold text-gray-900">Khôi phục mật khẩu</h3>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative p-6 pt-2">
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-orange-400 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 transform transition-transform hover:scale-105">
                  <Mail className="w-8 h-8" />
                </div>
                <p className="text-gray-600 leading-relaxed px-4">
                  Đừng lo lắng! Hãy nhập địa chỉ email của bạn, chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu.
                </p>
              </div>

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="example@gmail.com"
                autoFocus
              />

              <Button type="submit" isLoading={isLoading} className="w-full">
                Gửi mã xác thực
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-blue-400 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 transform transition-transform hover:scale-105">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-gray-600 leading-relaxed px-4">
                  Mã xác thực 6 số đã được gửi đến<br />
                  <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md inline-block mt-2">{email}</span>
                </p>
              </div>

              <Input
                label="Mã OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                error={errors.otpCode}
                placeholder="Nhập 6 số OTP"
                maxLength={6}
                autoFocus
              />

              <Button type="submit" isLoading={isLoading} className="w-full">
                Xác nhận OTP
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-green-500 to-green-400 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 transform transition-transform hover:scale-105">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-gray-600 leading-relaxed px-4">
                  Tuyệt vời! Hãy tạo mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>

              <Input
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.newPassword}
                placeholder="Nhập mật khẩu mới"
                autoFocus
              />
              
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />

              <Button type="submit" isLoading={isLoading} className="w-full">
                Cập nhật mật khẩu
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
