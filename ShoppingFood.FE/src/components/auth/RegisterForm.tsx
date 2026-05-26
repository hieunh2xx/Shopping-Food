import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../common';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../routes/routeConfig';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  isSeller?: boolean;
}

export function RegisterForm({ isSeller = false }: RegisterFormProps) {
  const navigate = useNavigate();
  const { register, registerSeller, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    userName: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
    // Seller fields
    businessName: '',
    businessAddress: '',
    businessLicenseUrl: '',
    shopImageUrl: '',
    contactInfo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.userName.trim()) newErrors.userName = 'Vui lÃ²ng nháº­p tÃªn Ä‘Äƒng nháº­p';
    else if (form.userName.length > 50) newErrors.userName = 'Tá»‘i Ä‘a 50 kÃ½ tá»±';

    if (!form.password) newErrors.password = 'Vui lÃ²ng nháº­p máº­t kháº©u';
    else if (form.password.length < 6) newErrors.password = 'Tá»‘i thiá»ƒu 6 kÃ½ tá»±';

    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Máº­t kháº©u khÃ´ng khá»›p';

    if (!form.fullName.trim()) newErrors.fullName = 'Vui lÃ²ng nháº­p há» tÃªn';
    else if (form.fullName.length > 100) newErrors.fullName = 'Tá»‘i Ä‘a 100 kÃ½ tá»±';

    if (!form.email.trim()) newErrors.email = 'Vui lÃ²ng nháº­p email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email khÃ´ng há»£p lá»‡';

    if (!form.phone.trim()) newErrors.phone = 'Vui lÃ²ng nháº­p sá»‘ Ä‘iá»‡n thoáº¡i';
    else if (!/^\d{9,15}$/.test(form.phone)) newErrors.phone = 'Sá»‘ Ä‘iá»‡n thoáº¡i 9-15 chá»¯ sá»‘';

    if (isSeller) {
      if (!form.businessName.trim()) newErrors.businessName = 'Vui lÃ²ng nháº­p tÃªn cá»­a hÃ ng';
      if (!form.businessAddress.trim()) newErrors.businessAddress = 'Vui lÃ²ng nháº­p Ä‘á»‹a chá»‰';
      if (!form.contactInfo.trim()) newErrors.contactInfo = 'Vui lÃ²ng nháº­p thÃ´ng tin liÃªn há»‡';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let success: boolean;

    if (isSeller) {
      success = await registerSeller({
        userName: form.userName,
        password: form.password,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        businessName: form.businessName,
        businessAddress: form.businessAddress,
        businessLicenseUrl: form.businessLicenseUrl || 'pending',
        shopImageUrl: form.shopImageUrl || 'pending',
        contactInfo: form.contactInfo,
      });
    } else {
      success = await register({
        userName: form.userName,
        password: form.password,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        role: 'Customer',
      });
    }

    if (success) {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="TÃªn Ä‘Äƒng nháº­p"
          value={form.userName}
          onChange={(e) => updateField('userName', e.target.value)}
          error={errors.userName}
          placeholder="username"
        />
        <Input
          label="Há» vÃ  tÃªn"
          value={form.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          error={errors.fullName}
          placeholder="Nguyá»…n VÄƒn A"
        />
      </div>

      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => updateField('email', e.target.value)}
        error={errors.email}
        placeholder="email@example.com"
      />

      <Input
        label="Sá»‘ Ä‘iá»‡n thoáº¡i"
        value={form.phone}
        onChange={(e) => updateField('phone', e.target.value)}
        error={errors.phone}
        placeholder="0901234567"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Input
            label="Máº­t kháº©u"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            error={errors.password}
            placeholder="Tá»‘i thiá»ƒu 6 kÃ½ tá»±"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input
          label="XÃ¡c nháº­n máº­t kháº©u"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          placeholder="Nháº­p láº¡i máº­t kháº©u"
        />
      </div>

      {/* Seller-specific fields */}
      {isSeller && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-orange-400">ThÃ´ng tin cá»­a hÃ ng</h3>
          <Input
            label="TÃªn cá»­a hÃ ng"
            value={form.businessName}
            onChange={(e) => updateField('businessName', e.target.value)}
            error={errors.businessName}
            placeholder="NhÃ  hÃ ng ABC"
          />
          <Input
            label="Äá»‹a chá»‰ cá»­a hÃ ng"
            value={form.businessAddress}
            onChange={(e) => updateField('businessAddress', e.target.value)}
            error={errors.businessAddress}
            placeholder="123 ÄÆ°á»ng XYZ, Quáº­n 1, TP.HCM"
          />
          <Input
            label="ThÃ´ng tin liÃªn há»‡"
            value={form.contactInfo}
            onChange={(e) => updateField('contactInfo', e.target.value)}
            error={errors.contactInfo}
            placeholder="Số điện thoại hoặc email liên hệ"
          />
        </div>
      )}

      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
        {isSeller ? 'Đăng ký đối tác' : 'Đăng ký tài khoản'}
      </Button>

      {!isSeller && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/50 text-gray-500">Hoặc</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toast.success('Đang chờ Backend tích hợp API Google')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path
                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                fill="#EA4335"
              />
              <path
                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                fill="#4285F4"
              />
              <path
                d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                fill="#FBBC05"
              />
              <path
                d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                fill="#34A853"
              />
            </svg>
            Đăng ký bằng Google
          </button>
        </>
      )}

      <p className="text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link to={ROUTES.LOGIN} className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
          Đăng nhập
        </Link>
      </p>

      {!isSeller && (
        <p className="text-center text-sm text-gray-500">
          Muốn bán hàng?{' '}
          <Link to={ROUTES.REGISTER_SELLER} className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
            Đăng ký đối tác
          </Link>
        </p>
      )}
    </form>
  );
}
