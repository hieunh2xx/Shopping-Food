import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, UploadCloud } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { authService } from '../../services/AuthService';
import { toast } from 'react-hot-toast';
import { ROUTES } from '../../routes/routeConfig';

export function AuthShipperApplyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    identityCardNumber: '',
    vehicleType: 'Motorcycle',
    vehiclePlateNumber: ''
  });

  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);
  const [vehicleRegFile, setVehicleRegFile] = useState<File | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFileHelper(file, 'Tệp tin');
        setter(file);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.identityCardNumber.trim() || !form.vehiclePlateNumber.trim() || !idFrontFile || !idBackFile || !driverLicenseFile || !vehicleRegFile) {
      toast.error('Vui lòng điền đủ thông tin và tải lên các tệp tin bắt buộc');
      return;
    }

    setLoading(true);

    try {
      const uploadPromises = [
        authService.uploadImage(idFrontFile),
        authService.uploadImage(idBackFile),
        authService.uploadImage(driverLicenseFile),
        authService.uploadImage(vehicleRegFile)
      ];

      const uploadResults = await Promise.all(uploadPromises);

      for (let i = 0; i < uploadResults.length; i++) {
        if (uploadResults[i].error || !uploadResults[i].data) {
          throw new Error(`Lỗi tải lên tệp tin thứ ${i + 1}`);
        }
      }

      const res = await authService.applyShipper({
        identityCardNumber: form.identityCardNumber,
        vehicleType: form.vehicleType,
        vehiclePlateNumber: form.vehiclePlateNumber,
        identityCardFrontUrl: uploadResults[0].data.imageUrl,
        identityCardBackUrl: uploadResults[1].data.imageUrl,
        driverLicenseUrl: uploadResults[2].data.imageUrl,
        vehicleRegistrationUrl: uploadResults[3].data.imageUrl
      });

      if (res.error) {
        toast.error(res.message || 'Có lỗi xảy ra');
      } else {
        toast.success('Gửi yêu cầu đăng ký tài xế thành công! Vui lòng chờ phê duyệt.');
        navigate(ROUTES.PROFILE);
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({ label, file, setter }: { label: string; file: File | null; setter: React.Dispatch<React.SetStateAction<File | null>> }) => (
    <div className="pt-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label} <span className="text-red-500">*</span></label>
      <div className="border-2 border-dashed rounded-xl p-5 transition-colors border-gray-300 hover:border-orange-500 bg-gray-50">
        <div className="flex flex-col items-center justify-center text-center">
          {!file ? (
            <>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <UploadCloud className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mb-3">PNG, JPG, JPEG, WEBP (Tối đa 5MB)</p>
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Chọn File
                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileSelect(e, setter)} />
              </label>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-gray-700 mb-2 truncate max-w-[200px]">{file.name}</span>
              <button type="button" onClick={() => setter(null)} className="text-xs text-red-600 hover:text-red-700 font-medium">Xóa / Chọn lại</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 mb-4">
            <Bike className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký trở thành Tài Xế</h1>
          <p className="mt-2 text-gray-500">Mở rộng thu nhập của bạn cùng Shopping Food</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số CMND/CCCD</label>
            <Input required value={form.identityCardNumber} onChange={(e) => setForm({ ...form, identityCardNumber: e.target.value })} placeholder="Nhập số CMND/CCCD" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadField label="Mặt trước CMND/CCCD" file={idFrontFile} setter={setIdFrontFile} />
            <FileUploadField label="Mặt sau CMND/CCCD" file={idBackFile} setter={setIdBackFile} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại phương tiện</label>
              <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-gray-50" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                <option value="Motorcycle">Xe máy</option>
                <option value="Car">Ô tô</option>
                <option value="Bicycle">Xe đạp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Biển kiểm soát</label>
              <Input required value={form.vehiclePlateNumber} onChange={(e) => setForm({ ...form, vehiclePlateNumber: e.target.value })} placeholder="VD: 59A1-123.45" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadField label="Bằng lái xe" file={driverLicenseFile} setter={setDriverLicenseFile} />
            <FileUploadField label="Giấy đăng ký xe" file={vehicleRegFile} setter={setVehicleRegFile} />
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-4 mt-8">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Hủy bỏ</Button>
            <Button type="submit" disabled={loading} className="px-8">{loading ? 'Đang gửi...' : 'Gửi yêu cầu'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
