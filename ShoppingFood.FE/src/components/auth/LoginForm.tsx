import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button, Input } from '../common';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../routes/routeConfig';
import toast from 'react-hot-toast';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { auth } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { ForgotPasswordModal } from './ForgotPasswordModal';

const MS_CLIENT_ID = 'b415c1cf-f993-460a-894d-66a9f5b109b5';
const MS_REDIRECT_URI = window.location.origin;

export function LoginForm() {
  const navigate = useNavigate();
  const { login, sendLoginOtp, verifyLoginOtp, verifyUnlockAccount, loginGoogle, loginMicrosoft, loginFirebasePhone, isLoading } = useAuth();
  
  // Step 1: Login
  const [loginMethod, setLoginMethod] = useState<'standard' | 'phone'>('standard');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Step 2 & 3: OTP
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [preAuthToken, setPreAuthToken] = useState('');
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize recaptcha if not already initialized
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  }, []);

  useEffect(() => {
    if (otpCode.length === 6 && !isLoading) {
      if (isPhoneLogin) {
        handleVerifyPhoneLoginOtp();
      } else {
        handleVerifyOtp();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  const validateLogin = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!userName.trim()) newErrors.userName = 'Vui lòng nhập tên đăng nhập';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateLogin()) return;

    const result = await login({ userName, password });
    if (result.success) {
      if (result.requireOtp && result.data) {
        setPreAuthToken(result.data.preAuthToken);
        setAvailableMethods(result.data.availableMethods);
        setIsLocked(result.isLocked || false);
        setStep(2);
      } else {
        navigate(ROUTES.HOME);
      }
    }
  };

  const handlePhoneLoginSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!loginPhone.trim()) {
      setErrors({ loginPhone: 'Vui lòng nhập số điện thoại' });
      return;
    }

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }

      // Format phone to E.164
      let formattedPhone = loginPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+84' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setIsPhoneLogin(true);
      setSelectedMethod('phone');
      setStep(3);
    } catch (error: any) {
      console.error(error);
      toast.error('Gửi OTP thất bại (Firebase)');
    }
  };

  const handleSendOtp = async (method: string) => {
    setSelectedMethod(method);
    const success = await sendLoginOtp(preAuthToken, method);
    if (success) {
      setStep(3);
    }
  };

  const handleVerifyOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length < 6) return;
    
    let success = false;
    if (isLocked) {
      success = await verifyUnlockAccount(preAuthToken, otpCode);
    } else {
      success = await verifyLoginOtp(preAuthToken, otpCode);
    }
    
    if (success) {
      navigate(ROUTES.HOME);
    }
  };

  const handleVerifyPhoneLoginOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length < 6) return;

    if (!confirmationResult) {
      toast.error('Không tìm thấy phiên xác thực OTP');
      return;
    }

    try {
      const result = await confirmationResult.confirm(otpCode);
      const idToken = await result.user.getIdToken();
      
      const success = await loginFirebasePhone(idToken);
      if (success) {
        navigate(ROUTES.HOME);
      }
    } catch (error) {
      console.error(error);
      toast.error('Mã OTP không hợp lệ');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const success = await loginGoogle(credentialResponse.credential);
      if (success) {
        navigate(ROUTES.HOME);
      }
    }
  };

  const handleGoogleError = () => {
    toast.error('Đăng nhập Google thất bại');
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'microsoft-auth-code') return;
      if (!event.data?.code) return;

      const success = await loginMicrosoft(event.data.code, MS_REDIRECT_URI);
      if (success) {
        navigate(ROUTES.HOME);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loginMicrosoft, navigate]);

  const handleMicrosoftLogin = () => {
    const scope = encodeURIComponent('User.Read openid profile email');
    const redirectUri = encodeURIComponent(MS_REDIRECT_URI);
    const nonce = Math.random().toString(36).substring(2);
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MS_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query&state=ms_login_${nonce}`;
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(authUrl, 'microsoft-login', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`);
  };

  if (step === 2) {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <button onClick={() => setStep(1)} className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
        </button>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {isLocked ? 'Tài khoản đang bị khóa' : 'Xác thực tài khoản'}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            {isLocked 
              ? 'Tài khoản của bạn đã bị khóa bảo vệ. Vui lòng xác thực OTP để mở khóa.' 
              : 'Vui lòng chọn phương thức nhận mã OTP (mã có hiệu lực 10 phút)'}
          </p>
        </div>
        <div className="grid gap-4 mt-6">
          {availableMethods.includes('email') && (
            <Button type="button" variant="secondary" onClick={() => handleSendOtp('email')} isLoading={isLoading} className="w-full">
              Gửi mã qua Email
            </Button>
          )}
          {/* Hide phone OTP verification method option */}
          {/* availableMethods.includes('phone') && (
            <Button type="button" variant="secondary" onClick={() => handleSendOtp('phone')} isLoading={isLoading} className="w-full">
              Gửi mã qua SMS
            </Button>
          ) */}
          {availableMethods.length === 0 && (
            <p className="text-sm text-red-500 text-center">Tài khoản này chưa cập nhật Email hay Số điện thoại.</p>
          )}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <form onSubmit={isPhoneLogin ? handleVerifyPhoneLoginOtp : handleVerifyOtp} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <button type="button" onClick={() => { setStep(1); setOtpCode(''); }} className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
        </button>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Nhập mã OTP</h3>
          <p className="text-sm text-gray-500 mt-2">Mã đã được gửi qua {selectedMethod === 'email' ? 'Email' : 'SMS'}</p>
        </div>
        <Input
          label="Mã OTP"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          error={errors.otp}
          placeholder="Nhập 6 số OTP"
          maxLength={6}
          autoFocus
        />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Xác nhận
        </Button>
      </form>
    );
  }

  return (
    <>
      <form onSubmit={loginMethod === 'standard' ? handleLoginSubmit : handlePhoneLoginSubmit} className="space-y-5 animate-in fade-in duration-300">
        
        {/* Hide phone login option tab selector */}
        {/*
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => { setLoginMethod('standard'); setErrors({}); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'standard' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Tài khoản
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('phone'); setErrors({}); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'phone' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Số điện thoại
            </button>
          </div>
        </div>
        */}

        {loginMethod === 'standard' ? (
          <>
            <Input
              label="Tên đăng nhập / Email"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              error={errors.userName}
              placeholder="Nhập tên đăng nhập hoặc email"
              autoComplete="username"
            />

            <div className="relative">
              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex justify-end -mt-2 mb-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>
          </>
        ) : (
          <Input
            label="Số điện thoại"
            value={loginPhone}
            onChange={(e) => setLoginPhone(e.target.value)}
            error={errors.loginPhone}
            placeholder="Nhập số điện thoại"
            autoComplete="tel"
          />
        )}

        <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
          {loginMethod === 'standard' ? 'Đăng nhập' : 'Tiếp tục'}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Hoặc</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="rectangular"
            theme="outline"
            size="large"
            width="100%"
            text="signin_with"
          />
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            className="flex items-center justify-center gap-3 w-full h-10 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <img src="https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.svg" alt="Microsoft" className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">Đăng nhập bằng Microsoft</span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <Link to={ROUTES.REGISTER} className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
            Đăng ký ngay
          </Link>
        </p>

        {/* Recaptcha Container for Firebase Phone Auth */}
        <div id="recaptcha-container"></div>
      </form>

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    </>
  );
}
