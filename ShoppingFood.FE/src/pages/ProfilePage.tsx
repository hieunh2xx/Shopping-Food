import { useState, useEffect } from 'react';
import { authService } from '../services/AuthService';
import type { IUserDto } from '../interfaces';
import { Button, Input } from '../components/common';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const [profile, setProfile] = useState<IUserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName || profile.userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold uppercase">
                {(profile.fullName || profile.userName).charAt(0)}
              </div>
            )}
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
          <Input 
            label="Email" 
            value={profile.email || 'Chưa cập nhật'} 
            disabled 
            className="bg-gray-50"
          />
          <Input 
            label="Số điện thoại" 
            value={profile.phone || 'Chưa cập nhật'} 
            disabled 
            className="bg-gray-50"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="secondary" className="mr-4">Đổi mật khẩu</Button>
          <Button disabled title="Tính năng đang phát triển">Cập nhật thông tin</Button>
        </div>
      </div>
    </div>
  );
}
