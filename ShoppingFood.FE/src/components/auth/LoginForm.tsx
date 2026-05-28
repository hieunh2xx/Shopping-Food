import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../common';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../routes/routeConfig';
import toast from 'react-hot-toast';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

const MS_CLIENT_ID = 'b415c1cf-f993-460a-894d-66a9f5b109b5';
const MS_REDIRECT_URI = window.location.origin;

export function LoginForm() {
  const navigate = useNavigate();
  const { login, loginGoogle, loginMicrosoft, isLoading } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!userName.trim()) newErrors.userName = 'Vui lòng nhập tên đăng nhập';
    if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const success = await login({ userName, password });
    if (success) {
      navigate(ROUTES.HOME);
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

  // Listen for Microsoft auth code via postMessage from popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from our own origin
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

    // Use response_mode=query so the code appears in ?code= (not #code=)
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MS_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query&state=ms_login_${nonce}`;

    // Open popup centered on screen
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      authUrl,
      'microsoft-login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Tên đăng nhập"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        error={errors.userName}
        placeholder="Nhập tên đăng nhập"
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

      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
        Đăng nhập
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
    </form>
  );
}
