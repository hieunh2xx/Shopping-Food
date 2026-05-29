import { useState, useEffect, type FormEvent } from 'react';
import { userAddressService, type IUserAddressDto, type IAddUserAddress } from '../../services/UserAddressService';
import { Button, Input } from '../common';
import { MapPin, Check, Trash2, Edit2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export function UserAddressManager() {
  const [addresses, setAddresses] = useState<IUserAddressDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await userAddressService.getAddresses();
      if (!res.error && res.data) {
        setAddresses(res.data);
      }
    } catch (error) {
      toast.error('Lỗi tải sổ địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setContactName('');
    setContactPhone('');
    setAddressLine('');
    setIsDefault(false);
    setEditingId(null);
    setFormErrors({});
    setIsFormOpen(false);
  };

  const handleOpenEdit = (addr: IUserAddressDto) => {
    setContactName(addr.contactName);
    setContactPhone(addr.contactPhone);
    setAddressLine(addr.addressLine);
    setIsDefault(addr.isDefault);
    setEditingId(addr.id);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!contactName.trim()) errors.contactName = 'Vui lòng nhập tên người nhận';
    if (!contactPhone.trim()) errors.contactPhone = 'Vui lòng nhập số điện thoại';
    if (!addressLine.trim()) errors.addressLine = 'Vui lòng nhập địa chỉ cụ thể';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const data: IAddUserAddress = { contactName, contactPhone, addressLine, isDefault };

    try {
      let res;
      if (editingId) {
        res = await userAddressService.updateAddress(editingId, data);
      } else {
        res = await userAddressService.addAddress(data);
      }

      if (!res.error) {
        toast.success(editingId ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới');
        resetForm();
        fetchAddresses();
      } else {
        toast.error(res.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    setIsLoading(true);
    try {
      const res = await userAddressService.deleteAddress(id);
      if (!res.error) {
        toast.success('Đã xóa địa chỉ');
        fetchAddresses();
      } else {
        toast.error(res.message || 'Lỗi khi xóa');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await userAddressService.setDefaultAddress(id);
      if (!res.error) {
        toast.success('Đã đặt làm địa chỉ mặc định');
        fetchAddresses();
      } else {
        toast.error(res.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Sổ địa chỉ nhận hàng</h2>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm địa chỉ mới
          </Button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tên người nhận"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                error={formErrors.contactName}
                placeholder="Nhập tên người nhận"
              />
              <Input
                label="Số điện thoại"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                error={formErrors.contactPhone}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <Input
              label="Địa chỉ cụ thể (Số nhà, ngõ, đường, phường/xã, quận/huyện...)"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              error={formErrors.addressLine}
              placeholder="VD: 123 Đường ABC, Phường XYZ..."
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700">
                Đặt làm địa chỉ mặc định
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Lưu địa chỉ
              </Button>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && addresses.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có địa chỉ nào trong sổ địa chỉ của bạn</p>
          <p className="text-sm text-gray-400 mt-1">Thêm địa chỉ để đặt hàng nhanh chóng hơn</p>
        </div>
      )}

      <div className="grid gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className={`p-4 rounded-xl border ${addr.isDefault ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200 bg-white'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{addr.contactName}</h4>
                  <span className="text-gray-300">|</span>
                  <p className="text-gray-600 text-sm font-medium">{addr.contactPhone}</p>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                      <Check className="w-3 h-3" />
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{addr.addressLine}</p>
              </div>
              <div className="flex items-center gap-2">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Đặt làm mặc định"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleOpenEdit(addr)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa địa chỉ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
