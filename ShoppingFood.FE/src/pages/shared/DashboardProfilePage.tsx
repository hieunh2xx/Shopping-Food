import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services';
import type { IUserDto } from '../../interfaces';
import { Button } from '../../components/common';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { UpdateProfileModal } from '../../components/auth/UpdateProfileModal';
import { ChangeContactModal } from '../../components/auth/ChangeContactModal';

export function DashboardProfilePage() {
  const { user, updateUser } = useAuthContext();
  const [profile, setProfile] = useState<IUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
  const [isChangeContactOpen, setIsChangeContactOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    const toastId = toast.loading('Đang tải ảnh lên...');
    setIsUploading(true);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-10 text-center">Không tìm thấy thông tin cá nhân</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
        <Button
          variant="outline"
          onClick={() => setIsChangePasswordOpen(true)}
        >
          Đổi mật khẩu
        </Button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div
            className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden relative group cursor-pointer border-2 border-transparent hover:border-orange-500 transition-all shrink-0"
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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="absolute bottom-0 right-0 bg-orange-600 text-white p-1 rounded-full border-2 border-white z-20">
              <Camera className="w-3 h-3" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.fullName || profile.userName}</h2>
            <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
              Thông tin liên hệ
              <button
                onClick={() => setIsChangeContactOpen(true)}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline"
              >
                Chỉnh sửa
              </button>
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Email</span>
                <p className="font-medium text-gray-900">{profile.email}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
              Thông tin cơ bản
              <button
                onClick={() => setIsUpdateProfileOpen(true)}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline"
              >
                Chỉnh sửa
              </button>
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Họ tên</span>
                <p className="font-medium text-gray-900">{profile.fullName || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Giới tính</span>
                <p className="font-medium text-gray-900">
                  {profile.gender === 'Male' ? 'Nam' : profile.gender === 'Female' ? 'Nữ' : 'Khác'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 block mb-1">Ngày sinh</span>
                <p className="font-medium text-gray-900">
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
              </div>
            </div>
          </div>
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
