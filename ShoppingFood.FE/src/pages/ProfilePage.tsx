import { useState, useEffect, useRef } from 'react';
import { authService } from '../services/AuthService';
import type { IUserDto } from '../interfaces';
import { Button, Input } from '../components/common';
import toast from 'react-hot-toast';
import { useAuthContext } from '../contexts/AuthContext';
import { Camera, Store, MapPin, Star, BadgeCheck, AlertCircle } from 'lucide-react';
import { ChangePasswordModal } from '../components/auth/ChangePasswordModal';
import { UpdateProfileModal } from '../components/auth/UpdateProfileModal';
import { ChangeContactModal } from '../components/auth/ChangeContactModal';
import { UserAddressManager } from '../components/profile/UserAddressManager';
import { Lock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthContext();
  const [profile, setProfile] = useState<IUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
  const [isChangeContactOpen, setIsChangeContactOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await authService.getProfile();
      if (!res.error && res.data) {
        setProfile(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải thông tin cá nhân');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB');
      return;
    }

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExtensions.includes(extension)) {
      toast.error('Chỉ cho phép tải lên các tệp ảnh (.jpg, .jpeg, .png, .webp).');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh lên...');

    try {
      const res = await authService.uploadAvatar(file);
      if (!res.error && res.data) {
        const newAvatarUrl = res.data.avatarUrl;
        setProfile(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);
        if (user) {
          updateUser({ ...user, avatarUrl: newAvatarUrl });
        }
        toast.success('Cập nhật ảnh đại diện thành công!', { id: toastId });
      } else {
        toast.error(res.message || 'Lỗi khi tải ảnh lên', { id: toastId });
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải ảnh', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLockAccount = async () => {
    if (!confirm('Bạn có chắc muốn KHÓA tài khoản này? Bạn sẽ bị đăng xuất và cần dùng Email/SĐT để lấy lại quyền truy cập.')) return;
    setIsLoading(true);
    try {
      const res = await authService.lockAccount();
      if (!res.error) {
        toast.success(res.message || 'Tài khoản đã bị khóa.');
        await logout();
        navigate(ROUTES.LOGIN);
      } else {
        toast.error(res.message || 'Lỗi hệ thống');
      }
    } catch {
      toast.error('Lỗi hệ thống');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!confirm('CẢNH BÁO: Xóa tài khoản là hành động không thể hoàn tác! Tài khoản sẽ bị xóa sau 30 ngày. Bạn chắc chứ?')) return;
    setIsLoading(true);
    try {
      const res = await authService.requestDeletion();
      if (!res.error) {
        toast.success(res.message || 'Đã gửi yêu cầu xóa tài khoản.');
        await logout();
        navigate(ROUTES.LOGIN);
      } else {
        toast.error(res.message || 'Lỗi hệ thống');
      }
    } catch {
      toast.error('Lỗi hệ thống');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10">Đang tải...</div>;
  }

  if (!profile) {
    return <div className="p-10 text-center">Không tìm thấy thông tin cá nhân</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Hồ sơ cá nhân</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-6 mb-8">
          <div
            className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden relative group cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Camera className="w-8 h-8 text-white" />
            </div>

            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName || profile.userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl font-bold uppercase bg-gray-100">
                {(profile.fullName || profile.userName).charAt(0)}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{profile.fullName || profile.userName}</h2>
            <p className="text-gray-500 capitalize">Vai trò: {profile.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Tên đăng nhập"
            value={profile.userName}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Họ và tên"
            value={profile.fullName || ''}
            disabled
            className="bg-gray-50"
          />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <button
                type="button"
                onClick={() => setIsChangeContactOpen(true)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {profile.email ? 'Thay đổi' : 'Thêm email'}
              </button>
            </div>
            <div className="relative">
              <input
                value={profile.email || 'Chưa cập nhật'}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 focus:outline-none pr-32"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {profile.isEmailActive ? (
                  <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <BadgeCheck className="w-3.5 h-3.5 mr-1" />
                    Đã xác thực
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    Chưa xác thực
                  </span>
                )}
              </div>
            </div>
          </div>
          <Input
            label="Số điện thoại"
            value={profile.phone || 'Chưa cập nhật'}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Giới tính"
            value={profile.gender === 'Male' ? 'Nam' : profile.gender === 'Female' ? 'Nữ' : profile.gender === 'Other' ? 'Khác' : 'Chưa cập nhật'}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Ngày sinh"
            value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
            disabled
            className="bg-gray-50"
          />
        </div>

        {profile.sellerInfo && (
          <div className="mt-8 border-t border-gray-100 pt-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <Store className="w-6 h-6 text-orange-500" />
              Thông tin Cửa hàng
            </h3>

            <div className="flex items-start gap-6">
              {profile.sellerInfo.logoUrl ? (
                <img src={profile.sellerInfo.logoUrl} alt="Logo" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                  <Store className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{profile.sellerInfo.restaurantName}</h4>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {profile.sellerInfo.address}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center text-orange-500">
                    <Star className="w-5 h-5 fill-current mr-1" />
                    <span className="font-semibold">{profile.sellerInfo.averageRating.toFixed(1)}</span>
                    <span className="text-gray-400 ml-1">({profile.sellerInfo.reviewCount} đánh giá)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-4">
          <Button variant="secondary" onClick={() => setIsChangePasswordOpen(true)}>
            Đổi mật khẩu
          </Button>
          <Button onClick={() => setIsUpdateProfileOpen(true)}>
            Cập nhật thông tin
          </Button>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <UserAddressManager />
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-red-100">
        <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Khu vực nguy hiểm (DANGER ZONE)
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleLockAccount}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-yellow-500 text-yellow-600 font-medium hover:bg-yellow-50 transition-colors"
          >
            <Lock className="w-5 h-5" />
            Khóa tài khoản khẩn cấp
          </button>
          <button
            onClick={handleRequestDeletion}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-500 text-red-600 font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Yêu cầu xóa tài khoản
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <UpdateProfileModal
        isOpen={isUpdateProfileOpen}
        onClose={() => setIsUpdateProfileOpen(false)}
        profile={profile}
        onSuccess={fetchProfile}
      />

      <ChangeContactModal
        isOpen={isChangeContactOpen}
        onClose={() => setIsChangeContactOpen(false)}
        onSuccess={fetchProfile}
      />
    </div>
  );
}
