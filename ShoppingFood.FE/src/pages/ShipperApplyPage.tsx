import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight, ChevronLeft, ChefHat, CheckCircle2, UploadCloud } from 'lucide-react';
import { Button, Input } from '../components/common';
import { authService } from '../services/AuthService';
import { toast } from 'react-hot-toast';
import { ROUTES } from '../routes/routeConfig';

// --- File Upload UI ---
const FileUploadField = ({
  label, file, errorKey, required = true, setter, handleFileSelect, errors
}: {
  label: string; file: File | null; errorKey: string; required?: boolean;
  setter: React.Dispatch<React.SetStateAction<File | null>>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>, errorKey: string) => void;
  errors: Record<string, string>;
}) => (
  <div className="pt-1">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className={`border-2 border-dashed rounded-xl p-5 transition-colors ${errors[errorKey] ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-orange-500 bg-gray-50'}`}>
      <div className="flex flex-col items-center justify-center text-center">
        {!file ? (
          <>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <UploadCloud className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mb-3">PNG, JPG, JPEG, WEBP (Tối đa 5MB)</p>
            <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Chọn File
              <input type="file" className="hidden" accept="image/*"
                onChange={e => handleFileSelect(e, setter, errorKey)} />
            </label>
          </>
        ) : (
          <div className="w-full flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <label className="cursor-pointer p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium shrink-0">
              Đổi file
              <input type="file" className="hidden" accept="image/*"
                onChange={e => handleFileSelect(e, setter, errorKey)} />
            </label>
          </div>
        )}
      </div>
    </div>
    {errors[errorKey] && (
      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
        <span className="w-1 h-1 bg-red-600 rounded-full inline-block"></span>
        {errors[errorKey]}
      </p>
    )}
  </div>
);

