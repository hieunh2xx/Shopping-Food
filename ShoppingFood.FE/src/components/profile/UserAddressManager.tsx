import { useState, useEffect, type FormEvent } from 'react';
import { userAddressService } from '../../services/UserAddressService';
import type { IUserAddressDto, IAddUserAddress } from '../../interfaces';
import { Button, Input, Modal } from '../common';
import { MapPin, Check, Trash2, Edit2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export function UserAddressManager() {
  const [addresses, setAddresses] = useState<IUserAddressDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
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
    setLatitude(undefined);
    setLongitude(undefined);
    setIsDefault(false);
    setEditingId(null);
    setFormErrors({});
    setIsFormOpen(false);
  };

  const handleOpenEdit = (addr: IUserAddressDto) => {
    setContactName(addr.contactName);
    setContactPhone(addr.contactPhone);
    setAddressLine(addr.addressLine);
    setLatitude(addr.latitude);
    setLongitude(addr.longitude);
    setIsDefault(addr.isDefault);
    setEditingId(addr.id);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          fetchAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
          toast.success('Đã lấy vị trí hiện tại');
        },
        () => {
          toast.error('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí.');
        }
      );
    } else {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị.');
    }
  };

  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`);
      const data = await response.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',').map((p: string) => p.trim());
        const filteredParts = parts.filter((p: string) => {
          const lower = p.toLowerCase();
          if (lower === 'việt nam' || lower === 'vietnam') return false;
          if (/^\d+$/.test(p)) return false;
          return true;
        });
        setAddressLine(filteredParts.join(', '));
      }
    } catch (error) {
      console.error("Lỗi khi chuyển đổi tọa độ thành địa chỉ", error);
    }
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
    const data: IAddUserAddress = { contactName, contactPhone, addressLine, isDefault, latitude, longitude };

    try {
      let res;
      if (editingId) {
        res = await userAddressService.update(editingId, data);
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

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsLoading(true);
    try {
      const res = await userAddressService.delete(deletingId);
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
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await userAddressService.setDefault(id);
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
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Địa chỉ cụ thể (Số nhà, ngõ, đường, phường/xã, quận/huyện...)"
                  value={addressLine}
                  onChange={(e) => {
                    setAddressLine(e.target.value);
                    // If user manually types address, we ideally want to re-geocode, but for simplicity we keep lat/lng or nullify them if it's vastly different. 
                    // Usually we might want to clear lat/lng so it falls back to Geocoding in checkout, or we can leave them.
                    setLatitude(undefined);
                    setLongitude(undefined);
                  }}
                  error={formErrors.addressLine}
                  placeholder="VD: 123 Đường ABC, Phường XYZ..."
                />
              </div>
              <Button type="button" variant="outline" onClick={handleGetLocation} className="mb-[2px]" title="Lấy vị trí hiện tại">
                <MapPin className="w-5 h-5" />
              </Button>
            </div>
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

      <Modal
        isOpen={!!deletingId}
        onClose={() => !isLoading && setDeletingId(null)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Bạn có chắc chắn muốn xóa địa chỉ này không? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeletingId(null)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={isLoading}
            >
              Xóa địa chỉ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
