import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UploadCloud, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button, Input, DocumentViewerModal, Modal, Loading } from '../common';
import { useAuth } from '../../hooks';
import { ROUTES } from '../../routes/routeConfig';
import toast from 'react-hot-toast';
import { auth } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { supportService } from '../../services/SupportService';
interface RegisterFormProps {
  isSeller?: boolean;
}

export function RegisterForm({ isSeller = false }: RegisterFormProps) {
  const navigate = useNavigate();
  const { register, registerSeller, isLoading } = useAuth();

  // Multi-step State
  const [step, setStep] = useState(1);
  const [isOtpSent, setIsOtpSent] = useState(false);
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
    otpCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedShopFile, setSelectedShopFile] = useState<File | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [legalModalState, setLegalModalState] = useState({
    isOpen: false,
    title: '',
    content: '',
    isLoading: false,
  });

  const handleOpenLegalModal = async (e: React.MouseEvent, type: 'terms' | 'privacy') => {
    e.preventDefault();
    setLegalModalState({
      isOpen: true,
      title: type === 'terms' ? 'Điều khoản dịch vụ' : 'Chính sách bảo mật',
      content: '',
      isLoading: true,
    });

    try {
      const response = await supportService.getLegalSettings();
      if (!response.error && response.data) {
        setLegalModalState(prev => ({
          ...prev,
          content: type === 'terms' ? (isSeller ? response.data.termsOfUseSeller : response.data.termsOfUseCustomer) || 'Chưa có nội dung' : (response.data.privacyPolicy || 'Chưa có nội dung'),
          isLoading: false
        }));
      } else {
        setLegalModalState(prev => ({ ...prev, content: 'Không thể tải nội dung.', isLoading: false }));
      }
    } catch (error) {
      setLegalModalState(prev => ({ ...prev, content: 'Lỗi kết nối. Vui lòng thử lại sau.', isLoading: false }));
    }
  };

  useEffect(() => {
    // Initialize recaptcha if not already initialized
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-register-container', {
        size: 'invisible'
      });
    }
  }, []);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewShopUrl, setPreviewShopUrl] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isShopViewerOpen, setIsShopViewerOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File không được vượt quá 5MB');
      return;
    }

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    if (!allowedExtensions.includes(extension)) {
      toast.error('Chỉ chấp nhận các định dạng file .pdf, .doc, .docx, .png, .jpg, .jpeg');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setForm(prev => ({ ...prev, businessLicenseUrl: file.name }));

    if (errors.businessLicenseUrl) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.businessLicenseUrl;
        return next;
      });
    }
  };

  const handleShopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File không được vượt quá 5MB');
      return;
    }

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    if (!allowedExtensions.includes(extension)) {
      toast.error('Chỉ chấp nhận các định dạng ảnh .png, .jpg, .jpeg, .webp');
      return;
    }

    setSelectedShopFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewShopUrl(objectUrl);
    setForm(prev => ({ ...prev, shopImageUrl: file.name }));

    if (errors.shopImageUrl) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.shopImageUrl;
        return next;
      });
    }
  };

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

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.userName.trim()) newErrors.userName = 'Vui lòng nhập tên đăng nhập';
    else if (form.userName.length > 50) newErrors.userName = 'Tối đa 50 ký tự';

    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) newErrors.password = 'Tối thiểu 6 ký tự';

    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp';

    if (!form.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    else if (form.fullName.length > 100) newErrors.fullName = 'Tối đa 100 ký tự';

    if (!form.email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email không hợp lệ';

    if (!form.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^\d{9,15}$/.test(form.phone)) newErrors.phone = 'Số điện thoại 9-15 chữ số';

    if (!isSeller && !agreedToTerms) newErrors.agreedToTerms = 'Bạn phải đồng ý với Điều khoản và Chính sách';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.businessName.trim()) newErrors.businessName = 'Vui lòng nhập tên cửa hàng';
    if (!form.businessAddress.trim()) newErrors.businessAddress = 'Vui lòng nhập địa chỉ';
    if (!form.contactInfo.trim()) newErrors.contactInfo = 'Vui lòng nhập thông tin liên hệ';
    if (!selectedFile) newErrors.businessLicenseUrl = 'Vui lòng tải lên Hợp đồng/Giấy phép';
    if (!selectedShopFile) newErrors.shopImageUrl = 'Vui lòng tải lên Ảnh chụp mặt tiền cửa hàng';
    if (!agreedToTerms) newErrors.agreedToTerms = 'Bạn phải đồng ý với Điều khoản và Chính sách';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => setStep(1);

  useEffect(() => {
    if (isOtpSent && form.otpCode.length === 6 && !isLoading) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.otpCode]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (isSeller) {
      if (!validateStep2()) return;
    } else {
      if (!validateStep1()) return;
    }

    const idToken = 'bypass';

    if (isSeller) {
      const result = await registerSeller({
        userName: form.userName,
        password: form.password,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        businessName: form.businessName,
        businessAddress: form.businessAddress,
        businessLicenseUrl: form.businessLicenseUrl || 'pending.jpg',
        shopImageUrl: form.shopImageUrl || 'pending.jpg',
        contactInfo: form.contactInfo,
        idToken: idToken,
      });
      if (result.success) {
        navigate(ROUTES.LOGIN);
      } else if (result.errors) {
        const mappedErrors: Record<string, string> = {};
        Object.keys(result.errors).forEach(key => {
          const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
          mappedErrors[lowerKey] = result.errors[key][0];
        });
        setErrors(mappedErrors);
        if (mappedErrors.userName || mappedErrors.email || mappedErrors.phone || mappedErrors.password) {
          setStep(1);
        }
      }
    } else {
      const result = await register({
        userName: form.userName,
        password: form.password,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        role: 'Customer',
        idToken: idToken,
      });
      if (result.success) {
        navigate(ROUTES.LOGIN);
      } else if (result.errors) {
        const mappedErrors: Record<string, string> = {};
        Object.keys(result.errors).forEach(key => {
          const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
          mappedErrors[lowerKey] = result.errors[key][0];
        });
        setErrors(mappedErrors);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Stepper (Only for Seller) */}
      {isSeller && (
        <div className="mb-8 relative">
          <div className="flex items-center justify-between">
            <div className={`flex flex-col items-center flex-1 z-10 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${step >= 1 ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-200 text-gray-500'}`}>
                1
              </div>
              <span className="text-xs font-semibold">Tài khoản</span>
            </div>

            <div className="flex-1 h-[2px] bg-gray-200 absolute top-4 left-1/4 right-1/4 -z-0">
              <div
                className="h-full bg-orange-600 transition-all duration-300"
                style={{ width: step === 2 ? '100%' : '0%' }}
              />
            </div>

            <div className={`flex flex-col items-center flex-1 z-10 ${step === 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${step === 2 ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              <span className="text-xs font-semibold">Cửa hàng</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* STEP 1: ACCOUNT INFO */}
        <div className={`space-y-4 transition-all duration-300 ${step === 1 ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              required
              label="Tên đăng nhập"
              value={form.userName}
              onChange={(e) => updateField('userName', e.target.value)}
              error={errors.userName}
              placeholder="username"
            />
            <Input
              required
              label="Họ và tên"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              error={errors.fullName}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <Input
            required
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={errors.email}
            placeholder="email@example.com"
          />

          <Input
            required
            label="Số điện thoại"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            error={errors.phone}
            placeholder="0901234567"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                required
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                error={errors.password}
                placeholder="Tối thiểu 6 ký tự"
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
              required
              label="Xác nhận mật khẩu"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          {!isSeller && (
            <div className="pt-2 pb-2 border-t border-gray-100 mt-4">
              <label className="flex items-start gap-2 cursor-pointer group">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    name="agreedToTerms"
                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer peer"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (e.target.checked && errors.agreedToTerms) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.agreedToTerms;
                          return next;
                        });
                      }
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 select-none">
                  Tôi đã đọc và đồng ý với{' '}
                  <a href="#" onClick={(e) => handleOpenLegalModal(e, 'terms')} className="text-orange-600 hover:underline font-medium">
                    Điều khoản dịch vụ
                  </a>{' '}
                  và{' '}
                  <a href="#" onClick={(e) => handleOpenLegalModal(e, 'privacy')} className="text-orange-600 hover:underline font-medium">
                    Chính sách bảo mật
                  </a>
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreedToTerms}</p>
              )}
            </div>
          )}

          {isSeller ? (
            <Button type="button" onClick={handleNext} className="w-full mt-6" size="lg">
              Tiếp tục
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button type="submit" isLoading={isLoading} className="w-full mt-6 shadow-lg shadow-orange-500/25" size="lg">
              Đăng ký
            </Button>
          )}
        </div>

        {/* STEP 2: SELLER INFO */}
        {isSeller && (
          <div className={`space-y-4 transition-all duration-300 ${step === 2 ? 'block' : 'hidden'}`}>
            <Input
              required
              label="Tên cửa hàng"
              value={form.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              error={errors.businessName}
              placeholder="Nhà hàng ABC"
            />
            <Input
              required
              label="Địa chỉ cửa hàng"
              value={form.businessAddress}
              onChange={(e) => updateField('businessAddress', e.target.value)}
              error={errors.businessAddress}
              placeholder="123 Đường XYZ, Quận 1, TP.HCM"
            />
            <Input
              required
              label="Thông tin liên hệ (SĐT / Email shop)"
              value={form.contactInfo}
              onChange={(e) => updateField('contactInfo', e.target.value)}
              error={errors.contactInfo}
              placeholder="Hotline: 1900 xxxx"
            />

            {/* Document Upload Area */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hợp đồng / Giấy phép kinh doanh <span className="text-red-500">*</span>
              </label>
              <div className={`border-2 border-dashed rounded-xl p-6 transition-colors ${errors.businessLicenseUrl ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-orange-500 bg-gray-50'}`}>
                <div className="flex flex-col items-center justify-center text-center">
                  {!selectedFile ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6 text-orange-600" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Kéo thả file vào đây hoặc click để chọn</p>
                      <p className="text-xs text-gray-500 mb-4">Hỗ trợ: PDF, DOC, DOCX, PNG, JPG (Tối đa 5MB)</p>
                      <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Chọn File
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,image/png,image/jpeg"
                          onChange={handleFileChange}
                        />
                      </label>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsViewerOpen(true)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Xem</span>
                        </button>
                        <label className="cursor-pointer p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">
                          Đổi file
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,image/png,image/jpeg"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {errors.businessLicenseUrl && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full inline-block"></span>
                  {errors.businessLicenseUrl}
                </p>
              )}
            </div>

            {/* Shop Image Upload Area */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh chụp mặt tiền cửa hàng <span className="text-red-500">*</span>
              </label>
              <div className={`border-2 border-dashed rounded-xl p-6 transition-colors ${errors.shopImageUrl ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-orange-500 bg-gray-50'}`}>
                <div className="flex flex-col items-center justify-center text-center">
                  {!selectedShopFile ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6 text-orange-600" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Kéo thả file vào đây hoặc click để chọn</p>
                      <p className="text-xs text-gray-500 mb-4">Hỗ trợ: PNG, JPG, JPEG, WEBP (Tối đa 5MB)</p>
                      <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Chọn File
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleShopFileChange}
                        />
                      </label>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedShopFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedShopFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsShopViewerOpen(true)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Xem</span>
                        </button>
                        <label className="cursor-pointer p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">
                          Đổi file
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleShopFileChange}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {errors.shopImageUrl && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full inline-block"></span>
                  {errors.shopImageUrl}
                </p>
              )}
            </div>

            <div className="pt-2 pb-2 border-t border-gray-100 mt-4">
              <label className="flex items-start gap-2 cursor-pointer group">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    name="agreedToTerms"
                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer peer"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (e.target.checked && errors.agreedToTerms) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.agreedToTerms;
                          return next;
                        });
                      }
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 select-none">
                  Tôi đã đọc và đồng ý với{' '}
                  <a href="#" onClick={(e) => handleOpenLegalModal(e, 'terms')} className="text-orange-600 hover:underline font-medium">
                    Điều khoản dịch vụ
                  </a>{' '}
                  và{' '}
                  <a href="#" onClick={(e) => handleOpenLegalModal(e, 'privacy')} className="text-orange-600 hover:underline font-medium">
                    Chính sách bảo mật
                  </a>
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreedToTerms}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="secondary" onClick={handleBack} className="w-1/3">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Quay lại
              </Button>
              <Button type="submit" isLoading={isLoading} className="flex-1 shadow-lg shadow-orange-500/25">
                Hoàn tất đăng ký
              </Button>
            </div>
          </div>
        )}



        {step === 1 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Đã có tài khoản?{' '}
            <Link to={ROUTES.LOGIN} className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
              Đăng nhập
            </Link>
          </p>
        )}

        {step === 1 && !isSeller && (
          <div className="space-y-1 mt-2">
            <p className="text-center text-sm text-gray-500">
              Muốn bán hàng?{' '}
              <Link to={ROUTES.REGISTER_SELLER} className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
                Đăng ký đối tác
              </Link>
            </p>
            <p className="text-center text-sm text-gray-500">
              Muốn giao hàng?{' '}
              <Link to={ROUTES.REGISTER_SHIPPER} className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
                Đăng ký làm tài xế
              </Link>
            </p>
          </div>
        )}
      </form>

      {/* Recaptcha Container for Firebase Phone Auth */}
      <div id="recaptcha-register-container"></div>

      {/* Viewer Modal */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        fileUrl={previewUrl}
        fileType={selectedFile?.type || null}
        fileName={selectedFile?.name || null}
      />
      <DocumentViewerModal
        isOpen={isShopViewerOpen}
        onClose={() => setIsShopViewerOpen(false)}
        fileUrl={previewShopUrl}
        fileType={selectedShopFile?.type || null}
        fileName={selectedShopFile?.name || null}
      />
      {/* Legal Modal */}
      <Modal
        isOpen={legalModalState.isOpen}
        onClose={() => setLegalModalState(prev => ({ ...prev, isOpen: false }))}
        title={legalModalState.title}
        size="lg"
      >
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {legalModalState.isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loading size="md" />
            </div>
          ) : (
            <div
              className="prose prose-orange max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: legalModalState.content }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
