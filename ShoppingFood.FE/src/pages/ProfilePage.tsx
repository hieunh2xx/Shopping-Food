import { useState, useEffect, useRef } from 'react';
import { authService } from '../services/AuthService';
import { restaurantService } from '../services/RestaurantService';
import type { IUserDto, IFavoriteRestaurantDto } from '../interfaces';
import { Button, Input } from '../components/common';
import toast from 'react-hot-toast';
import { useAuthContext } from '../contexts/AuthContext';
import { Camera, Store, MapPin as MapPinIcon, Star, BadgeCheck, AlertCircle, Heart, Lock, Trash2, Ticket, Plus } from 'lucide-react';
import { ChangePasswordModal } from '../components/auth/ChangePasswordModal';
import { UpdateProfileModal } from '../components/auth/UpdateProfileModal';
import { ChangeContactModal } from '../components/auth/ChangeContactModal';
import { UserAddressManager } from '../components/profile/UserAddressManager';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';
import { FavoriteRestaurants } from '../components/profile/FavoriteRestaurants';
import { CustomerVouchers } from '../components/profile/CustomerVouchers';
import { CustomerLoyalty } from '../components/profile/CustomerLoyalty';

export function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  const { user, updateUser, logout } = useAuthContext();
  const [profile, setProfile] = useState<IUserDto | null>(null);
  const [previewFavorites, setPreviewFavorites] = useState<IFavoriteRestaurantDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
  const [isChangeContactOpen, setIsChangeContactOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
      });
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const [res, favRes] = await Promise.all([
        authService.getProfile(),
        restaurantService.getFavorites({ take: 2 })
      ]);
      if (!res.error && res.data) {
        setProfile(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải thông tin cá nhân');
      }
      if (!favRes.error && favRes.data) {
        setPreviewFavorites(favRes.data);
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

  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    setIsSaving(true);
    try {
      const response = await authService.updateProfile({ 
        fullName: formData.fullName, 
        gender: formData.gender || undefined, 
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined 
      });
      
      if (!response.error) {
        toast.success(response.message || 'Cập nhật thông tin thành công!');
        fetchProfile();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    } finally {
      setIsSaving(false);
    }
  };

  const getTierName = (tier?: string | null) => {
    switch (tier) {
      case 'Bronze': return 'Đồng';
      case 'Silver': return 'Bạc';
      case 'Gold': return 'Vàng';
      case 'Diamond': return 'Kim Cương';
      default: return 'Thân thiết';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10">Đang tải...</div>;
  }

  if (!profile) {
    return <div className="p-10 text-center">Không tìm thấy thông tin cá nhân</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        {activeTab === 'info' && 'Hồ sơ cá nhân'}
        {activeTab === 'address' && 'Sổ địa chỉ'}
        {activeTab === 'favorites' && 'Quán ăn yêu thích'}
        {activeTab === 'vouchers' && 'Ví Voucher'}
        {activeTab === 'loyalty' && 'Điểm thưởng'}
      </h1>

      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            {/* Avatar & Tier */}
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
                <p className="text-gray-600 flex items-center gap-1.5 mt-1 text-sm font-medium">
                  Khách hàng hạng {getTierName(profile.tier)}
                </p>
              </div>
            </div>

            {/* 2-col Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Tên đăng nhập"
                value={profile.userName}
                disabled
                className="bg-gray-50/50"
              />
              <Input
                label="Họ và tên"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="bg-white"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <button type="button" onClick={() => setIsChangeContactOpen(true)} className="text-sm text-red-600 hover:text-red-700 font-medium">
                    {profile.email ? 'Thay đổi' : 'Thêm email'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    value={profile.email || 'Chưa cập nhật'}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-500 focus:outline-none pr-32"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {profile.isEmailActive ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                        <BadgeCheck className="w-3.5 h-3.5" /> Đã xác thực
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5" /> Chưa xác thực
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Input
                label="Số điện thoại"
                value={profile.phone || 'Chưa cập nhật'}
                disabled
                className="bg-gray-50/50"
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                <div className="relative">
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 appearance-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Chưa cập nhật</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-10 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)} className="px-6 border-gray-200 text-gray-700 hover:bg-gray-50">
                Đổi mật khẩu
              </Button>
              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="px-6 bg-orange-600 hover:bg-orange-700"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>

          {/* Previews (2 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address Preview */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Sổ địa chỉ nhận hàng</h3>
                <button
                  onClick={() => setActiveTab('address')}
                  className="text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Thêm mới
                </button>
              </div>
              <div className="flex-1 border-2 border-dashed border-orange-200/50 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-orange-50/30">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                  <MapPinIcon className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">
                  Chưa có địa chỉ nào trong sổ địa chỉ của bạn. Thêm địa chỉ để đặt hàng nhanh chóng hơn
                </p>
              </div>
            </div>

            {/* Favorite Preview */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" /> Quán ăn yêu thích
                </h3>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-4">
                {previewFavorites.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-gray-100">
                    <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Chưa có quán ăn yêu thích</p>
                  </div>
                ) : (
                  previewFavorites.map(rest => (
                    <div key={rest.restaurantId} onClick={() => navigate(ROUTES.RESTAURANT_DETAIL.replace(':id', rest.restaurantId))} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors cursor-pointer bg-white">
                      <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                        <img src={rest.logoUrl || "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=100&h=100"} alt={rest.restaurantName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{rest.restaurantName}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 mb-2">
                          <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> {rest.address || 'Hà Nội'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/30 p-6 rounded-2xl border border-red-200/50 mt-6">
            <h3 className="text-lg font-bold text-red-600 mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Khu vực nguy hiểm (DANGER ZONE)
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleLockAccount}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Lock className="w-4 h-4" /> Khóa tài khoản khẩn cấp
              </button>
              <button
                onClick={handleRequestDeletion}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-200 bg-white text-red-600 font-medium hover:bg-red-50 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Yêu cầu xóa tài khoản vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'address' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <UserAddressManager />
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            Quán ăn yêu thích
          </h3>
          <FavoriteRestaurants />
        </div>
      )}

      {activeTab === 'vouchers' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-orange-500" />
            Ví Voucher của tôi
          </h3>
          <CustomerVouchers />
        </div>
      )}

      {activeTab === 'loyalty' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <CustomerLoyalty />
        </div>
      )}

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
