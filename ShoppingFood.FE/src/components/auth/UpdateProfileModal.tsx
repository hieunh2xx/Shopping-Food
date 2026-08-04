import { useState, useEffect, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '../common';
import { authService } from '../../services/AuthService';
import type { IUserDto } from '../../interfaces';
import toast from 'react-hot-toast';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: IUserDto | null;
  onSuccess: () => void;
}

export function UpdateProfileModal({ isOpen, onClose, profile, onSuccess }: UpdateProfileModalProps) {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile && isOpen) {
      setFullName(profile.fullName || '');
      setGender(profile.gender || '');
      setDateOfBirth(profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '');
      setErrors({});
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.updateProfile({ 
        fullName, 
        gender: gender || undefined, 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined 
      });
      
      if (!response.error) {
        toast.success(response.message || 'Cập nhật thông tin thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Cập nhật thông tin</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              placeholder="Nhập họ và tên"
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm bg-white text-gray-900"
              >
                <option value="">Chọn giới tính</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            <Input
              label="Ngày sinh"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />

            <Button type="submit" isLoading={isLoading} className="w-full mt-4">
              Lưu thay đổi
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
