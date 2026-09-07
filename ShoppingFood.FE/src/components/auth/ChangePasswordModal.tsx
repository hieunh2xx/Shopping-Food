import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '../common';
import { authService } from '../../services/AuthService';
import toast from 'react-hot-toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal Đổi Mật Khẩu Người Dùng (ChangePasswordModal).
 * Yêu cầu nhập mật khẩu cũ, mật khẩu mới (tối thiểu 8 ký tự, không trùng mật khẩu cũ) và nhập lại mật khẩu xác nhận.
 */
export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  /**
   * Kiểm tra tính hợp lệ của các trường mật khẩu nhập vào.
   */
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!oldPassword) newErrors.oldPassword = 'Trường mật khẩu không được để trống';
    else if (oldPassword.length < 8) newErrors.oldPassword = 'Mật khẩu cũ cần tối thiểu 8 kí tự';

    if (!newPassword) newErrors.newPassword = 'Trường mật khẩu không được để trống';
    else if (newPassword.length < 8) newErrors.newPassword = 'Mật khẩu mới cần tối thiểu 8 ký tự';
    else if (newPassword === oldPassword) newErrors.newPassword = 'Mật khẩu mới không được giống mật khẩu cũ';
    
    if (!confirmPassword) newErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Mật khẩu được nhập lại không khớp';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gửi yêu cầu đổi mật khẩu lên máy chủ API.
   * @param e - Sự kiện FormEvent
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.changePassword({ oldPassword, newPassword });
      if (!response.error) {
        toast.success(response.message || 'Thay đổi mật khẩu thành công!');
        handleClose();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đóng modal và đặt lại toàn bộ form về trạng thái rỗng.
   */
  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h3>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              error={errors.oldPassword}
              placeholder="Nhập mật khẩu hiện tại"
            />
            
            <Input
              label="Mật khẩu mới"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
              placeholder="Nhập mật khẩu mới"
            />

            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              placeholder="Nhập lại mật khẩu mới"
            />

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Đổi mật khẩu
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