export function ShipperApplyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    userName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    fullName: '',
    identityCardNumber: '',
    vehicleType: 'Motorcycle',
    vehiclePlateNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);
  const [vehicleRegFile, setVehicleRegFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  // --- Validations ---
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.identityCardNumber.trim()) newErrors.identityCardNumber = 'Vui lòng nhập số CMND/CCCD';
    if (!idFrontFile) newErrors.idFrontFile = 'Vui lòng tải lên mặt trước CMND/CCCD';
    if (!idBackFile) newErrors.idBackFile = 'Vui lòng tải lên mặt sau CMND/CCCD';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.vehiclePlateNumber.trim()) newErrors.vehiclePlateNumber = 'Vui lòng nhập biển kiểm soát';
    if (!driverLicenseFile) newErrors.driverLicenseFile = 'Vui lòng tải lên bằng lái xe';
    if (!vehicleRegFile) newErrors.vehicleRegFile = 'Vui lòng tải lên giấy đăng ký xe';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => setStep(prev => prev - 1);

  // --- File helpers ---
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const maxFileSize = 5 * 1024 * 1024;

  const validateFileHelper = (file: File, name: string) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`${name} phải là tệp ảnh (.jpg, .jpeg, .png, .webp).`);
    }
    if (file.size > maxFileSize) {
      throw new Error(`${name} không được vượt quá 5MB`);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    errorKey: string
  ) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      try {
        validateFileHelper(file, errorKey);
        setter(file);
        if (errors[errorKey]) {
          setErrors(prev => { const next = { ...prev }; delete next[errorKey]; return next; });
        }
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    try {
      validateFileHelper(idFrontFile!, 'Mặt trước CMND/CCCD');
      validateFileHelper(idBackFile!, 'Mặt sau CMND/CCCD');
      validateFileHelper(driverLicenseFile!, 'Bằng lái xe');
      validateFileHelper(vehicleRegFile!, 'Giấy đăng ký xe');
      if (avatarFile) validateFileHelper(avatarFile, 'Ảnh đại diện');
    } catch (err: any) {
      toast.error(err.message);
      return;
    }

    setLoading(true);
    try {
      const filesToUpload = [
        { file: idFrontFile!, name: 'Mặt trước CMND/CCCD' },
        { file: idBackFile!, name: 'Mặt sau CMND/CCCD' },
        { file: driverLicenseFile!, name: 'Bằng lái xe' },
        { file: vehicleRegFile!, name: 'Giấy đăng ký xe' },
        ...(avatarFile ? [{ file: avatarFile, name: 'Ảnh đại diện' }] : [])
      ];

      const uploadResults = [];
      for (const item of filesToUpload) {
        if (!item.file) continue;
        try {
          const res = await authService.uploadImage(item.file);
          if (res.error || !res.data) {
            throw new Error(res.message || `Lỗi tải lên ${item.name}`);
          }
          uploadResults.push(res);
        } catch (err: any) {
          toast.error(`Lỗi tải lên ${item.name}: ${err.response?.data?.message || err.message}`);
          setLoading(false);
          return;
        }
      }

      const res = await authService.registerShipper({
        userName: form.userName,
        password: form.password,
        phone: form.phone,
        email: form.email,
        fullName: form.fullName,
        identityCardNumber: form.identityCardNumber,
        vehicleType: form.vehicleType,
        vehiclePlateNumber: form.vehiclePlateNumber,
        identityCardFrontUrl: uploadResults[0].data.imageUrl,
        identityCardBackUrl: uploadResults[1].data.imageUrl,
        driverLicenseUrl: uploadResults[2].data.imageUrl,
        vehicleRegistrationUrl: uploadResults[3].data.imageUrl,
        avatarUrl: avatarFile ? uploadResults[4].data.imageUrl : null
      });

      if (res.error) {
        toast.error(res.message || 'Có lỗi xảy ra');
      } else {
        toast.success('Đăng ký tài xế thành công! Vui lòng chờ phê duyệt.');
        navigate(ROUTES.HOME);
      }
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  // --- Stepper ---
  const steps = [
    { num: 1, label: 'Tài khoản' },
    { num: 2, label: 'Giấy tờ' },
    { num: 3, label: 'Phương tiện' }
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left — Decorative */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-gray-50 to-gray-50" />
        <div className="absolute top-32 left-16 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-12 group cursor-pointer hover:scale-105 transition-transform w-fit">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/20">
              <ChefHat className="w-7 h-7 text-gray-900" />
            </div>
            <span className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Shopping Food</span>
          </Link>

          <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
            Trở thành
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              đối tác giao hàng
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-md leading-relaxed">
            Tự do thời gian, thu nhập hấp dẫn. Đăng ký ngay để trở thành tài xế Shopping Food.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChefHat className="w-6 h-6 text-gray-900" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Shopping Food
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký tài xế</h1>
            <p className="text-sm text-gray-500">Điền thông tin để bắt đầu giao hàng</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* Stepper */}
            <div className="mb-8 relative">
              <div className="flex items-center justify-between">
                {steps.map((s) => (
                  <div key={s.num} className={`flex flex-col items-center flex-1 z-10 ${step >= s.num ? 'text-orange-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${step >= s.num ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-200 text-gray-500'}`}>
                      {s.num}
                    </div>
                    <span className="text-xs font-semibold">{s.label}</span>
                  </div>
                ))}
              </div>
              {/* Progress bars */}
              <div className="absolute top-4 left-[16.6%] right-[16.6%] flex -z-0">
                <div className="flex-1 h-[2px] bg-gray-200 mx-1">
                  <div className="h-full bg-orange-600 transition-all duration-300" style={{ width: step >= 2 ? '100%' : '0%' }} />
                </div>
                <div className="flex-1 h-[2px] bg-gray-200 mx-1">
                  <div className="h-full bg-orange-600 transition-all duration-300" style={{ width: step >= 3 ? '100%' : '0%' }} />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ===== STEP 1: Thông tin tài khoản ===== */}
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 transition-colors">
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

                <Button type="button" onClick={handleNext} className="w-full mt-6" size="lg">
                  Tiếp tục
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* ===== STEP 2: Giấy tờ cá nhân ===== */}
              <div className={`space-y-4 transition-all duration-300 ${step === 2 ? 'block' : 'hidden'}`}>
                <Input
                  required
                  label="Số CMND/CCCD"
                  value={form.identityCardNumber}
                  onChange={(e) => updateField('identityCardNumber', e.target.value)}
                  error={errors.identityCardNumber}
                  placeholder="Nhập số CMND hoặc CCCD"
                />

                <FileUploadField label="Ảnh CMND/CCCD Mặt trước" file={idFrontFile} errorKey="idFrontFile" setter={setIdFrontFile} handleFileSelect={handleFileSelect} errors={errors} />
                <FileUploadField label="Ảnh CMND/CCCD Mặt sau" file={idBackFile} errorKey="idBackFile" setter={setIdBackFile} handleFileSelect={handleFileSelect} errors={errors} />

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="secondary" onClick={handleBack} className="w-1/3">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Quay lại
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1">
                    Tiếp tục
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>

              {/* ===== STEP 3: Phương tiện & Bằng lái ===== */}
              <div className={`space-y-4 transition-all duration-300 ${step === 3 ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại phương tiện <span className="text-red-500">*</span></label>
                    <select value={form.vehicleType} onChange={e => updateField('vehicleType', e.target.value)}
                      className="block w-full rounded-xl border-gray-300 border shadow-sm bg-gray-50 p-2.5 text-sm focus:border-orange-500 focus:ring-orange-500">
                      <option value="Motorcycle">Xe máy</option>
                      <option value="ElectricMotorbike">Xe điện</option>
                      <option value="Car">Ô tô</option>
                    </select>
                  </div>
                  <Input
                    required
                    label="Biển kiểm soát"
                    value={form.vehiclePlateNumber}
                    onChange={(e) => updateField('vehiclePlateNumber', e.target.value)}
                    error={errors.vehiclePlateNumber}
                    placeholder="29A-123.45"
                  />
                </div>

                <FileUploadField label="Ảnh bằng lái xe" file={driverLicenseFile} errorKey="driverLicenseFile" setter={setDriverLicenseFile} handleFileSelect={handleFileSelect} errors={errors} />
                <FileUploadField label="Ảnh giấy đăng ký xe (Cà vẹt)" file={vehicleRegFile} errorKey="vehicleRegFile" setter={setVehicleRegFile} handleFileSelect={handleFileSelect} errors={errors} />
                <FileUploadField label="Ảnh chân dung / đại diện" file={avatarFile} errorKey="avatarFile" required={false} setter={setAvatarFile} handleFileSelect={handleFileSelect} errors={errors} />

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="secondary" onClick={handleBack} className="w-1/3">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Quay lại
                  </Button>
                  <Button type="submit" isLoading={loading} className="flex-1 shadow-lg shadow-orange-500/25">
                    Hoàn tất đăng ký
                  </Button>
                </div>
              </div>

              {/* Footer links — step 1 only */}
              {step === 1 && (
                <div className="space-y-1 mt-4">
                  <p className="text-center text-sm text-gray-500">
                    Đã có tài khoản?{' '}
                    <Link to={ROUTES.LOGIN} className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
                      Đăng nhập
                    </Link>
                  </p>
                  <p className="text-center text-sm text-gray-500">
                    Muốn bán hàng?{' '}
                    <Link to={ROUTES.REGISTER_SELLER} className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
                      Đăng ký đối tác
                    </Link>
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
